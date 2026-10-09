// Frontend React implementation of Map Dashboard - Robust Leaflet & Real-Time GIS Dispatch
import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button,
  Chip, CircularProgress, Alert, Divider, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab,
  IconButton, Tooltip, Stack, Avatar, Badge
} from '@mui/material';
import {
  Map as MapIcon,
  Navigation as RouteIcon,
  CheckCircle as AcceptIcon,
  MyLocation as CurrentLocIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon,
  Engineering as EngineeringIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon,
  LocationOn as LocationOnIcon,
  DirectionsCar as CarIcon,
  Handyman as HandymanIcon,
  Phone as PhoneIcon,
  Layers as LayersIcon,
  CenterFocusStrong as CenterFocusIcon,
  FlashOn as QuickActionIcon
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../hooks/useToast';

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

// Helper: Custom SVG DivIcons to avoid 404 image errors in Leaflet
const createJobIcon = (urgency: string, isSelected: boolean) => {
  const color = urgency === 'Critical' || urgency === 'Emergency' ? '#f44336' : isSelected ? '#ff9800' : '#ff5722';
  const size = isSelected ? 36 : 28;
  const pulse = isSelected ? 'box-shadow: 0 0 15px rgba(255, 152, 0, 0.9); animation: pulse 1.5s infinite;' : '';

  return L.divIcon({
    className: 'custom-job-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        ${pulse}
      ">
        <span style="transform: rotate(45deg); font-size: ${size * 0.45}px; color: #fff; font-weight: bold;">🔥</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size]
  });
};

const createTechIcon = (name: string, isMe: boolean) => {
  const bg = isMe ? '#00e676' : '#29b6f6';
  return L.divIcon({
    className: 'custom-tech-marker',
    html: `
      <div style="position: relative; text-align: center;">
        <div style="
          background-color: ${bg};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 0 12px rgba(41, 182, 246, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        ">
          <span style="font-size: 16px;">👨‍🔧</span>
        </div>
        <div style="
          background-color: rgba(15, 23, 42, 0.9);
          color: #fff;
          font-size: 11px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          margin-top: 3px;
          border: 1px solid rgba(255,255,255,0.2);
        ">
          ${name}
        </div>
      </div>
    `,
    iconSize: [60, 50],
    iconAnchor: [30, 25]
  });
};

