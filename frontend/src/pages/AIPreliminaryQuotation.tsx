import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Chip, CircularProgress, Alert, LinearProgress, Divider
} from '@mui/material';
import {
  Psychology as RobotIcon,
  AttachMoney as MoneyIcon,
  WarningAmber as WarningIcon,
  CheckCircleOutline as CheckIcon,
  Transform as ConvertIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

interface SuggestedItem {
  itemCode: string;
  quantity: number;
  rationale: string;
  modelId?: string;
  name?: string;
  unitPrice?: number;
  totalPrice?: number;
}

interface QuotationSuggestion {
  suggestedItems: SuggestedItem[];
  equipmentCost: number;
  installationCost: number;
  surveyCost: number;
  minPriceRange: number;
  maxPriceRange: number;
  assumptions: string[];
  missingInfo: string[];
  confidenceLevel: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

export default function AIPreliminaryQuotation() {
  const [form, setForm] = useState({
    buildingType: 'Nhà ở gia đình',
    areaSqm: 100,
    floorCount: 3,
    roomCount: 6,
    riskLevel: 'Trung bình',
    existingEquipment: '',
    expectedBudget: '',
    specialRequirements: ''
  });

  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<QuotationSuggestion | null>(null);
  
  // Convert Dialog State
  const [convertOpen, setConvertOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [converting, setConverting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch customers when opening the convert modal
  useEffect(() => {
    if (convertOpen) {
      axiosInstance.get('/Customer?PageSize=100')
        .then(res => {
          if (res.data?.data?.items) {
            setCustomers(res.data.data.items);
            if (res.data.data.items.length > 0) {
              setSelectedCustomerId(res.data.data.items[0].id);
            }
          }
        })
        .catch(err => console.error('Error fetching customers:', err));
    }
  }, [convertOpen]);

  const handleGenerate = async () => {
    setLoading(true);
    setSuggestion(null);
    try {
      const response = await axiosInstance.post('/ai/quotation/suggest', {
        building_type: form.buildingType,
        area_sqm: Number(form.areaSqm),
        floor_count: Number(form.floorCount),
        room_count: Number(form.roomCount),
        risk_level: form.riskLevel,
        existing_equipment: form.existingEquipment,
        expected_budget: form.expectedBudget ? Number(form.expectedBudget) : null,
        special_requirements: form.specialRequirements
      });
      setSuggestion(response.data);
    } catch (err) {
      console.error(err);
      alert('Không thể tạo báo giá đề xuất từ AI service. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToDraft = async () => {
    if (!suggestion || !selectedCustomerId || converting) return;
    setConverting(true);
    try {
      const itemsPayload = suggestion.suggestedItems.map(item => ({
        itemType: 0, // QuotationItemType.Equipment
        modelId: item.modelId || null,
        name: item.name || `Thiết bị ${item.itemCode}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice || 0
      }));

      // Add installation standard fee as a line item
      itemsPayload.push({
        itemType: 1, // InstallationService
        modelId: null,
        name: 'Dịch vụ thi công lắp đặt thiết bị PCCC (10% dự tính)',
        quantity: 1,
        unitPrice: suggestion.installationCost
      });

      // Add survey fee
      itemsPayload.push({
        itemType: 2, // MaintenanceService or other placeholder for survey
        modelId: null,
        name: 'Chi phí khảo sát thực địa PCCC',
        quantity: 1,
        unitPrice: suggestion.surveyCost
      });

      const response = await axiosInstance.post('/Quotation', {
        customerId: selectedCustomerId,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        discountAmount: 0,
        vatRate: 10,
        notes: `Tạo tự động từ đề xuất báo giá PCCC bằng AI. Quy mô: ${form.buildingType}, ${form.areaSqm}m2, ${form.floorCount} tầng, ${form.roomCount} phòng. Mức rủi ro: ${form.riskLevel}.`,
        items: itemsPayload
      });

      if (response.data?.succeeded) {
        setSuccessMessage(`Đã chuyển đổi đề xuất AI thành Báo Giá Nháp thành công! Số báo giá: ${response.data.data.quotationNumber}. Vui lòng kiểm tra trong phân hệ Quản lý Báo giá.`);
        setConvertOpen(false);
      } else {
        alert('Tạo báo giá thất bại: ' + response.data?.message);
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi kết nối tạo báo giá.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <RobotIcon fontSize="large" /> Đề Xuất Báo Giá Sơ Bộ Bằng AI
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Hệ thống AI phân tích thông số công trình, đối chiếu danh mục thiết bị trong database để ước lượng chi phí PCCC sơ bộ.
        </Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Form Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#131522', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="primary.light" mb={3}>
                Thông Số Công Trình
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  select
                  fullWidth
                  label="Loại công trình"
                  value={form.buildingType}
                  onChange={(e) => setForm({ ...form, buildingType: e.target.value })}
                >
                  <MenuItem value="Nhà ở gia đình">Nhà ở gia đình</MenuItem>
                  <MenuItem value="Chung cư mini">Chung cư mini</MenuItem>
                  <MenuItem value="Văn phòng làm việc">Văn phòng làm việc</MenuItem>
                  <MenuItem value="Nhà hàng / Quán ăn">Nhà hàng / Quán ăn</MenuItem>
                  <MenuItem value="Khách sạn / Nhà nghỉ">Khách sạn / Nhà nghỉ</MenuItem>
                  <MenuItem value="Nhà kho / Nhà xưởng">Nhà kho / Nhà xưởng</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  type="number"
                  label="Diện tích mặt bằng (m²)"
                  value={form.areaSqm}
                  onChange={(e) => setForm({ ...form, areaSqm: Number(e.target.value) })}
                />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Số tầng"
                      value={form.floorCount}
                      onChange={(e) => setForm({ ...form, floorCount: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Số phòng"
                      value={form.roomCount}
                      onChange={(e) => setForm({ ...form, roomCount: Number(e.target.value) })}
                    />
                  </Grid>
                </Grid>

                <TextField
                  select
                  fullWidth
                  label="Mức độ rủi ro cháy nổ"
                  value={form.riskLevel}
                  onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}
                >
                  <MenuItem value="Thấp">Thấp</MenuItem>
                  <MenuItem value="Trung bình">Trung bình</MenuItem>
                  <MenuItem value="Cao">Cao</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Thiết bị PCCC hiện có (nếu có)"
                  placeholder="VD: Đã có 2 bình cứu hỏa CO2 cũ"
                  value={form.existingEquipment}
                  onChange={(e) => setForm({ ...form, existingEquipment: e.target.value })}
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Ngân sách dự kiến (VND)"
                  placeholder="Để trống nếu chưa có"
                  value={form.expectedBudget}
                  onChange={(e) => setForm({ ...form, expectedBudget: e.target.value })}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Yêu cầu đặc biệt"
                  placeholder="VD: Cần lắp đầu phun tự động ở phòng bếp"
                  value={form.specialRequirements}
                  onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })}
                />

                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleGenerate}
                  disabled={loading}
                  sx={{
                    mt: 1,
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #ff3d00 0%, #d50000 100%)',
                    boxShadow: '0 4px 16px rgba(255, 61, 0, 0.2)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ff6d00 0%, #b71c1c 100%)'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Tạo Báo Giá Đề Xuất'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Output Panel */}
        <Grid item xs={12} md={8}>
          <Card sx={{
            backgroundColor: '#131522',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 4,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 500 }}>
              {suggestion ? (
                <Box display="flex" flexDirection="column" gap={3}>
                  
                  {/* Warning Header */}
                  <Alert severity="warning" variant="outlined" sx={{ borderColor: 'warning.main', color: '#ffb74d' }}>
                    <strong>ƯỚC TÍNH SƠ BỘ:</strong> Báo giá này được thiết lập tự động dựa trên thông số sơ bộ của AI.
                    Nhân viên kinh doanh phải kiểm tra thực tế và duyệt trước khi ban hành báo giá chính thức.
                  </Alert>

                  {/* Pricing Estimates */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Paper sx={{ p: 2, backgroundColor: '#1b1d30', textAlign: 'center', borderRadius: 3 }}>
                        <Typography variant="caption" color="text.secondary">Tạm tính thiết bị</Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary.main" mt={0.5}>
                          {suggestion.equipmentCost.toLocaleString('vi-VN')} ₫
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Paper sx={{ p: 2, backgroundColor: '#1b1d30', textAlign: 'center', borderRadius: 3 }}>
                        <Typography variant="caption" color="text.secondary">Vật tư & Thi công</Typography>
                        <Typography variant="h6" fontWeight="bold" color="info.main" mt={0.5}>
                          {suggestion.installationCost.toLocaleString('vi-VN')} ₫
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Paper sx={{ p: 2, backgroundColor: '#1b1d30', textAlign: 'center', borderRadius: 3 }}>
                        <Typography variant="caption" color="text.secondary">Khảo sát & Hồ sơ TCVN</Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main" mt={0.5}>
                          {suggestion.surveyCost.toLocaleString('vi-VN')} ₫
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Paper sx={{ p: 2, backgroundColor: 'rgba(255,61,0,0.08)', textAlign: 'center', borderRadius: 3, border: '1px solid rgba(255,61,0,0.2)' }}>
                        <Typography variant="caption" color="primary.light">Dự toán gói (Dự kiến)</Typography>
                        <Typography variant="subtitle1" fontWeight="bold" color="warning.main" mt={0.5}>
                          {(suggestion.equipmentCost + suggestion.installationCost + suggestion.surveyCost).toLocaleString('vi-VN')} ₫
                        </Typography>
                        <Typography fontSize={10} color="text.disabled">
                          Tối đa: {suggestion.maxPriceRange.toLocaleString('vi-VN')} ₫
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Confidence rating */}
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" fontWeight="bold" color="text.secondary">Mức độ tin cậy của đề xuất:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">{(suggestion.confidenceLevel * 100).toFixed(0)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={suggestion.confidenceLevel * 100} sx={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                  </Box>

                  {/* Equipment Table */}
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary.light" mb={1} display="flex" alignItems="center" gap={1}>
                      <MoneyIcon /> Chi Tiết Thiết Bị Đề Xuất:
                    </Typography>
                    <TableContainer component={Paper} sx={{ backgroundColor: '#1b1d30', borderRadius: 3 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ borderBottom: '2px solid rgba(255,255,255,0.05)' }}>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Mã thiết bị</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Tên sản phẩm</TableCell>
                            <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold' }}>SL</TableCell>
                            <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>Đơn giá</TableCell>
                            <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>Thành tiền</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {suggestion.suggestedItems.map((item, idx) => (
                            <TableRow key={idx} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold', fontSize: 12 }}>{item.itemCode}</TableCell>
                              <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
                                {item.name || 'Thiết bị mẫu dự kiến'}
                                <Box fontSize={10} color="text.disabled" mt={0.5}>{item.rationale}</Box>
                              </TableCell>
                              <TableCell align="center" sx={{ color: 'text.secondary', fontSize: 12 }}>{item.quantity}</TableCell>
                              <TableCell align="right" sx={{ color: 'text.secondary', fontSize: 12 }}>
                                {item.unitPrice ? `${item.unitPrice.toLocaleString('vi-VN')} ₫` : '—'}
                              </TableCell>
                              <TableCell align="right" sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: 12 }}>
                                {item.totalPrice ? `${item.totalPrice.toLocaleString('vi-VN')} ₫` : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* Assumptions & Gaps */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" fontWeight="bold" color="warning.main" mb={1} display="flex" alignItems="center" gap={1}>
                        <CheckIcon fontSize="small" /> Các Giả Định Hệ Thống:
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: 20, color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
                        {suggestion.assumptions.map((asm, idx) => (
                          <li key={idx}>{asm}</li>
                        ))}
                      </ul>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" fontWeight="bold" color="error.main" mb={1} display="flex" alignItems="center" gap={1}>
                        <WarningIcon fontSize="small" /> Thông Tin Cần Khảo Sát Thêm:
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: 20, color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
                        {suggestion.missingInfo.map((mis, idx) => (
                          <li key={idx}>{mis}</li>
                        ))}
                      </ul>
                    </Grid>
                  </Grid>

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                  {/* Convert CTA */}
                  <Box display="flex" justifyContent="flex-end" pt={1}>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="large"
                      startIcon={<ConvertIcon />}
                      onClick={() => setConvertOpen(true)}
                      sx={{
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #00e676 0%, #00a152 100%)',
                        boxShadow: '0 4px 16px rgba(0, 230, 118, 0.2)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #33eb91 0%, #00701a 100%)'
                        }
                      }}
                    >
                      Chuyển Thành Báo Giá Nháp
                    </Button>
                  </Box>

                </Box>
              ) : (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={2} py={8}>
                  <RobotIcon sx={{ fontSize: 80, color: 'text.disabled', opacity: 0.2 }} />
                  <Typography color="text.secondary" variant="body1" textAlign="center" maxWidth={400}>
                    Nhập các thông số mặt bằng và yêu cầu công trình ở cột bên trái, sau đó nhấn "Tạo Báo Giá Đề Xuất" để hiển thị ước tính chi tiết tại đây.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Convert Dialog */}
      <Dialog open={convertOpen} onClose={() => setConvertOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Chuyển Đề Xuất Thành Báo Giá Nháp</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Vui lòng chọn khách hàng thụ hưởng trong hệ thống CRM để liên kết với dự thảo báo giá này.
          </Typography>

          <TextField
            select
            fullWidth
            label="Chọn khách hàng CRM"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            {customers.map(c => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} ({c.email})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertOpen(false)}>Hủy bỏ</Button>
          <Button
            variant="contained"
            color="success"
            disabled={!selectedCustomerId || converting}
            onClick={handleConvertToDraft}
            startIcon={converting ? <CircularProgress size={20} color="inherit" /> : <ConvertIcon />}
          >
            Tạo Bản Thảo
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
