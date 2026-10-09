import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useToast } from './useToast';
import authService from '../services/authService';

export interface FireGuardEventEnvelope {
  eventId: string;
  eventType: string;
  data: any;
  timestamp: string;
}

export type ConnectionStatus = 'Disconnected' | 'Connecting' | 'Connected' | 'Reconnecting';

interface SignalRContextType {
  connectionStatus: ConnectionStatus;
  joinProject: (projectId: string) => Promise<void>;
  leaveProject: (projectId: string) => Promise<void>;
  joinServiceRequest: (serviceRequestId: string) => Promise<void>;
  leaveServiceRequest: (serviceRequestId: string) => Promise<void>;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export function SignalRProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('Disconnected');
  const [connection, setConnection] = useState<HubConnection | null>(null);
  
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const { accessToken, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const processedEventIds = useRef<Set<string>>(new Set());

  // Prevent duplicate events
  const isDuplicate = (eventId: string) => {
    if (!eventId) return false;
    if (processedEventIds.current.has(eventId)) {
      return true;
    }
    processedEventIds.current.add(eventId);
    // Keep set size capped at 500 to prevent memory leak
    if (processedEventIds.current.size > 500) {
      const firstItem = processedEventIds.current.values().next().value;
      if (firstItem !== undefined) {
        processedEventIds.current.delete(firstItem);
      }
    }
    return false;
  };

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      // Disconnect if user logs out
      if (connection) {
        connection.stop()
          .then(() => {
            setConnectionStatus('Disconnected');
            setConnection(null);
          })
          .catch((err) => console.error('Error stopping SignalR connection:', err));
      }
      return;
    }

    const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';
    const HUB_URL = API_URL.replace(/\/api$/, '') + '/hubs/fireguard';

