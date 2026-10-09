import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Alert, IconButton,
  Divider, List, ListItem, ListItemText, Dialog, DialogContent, CardMedia
} from '@mui/material';
import {
  MonetizationOn as RevenueIcon,
  Assignment as ProjectIcon,
  Build as RepairIcon,
  Warning as WarningIcon,
  TrendingUp as TrendIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  People as TechIcon,
  Inventory as InventoryIcon,
  DateRange as DateIcon,
  CameraAlt as CameraIcon,
  Engineering as EngineeringIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

interface DashboardData {
  todayRevenue: number;
  monthlyRevenue: number;
  accountsReceivable: number;
  quotationCount: number;
  quotationSuccessRate: number;
  ongoingProjects: number;
  overdueProjects: number;
  newRepairs: number;
  dispatchingRepairs: number;
  callbackRepairs: number;
  onlineTechnicians: number;
  averageCustomerRating: number;
  lowStockItems: number;
  nearingMaintenanceCount: number;
  overdueMaintenanceCount: number;
  topTechnicians: {
    technicianName: string;
    kpiScore: number;
    completedJobs: number;
  }[];
  revenueChart: {
    label: string;
    revenue: number;
  }[];
}

export default function Dashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [recentProgressLogs, setRecentProgressLogs] = useState<any[]>([]);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');

  const fetchData = async (bypassCache = false) => {
    if (!user) return;
    
    // For Customers, we skip Admin KPIs and display simplified welcome info or mock metrics
    const isAdminOrEmployee = user.roles.some(r => r === 'ADMIN' || r === 'SALES' || r === 'EMPLOYEE' || r === 'INSTALLATION_LEADER');
    if (!isAdminOrEmployee) return;

    setLoading(true);
    try {
      const [res, progressRes] = await Promise.all([
        axiosInstance.get(`/dashboard/admin?startDate=${startDate}&endDate=${endDate}&bypassCache=${bypassCache}`),
        axiosInstance.get('/project/recent-progress')
      ]);
      setData(res.data.data);
      if (progressRes.data?.data) {
        setRecentProgressLogs(progressRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  if (!user) return null;

  const isAdminOrEmployee = user.roles.some(r => r === 'ADMIN' || r === 'SALES' || r === 'EMPLOYEE');

  // Customer Welcome Screen
  if (!isAdminOrEmployee) {
    return (
      <Box p={3}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
            Xin chào, {user.fullName}!
          </Typography>
          <Typography color="text.secondary">
            Chào mừng quay trở lại cổng thông tin FireGuard AI. Vai trò: <strong>KHÁCH HÀNG</strong>.
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Đảm Bảo An Toàn Phòng Cháy</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 3 }}>
                Hệ thống AI tự động theo dõi thời gian bảo dưỡng bình cứu hỏa và đầu báo khói của bạn. Hãy truy cập trang "Theo dõi bảo trì" để xem đề xuất lịch hẹn.
              </Typography>
              <Button href="/maintenance-tracking" variant="contained" color="secondary" sx={{ fontWeight: 'bold' }}>
                Xem thiết bị của tôi
              </Button>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid #e0e0e0' }}>
              <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>Tư Vấn Thiết Kế PCCC AI</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Bạn cần báo giá sơ bộ hoặc hỏi đáp về luật PCCC hiện hành? Chat trực tiếp với chuyên gia tư vấn ảo của chúng tôi.
              </Typography>
              <Button href="/ai-consulting" variant="outlined" color="primary">
                Trò chuyện với AI
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Helper for rendering line chart points via SVG paths
  const renderLineChart = (chartData: { label: string, revenue: number }[]) => {
    if (!chartData || chartData.length === 0) return null;
    const maxVal = Math.max(...chartData.map(d => d.revenue), 1000000);
    const height = 150;
    const width = 500;
    const padding = 30;

    const points = chartData.map((d, index) => {
      const x = padding + (index * (width - 2 * padding)) / (chartData.length - 1);
      const y = height - padding - (d.revenue * (height - 2 * padding)) / maxVal;
      return { x, y, label: d.label, revenue: d.revenue };
    });

    const pathData = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <Box sx={{ width: '100%', overflowX: 'auto', mt: 2 }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={200} style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e0e0e0" strokeWidth={1} />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f0f0f0" strokeWidth={1} />

          {/* Area under route */}
          <path
            d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
            fill="rgba(25, 118, 210, 0.1)"
          />
          {/* Line */}
          <path d={pathData} fill="none" stroke="#1976d2" strokeWidth={3} />

          {/* Points & Labels */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r={5} fill="#1976d2" stroke="#fff" strokeWidth={2} />
              <text x={p.x} y={height - 8} fontSize={9} textAnchor="middle" fill="#666">
                {p.label}
              </text>
              <text x={p.x} y={p.y - 10} fontSize={8} fontWeight="bold" textAnchor="middle" fill="#333">
                {(p.revenue / 1000000).toFixed(1)}M
              </text>
            </g>
          ))}
        </svg>
      </Box>
    );
  };

  return (
    <Box p={1}>
      {/* Title & Filter bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Bảng Quản Trị Hệ Thống FireGuard AI
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tổng hợp dữ liệu doanh thu, công nợ, hiệu suất KPI của đội ngũ kỹ thuật và tình trạng bảo trì thiết bị PCCC.
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={2} bgcolor="background.paper" p={1.5} borderRadius={3} border="1px solid #e0e0e0">
          <DateIcon color="action" />
          <TextField
            size="small"
            type="date"
            label="Từ ngày"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            size="small"
            type="date"
            label="Đến ngày"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <IconButton color="primary" onClick={() => fetchData(true)} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} mb={4}>
        {/* Doanh thu hôm nay */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '5px solid #2e7d32' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">REVENUE TODAY</Typography>
                  <Typography variant="h5" fontWeight="bold" mt={1}>
                    {loading ? <Skeleton width={120} /> : `${data?.todayRevenue.toLocaleString('vi-VN')} ₫`}
                  </Typography>
                </Box>
                <RevenueIcon color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Doanh thu tháng */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '5px solid #1976d2' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">REVENUE MONTHLY</Typography>
                  <Typography variant="h5" fontWeight="bold" mt={1}>
                    {loading ? <Skeleton width={120} /> : `${data?.monthlyRevenue.toLocaleString('vi-VN')} ₫`}
                  </Typography>
                </Box>
                <RevenueIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Công nợ */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '5px solid #ed6c02' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">ACCOUNTS RECEIVABLE</Typography>
                  <Typography variant="h5" fontWeight="bold" mt={1}>
                    {loading ? <Skeleton width={120} /> : `${data?.accountsReceivable.toLocaleString('vi-VN')} ₫`}
                  </Typography>
                </Box>
                <RevenueIcon color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Success Rate */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '5px solid #9c27b0' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">QUOTATION SUCCESS RATE</Typography>
                  <Typography variant="h5" fontWeight="bold" mt={1}>
                    {loading ? <Skeleton width={80} /> : `${data?.quotationSuccessRate}%`}
                  </Typography>
                </Box>
                <TrendIcon color="secondary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main stats layout */}
      <Grid container spacing={3}>
        {/* Left Side: Charts & Project status */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, borderRadius: 4, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Biểu Đồ Xu Hướng Doanh Thu (6 Tháng Gần Nhất)
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            ) : (
              data && renderLineChart(data.revenueChart)
            )}
          </Card>

          <Grid container spacing={3}>
            {/* Project Status Card */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ProjectIcon fontSize="small" /> Tình trạng dự án thi công
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" my={1.5}>
                  <Typography variant="body2">Đang thực hiện:</Typography>
                  <strong>{loading ? <Skeleton width={20} /> : data?.ongoingProjects} dự án</strong>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="error">Trễ tiến độ:</Typography>
                  <strong style={{ color: '#d32f2f' }}>{loading ? <Skeleton width={20} /> : data?.overdueProjects} dự án</strong>
                </Box>
              </Card>
            </Grid>

            {/* Repair Order Status Card */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" color="secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RepairIcon fontSize="small" /> Đơn sửa chữa & Cứu hộ
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" my={1.5}>
                  <Typography variant="body2">Chờ phân công:</Typography>
                  <strong>{loading ? <Skeleton width={20} /> : data?.newRepairs} đơn</strong>
                </Box>
                <Box display="flex" justifyContent="space-between" my={1.5}>
                  <Typography variant="body2">Đang điều phối:</Typography>
                  <strong>{loading ? <Skeleton width={20} /> : data?.dispatchingRepairs} đơn</strong>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="error">Khách báo lỗi lại (Callback):</Typography>
                  <strong style={{ color: '#d32f2f' }}>{loading ? <Skeleton width={20} /> : data?.callbackRepairs} đơn</strong>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Side: Maintenance alerts, tech online & top performers */}
        <Grid item xs={12} md={4}>
          {/* Warning Panels */}
          <Card sx={{ p: 2.5, borderRadius: 3, mb: 3, borderLeft: '5px solid #d32f2f' }}>
            <Typography variant="subtitle2" fontWeight="bold" color="error" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon /> Cảnh báo & Tồn kho
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between" my={1.2}>
              <Typography variant="body2">Bảo trì sắp đến hạn (7 ngày):</Typography>
              <strong>{loading ? <Skeleton width={20} /> : data?.nearingMaintenanceCount} thiết bị</strong>
            </Box>
            <Box display="flex" justifyContent="space-between" my={1.2}>
              <Typography variant="body2" color="error">Bảo trì quá hạn:</Typography>
              <strong style={{ color: '#d32f2f' }}>{loading ? <Skeleton width={20} /> : data?.overdueMaintenanceCount} thiết bị</strong>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="warning.dark">Tồn kho dưới định mức:</Typography>
              <strong style={{ color: '#ed6c02' }}>{loading ? <Skeleton width={20} /> : data?.lowStockItems} mẫu</strong>
            </Box>
          </Card>

          {/* Resources Status */}
          <Card sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TechIcon fontSize="small" /> Tài nguyên kỹ thuật
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between" my={1.2}>
              <Typography variant="body2">Kỹ thuật viên online:</Typography>
              <Chip label={loading ? '...' : `${data?.onlineTechnicians} On-duty`} color="success" size="small" />
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Đánh giá sao trung bình:</Typography>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {loading ? <Skeleton width={20} /> : data?.averageCustomerRating} <StarIcon color="warning" fontSize="small" />
              </strong>
            </Box>
          </Card>

          {/* Top Performers */}
          <Card sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" color="secondary" gutterBottom>
              Top 3 kỹ thuật viên KPI
            </Typography>
            <Divider sx={{ my: 1 }} />
            {loading ? (
              <Box display="flex" flexDirection="column" gap={1} mt={1}>
                <Skeleton width="100%" height={24} />
                <Skeleton width="100%" height={24} />
              </Box>
            ) : data?.topTechnicians.length === 0 ? (
              <Typography variant="caption" color="text.secondary">Chưa có xếp hạng KPI tháng này.</Typography>
            ) : (
              <List dense sx={{ p: 0 }}>
                {data?.topTechnicians.slice(0, 3).map((t, idx) => (
                  <ListItem key={idx} sx={{ px: 0, py: 0.8, display: 'flex', justifyContent: 'space-between' }}>
                    <ListItemText
                      primary={<strong>{t.technicianName}</strong>}
                      secondary={`${t.completedJobs} đơn hàng hoàn thành`}
                    />
                    <Chip label={`${t.kpiScore} điểm`} color="success" size="small" variant="outlined" />
                  </ListItem>
                ))}
              </List>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* REALTIME FIELD PHOTOS & PROGRESS REPORT FROM INSTALLATION LEADERS */}
      <Box mt={4} mb={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight="bold" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CameraIcon /> Báo Cáo Hiện Trường & Ảnh Thực Tế Từ Đội Trưởng Thi Công
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hình ảnh hiện trường và nhật ký công việc được đội trưởng gửi trực tiếp từ công trình PCCC.
            </Typography>
          </Box>
        </Box>

        {recentProgressLogs.length > 0 ? (
          <Grid container spacing={3}>
            {recentProgressLogs.map((log: any) => (
              <Grid item xs={12} sm={6} md={3} key={log.id}>
                <Card sx={{ borderRadius: 3, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  {log.imageUrl ? (
                    <Box sx={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                        height="160"
                        image={log.imageUrl}
                        alt="Ảnh hiện trường"
                        sx={{ objectFit: 'cover', cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'scale(1.08)' } }}
                        onClick={() => {
                          setSelectedPhoto(log.imageUrl);
                          setPhotoDialogOpen(true);
                        }}
                      />
                      <Chip
                        label={`${log.progressPercentage}% Hoàn thành`}
                        color={log.progressPercentage === 100 ? 'success' : 'primary'}
                        size="small"
                        sx={{ position: 'absolute', top: 10, right: 10, fontWeight: 'bold' }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ height: 120, bgcolor: 'rgba(255,61,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <EngineeringIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4 }} />
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" noWrap color="primary">
                      {log.projectName || 'Công trình PCCC'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      {new Date(log.createdAtUtc).toLocaleString('vi-VN')}
                    </Typography>
                    <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {log.notes}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Bởi: <strong>{log.createdBy || 'Đội trưởng thi công'}</strong>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Chưa có ảnh báo cáo hiện trường nào được gửi từ các đội trưởng thi công.
          </Alert>
        )}
      </Box>

      {/* FULL PHOTO LIGHTBOX / ZOOM DIALOG */}
      <Dialog open={photoDialogOpen} onClose={() => setPhotoDialogOpen(false)} maxWidth="md">
        <DialogContent sx={{ p: 1 }}>
          <img src={selectedPhoto} alt="Zoom" style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