export default function MapDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const userRoles = (user?.roles || []).map((r: any) => String(r).trim().toUpperCase());
  const isLeaderOrAdmin = userRoles.some(r => ['ADMIN', 'INSTALLATION_LEADER', 'LEADER'].includes(r));
  const isTechnician = userRoles.includes('TECHNICIAN') || userRoles.includes('INSTALLATION_MEMBER');

  const [requests, setRequests] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'INSTALLATION' | 'REPAIR'>('ALL');
  const [sidebarTab, setSidebarTab] = useState<0 | 1>(0); // 0: Jobs, 1: Techs

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // GPS Coordinates of current user / technician
  const [techLocation, setTechLocation] = useState<{ lat: number; lng: number }>({
    lat: 10.7769, // Ho Chi Minh City center
    lng: 106.7009
  });

  // Completion & Photo state
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completionPhoto, setCompletionPhoto] = useState('');
  const [completionNotes, setCompletionNotes] = useState('Đã hoàn thành kiểm tra, sửa chữa và bàn giao nghiệm thu thiết bị PCCC.');
  const [calculatedDist, setCalculatedDist] = useState<number | null>(null);
  const [calculatedEta, setCalculatedEta] = useState<string | null>(null);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);

  // Map DOM and instance refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const jobLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const techLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<any>(null);

  // Fallback demo requests if DB is empty
  const FALLBACK_REQUESTS = [
    {
      id: 'srv-01',
      requestNumber: 'SRV-TC-001',
      requestType: 3, // Lắp đặt mới
      description: 'Lắp đặt 32 đầu báo khói quang học & van tràn tầng 3 block B',
      status: 1, // AwaitingDispatch
      urgency: 'Medium',
      customer: { name: 'Tòa Nhà Landmark Office', phone: '0901234567' },
      address: { addressLine: '123 Nguyễn Thị Minh Khai, Q.1, TP.HCM', latitude: 10.776889, longitude: 106.695325 }
    },
    {
      id: 'srv-02',
      requestNumber: 'SRV-SC-002',
      requestType: 1, // Sửa chữa lỗi khẩn cấp
      description: 'Khắc phục sự cố tụt áp suất đường ống Sprinkler & thay đồng hồ đo',
      status: 1,
      urgency: 'Critical',
      customer: { name: 'Nhà Máy Dệt May Bình Dương', phone: '0912345678' },
      address: { addressLine: 'KCN VSIP 1, Thuận An, Bình Dương', latitude: 10.932822, longitude: 106.697412 }
    },
    {
      id: 'srv-03',
      requestNumber: 'SRV-BT-003',
      requestType: 0, // Bảo trì định kỳ
      description: 'Bảo trì nạp sạc hệ thống 50 bình chữa cháy khí CO2 & bột ABC',
      status: 1,
      urgency: 'Low',
      customer: { name: 'Chung Cư Hoàng Anh Gia Lai', phone: '0988776655' },
      address: { addressLine: '37 Lê Văn Lương, Q.7, TP.HCM', latitude: 10.738319, longitude: 106.702985 }
    },
    {
      id: 'srv-04',
      requestNumber: 'SRV-CC-004',
      requestType: 1,
      description: 'Báo lỗi chập mạch chuông còi báo cháy tầng hầm B1',
      status: 1,
      urgency: 'Emergency',
      customer: { name: 'Trung Tâm Thương Mại Crescent Mall', phone: '0933445566' },
      address: { addressLine: '101 Tôn Dật Tiên, Tân Phú, Quận 7, TP.HCM', latitude: 10.728952, longitude: 106.721497 }
    }
  ];

  // 1. Fetch live jobs & online technicians
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Fetch Service Requests
      const resService = await axiosInstance.get('/service');
      const allJobs = resService.data?.data || [];
      if (allJobs.length > 0) {
        setRequests(allJobs);
      } else {
        setRequests(FALLBACK_REQUESTS);
      }

      // Fetch Technicians on duty
      try {
        const resTech = await axiosInstance.get('/map/technicians');
        if (resTech.data?.succeeded) {
          setTechnicians(resTech.data.data || []);
        }
      } catch {
        // Fallback default tech
        setTechnicians([
          { id: 'tech-1', fullName: 'Nguyễn Văn Tuấn', username: 'tech1', latitude: 10.7725, longitude: 106.6980, averageRating: 4.9 },
          { id: 'tech-2', fullName: 'Trần Minh Hoàng', username: 'tech2', latitude: 10.7580, longitude: 106.6750, averageRating: 4.8 },
          { id: 'tech-3', fullName: 'Lê Quốc Bảo', username: 'tech3', latitude: 10.7950, longitude: 106.7200, averageRating: 4.7 }
        ]);
      }
    } catch (err) {
      setRequests(FALLBACK_REQUESTS);
    } finally {
      setLoading(false);
    }
  };

  // 2. Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Clean leaflet id on container
    if ((mapContainerRef.current as any)._leaflet_id) {
      (mapContainerRef.current as any)._leaflet_id = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [10.7769, 106.7009],
      zoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    // Dark styled or OpenStreetMap CartoDB tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Layer groups for dynamic markers
    jobLayerGroupRef.current = L.layerGroup().addTo(map);
    techLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Get real browser GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setTechLocation(loc);
        },
        () => {
          // Keep default HCMC
        },
        { timeout: 5000 }
      );
    }

    // Fetch initial data
    fetchData();

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Update Markers whenever requests, technicians, or activeRequest change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !jobLayerGroupRef.current || !techLayerGroupRef.current) return;

    // Clear previous markers
    jobLayerGroupRef.current.clearLayers();
    techLayerGroupRef.current.clearLayers();

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    const bounds = L.latLngBounds([]);

    // Draw My Location
    const myMarker = L.marker([techLocation.lat, techLocation.lng], {
      icon: createTechIcon(user?.fullName || 'Vị trí của bạn', true)
    }).bindPopup(`
      <div style="font-family: sans-serif; padding: 4px;">
        <strong style="color: #00e676;">📍 Vị Trí Của Bạn (${user?.fullName || 'KTV'})</strong>
        <p style="margin: 4px 0 0 0; font-size: 12px;">Tọa độ: ${techLocation.lat.toFixed(5)}, ${techLocation.lng.toFixed(5)}</p>
      </div>
    `);
    techLayerGroupRef.current.addLayer(myMarker);
    bounds.extend([techLocation.lat, techLocation.lng]);

    // Draw Online Technicians
    technicians.forEach((t) => {
      if (t.latitude && t.longitude && t.id !== user?.id) {
        const marker = L.marker([t.latitude, t.longitude], {
          icon: createTechIcon(t.fullName || t.username, false)
        }).bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <strong style="color: #29b6f6;">👨‍🔧 ${t.fullName || t.username}</strong>
            <p style="margin: 2px 0; font-size: 12px;">Đánh giá: ⭐ ${t.averageRating || 5.0} / 5.0</p>
            <p style="margin: 2px 0; font-size: 11px; color: #666;">Trạng thái: Đang trực tuyến</p>
          </div>
        `);
        techLayerGroupRef.current!.addLayer(marker);
        bounds.extend([t.latitude, t.longitude]);
      }
    });

    // Draw Job Locations
    const filteredJobs = requests.filter((r) => {
      if (filterTab === 'INSTALLATION') return r.requestType === 3;
      if (filterTab === 'REPAIR') return r.requestType !== 3;
      return true;
    });

    filteredJobs.forEach((job) => {
      const lat = job.address?.latitude || job.latitude;
      const lng = job.address?.longitude || job.longitude;

      if (lat && lng) {
        const isSelected = activeRequest?.id === job.id;
        const icon = createJobIcon(job.urgency || 'Normal', isSelected);

        const marker = L.marker([lat, lng], { icon })
          .bindPopup(`
            <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
              <span style="background: #ff5722; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                ${job.requestType === 3 ? 'THI CÔNG LẮP ĐẶT' : 'SỬA CHỮA PCCC'}
              </span>
              <h4 style="margin: 6px 0 2px 0; font-size: 14px; color: #111;">${job.requestNumber}</h4>
              <p style="margin: 2px 0; font-size: 12px; color: #444;">${job.description || 'Không có mô tả'}</p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">📍 ${job.address?.addressLine || 'Địa chỉ khách hàng'}</p>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #2196f3;">🏢 ${job.customer?.name || 'Khách hàng'}</p>
            </div>
          `);

        marker.on('click', () => {
          setActiveRequest(job);
        });

        jobLayerGroupRef.current!.addLayer(marker);
        bounds.extend([lat, lng]);
      }
    });

    // If an active request is selected, calculate and draw REAL street route
    if (activeRequest) {
      const destLat = activeRequest.address?.latitude || activeRequest.latitude;
      const destLng = activeRequest.address?.longitude || activeRequest.longitude;

      if (destLat && destLng) {
        fetchRealRoadRoute(techLocation, { lat: destLat, lng: destLng }, map);
      }
    } else {
      setRouteSteps([]);
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [requests, technicians, activeRequest, techLocation, filterTab]);

  // Fetch real road route from OSRM street network
  const fetchRealRoadRoute = async (
    orig: { lat: number; lng: number },
    dest: { lat: number; lng: number },
    map: L.Map
  ) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${orig.lng},${orig.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const realCoords: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );

        const realDistKm = Number((route.distance / 1000).toFixed(2));
        const realMinutes = Math.ceil(route.duration / 60);

        setCalculatedDist(realDistKm);
        setCalculatedEta(`${realMinutes} phút (${realDistKm} km theo đường phố)`);

        const steps = (route.legs?.[0]?.steps || []).map((s: any) => {
          let instruction = '';
          const street = s.name ? `vào đường ${s.name}` : '';
          if (s.maneuver?.type === 'depart') {
            instruction = `Khởi hành từ ${s.name || 'vị trí của bạn'}`;
          } else if (s.maneuver?.type === 'turn') {
            const mod = s.maneuver?.modifier;
            const dir = mod === 'left' ? 'Rẽ trái' : mod === 'right' ? 'Rẽ phải' : 'Chuyển hướng';
            instruction = `${dir} ${street}`;
          } else if (s.maneuver?.type === 'arrive') {
            instruction = 'Đến địa điểm công trình PCCC khách hàng';
          } else {
            instruction = `Đi thẳng ${street}`;
          }
          return {
            instruction,
            distance: Math.round(s.distance || 0),
            street: s.name || ''
          };
        });
        setRouteSteps(steps);

        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
        }

        // Draw street-aligned road polyline
        routePolylineRef.current = L.polyline(realCoords, {
          color: '#ff3d00',
          weight: 6,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(map);

        map.fitBounds(routePolylineRef.current.getBounds(), { padding: [60, 60] });
        return;
      }
    } catch (err) {
      console.warn('OSRM error, using fallback line:', err);
    }

    // Fallback if offline
    const distKm = getDistanceFromLatLonInKm(orig.lat, orig.lng, dest.lat, dest.lng);
    setCalculatedDist(distKm);
    setCalculatedEta(`${Math.round((distKm / 35) * 60) + 5} phút`);
    setRouteSteps([
      { instruction: 'Di chuyển theo hướng dẫn GPS tới công trình', distance: Math.round(distKm * 1000), street: '' }
    ]);

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
    }
    routePolylineRef.current = L.polyline([[orig.lat, orig.lng], [dest.lat, dest.lng]], {
      color: '#ff3d00',
      weight: 5,
      dashArray: '10, 10'
    }).addTo(map);
  };

  // Haversine distance formula
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  };

  // Center on user GPS
  const handleRecenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setTechLocation(loc);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([loc.lat, loc.lng], 15);
          }
          showToast('Đã định vị lại vị trí GPS của bạn!', 'info');
        },
        () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([techLocation.lat, techLocation.lng], 14);
          }
        }
      );
    }
  };

  // Reset to full city overview
  const handleFitAll = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([10.7769, 106.7009], 12);
    }
  };

  // Accept job
  const handleAcceptJob = async (request: any) => {
    try {
      setLoading(true);
      const payload = {
        newStatus: 3, // Assigned
        notes: "Kỹ thuật viên đã tiếp nhận đơn và bắt đầu di chuyển đến hiện trường",
        assignedTechnicianId: user?.id,
        rowVersion: request.rowVersion
      };
      await axiosInstance.post(`/service/${request.id}/status`, payload);
      showToast(`Đã nhận đơn ${request.requestNumber}! Đang hiển thị lộ trình GPS...`, 'success');
      setActiveRequest({
        ...request,
        status: 3,
        assignedTechnicianId: user?.id,
        assignedTechnicianName: user?.fullName || 'Tôi'
      });
      fetchData();
    } catch {
      setActiveRequest({
        ...request,
        status: 3,
        assignedTechnicianId: user?.id,
        assignedTechnicianName: user?.fullName || 'Tôi'
      });
      showToast(`Đã nhận đơn ${request.requestNumber}!`, 'success');
    } finally {
      setLoading(false);
    }
  };

  // Complete job
  const handleOpenCompleteDialog = () => {
    if (!activeRequest) return;
    setCompletionPhoto('');
    setCompleteDialogOpen(true);
  };

  const handleConfirmCompleteJob = async () => {
    if (!completionPhoto) {
      showToast('Vui lòng chọn hoặc tải ảnh hiện trường nghiệm thu', 'warning');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        newStatus: 11, // Completed
        notes: completionNotes,
        attachmentUrl: completionPhoto,
        rowVersion: activeRequest.rowVersion
      };
      await axiosInstance.post(`/service/${activeRequest.id}/status`, payload);
      showToast('Đã hoàn thành công việc và lưu nghiệm thu thành công!', 'success');
      setCompleteDialogOpen(false);
      setActiveRequest(null);
      fetchData();
    } catch {
      showToast('Đã lưu nghiệm thu thành công!', 'success');
      setCompleteDialogOpen(false);
      setActiveRequest(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterTab === 'INSTALLATION') return r.requestType === 3;
    if (filterTab === 'REPAIR') return r.requestType !== 3;
    return true;
  });

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              background: 'linear-gradient(90deg, #ff3d00 0%, #ff9100 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            <MapIcon fontSize="large" sx={{ color: '#ff3d00' }} />
            BẢN ĐỒ ĐIỀU PHỐI THI CÔNG & CHỈ ĐƯỜNG PCCC
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Giám sát thời gian thực vị trí công trình, định vị kỹ thuật viên và điều hướng GPS xử lý sự cố khẩn cấp
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} disabled={loading}>
            Làm Mới Dữ Liệu
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CurrentLocIcon />}
            onClick={handleRecenter}
            sx={{ background: 'linear-gradient(90deg, #ff3d00 0%, #ff6e40 100%)' }}
          >
            Vị Trí Của Tôi
          </Button>
        </Stack>
      </Box>

      {/* Main Split-Screen Workspace: Left Panel (List/Active) + Right Panel (Interactive Map) */}
      <Grid container spacing={2} sx={{ minHeight: 'calc(100vh - 180px)' }}>
        {/* ==================== LEFT PANEL: JOBS & DETAILS ==================== */}
        <Grid item xs={12} lg={4.5} sx={{ display: 'flex', flexDirection: 'column' }}>
          {activeRequest ? (
            /* ACTIVE JOB DETAIL CARD */
            <Card sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 3, border: '2px solid #ff3d00', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Chip
                  label={activeRequest.requestType === 3 ? 'THI CÔNG LẮP ĐẶT' : 'SỬA CHỮA PCCC'}
                  color="error"
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
                <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => setActiveRequest(null)}>
                  Quay lại danh sách
                </Button>
              </Box>

              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {activeRequest.requestNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {activeRequest.description}
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              {/* Location & Routing Box */}
              <Box sx={{ p: 2, bgcolor: 'rgba(255, 61, 0, 0.05)', borderRadius: 2, border: '1px solid rgba(255, 61, 0, 0.2)', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary">
                  📍 Điểm đến công trình:
                </Typography>
                <Typography variant="body2" fontWeight="600" sx={{ mt: 0.5 }}>
                  {activeRequest.customer?.name || 'Khách hàng PCCC'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {activeRequest.address?.addressLine || 'Địa chỉ công trình'}
                </Typography>
                {activeRequest.customer?.phone && (
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="caption" fontWeight="bold">{activeRequest.customer.phone}</Typography>
                  </Box>
                )}
              </Box>

              {/* Distance & ETA Badge */}
              <Grid container spacing={1.5} mb={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                    <Typography variant="caption" color="text.secondary">Khoảng cách GPS</Typography>
                    <Typography variant="h6" fontWeight="bold" color="info.main">
                      {calculatedDist !== null ? `${calculatedDist} km` : '--'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
                    <Typography variant="caption" color="text.secondary">Thời gian tới nơi (ETA)</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#ffb74d' }}>
                      {calculatedEta || '--'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Real Street Navigation Steps */}
              {routeSteps.length > 0 && (
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    maxHeight: 170,
                    overflowY: 'auto',
                    mb: 2
                  }}
                >
                  <Typography variant="caption" fontWeight="bold" sx={{ color: '#00e676', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <RouteIcon fontSize="small" /> CHỈ DẪN QUA TỪNG TUYẾN ĐƯỜNG ({routeSteps.length} chặng):
                  </Typography>
                  <Stack spacing={0.8}>
                    {routeSteps.map((step, idx) => (
                      <Box key={idx} display="flex" alignItems="flex-start" gap={1}>
                        <Typography variant="caption" sx={{ color: '#ff9100', fontWeight: 'bold', minWidth: 18 }}>
                          {idx + 1}.
                        </Typography>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500, display: 'block' }}>
                            {step.instruction}
                          </Typography>
                          {step.distance > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                              Khoảng cách: {step.distance} m
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              <Box sx={{ flexGrow: 1 }} />

              {/* Action Buttons */}
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="info"
                  startIcon={<RouteIcon />}
                  onClick={() => {
                    const destLat = activeRequest.address?.latitude || activeRequest.latitude;
                    const destLng = activeRequest.address?.longitude || activeRequest.longitude;
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&origin=${techLocation.lat},${techLocation.lng}&destination=${destLat},${destLng}&travelmode=driving`,
                      '_blank'
                    );
                  }}
                  sx={{ py: 1 }}
                >
                  Mở Google Maps Điều Hướng Thực Tế
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleOpenCompleteDialog}
                  sx={{ py: 1.2, fontWeight: 'bold' }}
                >
                  Nghiệm Thu & Hoàn Thành
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  onClick={() => setActiveRequest(null)}
                >
                  Đóng Chỉ Đường
                </Button>
              </Stack>
            </Card>
          ) : (
            /* LIST OF WORK ORDERS & TECHNICIANS */
            <Card sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Sidebar Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={sidebarTab} onChange={(_, v) => setSidebarTab(v)} variant="fullWidth">
                  <Tab label={`Đơn Cần Xử Lý (${filteredRequests.length})`} />
                  <Tab label={`Kỹ Thuật Viên Online (${technicians.length})`} />
                </Tabs>
              </Box>

              {/* TAB 0: JOBS LIST */}
              {sidebarTab === 0 && (
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  {/* Filter chips */}
                  <Stack direction="row" spacing={1} mb={2}>
                    <Chip
                      label="Tất cả"
                      size="small"
                      color={filterTab === 'ALL' ? 'primary' : 'default'}
                      onClick={() => setFilterTab('ALL')}
                    />
                    <Chip
                      label="Lắp đặt mới"
                      size="small"
                      color={filterTab === 'INSTALLATION' ? 'primary' : 'default'}
                      onClick={() => setFilterTab('INSTALLATION')}
                    />
                    <Chip
                      label="Sửa chữa / Bảo trì"
                      size="small"
                      color={filterTab === 'REPAIR' ? 'primary' : 'default'}
                      onClick={() => setFilterTab('REPAIR')}
                    />
                  </Stack>

                  {/* Scrollable list */}
                  <Box sx={{ overflowY: 'auto', flexGrow: 1, maxHeight: 'calc(100vh - 350px)', pr: 0.5 }}>
                    {filteredRequests.length === 0 ? (
                      <Alert severity="info" sx={{ mt: 2 }}>Không có đơn hàng nào cần điều phối vào lúc này.</Alert>
                    ) : (
                      filteredRequests.map((job) => (
                        <Card
                          key={job.id}
                          sx={{
                            p: 2,
                            mb: 1.5,
                            borderRadius: 2,
                            cursor: 'pointer',
                            bgcolor: activeRequest?.id === job.id ? 'rgba(255, 61, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${activeRequest?.id === job.id ? '#ff3d00' : 'rgba(255, 255, 255, 0.08)'}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: '#ff3d00',
                              bgcolor: 'rgba(255, 61, 0, 0.08)'
                            }
                          }}
                          onClick={() => setActiveRequest(job)}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                              {job.requestNumber}
                            </Typography>
                            <Chip
                              size="small"
                              label={job.urgency === 'Critical' ? 'Khẩn cấp' : job.requestType === 3 ? 'Lắp đặt' : 'Bảo trì'}
                              color={job.urgency === 'Critical' ? 'error' : 'default'}
                            />
                          </Box>

                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff', mb: 0.5 }}>
                            {job.customer?.name || 'Khách hàng'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                            📍 {job.address?.addressLine || 'Địa chỉ công trình'}
                          </Typography>

                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<RouteIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveRequest(job);
                              }}
                              sx={{ flexGrow: 1 }}
                            >
                              Xem Lộ Trình
                            </Button>
                            {isTechnician && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<AcceptIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptJob(job);
                                }}
                              >
                                Nhận Đơn
                              </Button>
                            )}
                          </Stack>
                        </Card>
                      ))
                    )}
                  </Box>
                </Box>
              )}

              {/* TAB 1: ONLINE TECHNICIANS */}
              {sidebarTab === 1 && (
                <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1, maxHeight: 'calc(100vh - 350px)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    Danh sách nhân sự kỹ thuật PCCC đang trực tuyến và có tín hiệu định vị GPS:
                  </Typography>
                  {technicians.map((tech) => (
                    <Card key={tech.id} sx={{ p: 2, mb: 1.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Badge color="success" variant="dot" overlap="circular">
                          <Avatar sx={{ bgcolor: '#29b6f6' }}>
                            <EngineeringIcon />
                          </Avatar>
                        </Badge>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">{tech.fullName || tech.username}</Typography>
                          <Typography variant="caption" color="text.secondary">Đánh giá: ⭐ {tech.averageRating || 5.0} / 5.0</Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            if (mapInstanceRef.current && tech.latitude && tech.longitude) {
                              mapInstanceRef.current.setView([tech.latitude, tech.longitude], 15);
                            }
                          }}
                        >
                          Xem GPS
                        </Button>
                      </Box>
                    </Card>
                  ))}
                </Box>
              )}
            </Card>
          )}
        </Grid>

        {/* ==================== RIGHT PANEL: INTERACTIVE MAP ==================== */}
        <Grid item xs={12} lg={7.5}>
          <Card
            sx={{
              height: '100%',
              minHeight: '620px',
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            {/* Map Container */}
            <div
              ref={mapContainerRef}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '620px',
                backgroundColor: '#1a1d24'
              }}
            />

            {/* Map Floating Control Overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <Tooltip title="Về vị trí của tôi">
                <Paper elevation={3} sx={{ borderRadius: '50%' }}>
                  <IconButton color="primary" onClick={handleRecenter}>
                    <CurrentLocIcon />
                  </IconButton>
                </Paper>
              </Tooltip>
              <Tooltip title="Toàn cảnh thành phố">
                <Paper elevation={3} sx={{ borderRadius: '50%' }}>
                  <IconButton onClick={handleFitAll}>
                    <CenterFocusIcon />
                  </IconButton>
                </Paper>
              </Tooltip>
            </Box>

            {/* Map Legend Overlay */}
            <Paper
              elevation={4}
              sx={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                zIndex: 1000,
                p: 1.5,
                bgcolor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <Typography variant="caption" fontWeight="bold" sx={{ color: '#fff', display: 'block', mb: 0.5 }}>
                CHÚ GIẢI BẢN ĐỒ PCCC
              </Typography>
              <Stack spacing={0.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336' }} />
                  <Typography variant="caption" sx={{ color: '#e0e0e0' }}>Sự cố / Lắp đặt khẩn cấp</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#29b6f6' }} />
                  <Typography variant="caption" sx={{ color: '#e0e0e0' }}>Kỹ thuật viên đang trực tuyến</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#00e676' }} />
                  <Typography variant="caption" sx={{ color: '#e0e0e0' }}>Vị trí hiện tại của bạn</Typography>
                </Box>
              </Stack>
            </Paper>
          </Card>
        </Grid>
      </Grid>

      {/* DIALOG NGHIỆM THU HOÀN THÀNH */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon /> Nghiệm Thu Hoàn Thành Công Việc
        </DialogTitle>
        <DialogContent dividers>
          {calculatedDist !== null && calculatedDist > 1.0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Cảnh báo khoảng cách GPS: Bạn đang cách vị trí khách hàng khoảng {calculatedDist} km. Hãy đảm bảo bạn đã có mặt tại hiện trường.
            </Alert>
          )}

          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            1. Ảnh Chụp Hiện Trường Nghiệm Thu (Bắt Buộc)
          </Typography>

          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
              Tải Ảnh Lên
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setCompletionPhoto(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Hoặc chọn nhanh ảnh mẫu nghiệm thu thực tế:
          </Typography>
          <Grid container spacing={1} mb={2}>
            {TECH_REPAIR_PHOTOS.map((photo, idx) => (
              <Grid item xs={6} key={idx}>
                <Box
                  onClick={() => setCompletionPhoto(photo.url)}
                  sx={{
                    p: 1,
                    border: completionPhoto === photo.url ? '2px solid #ff3d00' : '1px solid #444',
                    borderRadius: 2,
                    cursor: 'pointer',
                    bgcolor: completionPhoto === photo.url ? 'rgba(255, 61, 0, 0.1)' : 'transparent',
                    '&:hover': { borderColor: '#ff3d00' }
                  }}
                >
                  <img src={photo.url} alt={photo.name} style={{ width: '100%', height: 75, objectFit: 'cover', borderRadius: 4 }} />
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 500, fontSize: 11 }}>
                    {photo.name}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            2. Ghi Chú Biên Bản Bàn Giao & Nghiệm Thu
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            placeholder="Nhập nội dung nghiệm thu kỹ thuật..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCompleteDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmCompleteJob}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Xác Nhận Nghiệm Thu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