    const newConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: async () => {
          let token = accessToken;
          if (!token) {
            try {
              const refreshRes = await authService.refreshToken();
              token = refreshRes.accessToken;
            } catch (err) {
              console.error('SignalR failed to fetch token via refresh:', err);
            }
          }
          return token || '';
        }
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Custom backoff: 2s, 5s, 10s, 30s
          if (retryContext.previousRetryCount === 0) return 2000;
          if (retryContext.previousRetryCount === 1) return 5000;
          if (retryContext.previousRetryCount === 2) return 10000;
          return 30000;
        }
      })
      .configureLogging(LogLevel.Information)
      .build();

    // Setup event listeners
    newConnection.on('ReceiveEvent', (envelope: FireGuardEventEnvelope) => {
      if (isDuplicate(envelope.eventId)) {
        console.warn('SignalR: Duplicate event received, ignoring:', envelope.eventId);
        return;
      }

      console.log('SignalR Event Received:', envelope);
      handleEvent(envelope);
    });

    // Connection lifecycle handlers
    newConnection.onclose((error) => {
      setConnectionStatus('Disconnected');
      console.log('SignalR connection closed.', error);
    });

    newConnection.onreconnecting((error) => {
      setConnectionStatus('Reconnecting');
      console.warn('SignalR connection lost. Reconnecting...', error);
    });

    newConnection.onreconnected((connectionId) => {
      setConnectionStatus('Connected');
      console.log('SignalR connection reconnected. ConnectionId:', connectionId);
    });

    // Start connection
    setConnectionStatus('Connecting');
    newConnection.start()
      .then(() => {
        setConnectionStatus('Connected');
        console.log('SignalR connection established successfully.');
      })
      .catch((err) => {
        setConnectionStatus('Disconnected');
        console.error('SignalR connection failed to start:', err);
      });

    setConnection(newConnection);

    return () => {
      newConnection.stop()
        .then(() => console.log('SignalR connection cleaned up.'))
        .catch((err) => console.error('Error cleaning up SignalR connection:', err));
    };
  }, [isAuthenticated, accessToken]);

  // Handle incoming events and trigger query invalidation + toast notifications
  const handleEvent = (envelope: FireGuardEventEnvelope) => {
    const { eventType, data } = envelope;

    // Toast alert mapping
    let toastMessage = '';
    let toastSeverity: 'info' | 'success' | 'warning' | 'error' = 'info';

    switch (eventType) {
      case 'ServiceRequestCreated':
        toastMessage = `Yêu cầu dịch vụ mới được tạo: #${data.serviceRequestId || data.id}`;
        toastSeverity = 'success';
        queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
        break;

      case 'ReceiveNewInstallationRequest':
        toastMessage = `Yêu cầu lắp đặt mới: ${data.RequestNumber}`;
        toastSeverity = 'info';
        queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
        break;

      case 'ReceiveJobOffer':
        // Custom event for Technician popup
        // We also dispatch a custom DOM event so components can listen to it
        const customEvent = new CustomEvent('onJobOffer', { detail: data });
        window.dispatchEvent(customEvent);
        break;

      case 'DispatchStarted':
        toastMessage = 'Bắt đầu điều động kỹ thuật viên.';
        queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
        queryClient.invalidateQueries({ queryKey: ['dispatches'] });
        if (data.serviceRequestId) {
          queryClient.invalidateQueries({ queryKey: ['serviceRequests', data.serviceRequestId] });
        }
        break;

      case 'TechnicianSuggested':
        toastMessage = 'Gợi ý kỹ thuật viên phù hợp cho sự cố.';
        if (data.serviceRequestId) {
          queryClient.invalidateQueries({ queryKey: ['serviceRequests', data.serviceRequestId] });
        }
        break;

      case 'TechnicianAssigned':
        toastMessage = 'Kỹ thuật viên đã được phân công.';
        toastSeverity = 'success';
        queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
        if (data.serviceRequestId) {
          queryClient.invalidateQueries({ queryKey: ['serviceRequests', data.serviceRequestId] });
        }
        // Dispatch custom event for Customer radar UI
        window.dispatchEvent(new CustomEvent('onTechnicianAssigned', { detail: data }));
        break;

      case 'TechnicianAccepted':
        toastMessage = 'Kỹ thuật viên đã nhận công việc.';
        toastSeverity = 'success';
        if (data.serviceRequestId) {
          queryClient.invalidateQueries({ queryKey: ['serviceRequests', data.serviceRequestId] });
        }
        break;

      case 'TechnicianRejected':
        toastMessage = 'Kỹ thuật viên đã từ chối nhận việc.';
        toastSeverity = 'warning';
        if (data.serviceRequestId) {
          queryClient.invalidateQueries({ queryKey: ['serviceRequests', data.serviceRequestId] });
        }
        break;

      case 'TechnicianOnTheWay':
        toastMessage = 'Kỹ thuật viên đang di chuyển đến hiện trường.';
        if (data.serviceRequestId) {
          queryClient.invalidateQueries({ queryKey: ['serviceRequests', data.serviceRequestId] });
        }
        break;

      case 'TechnicianCheckedIn':
        toastMessage = 'Kỹ thuật viên đã check-in tại địa điểm.';
        toastSeverity = 'success';
        if (data.serviceRequestId) {
          queryClient.invalidateQueries({ queryKey: ['serviceRequests', data.serviceRequestId] });
        }
        break;

      case 'RepairStarted':
        toastMessage = 'Quá trình sửa chữa hệ thống PCCC đã bắt đầu.';
        if (data.serviceRequestId) {
          queryClient.invalidateQueries({ queryKey: ['serviceRequests', data.serviceRequestId] });
        }
        break;

      case 'RepairProgressUpdated':
        toastMessage = 'Tiến độ sửa chữa đã được cập nhật.';
        if (data.serviceRequestId) {
          queryClient.invalidateQueries({ queryKey: ['serviceRequests', data.serviceRequestId] });
        }
        break;

      case 'ServiceCompleted':
        toastMessage = 'Khắc phục sự cố/Dịch vụ hoàn thành!';
        toastSeverity = 'success';
        queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
        if (data.serviceRequestId) {
          queryClient.invalidateQueries({ queryKey: ['serviceRequests', data.serviceRequestId] });
        }
        break;

      case 'ProjectProgressUpdated':
        toastMessage = `Tiến độ dự án ${data.projectName || ''} đã thay đổi.`;
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        if (data.projectId) {
          queryClient.invalidateQueries({ queryKey: ['projects', data.projectId] });
        }
        break;

      case 'InventoryLow':
        toastMessage = `Cảnh báo: Số lượng vật tư '${data.itemName || data.itemCode}' ở mức thấp!`;
        toastSeverity = 'error';
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        break;

      case 'MaintenanceReminderCreated':
        toastMessage = 'Lịch nhắc nhở bảo trì mới đã được tạo.';
        queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        queryClient.invalidateQueries({ queryKey: ['maintenanceReminders'] });
        break;

      case 'NotificationCreated':
        toastMessage = data.message || 'Bạn có thông báo mới.';
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        break;

      default:
        toastMessage = `Sự kiện mới: ${eventType}`;
        break;
    }

    if (toastMessage) {
      showToast(toastMessage, toastSeverity);
    }
  };

  const joinProject = async (projectId: string) => {
    if (connection && connection.state === HubConnectionState.Connected) {
      try {
        await connection.invoke('JoinProject', projectId);
      } catch (err) {
        console.error('Error invoking JoinProject group:', err);
      }
    }
  };

  const leaveProject = async (projectId: string) => {
    if (connection && connection.state === HubConnectionState.Connected) {
      try {
        await connection.invoke('LeaveProject', projectId);
      } catch (err) {
        console.error('Error invoking LeaveProject group:', err);
      }
    }
  };

  const joinServiceRequest = async (serviceRequestId: string) => {
    if (connection && connection.state === HubConnectionState.Connected) {
      try {
        await connection.invoke('JoinServiceRequest', serviceRequestId);
      } catch (err) {
        console.error('Error invoking JoinServiceRequest group:', err);
      }
    }
  };

  const leaveServiceRequest = async (serviceRequestId: string) => {
    if (connection && connection.state === HubConnectionState.Connected) {
      try {
        await connection.invoke('LeaveServiceRequest', serviceRequestId);
      } catch (err) {
        console.error('Error invoking LeaveServiceRequest group:', err);
      }
    }
  };

  return (
    <SignalRContext.Provider
      value={{
        connectionStatus,
        joinProject,
        leaveProject,
        joinServiceRequest,
        leaveServiceRequest
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
}

export function useSignalR() {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error('useSignalR must be used within a SignalRProvider');
  }
  return context;
}
