import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  MenuItem, Chip, Tabs, Tab, List, ListItem, ListItemText, Divider, CircularProgress, Snackbar, Alert,
  FormControl, RadioGroup, FormControlLabel, Radio, Dialog, DialogContent, DialogActions, DialogTitle, TextField
} from '@mui/material';
import {
  Build, History, Timer, Notifications, MyLocation, PersonPin,
  CameraAlt as CameraIcon, CloudUpload as CloudUploadIcon, CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useRef } from 'react';
import { RootState } from '../store';
import axiosInstance from '../api/axiosInstance';

const TECH_REPAIR_PHOTOS = [
  {
    name: 'Bình Chữa Cháy Nạp Sạc & Kiểm Định',
    url: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Đo Kiểm & Thay Đầu Báo Khói Mới',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Đấu Nối Tủ Báo Cháy Hoàn Tất',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Nghiệm Thu Đồng Hồ Áp Lực PCCC',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80'
  }
];

export default function ServiceRequestManagement() {
  const { user } = useSelector((state: RootState) => state.auth);
  const userRoles = user?.roles || [];
  const isCustomer = userRoles.includes('CUSTOMER') && !userRoles.some((r: string) => ['ADMIN', 'SALES', 'TECHNICIAN'].includes(r));
  const isStaff = userRoles.some((r: string) => ['ADMIN', 'SALES'].includes(r));
  const isTechnician = userRoles.some((r: string) => ['ADMIN', 'TECHNICIAN', 'INSTALLATION_LEADER', 'INSTALLATION_MEMBER'].includes(r));

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [createOpen, setCreateOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completingRequest, setCompletingRequest] = useState<any | null>(null);
  const [completionPhoto, setCompletionPhoto] = useState('');
  const [completionNotes, setCompletionNotes] = useState('Đã hoàn thành kiểm tra, sửa chữa và nghiệm thu thiết bị PCCC.');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompletionPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [newRequest, setNewRequest] = useState({
    customerId: '',
    addressId: '',
    newAddressLine: '',
    latitude: 10.762622,
    longitude: 106.660172,
    description: 'Yêu cầu kiểm tra thiết bị',
    urgency: 1, // Medium
    requestType: 1, // Repair
  });

  const [addressMode, setAddressMode] = useState<'existing' | 'new'>('existing');
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    if (addressMode !== 'new') return;
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapReady(true);
      document.head.appendChild(script);
    } else {
      setMapReady(true);
    }
  }, [addressMode]);

  useEffect(() => {
    if (!mapReady || addressMode !== 'new' || !mapContainerRef.current) return;
    const L = (window as any).L;
    
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([newRequest.latitude || 10.762622, newRequest.longitude || 106.660172], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
      
      markerRef.current = L.marker([newRequest.latitude || 10.762622, newRequest.longitude || 106.660172], { draggable: true }).addTo(mapRef.current);
      
      markerRef.current.on('dragend', () => {
        const position = markerRef.current.getLatLng();
        setNewRequest(prev => ({ ...prev, latitude: position.lat, longitude: position.lng }));
      });
      
      mapRef.current.on('click', (e: any) => {
        markerRef.current.setLatLng(e.latlng);
        setNewRequest(prev => ({ ...prev, latitude: e.latlng.lat, longitude: e.latlng.lng }));
      });
      
      setTimeout(() => mapRef.current?.invalidateSize(), 500);
    }
  }, [mapReady, addressMode, createOpen]);

  const [activeTab, setActiveTab] = useState(0);
  const [diagnoseOpen, setDiagnoseOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const [diagnoseForm, setDiagnoseForm] = useState({
    status: 9, // Repairing
    notes: 'Đã kiểm tra và đang tiến hành xử lý.'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, custRes] = await Promise.all([
        axiosInstance.get('/service'),
        axiosInstance.get('/customer?PageSize=100')
      ]);
      if (reqRes.data?.data) {
        let list = reqRes.data.data;
        if (isCustomer) {
          list = list.filter((r: any) => r.customerId === user?.id);
        } else if (isTechnician && !isStaff) {
          const canInstall = userRoles.includes('INSTALLATION_LEADER') || userRoles.includes('INSTALLATION_MEMBER');
          const canRepair = userRoles.includes('TECHNICIAN');
          
          list = list.filter((r: any) => {
            // Show jobs assigned to them
            if (r.assignedTechnicianId === user?.id) return true;
            
            // Show all unassigned open jobs (status < 3) for technicians to self-claim directly
            if (!r.assignedTechnicianId && r.status < 3) {
              return true;
            }
            return false;
          });
        }
        setRequests(list);
      }
      if (custRes.data?.data?.items) {
        setCustomers(custRes.data.data.items);
        if (custRes.data.data.items.length > 0) {
          const firstCust = custRes.data.data.items[0];
          setNewRequest(prev => ({
            ...prev,
            customerId: firstCust.id,
            addressId: firstCust.addresses && firstCust.addresses.length > 0 ? firstCust.addresses[0].id : ''
          }));
        }
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu', error);
      setSnackbar({ open: true, message: 'Lỗi tải dữ liệu', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async () => {
    try {
      if (!newRequest.customerId) {
        setSnackbar({ open: true, message: 'Vui lòng chọn khách hàng', severity: 'error' });
        return;
      }
      if (addressMode === 'existing' && !newRequest.addressId) {
        setSnackbar({ open: true, message: 'Vui lòng chọn địa chỉ', severity: 'error' });
        return;
      }
      if (addressMode === 'new' && !newRequest.newAddressLine) {
        setSnackbar({ open: true, message: 'Vui lòng nhập địa chỉ mới', severity: 'error' });
        return;
      }
      const payload = {
        customerId: newRequest.customerId,
        addressId: addressMode === 'existing' ? newRequest.addressId : '',
        newAddressLine: addressMode === 'new' ? newRequest.newAddressLine : '',
        latitude: addressMode === 'new' ? newRequest.latitude : undefined,
        longitude: addressMode === 'new' ? newRequest.longitude : undefined,
        description: newRequest.description,
        urgency: newRequest.urgency,
        requestType: newRequest.requestType,
        desiredTime: new Date().toISOString()
      };
      const isInstallation = newRequest.requestType === 3;
      await axiosInstance.post('/service', payload);
      setCreateOpen(false);
      fetchData();
      
      if (isInstallation) {
        setSnackbar({ open: true, message: 'Yêu cầu lắp đặt đã được ghi nhận và báo đến Đội Lắp Đặt.', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Yêu cầu của bạn đã được ghi nhận và đang chờ Kỹ thuật viên tiếp nhận.', severity: 'success' });
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi tạo yêu cầu', severity: 'error' });
    }
  };

  const handleStartAutoDispatch = async (id: string) => {
    try {
      await axiosInstance.post(`/dispatch/${id}/start`);
      setSnackbar({ open: true, message: 'Đã kích hoạt AI điều phối tự động', severity: 'success' });
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi điều phối', severity: 'error' });
    }
  };

  const handleAcceptOffer = async (id: string) => {
    try {
      await axiosInstance.post(`/dispatch/${id}/accept`);
      setSnackbar({ open: true, message: 'Nhận việc thành công', severity: 'success' });
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi nhận việc', severity: 'error' });
    }
  };

  const handleRejectOffer = async (id: string) => {
    try {
      await axiosInstance.post(`/dispatch/${id}/reject`, { reason: 'Bận công việc khác' });
      setSnackbar({ open: true, message: 'Đã từ chối đơn', severity: 'success' });
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi từ chối', severity: 'error' });
    }
  };

  const handleClaimRequest = async (r: any) => {
    try {
      const payload = {
        newStatus: 4, // TechnicianAccepted
        notes: `Kỹ thuật viên ${user?.fullName || user?.username || 'KTV'} chủ động nhận đơn trực tiếp`,
        assignedTechnicianId: user?.id,
        rowVersion: r.rowVersion
      };
      await axiosInstance.post(`/service/${r.id}/status`, payload);
      setSnackbar({ open: true, message: '🎉 Tiếp nhận đơn thành công!', severity: 'success' });
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi nhận đơn trực tiếp', severity: 'error' });
    }
  };

  const handleUpdateStatus = async (id: string, rowVersion: string, newStatus: number, notes: string, attachmentUrl?: string) => {
    try {
      const payload = {
        newStatus,
        notes,
        attachmentUrl,
        rowVersion
      };
      await axiosInstance.post(`/service/${id}/status`, payload);
      setSnackbar({ open: true, message: 'Cập nhật trạng thái thành công', severity: 'success' });
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi cập nhật trạng thái', severity: 'error' });
    }
  };

  const getStatusLabel = (status: number) => {
    const labels = [
      'Created (Mới tạo)', 'AwaitingDispatch (Chờ điều phối)', 'Dispatching (Đang điều phối)', 'Assigned (Đã giao việc)',
      'TechnicianAccepted (Thợ đã nhận)', 'TechnicianRejected (Thợ từ chối)', 'OnTheWay (Đang di chuyển)', 'CheckedIn (Đã tới nơi)',
      'Diagnosing (Đang chẩn đoán)', 'Repairing (Đang sửa chữa)', 'WaitingForPart (Chờ linh kiện)', 'Completed (Hoàn thành)',
      'CustomerConfirmed (Khách xác nhận)', 'Cancelled (Đã hủy)'
    ];
    return labels[status] || `Status ${status}`;
  };

  const getUrgencyLabel = (urgency: number) => {
    const labels = ['Low', 'Medium', 'High', 'Emergency'];
    return labels[urgency] || 'N/A';
  };

  const getRequestTypeLabel = (type: number) => {
    const labels = ['Bảo trì', 'Sửa chữa', 'Thay thế', 'Lắp đặt mới'];
    return labels[type] || 'N/A';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Build /> Sửa Chữa & Bảo Trì Thiết Bị
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          {(isCustomer || isStaff) && (
            <Button variant="contained" color="primary" onClick={() => setCreateOpen(true)}>
              + Tạo Yêu Cầu Mới
            </Button>
          )}
          <Chip label="SignalR kết nối Kỹ thuật viên" color="info" icon={<Notifications />} variant="outlined" />
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} indicatorColor="primary" textColor="primary" sx={{ mb: 3 }}>
        <Tab icon={<Timer sx={{ mr: 1, verticalAlign: 'middle' }} />} label="Danh sách yêu cầu" />
        <Tab icon={<History sx={{ mr: 1, verticalAlign: 'middle' }} />} label="Lịch sử xử lý" />
      </Tabs>

      {activeTab === 0 ? (
        <Card sx={{ background: '#1a202c', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
              <Table>
                <TableHead sx={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Mã phiếu</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Khách hàng</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Địa chỉ</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Mô tả</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Độ khẩn</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Loại hình</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Trạng thái</TableCell>
                    <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}><CircularProgress color="primary" /></TableCell></TableRow>
                  ) : requests.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>Chưa có yêu cầu nào</TableCell></TableRow>
                  ) : requests.map((r) => (
                    <TableRow key={r.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.04)' } }}>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{r.requestNumber}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{r.customer?.name}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{r.address?.addressLine || 'N/A'}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{r.description}</TableCell>
                      <TableCell>
                        <Chip label={getUrgencyLabel(r.urgency)} color={r.urgency >= 2 ? 'error' : 'default'} size="small" />
                      </TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{getRequestTypeLabel(r.requestType)}</TableCell>
                      <TableCell>
                        <Chip label={getStatusLabel(r.status)} color={r.status === 11 ? 'success' : r.status >= 3 ? 'info' : 'warning'} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        {isTechnician && (!r.assignedTechnicianId || r.status < 3) && (
                          <Button size="small" variant="contained" color="success" onClick={() => handleClaimRequest(r)} sx={{ fontWeight: 'bold' }}>
                            Nhận Đơn Trực Tiếp
                          </Button>
                        )}
                        {isStaff && r.status === 0 /* Created */ && (
                          <Button size="small" variant="outlined" color="primary" onClick={() => handleUpdateStatus(r.id, r.rowVersion, 1, 'Duyệt yêu cầu')}>Duyệt</Button>
                        )}
                        {isStaff && r.status === 1 /* AwaitingDispatch */ && (
                          <Button size="small" variant="contained" color="primary" onClick={() => handleStartAutoDispatch(r.id)}>AI Điều phối</Button>
                        )}
                        {isTechnician && r.status === 2 /* Dispatching */ && (
                          <Box display="flex" gap={1} justifyContent="flex-end">
                            <Button size="small" variant="contained" color="success" onClick={() => handleAcceptOffer(r.id)}>Nhận Đơn</Button>
                            <Button size="small" variant="outlined" color="error" onClick={() => handleRejectOffer(r.id)}>Từ chối</Button>
                          </Box>
                        )}
                        {isTechnician && r.status === 3 /* Assigned */ && (
                          <Button size="small" variant="contained" color="success" onClick={() => handleUpdateStatus(r.id, r.rowVersion, 4, 'Đồng ý nhận việc')}>Chấp nhận</Button>
                        )}
                        {isTechnician && r.status === 4 /* TechnicianAccepted */ && (
                          <Button size="small" variant="contained" color="info" onClick={() => handleUpdateStatus(r.id, r.rowVersion, 6, 'Đang di chuyển')}>Di chuyển</Button>
                        )}
                        {isTechnician && r.status === 6 /* OnTheWay */ && (
                          <Button size="small" variant="contained" color="warning" onClick={() => handleUpdateStatus(r.id, r.rowVersion, 7, 'Đã check-in')}>Check-in</Button>
                        )}
                        {isTechnician && r.status === 7 /* CheckedIn */ && (
                          <Button size="small" variant="contained" color="primary" onClick={() => handleUpdateStatus(r.id, r.rowVersion, 8, 'Bắt đầu chẩn đoán')}>Chẩn đoán</Button>
                        )}
                        {isTechnician && r.status === 8 /* Diagnosing */ && (
                          <Button size="small" variant="contained" color="secondary" onClick={() => { setSelectedRequest(r); setDiagnoseOpen(true); }}>Cập nhật lỗi</Button>
                        )}
                        {isTechnician && r.status === 9 /* Repairing */ && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CameraIcon />}
                            onClick={() => {
                              setCompletingRequest(r);
                              setCompletionPhoto('');
                              setCompletionNotes('Đã hoàn thành sửa chữa, đo kiểm và nghiệm thu thiết bị PCCC.');
                              setCompleteDialogOpen(true);
                            }}
                          >
                            Hoàn thành
                          </Button>
                        )}
                        {isCustomer && r.status === 11 /* Completed */ && (
                          <Button size="small" variant="contained" color="success" onClick={() => handleUpdateStatus(r.id, r.rowVersion, 12, 'Khách hàng xác nhận')}>Xác nhận hoàn thành</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ background: '#1a202c', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <CardContent>
            <List>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>Lịch sử hiển thị trạng thái hiện tại (Phiên bản thực tế sẽ gọi API `/logs`).</Typography>
              {requests.map((r, idx) => (
                <Box key={idx}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      sx={{ color: '#fff' }}
                      primary={
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="subtitle2" fontWeight="bold">Phiếu: {r.requestNumber}</Typography>
                          <Typography variant="caption" color="textSecondary">{new Date(r.createdAtUtc).toLocaleString()}</Typography>
                        </Box>
                      }
                      secondary={<span style={{ color: '#aaa' }}>Trạng thái hiện tại: {getStatusLabel(r.status)} | Mô tả: {r.description}</span>}
                    />
                  </ListItem>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                </Box>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Create Request Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>Tạo Yêu Cầu Bảo Trì / Sửa Chữa Mới</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Khách hàng" value={newRequest.customerId} onChange={(e) => {
                const cust = customers.find(c => c.id === e.target.value);
                setNewRequest({ 
                  ...newRequest, 
                  customerId: e.target.value, 
                  addressId: cust?.addresses && cust.addresses.length > 0 ? cust.addresses[0].id : ''
                });
              }}>
                {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <RadioGroup row value={addressMode} onChange={(e) => {
                  setAddressMode(e.target.value as 'existing' | 'new');
                  // Reset map instance when mode changes to force re-render if needed
                  if (e.target.value === 'new') mapRef.current = null;
                }}>
                  <FormControlLabel value="existing" control={<Radio />} label="Chọn địa chỉ đã lưu" />
                  <FormControlLabel value="new" control={<Radio />} label="Nhập địa chỉ mới" />
                </RadioGroup>
              </FormControl>
            </Grid>
            {addressMode === 'existing' && customers.find(c => c.id === newRequest.customerId)?.addresses?.length > 0 && (
              <Grid item xs={12}>
                <TextField select fullWidth label="Địa chỉ" value={newRequest.addressId} onChange={(e) => setNewRequest({ ...newRequest, addressId: e.target.value })}>
                  {customers.find(c => c.id === newRequest.customerId)?.addresses?.map((a: any) => (
                    <MenuItem key={a.id} value={a.id}>{a.addressLine}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            {addressMode === 'new' && (
              <Grid item xs={12}>
                <TextField fullWidth label="Địa chỉ chi tiết mới" value={newRequest.newAddressLine} onChange={(e) => setNewRequest({ ...newRequest, newAddressLine: e.target.value })} sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>Chạm hoặc kéo thả ghim trên bản đồ để chọn vị trí chính xác</Typography>
                <Box ref={mapContainerRef} sx={{ width: '100%', height: 300, borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: '#333' }} />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField select fullWidth label="Loại yêu cầu" value={newRequest.requestType} onChange={(e) => setNewRequest({ ...newRequest, requestType: Number(e.target.value) })}>
                <MenuItem value={0}>Bảo trì định kỳ (Maintenance)</MenuItem>
                <MenuItem value={1}>Sửa chữa hỏng hóc (Repair)</MenuItem>
                <MenuItem value={2}>Thay thế linh kiện (Replace)</MenuItem>
                <MenuItem value={3}>Lắp đặt mới (Installation)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField select fullWidth label="Độ khẩn cấp" value={newRequest.urgency} onChange={(e) => setNewRequest({ ...newRequest, urgency: Number(e.target.value) })}>
                <MenuItem value={0}>Thấp (Trong tuần)</MenuItem>
                <MenuItem value={1}>Trung bình (Trong 48h)</MenuItem>
                <MenuItem value={2}>Cao (Trong 24h)</MenuItem>
                <MenuItem value={3}>Khẩn cấp (Xử lý ngay)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Mô tả sự cố hoặc ghi chú thêm" value={newRequest.description} onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="primary" onClick={handleCreateRequest}>Gửi yêu cầu</Button>
        </DialogActions>
      </Dialog>

      {/* Diagnose Dialog */}
      <Dialog open={diagnoseOpen} onClose={() => setDiagnoseOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Nhập kết quả chẩn đoán lỗi</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Trạng thái tiếp theo" value={diagnoseForm.status} onChange={(e) => setDiagnoseForm({ ...diagnoseForm, status: Number(e.target.value) })}>
                <MenuItem value={9}>Đang tiến hành sửa chữa (Repairing)</MenuItem>
                <MenuItem value={10}>Chờ linh kiện thay thế (WaitingForPart)</MenuItem>
                <MenuItem value={11}>Hoàn thành sửa chữa (Completed)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Ghi chú chẩn đoán nguyên nhân & cách khắc phục" value={diagnoseForm.notes} onChange={(e) => setDiagnoseForm({ ...diagnoseForm, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDiagnoseOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="secondary" onClick={() => {
            if (selectedRequest) {
              handleUpdateStatus(selectedRequest.id, selectedRequest.rowVersion, diagnoseForm.status, diagnoseForm.notes);
            }
            setDiagnoseOpen(false);
          }}>Xác nhận</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG NGHIỆM THU HOÀN THÀNH & TẢI ẢNH HIỆN TRƯỜNG */}
      <Dialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CameraIcon color="primary" /> Nghiệm Thu Hoàn Thành & Tải Ảnh Hiện Trường
        </DialogTitle>
        <DialogContent dividers>
          {completingRequest && (
            <Box mb={2} p={1.5} bgcolor="rgba(25, 118, 210, 0.08)" borderRadius={2} border="1px solid #1976d2">
              <Typography variant="body2" fontWeight="bold">
                Mã đơn: {completingRequest.requestNumber} - Khách hàng: {completingRequest.customer?.name || 'Khách hàng'}
              </Typography>
            </Box>
          )}

          <TextField
            label="Ghi chú kết quả sửa chữa / bảo trì *"
            fullWidth
            multiline
            rows={3}
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            sx={{ mb: 2.5 }}
          />

          <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
            Ảnh Chụp Nghiệm Thu Thực Tế (BẮT BUỘC):
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
            * Kỹ thuật viên bắt buộc phải tải lên hoặc chụp ảnh thiết bị sau khi khắc phục xong để đối soát nghiệm thu.
          </Typography>

          {/* Photo Upload Button */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
            >
              Chụp Ảnh / Tải File Từ Thiết Bị
              <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
            </Button>
            {completionPhoto && (
              <Chip label="Đã có ảnh nghiệm thu" color="success" size="small" onDelete={() => setCompletionPhoto('')} />
            )}
          </Box>

          {/* Preset Photo Pickers */}
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Hoặc chọn nhanh ảnh mẫu hiện trường nghiệm thu:
          </Typography>
          <Grid container spacing={1} mb={2}>
            {TECH_REPAIR_PHOTOS.map((p, i) => (
              <Grid item xs={6} key={i}>
                <Box
                  onClick={() => setCompletionPhoto(p.url)}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: completionPhoto === p.url ? '3px solid #ff3d00' : '1px solid rgba(255,255,255,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 0.5,
                    bgcolor: completionPhoto === p.url ? 'rgba(255,61,0,0.08)' : 'transparent'
                  }}
                >
                  <img src={p.url} alt={p.name} style={{ width: 45, height: 45, objectFit: 'cover', borderRadius: 4 }} />
                  <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1.2 }}>
                    {p.name}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Image Preview */}
          {completionPhoto ? (
            <Box mt={2}>
              <Typography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Xem trước ảnh nghiệm thu:
              </Typography>
              <img
                src={completionPhoto}
                alt="Nghiệm thu"
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }}
              />
            </Box>
          ) : (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Chưa có ảnh nghiệm thu. Bạn phải tải hoặc chọn ảnh mới có thể hoàn thành đơn!
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCompleteDialogOpen(false)} color="inherit">
            Hủy
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={!completionPhoto || !completingRequest}
            onClick={() => {
              if (completingRequest) {
                handleUpdateStatus(completingRequest.id, completingRequest.rowVersion, 11, completionNotes, completionPhoto);
                setCompleteDialogOpen(false);
              }
            }}
            startIcon={<CheckCircleIcon />}
          >
            Xác Nhận Hoàn Thành Đơn
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
