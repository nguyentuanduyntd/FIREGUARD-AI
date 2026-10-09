// Frontend React implementation of MapDashboard
import { useState, useEffect, useRef } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, CircularProgress, Alert, List, ListItem, ListItemText, Divider
} from '@mui/material';
import {
  Map as MapIcon,
  Navigation as RouteIcon,
  PersonPin as TechIcon,
  ContactSupport as RequestIcon,
  MyLocation as CurrentLocIcon,
  Send as SendIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

interface Technician {
  id: string;
  fullName: string;
  username: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  acceptanceRate: number;
  skills: string;
}

interface ServiceRequest {
  id: string;
  requestNumber: string;
  description: string;
  status: number;
  latitude: number;
  longitude: number;
  customer?: {
    name: string;
  };
  address?: {
    addressLine: string;
  };
}

export default function MapDashboard() {
  const [mapReady, setMapReady] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number, durationMinutes: number, etaText: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const routeLineRef = useRef<any>(null);

  // Load Leaflet dynamically
  useEffect(() => {
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
      if ((window as any).L) {
        setMapReady(true);
      } else {
        const script = document.getElementById('leaflet-js') as HTMLScriptElement;
        script.addEventListener('load', () => setMapReady(true));
      }
    }
  }, []);

  const fetchData = async () => {
    try {
      const techRes = await axiosInstance.get('/map/technicians');
      setTechnicians(techRes.data.data || []);

      // Fetch service requests awaiting dispatch (status = 1: AwaitingDispatch or 2: Dispatching)
      const serviceRes = await axiosInstance.get('/service'); // fix endpoint to match ServiceController
      const list = serviceRes.data.data || [];
      const pending = list.filter((r: any) => r.status === 1 || r.status === 2);
      setRequests(pending);
    } catch (error) {
      console.error('Error fetching dispatch details:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh pins every 10s
    return () => clearInterval(interval);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || mapRef.current) return;

    const L = (window as any).L;
    if (!L) return; // Safety check

    // Center at HCMC coordinates
    mapRef.current = L.map(mapContainerRef.current).setView([10.762622, 106.660172], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(mapRef.current);

    // Fix map gray issue when container resizes
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 500);
  }, [mapReady]);

  // Update map pins when data changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const L = (window as any).L;
    if (!L) return; // Safety check

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    // Add Technician markers
    technicians.forEach(t => {
      const marker = L.marker([t.latitude, t.longitude], {
        icon: L.divIcon({
          className: 'custom-tech-pin',
          html: `<div style="background-color: #4caf50; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #fff; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; box-shadow: 0 2px 5px rgba(0,0,0,0.3)">KT</div>`
        })
      })
      .bindPopup(`<b>${t.fullName}</b><br/>Rating: ${t.averageRating}⭐<br/>Kỹ năng: ${t.skills}`)
      .addTo(mapRef.current);

      marker.on('click', () => setSelectedTechnician(t));
      markersRef.current.push(marker);
    });

    // Add Customer marker if request selected
    if (selectedRequest) {
      // Parse or mock coordinate if null
      const cLat = selectedRequest.latitude || 21.025;
      const cLon = selectedRequest.longitude || 105.84;

      const customerMarker = L.marker([cLat, cLon], {
        icon: L.divIcon({
          className: 'custom-customer-pin',
          html: `<div style="background-color: #ff3d00; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #fff; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 8px rgba(255,61,0,0.5)"><svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg></div>`
        })
      })
      .bindPopup(`<b>${selectedRequest.customer?.name}</b><br/>${selectedRequest.address?.addressLine}`)
      .addTo(mapRef.current);

      markersRef.current.push(customerMarker);
      mapRef.current.setView([cLat, cLon], 14);

      // Draw routing line if technician is also selected
      if (selectedTechnician) {
        routeLineRef.current = L.polyline([
          [selectedTechnician.latitude, selectedTechnician.longitude],
          [cLat, cLon]
        ], { color: '#2196f3', weight: 4, dashArray: '8, 8' }).addTo(mapRef.current);

        mapRef.current.fitBounds(routeLineRef.current.getBounds());
      }
    }
  }, [technicians, selectedRequest, selectedTechnician, mapReady]);

  // Query API for Distance & ETA
  useEffect(() => {
    if (!selectedRequest || !selectedTechnician) {
      setRouteInfo(null);
      return;
    }

    const fetchRoute = async () => {
      try {
        const cLat = selectedRequest.latitude || 21.025;
        const cLon = selectedRequest.longitude || 105.84;
        const res = await axiosInstance.get(`/map/distance?origLat=${selectedTechnician.latitude}&origLon=${selectedTechnician.longitude}&destLat=${cLat}&destLon=${cLon}`);
        setRouteInfo(res.data.data);
      } catch (error) {
        console.error('Error fetching distance matrix:', error);
      }
    };

    fetchRoute();
  }, [selectedRequest, selectedTechnician]);

  const handleManualDispatch = async () => {
    if (!selectedRequest || !selectedTechnician) return;
    setLoading(true);
    setMsg(null);
    try {
      // Find latest recommendation log for request
      const recRes = await axiosInstance.get(`/dispatch/${selectedRequest.id}/recommendation`);
      const rec = recRes.data.data;

      await axiosInstance.post('/dispatch/confirm', {
        serviceRequestId: selectedRequest.id,
        recommendationId: rec.id,
        chosenTechnicianId: selectedTechnician.id,
        notes: `Điều phối thủ công từ bản đồ kỹ thuật số: Giao việc cho ${selectedTechnician.fullName}.`
      });

      setMsg({ type: 'success', text: `Điều phối kỹ thuật viên ${selectedTechnician.fullName} thành công.` });
      setSelectedRequest(null);
      setSelectedTechnician(null);
      fetchData();
    } catch (error) {
      setMsg({ type: 'error', text: 'Điều phối thất bại. Vui lòng kiểm tra lại trạng thái kỹ thuật viên.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MapIcon fontSize="large" /> Bản Đồ Điều Phối Kỹ Thuật Số
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Hiển thị vị trí thời gian thực của kỹ thuật viên, địa điểm sự cố của khách hàng và điều phối công việc trực quan.
        </Typography>
      </Box>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ height: 'calc(100vh - 180px)', minHeight: 650 }}>
        {/* Left Control Panel */}
        <Grid item xs={12} md={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Awaiting Dispatch List */}
          <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 250 }}>
            <Box px={3} py={2} bgcolor="#f5f5f5" display="flex" alignItems="center" gap={1}>
              <RequestIcon color="primary" />
              <Typography variant="subtitle2" fontWeight="bold">Sự cố chờ điều phối ({requests.length})</Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {requests.length === 0 ? (
                <Box p={3} textAlign="center" color="text.secondary">
                  Không có sự cố nào cần điều phối lúc này.
                </Box>
              ) : (
                <List dense>
                  {requests.map((r) => (
                    <ListItem
                      button
                      key={r.id}
                      selected={selectedRequest?.id === r.id}
                      onClick={() => {
                        setSelectedRequest(r);
                        setSelectedTechnician(null);
                      }}
                      sx={{
                        borderLeft: selectedRequest?.id === r.id ? '4px solid #ff3d00' : '4px solid transparent',
                        mb: 0.5
                      }}
                    >
                      <ListItemText
                        primary={<strong>{r.requestNumber} - {r.customer?.name}</strong>}
                        secondary={r.description}
                      />
                      <Chip label={r.status === 2 ? "Đang gửi" : "Chờ AI"} color={r.status === 2 ? "warning" : "default"} size="small" />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Card>

          {/* Route & Dispatch Details */}
          {selectedRequest && (
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                Chi tiết điều phối
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box display="flex" flexDirection="column" gap={1.5}>
                <Typography variant="body2">
                  <strong>Khách hàng:</strong> {selectedRequest.customer?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Địa chỉ:</strong> {selectedRequest.address?.addressLine}
                </Typography>

                {selectedTechnician ? (
                  <Paper sx={{ p: 2, bgcolor: '#e3f2fd', mt: 1 }}>
                    <Typography variant="subtitle2" color="primary" fontWeight="bold">
                      Ứng viên chọn: {selectedTechnician.fullName}
                    </Typography>
                    {routeInfo ? (
                      <Box mt={1} display="flex" flexDirection="column" gap={0.5}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <RouteIcon fontSize="small" /> Khoảng cách: <strong>{routeInfo.distanceKm} km</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CurrentLocIcon fontSize="small" /> Thời gian tới (ETA): <strong>{routeInfo.etaText}</strong>
                        </Typography>
                      </Box>
                    ) : (
                      <Box display="flex" alignItems="center" gap={1} mt={1}>
                        <CircularProgress size={16} />
                        <Typography variant="caption">Đang tính toán tuyến đường...</Typography>
                      </Box>
                    )}
                  </Paper>
                ) : (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Hãy chọn một kỹ thuật viên trên bản đồ hoặc trong bảng để xem ETA và lộ trình di chuyển.
                  </Alert>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  color="warning"
                  disabled={!selectedTechnician || loading}
                  startIcon={<SendIcon />}
                  onClick={handleManualDispatch}
                  sx={{ mt: 2, py: 1.2, fontWeight: 'bold', borderRadius: 2 }}
                >
                  Xác nhận giao đơn thủ công
                </Button>
              </Box>
            </Card>
          )}
        </Grid>

        {/* Right Map Canvas Panel */}
        <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Card sx={{ flexGrow: 1, borderRadius: 4, overflow: 'hidden', border: '1px solid #e0e0e0', position: 'relative' }}>
            {!mapReady && (
              <Box position="absolute" top={0} left={0} right={0} bottom={0} display="flex" justifyContent="center" alignItems="center" bgcolor="rgba(255,255,255,0.7)" zIndex={10}>
                <CircularProgress />
              </Box>
            )}
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
