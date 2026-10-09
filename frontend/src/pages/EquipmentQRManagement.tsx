import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, TextField,
  MenuItem, Chip, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, IconButton, Tooltip, Divider, Stack
} from '@mui/material';
import {
  QrCode2 as QrCodeIcon,
  Search as SearchIcon,
  AddCircleOutline as AddIcon,
  Print as PrintIcon,
  Build as MaintenanceIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Engineering as TechIcon,
  Refresh as RefreshIcon,
  FlashOn as QuickActionIcon
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../hooks/useToast';

interface EquipmentAssetItem {
  id: string;
  serialNumber: string;
  modelId: string;
  modelName: string;
  modelCode: string;
  categoryName?: string;
  imageUrl?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  projectId?: string;
  projectName?: string;
  locationName?: string;
  status: string;
  installationDate: string;
  warrantyPeriodMonths: number;
  warrantyEndDate: string;
  isWarrantyValid: boolean;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  isMaintenanceOverdue: boolean;
  daysUntilMaintenance?: number;
  qrCodePayload: string;
}

interface StatsData {
  total: number;
  installed: number;
  overdue: number;
  upcoming30Days: number;
}

export default function EquipmentQRManagement() {
  const { showToast } = useToast();
  const [currentTab, setCurrentTab] = useState(0);
  const [stats, setStats] = useState<StatsData>({ total: 0, installed: 0, overdue: 0, upcoming30Days: 0 });
  const [assets, setAssets] = useState<EquipmentAssetItem[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterOverdue, setFilterOverdue] = useState<boolean | null>(null);

  // Tab 1: Lookup state
  const [lookupInput, setLookupInput] = useState('SN-2026-FIREGUARD-0050');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [currentPassport, setCurrentPassport] = useState<any | null>(null);

  // Tab 2: Create state
  const [models, setModels] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [formModelId, setFormModelId] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formLocation, setFormLocation] = useState('Hành lang Tầng 3 - Cạnh lối thoát hiểm');
  const [formInstallDate, setFormInstallDate] = useState(new Date().toISOString().split('T')[0]);
  const [formWarrantyMonths, setFormWarrantyMonths] = useState(12);
  const [formMaintenanceInterval, setFormMaintenanceInterval] = useState(6);
  const [createdAsset, setCreatedAsset] = useState<EquipmentAssetItem | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Dialog Maintenance
  const [maintenanceDialog, setMaintenanceDialog] = useState(false);
  const [maintenanceNotes, setMaintenanceNotes] = useState('Kiểm tra áp kế, nạp lại bột chữa cháy, bảo dưỡng van xả');
  const [maintenanceBy, setMaintenanceBy] = useState('Nguyễn Văn Tuấn (KTV PCCC)');
  const [maintenanceInterval, setMaintenanceInterval] = useState(6);
  const [targetAssetId, setTargetAssetId] = useState<string | null>(null);

  // Dialog Print Label
  const [printAsset, setPrintAsset] = useState<EquipmentAssetItem | any | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  // Fetch stats and assets
  const fetchStats = async () => {
    try {
      const res = await axiosInstance.get('/equipmentqr/stats');
      if (res.data.succeeded) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchAssets = async () => {
    setLoadingAssets(true);
    try {
      const params: any = {};
      if (searchKeyword.trim()) params.search = searchKeyword.trim();
      if (filterOverdue !== null) params.overdueOnly = filterOverdue;
      const res = await axiosInstance.get('/equipmentqr', { params });
      if (res.data.succeeded) {
        setAssets(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoadingAssets(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const res = await axiosInstance.get('/equipmentqr/models');
      if (res.data.succeeded) {
        setModels(res.data.data.models || []);
        setProjects(res.data.data.projects || []);
        setCustomers(res.data.data.customers || []);
        if (res.data.data.models?.length > 0) {
          setFormModelId(res.data.data.models[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching models:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAssets();
    fetchReferenceData();
    handleLookup('SN-2026-FIREGUARD-0050');
  }, []);

  const handleLookup = async (codeToLookup?: string) => {
    const code = (codeToLookup || lookupInput).trim();
    if (!code) {
      showToast('Vui lòng nhập mã thiết bị hoặc số Serial', 'warning');
      return;
    }
    setLookupLoading(true);
    try {
      const res = await axiosInstance.get(`/equipmentqr/lookup/${encodeURIComponent(code)}`);
      if (res.data.succeeded) {
        setCurrentPassport(res.data.data);
        showToast('Đã tải hồ sơ vòng đời thiết bị PCCC thành công!', 'success');
      } else {
        showToast(res.data.message || 'Không tìm thấy thông tin thiết bị', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không tìm thấy thiết bị với mã này', 'error');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formModelId) {
      showToast('Vui lòng chọn Model thiết bị PCCC', 'warning');
      return;
    }
    setCreateLoading(true);
    try {
      const payload = {
        modelId: formModelId,
        serialNumber: formSerial.trim() || undefined,
        customerId: formCustomerId || undefined,
        projectId: formProjectId || undefined,
        locationName: formLocation,
        installationDate: new Date(formInstallDate).toISOString(),
        warrantyPeriodMonths: Number(formWarrantyMonths),
        maintenanceIntervalMonths: Number(formMaintenanceInterval),
        status: 2 // Installed
      };

      const res = await axiosInstance.post('/equipmentqr/generate', payload);
      if (res.data.succeeded) {
        showToast('Tạo mã QR và đăng ký thiết bị PCCC thành công!', 'success');
        setCreatedAsset(res.data.data);
        fetchStats();
        fetchAssets();
      } else {
        showToast(res.data.message || 'Tạo mã thất bại', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi tạo mã thiết bị', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleLogMaintenance = async () => {
    if (!targetAssetId) return;
    try {
      const res = await axiosInstance.post(`/equipmentqr/${targetAssetId}/log-maintenance`, {
        performedBy: maintenanceBy,
        actionNotes: maintenanceNotes,
        nextIntervalMonths: Number(maintenanceInterval)
      });
      if (res.data.succeeded) {
        showToast(res.data.message || 'Ghi nhận bảo trì thành công!', 'success');
        setMaintenanceDialog(false);
        fetchStats();
        fetchAssets();
        if (currentPassport?.asset?.id === targetAssetId) {
          handleLookup(currentPassport.asset.serialNumber);
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ghi nhận bảo trì thất bại', 'error');
    }
  };

  const openMaintenanceFor = (assetId: string) => {
    setTargetAssetId(assetId);
    setMaintenanceDialog(true);
  };

  const openPrintFor = (item: any) => {
    setPrintAsset(item);
    setPrintDialogOpen(true);
  };

  const formatDate = (d?: string) => {
    if (!d) return 'Chưa có thông tin';
    return new Date(d).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Title */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #ff3d00 0%, #ff9100 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            QUẢN LÝ MÃ QR & THỜI GIAN BẢO TRÌ, LẮP ĐẶT THIẾT BỊ PCCC
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cấp mã định danh QR Code, theo dõi ngày lắp đặt, chu kỳ bảo dưỡng định kỳ và tra cứu vòng đời thiết bị tại hiện trường
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCurrentTab(1)}
            sx={{ background: 'linear-gradient(90deg, #ff3d00 0%, #ff6e40 100%)' }}
          >
            Tạo Mã QR Mới
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { fetchStats(); fetchAssets(); }}>
            Làm mới
          </Button>
        </Stack>
      </Box>

      {/* KPI Stats Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">TỔNG THIẾT BỊ GẮN MÃ</Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">{stats.total}</Typography>
                </Box>
                <QrCodeIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.8 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">Thiết bị PCCC có mã định danh</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">ĐÃ LẮP ĐẶT CÔNG TRÌNH</Typography>
                  <Typography variant="h4" fontWeight="bold" color="info.main">{stats.installed}</Typography>
                </Box>
                <LocationIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.8 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">Đang hoạt động tại vị trí chỉ định</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'background.paper', border: '1px solid rgba(244, 67, 54, 0.3)', borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" sx={{ color: '#ff5252' }}>QUÁ HẠN BẢO TRÌ</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#ff5252' }}>{stats.overdue}</Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 40, color: '#ff5252', opacity: 0.9 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">Cần cử kỹ thuật viên kiểm tra ngay</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'background.paper', border: '1px solid rgba(255, 152, 0, 0.3)', borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" sx={{ color: '#ffb74d' }}>ĐẾN HẠN TRONG 30 NGÀY</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#ffb74d' }}>{stats.upcoming30Days}</Typography>
                </Box>
                <AccessTimeIcon sx={{ fontSize: 40, color: '#ffb74d', opacity: 0.9 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">Sắp đến hạn kiểm định định kỳ</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Tabs Navigation */}
      <Paper sx={{ mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Tabs
          value={currentTab}
          onChange={(_, val) => setCurrentTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<SearchIcon />} iconPosition="start" label="1. Tra cứu & Kiểm tra thời gian bảo trì (Quét mã QR)" />
          <Tab icon={<AddIcon />} iconPosition="start" label="2. Tạo mã định danh QR & In tem dán thiết bị" />
          <Tab icon={<QrCodeIcon />} iconPosition="start" label="3. Danh sách toàn bộ thiết bị đã cấp mã" />
        </Tabs>
      </Paper>

      {/* ==================== TAB 0: LOOKUP & PASSPORT ==================== */}
      {currentTab === 0 && (
        <Box>
          {/* Search Box */}
          <Card sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid rgba(255, 61, 0, 0.2)' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              🔍 Nhập số Serial hoặc dán link QR Code để kiểm tra thời gian lắp đặt & hạn bảo trì:
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder="Ví dụ: SN-2026-FIREGUARD-0050 hoặc FG-PCCC-..."
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => handleLookup()}
                  disabled={lookupLoading}
                  sx={{ height: 54, background: 'linear-gradient(90deg, #ff3d00 0%, #ff6e40 100%)' }}
                >
                  {lookupLoading ? <CircularProgress size={24} color="inherit" /> : 'Kiểm tra ngay'}
                </Button>
              </Grid>
            </Grid>

            {/* Quick Demo Chips */}
            <Box mt={2} display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="caption" color="text.secondary">Mã thiết bị mẫu có sẵn để kiểm tra nhanh:</Typography>
              {['SN-2026-FIREGUARD-0050', 'SN-2026-FIREGUARD-0080', 'SN-2026-FIREGUARD-0024', 'SN-2026-FIREGUARD-0055'].map((sn) => (
                <Chip
                  key={sn}
                  label={sn}
                  size="small"
                  onClick={() => { setLookupInput(sn); handleLookup(sn); }}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,61,0,0.2)' } }}
                  variant="outlined"
                />
              ))}
            </Box>
          </Card>

          {/* Equipment Passport Display */}
          {currentPassport && (
            <Card sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255, 61, 0, 0.3)', overflow: 'hidden' }}>
              {/* Header Status Bar */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: currentPassport.asset.isMaintenanceOverdue ? 'rgba(244, 67, 54, 0.15)' : 'rgba(76, 175, 80, 0.15)',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  {currentPassport.asset.isMaintenanceOverdue ? (
                    <ErrorIcon sx={{ color: '#ff5252', fontSize: 32 }} />
                  ) : (
                    <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 32 }} />
                  )}
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      HỒ SƠ VÒNG ĐỜI THIẾT BỊ PCCC (EQUIPMENT PASSPORT)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Mã định danh duy nhất: <strong>{currentPassport.asset.serialNumber}</strong>
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={currentPassport.asset.isMaintenanceOverdue ? '⚠️ CẢNH BÁO: QUÁ HẠN BẢO TRÌ' : '✅ TÌNH TRẠNG: HOẠT ĐỘNG TỐT'}
                  color={currentPassport.asset.isMaintenanceOverdue ? 'error' : 'success'}
                  sx={{ fontWeight: 'bold', fontSize: 13 }}
                />
              </Box>

              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                <Grid container spacing={4}>
                  {/* Left Column: QR Code & Quick Action */}
                  <Grid item xs={12} md={3.5} sx={{ textAlign: 'center' }}>
                    <Paper
                      elevation={4}
                      sx={{
                        p: 3,
                        bgcolor: '#ffffff',
                        borderRadius: 2,
                        display: 'inline-block',
                        border: '3px solid #ff3d00',
                        mb: 2
                      }}
                    >
                      <QRCodeSVG
                        value={currentPassport.asset.qrCodePayload}
                        size={170}
                        level="H"
                        includeMargin={true}
                      />
                      <Typography variant="caption" sx={{ color: '#000', fontWeight: 'bold', display: 'block', mt: 1 }}>
                        FIREGUARD AI PCCC
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#ff3d00', fontWeight: 'bold', display: 'block' }}>
                        {currentPassport.asset.serialNumber}
                      </Typography>
                    </Paper>

                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        startIcon={<QuickActionIcon />}
                        onClick={() => openMaintenanceFor(currentPassport.asset.id)}
                        sx={{ py: 1.2, fontWeight: 'bold' }}
                      >
                        Ghi Nhận Vừa Bảo Dưỡng
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={() => openPrintFor({
                          ...currentPassport.asset,
                          modelName: currentPassport.model?.name,
                          categoryName: currentPassport.model?.category,
                          locationName: currentPassport.location?.locationName
                        })}
                      >
                        In Tem Dán Thiết Bị
                      </Button>
                    </Stack>
                  </Grid>

                  {/* Right Column: Key Equipment Attributes */}
                  <Grid item xs={12} md={8.5}>
                    <Typography variant="h5" fontWeight="bold" color="primary.main" gutterBottom>
                      {currentPassport.model?.name || 'Thiết bị PCCC'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Chủng loại: <strong>{currentPassport.model?.category || 'Hệ thống PCCC'}</strong> | Hãng sản xuất: <strong>{currentPassport.model?.brand || 'FireGuard'}</strong> | Mã Model: <strong>{currentPassport.model?.modelCode}</strong>
                    </Typography>

                    {/* 4 Essential Lifecycle Highlights */}
                    <Grid container spacing={2} mb={3}>
                      {/* 1. Installation Date */}
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ bgcolor: 'rgba(255, 61, 0, 0.05)', border: '1px solid rgba(255, 61, 0, 0.2)', p: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                            📅 THỜI GIAN LẮP ĐẶT
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff' }}>
                            {formatDate(currentPassport.asset.installationDate)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Vị trí: <strong>{currentPassport.location?.locationName || 'Chưa chỉ định'}</strong>
                          </Typography>
                        </Card>
                      </Grid>

                      {/* 2. Warranty Expiry */}
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ bgcolor: 'rgba(0, 176, 255, 0.05)', border: '1px solid rgba(0, 176, 255, 0.2)', p: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                            🛡️ THỜI HẠN BẢO HÀNH
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff' }}>
                            {formatDate(currentPassport.asset.warrantyEndDate)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: currentPassport.asset.isWarrantyValid ? '#4caf50' : '#ff5252' }}>
                            {currentPassport.asset.isWarrantyValid ? `Còn hạn (${currentPassport.asset.warrantyMonths} tháng)` : 'Đã hết hạn bảo hành'}
                          </Typography>
                        </Card>
                      </Grid>

                      {/* 3. Last Maintenance */}
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ bgcolor: 'rgba(76, 175, 80, 0.05)', border: '1px solid rgba(76, 175, 80, 0.2)', p: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                            🔧 LẦN BẢO TRÌ GẦN NHẤT
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff' }}>
                            {currentPassport.asset.lastMaintenanceDate ? formatDate(currentPassport.asset.lastMaintenanceDate) : 'Chưa có lịch sử'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Đạt chuẩn kiểm định PCCC
                          </Typography>
                        </Card>
                      </Grid>

                      {/* 4. Next Maintenance Date */}
                      <Grid item xs={12} sm={6}>
                        <Card
                          sx={{
                            bgcolor: currentPassport.asset.isMaintenanceOverdue ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 152, 0, 0.05)',
                            border: `1px solid ${currentPassport.asset.isMaintenanceOverdue ? '#f44336' : 'rgba(255, 152, 0, 0.3)'}`,
                            p: 2
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                            ⏰ HẠN BẢO TRÌ TIẾP THEO
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: currentPassport.asset.isMaintenanceOverdue ? '#ff5252' : '#ffb74d' }}>
                            {formatDate(currentPassport.asset.nextMaintenanceDate)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: currentPassport.asset.isMaintenanceOverdue ? '#ff5252' : '#ffb74d' }}>
                            {currentPassport.asset.isMaintenanceOverdue
                              ? `Đã quá hạn ${Math.abs(currentPassport.asset.daysUntilMaintenance || 0)} ngày`
                              : `Còn ${currentPassport.asset.daysUntilMaintenance || 0} ngày đến hạn`}
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Customer & Location Details */}
                    <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        📍 Địa điểm lắp đặt & Chủ sở hữu:
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">Khách hàng sở hữu:</Typography>
                          <Typography variant="body2" fontWeight="600">{currentPassport.customer?.name || 'Khách hàng PCCC'}</Typography>
                          <Typography variant="caption" color="text.secondary">SĐT: {currentPassport.customer?.phone || '0900000000'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">Dự án công trình:</Typography>
                          <Typography variant="body2" fontWeight="600">{currentPassport.location?.projectName || 'Công trình PCCC tiêu chuẩn'}</Typography>
                          <Typography variant="caption" color="text.secondary">Vị trí lắp: {currentPassport.location?.locationName || 'Tầng kỹ thuật'}</Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Maintenance History */}
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      📋 Nhật ký các lần kiểm định & bảo dưỡng:
                    </Typography>
                    {currentPassport.maintenanceHistory?.length > 0 ? (
                      <TableContainer component={Paper} sx={{ bgcolor: 'background.default' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Ngày bảo trì</TableCell>
                              <TableCell>Loại nhắc nhở</TableCell>
                              <TableCell>Trạng thái</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {currentPassport.maintenanceHistory.map((item: any) => (
                              <TableRow key={item.id}>
                                <TableCell>{formatDate(item.scheduledDate)}</TableCell>
                                <TableCell><Chip label={item.reminderType} size="small" variant="outlined" /></TableCell>
                                <TableCell><Chip label={item.status} size="small" color={item.status === 'Accepted' ? 'success' : 'default'} /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                        Chưa có lịch sử sự cố hoặc cảnh báo sửa chữa đối với thiết bị này. Thiết bị đang hoạt động ổn định.
                      </Alert>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* ==================== TAB 1: CREATE QR & ASSET ==================== */}
      {currentTab === 1 && (
        <Grid container spacing={3}>
          {/* Form */}
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid rgba(255, 61, 0, 0.2)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
                ĐĂNG KÝ THIẾT BỊ MỚI & TẠO MÃ QR CODE
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Hệ thống sẽ tạo mã QR chuẩn PCCC, gắn thông tin thời gian lắp đặt và tự động lập lịch bảo trì định kỳ.
              </Typography>

              <Box component="form" onSubmit={handleCreateAsset}>
                <Grid container spacing={2}>
                  {/* Select Model */}
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Model thiết bị PCCC"
                      value={formModelId}
                      onChange={(e) => setFormModelId(e.target.value)}
                      helperText="Chọn loại bình chữa cháy, đầu báo, hoặc tủ trung tâm"
                    >
                      {models.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.name} ({m.modelCode}) - [{m.categoryName}]
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Serial Number */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Số Serial định danh"
                      placeholder="Để trống hệ thống tự sinh mã FG-PCCC-..."
                      value={formSerial}
                      onChange={(e) => setFormSerial(e.target.value)}
                    />
                  </Grid>

                  {/* Installation Date */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      required
                      label="Thời gian lắp đặt"
                      value={formInstallDate}
                      onChange={(e) => setFormInstallDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  {/* Customer */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Khách hàng / Chủ sở hữu"
                      value={formCustomerId}
                      onChange={(e) => setFormCustomerId(e.target.value)}
                    >
                      <MenuItem value="">-- Không chỉ định --</MenuItem>
                      {customers.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Project */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Dự án / Công trình"
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                    >
                      <MenuItem value="">-- Không chỉ định --</MenuItem>
                      {projects.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Location */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Vị trí lắp đặt cụ thể"
                      placeholder="Ví dụ: Tầng 3 - Tòa nhà Landmark 81, cạnh cửa thoát hiểm"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                    />
                  </Grid>

                  {/* Warranty Months */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Thời hạn bảo hành"
                      value={formWarrantyMonths}
                      onChange={(e) => setFormWarrantyMonths(Number(e.target.value))}
                    >
                      <MenuItem value={12}>12 Tháng (1 năm)</MenuItem>
                      <MenuItem value={24}>24 Tháng (2 năm)</MenuItem>
                      <MenuItem value={36}>36 Tháng (3 năm)</MenuItem>
                      <MenuItem value={60}>60 Tháng (5 năm)</MenuItem>
                    </TextField>
                  </Grid>

                  {/* Maintenance Interval */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Chu kỳ bảo trì định kỳ"
                      value={formMaintenanceInterval}
                      onChange={(e) => setFormMaintenanceInterval(Number(e.target.value))}
                      helperText="Theo TCVN 3890 (Khuyên dùng 6 tháng/lần)"
                    >
                      <MenuItem value={3}>3 Tháng / lần</MenuItem>
                      <MenuItem value={6}>6 Tháng / lần (Chuẩn)</MenuItem>
                      <MenuItem value={12}>12 Tháng / lần</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={createLoading}
                  sx={{ mt: 3, py: 1.5, background: 'linear-gradient(90deg, #ff3d00 0%, #ff6e40 100%)', fontSize: 16 }}
                >
                  {createLoading ? <CircularProgress size={24} color="inherit" /> : 'TẠO MÃ QR & KÍCH HOẠT THIẾT BỊ'}
                </Button>
              </Box>
            </Card>
          </Grid>

          {/* Preview Label Card */}
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                BẢN XEM TRƯỚC TEM DÁN PCCC (QR LABEL)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Tem đạt chuẩn PCCC chống giả mạo, cho phép quét kiểm tra ngay lập tức tại hiện trường
              </Typography>

              {/* Physical Label Template */}
              <Box
                sx={{
                  p: 3,
                  bgcolor: '#ffffff',
                  color: '#000000',
                  borderRadius: 2,
                  border: '4px solid #b71c1c',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                {/* Header Badge */}
                <Box sx={{ bgcolor: '#b71c1c', color: '#fff', py: 0.8, px: 2, borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" letterSpacing={1}>
                    FIREGUARD AI - TEM KIỂM ĐỊNH PCCC
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: 10 }}>
                    HỆ THỐNG AN TOÀN PHÒNG CHÁY CHỮA CHÁY THÔNG MINH
                  </Typography>
                </Box>

                {/* QR Code */}
                <Box my={1.5}>
                  <QRCodeSVG
                    value={createdAsset?.qrCodePayload || `https://fireguard.vn/scan/asset/demo?sn=${formSerial || 'FG-PCCC-SAMPLE'}`}
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                </Box>

                <Typography variant="h6" fontWeight="bold" sx={{ color: '#b71c1c', mb: 1 }}>
                  {createdAsset?.serialNumber || formSerial || 'FG-PCCC-2026-XXXX'}
                </Typography>

                <Divider sx={{ my: 1, borderColor: '#ccc' }} />

                <Box sx={{ textAlign: 'left', fontSize: 13, px: 1 }}>
                  <Typography variant="body2" sx={{ color: '#222' }}>
                    <strong>Thiết bị:</strong> {models.find(m => m.id === formModelId)?.name || 'Bình chữa cháy / Thiết bị PCCC'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#222' }}>
                    <strong>Ngày lắp đặt:</strong> {formatDate(formInstallDate)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#222' }}>
                    <strong>Vị trí lắp:</strong> {formLocation}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b71c1c', fontWeight: 'bold' }}>
                    <strong>Hạn bảo trì kế tiếp:</strong> {new Date(new Date(formInstallDate).setMonth(new Date(formInstallDate).getMonth() + formMaintenanceInterval)).toLocaleDateString('vi-VN')}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2, bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: '#555', fontWeight: 600 }}>
                    📞 Hotline Cứu Nạn & Bảo Trì PCCC: 1900-FIREGUARD
                  </Typography>
                </Box>
              </Box>

              {createdAsset && (
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<PrintIcon />}
                  onClick={() => openPrintFor(createdAsset)}
                  sx={{ mt: 3, background: 'linear-gradient(90deg, #ff3d00 0%, #ff6e40 100%)' }}
                >
                  In Tem Dán Thiết Bị Ngay
                </Button>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ==================== TAB 2: ASSET REGISTRY TABLE ==================== */}
      {currentTab === 2 && (
        <Card sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Box p={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
              <Button
                size="small"
                variant={filterOverdue === null ? 'contained' : 'outlined'}
                onClick={() => { setFilterOverdue(null); fetchAssets(); }}
              >
                Tất cả ({stats.total})
              </Button>
              <Button
                size="small"
                variant={filterOverdue === true ? 'contained' : 'outlined'}
                color="error"
                onClick={() => { setFilterOverdue(true); fetchAssets(); }}
              >
                Quá hạn bảo trì ({stats.overdue})
              </Button>
            </Box>

            <Box display="flex" gap={1}>
              <TextField
                size="small"
                placeholder="Tìm Serial, tên thiết bị..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchAssets(); }}
              />
              <Button variant="outlined" onClick={fetchAssets}>Tìm</Button>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>MÃ SERIAL</TableCell>
                  <TableCell>TÊN THIẾT BỊ PCCC</TableCell>
                  <TableCell>KHÁCH HÀNG & VỊ TRÍ</TableCell>
                  <TableCell>THỜI GIAN LẮP ĐẶT</TableCell>
                  <TableCell>HẠN BẢO TRÌ TIẾP THEO</TableCell>
                  <TableCell>TRẠNG THÁI</TableCell>
                  <TableCell align="right">THAO TÁC</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingAssets ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      Không tìm thấy thiết bị nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          {item.serialNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">{item.modelName}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.categoryName || 'PCCC'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.customerName || 'Khách hàng'}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.locationName || 'Chưa định vị'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(item.installationDate)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: item.isMaintenanceOverdue ? '#ff5252' : '#ffb74d' }}>
                          {formatDate(item.nextMaintenanceDate)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: item.isMaintenanceOverdue ? '#ff5252' : '#4caf50' }}>
                          {item.isMaintenanceOverdue ? '⚠️ Quá hạn' : 'Đang còn hạn'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={item.isMaintenanceOverdue ? 'Cần bảo trì' : 'Bình thường'}
                          color={item.isMaintenanceOverdue ? 'error' : 'success'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Xem hồ sơ và quét mã">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setLookupInput(item.serialNumber);
                                setCurrentTab(0);
                                handleLookup(item.serialNumber);
                              }}
                            >
                              <SearchIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="In tem dán QR">
                            <IconButton size="small" onClick={() => openPrintFor(item)}>
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Ghi nhận vừa bảo dưỡng">
                            <IconButton size="small" color="success" onClick={() => openMaintenanceFor(item.id)}>
                              <MaintenanceIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ==================== DIALOG 1: LOG MAINTENANCE ==================== */}
      <Dialog open={maintenanceDialog} onClose={() => setMaintenanceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'success.main' }}>
          🔧 GHI NHẬN BẢO DƯỠNG & KIỂM TRA ĐỊNH KỲ THIẾT BỊ
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Cập nhật kết quả bảo dưỡng thực tế tại hiện trường. Hệ thống sẽ ghi nhận lịch sử và gia hạn chu kỳ bảo trì định kỳ tiếp theo.
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Kỹ thuật viên thực hiện"
              value={maintenanceBy}
              onChange={(e) => setMaintenanceBy(e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Ghi chú nội dung kiểm tra / bảo trì"
              value={maintenanceNotes}
              onChange={(e) => setMaintenanceNotes(e.target.value)}
            />
            <TextField
              select
              fullWidth
              label="Chu kỳ bảo trì kế tiếp"
              value={maintenanceInterval}
              onChange={(e) => setMaintenanceInterval(Number(e.target.value))}
            >
              <MenuItem value={3}>Gia hạn thêm 3 Tháng</MenuItem>
              <MenuItem value={6}>Gia hạn thêm 6 Tháng (Chuẩn PCCC)</MenuItem>
              <MenuItem value={12}>Gia hạn thêm 12 Tháng</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setMaintenanceDialog(false)}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleLogMaintenance}>
            Xác nhận hoàn tất bảo trì
          </Button>
        </DialogActions>
      </Dialog>

      {/* ==================== DIALOG 2: PRINT LABEL ==================== */}
      <Dialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          🖨️ IN TEM DÁN THIẾT BỊ PCCC
        </DialogTitle>
        <DialogContent dividers sx={{ textAlign: 'center', p: 3 }}>
          {printAsset && (
            <Box
              sx={{
                p: 3,
                bgcolor: '#ffffff',
                color: '#000000',
                borderRadius: 2,
                border: '3px solid #b71c1c',
                textAlign: 'center',
                boxShadow: 3
              }}
            >
              <Box sx={{ bgcolor: '#b71c1c', color: '#fff', py: 0.6, px: 1.5, borderRadius: 1, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  FIREGUARD AI - TEM KIỂM ĐỊNH PCCC
                </Typography>
              </Box>

              <QRCodeSVG
                value={printAsset.qrCodePayload || `https://fireguard.vn/scan/asset/${printAsset.id}?sn=${printAsset.serialNumber}`}
                size={180}
                level="H"
                includeMargin={true}
              />

              <Typography variant="h6" fontWeight="bold" sx={{ color: '#b71c1c', my: 1 }}>
                {printAsset.serialNumber}
              </Typography>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ textAlign: 'left', fontSize: 13, px: 1 }}>
                <Typography variant="body2" sx={{ color: '#222' }}>
                  <strong>Thiết bị:</strong> {printAsset.modelName || 'Thiết bị PCCC'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#222' }}>
                  <strong>Ngày lắp đặt:</strong> {formatDate(printAsset.installationDate)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#222' }}>
                  <strong>Vị trí:</strong> {printAsset.locationName || 'Chưa định vị'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#b71c1c', fontWeight: 'bold' }}>
                  <strong>Hạn bảo trì:</strong> {formatDate(printAsset.nextMaintenanceDate)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPrintDialogOpen(false)}>Đóng</Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => {
              window.print();
            }}
            sx={{ background: 'linear-gradient(90deg, #ff3d00 0%, #ff6e40 100%)' }}
          >
            In Ngay
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
