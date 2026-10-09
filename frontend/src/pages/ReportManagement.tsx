// Frontend React implementation of ReportManagement
import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, CircularProgress, Alert, Divider, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
  Assessment as ReportIcon,
  CloudDownload as DownloadIcon,
  FilterList as FilterIcon,
  History as HistoryIcon,
  LibraryBooks as BookIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

interface ExportRecord {
  id: string;
  reportType: number;
  fileFormat: string;
  fileUrl?: string;
  status: number;
  errorMessage?: string;
  createdAtUtc: string;
  expiresAtUtc?: string;
}

const REPORT_TYPES = [
  { value: 0, label: 'Doanh thu & Tài chính', desc: 'Phân tích doanh số, công nợ' },
  { value: 1, label: 'Báo giá & Đấu thầu', desc: 'Tỷ lệ chốt hợp đồng thành công' },
  { value: 2, label: 'Tiến độ dự án thi công', desc: 'Các công trình đang thi công' },
  { value: 3, label: 'Tồn kho & Nhập xuất tồn', desc: 'Báo cáo cảnh báo kho thấp' },
  { value: 4, label: 'Lịch trình bảo trì thiết bị', desc: 'Bình chữa cháy, vòi phun PCCC' },
  { value: 5, label: 'Đơn cứu hộ & Sửa chữa', desc: 'Thống kê lỗi thiết bị PCCC' },
  { value: 6, label: 'Hiệu suất & Điểm KPI', desc: 'Xếp hạng kỹ thuật viên xuất sắc' },
  { value: 7, label: 'Đánh giá & Phản hồi', desc: 'Ý kiến phản hồi từ khách hàng' },
  { value: 8, label: 'Trạng thái thiết bị', desc: 'Thiết bị hoạt động & Hết bảo hành' }
];

const REPORT_STATUS = [
  { value: 0, label: 'Chờ xử lý', color: 'default' as const },
  { value: 1, label: 'Đang kết xuất', color: 'info' as const },
  { value: 2, label: 'Hoàn tất', color: 'success' as const },
  { value: 3, label: 'Thất bại', color: 'error' as const }
];

export default function ReportManagement() {
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<typeof REPORT_TYPES[0] | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [format, setFormat] = useState('Excel');
  const [employeeId, setEmployeeId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/report');
      setHistory(res.data.data || []);
    } catch (error) {
      console.error('Error fetching export history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleOpenDialog = (type: typeof REPORT_TYPES[0]) => {
    setSelectedType(type);
    setDialogOpen(true);
  };

  const handleTriggerExport = async () => {
    if (!selectedType) return;
    setExportLoading(true);
    setMsg(null);
    try {
      const filters = { startDate, endDate, employeeId, warehouseId };
      await axiosInstance.post('/report/export', {
        reportType: selectedType.value,
        fileFormat: format,
        filtersJson: JSON.stringify(filters)
      });
      setMsg({ type: 'success', text: 'Yêu cầu kết xuất báo cáo đang được xử lý trong nền. Bạn sẽ nhận được thông báo sau vài giây.' });
      setDialogOpen(false);
      fetchHistory();
    } catch (error) {
      setMsg({ type: 'error', text: 'Yêu cầu kết xuất thất bại. Vui lòng kiểm tra lại quyền.' });
    } finally {
      setExportLoading(false);
    }
  };

  const handleDownload = (record: ExportRecord) => {
    // Generate secure absolute download URL pointing to backend download endpoint
    const downloadUrl = `${axiosInstance.defaults.baseURL}/report/${record.id}/download`;
    window.open(downloadUrl, '_blank');
  };

  const getStatusChip = (status: number) => {
    const item = REPORT_STATUS.find(s => s.value === status) || REPORT_STATUS[0];
    return <Chip label={item.label} color={item.color} size="small" />;
  };

  const getReportName = (type: number) => {
    return REPORT_TYPES.find(t => t.value === type)?.label || 'Báo cáo khác';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReportIcon fontSize="large" /> Trung Tâm Kết Xuất Báo Cáo & Thống Kê
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Yêu cầu các báo cáo tài chính, kho hàng, bảo trì và hiệu suất làm việc của kỹ thuật viên. Báo cáo dung lượng lớn được xử lý không đồng bộ.
        </Typography>
      </Box>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      {/* Grid of Report Cards */}
      <Typography variant="h6" fontWeight="bold" mb={2}>Danh mục báo cáo khả dụng</Typography>
      <Grid container spacing={3} mb={5}>
        {REPORT_TYPES.map((t) => (
          <Grid item xs={12} sm={6} md={4} key={t.value}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                  {t.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t.desc}
                </Typography>
              </CardContent>
              <Box p={2} borderTop="1px solid #f0f0f0">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => handleOpenDialog(t)}
                  fullWidth
                >
                  Thiết lập bộ lọc & Xuất
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Export History Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', background: '#1a202c', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box px={3} py={2} bgcolor="rgba(255, 255, 255, 0.05)" display="flex" alignItems="center" gap={1} borderBottom="1px solid rgba(255, 255, 255, 0.1)">
          <HistoryIcon color="primary" />
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#fff' }}>Lịch sử kết xuất báo cáo gần đây</Typography>
        </Box>
        <CardContent>
          {loading && history.length === 0 ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : history.length === 0 ? (
            <Box p={3} textAlign="center" color="text.secondary">
              Không tìm thấy yêu cầu báo cáo nào của bạn.
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
              <Table size="small">
                <TableHead sx={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Mã yêu cầu</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Loại báo cáo</TableCell>
                    <TableCell align="center" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Định dạng</TableCell>
                    <TableCell align="center" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Trạng thái</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Ngày tạo</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Hết hạn tải</TableCell>
                    <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Tải xuống</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((h) => {
                    const isExpired = !!(h.expiresAtUtc && new Date() > new Date(h.expiresAtUtc));
                    return (
                      <TableRow key={h.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.04)' } }}>
                        <TableCell sx={{ color: '#90caf9' }}><span style={{ fontFamily: 'monospace' }}>{h.id.substring(0, 8)}...</span></TableCell>
                        <TableCell sx={{ color: '#fff' }}><strong>{getReportName(h.reportType)}</strong></TableCell>
                        <TableCell align="center" sx={{ color: '#e0e0e0' }}>{h.fileFormat}</TableCell>
                        <TableCell align="center">{getStatusChip(h.status)}</TableCell>
                        <TableCell sx={{ color: '#e0e0e0' }}>{new Date(h.createdAtUtc).toLocaleString('vi-VN')}</TableCell>
                        <TableCell>
                          {h.expiresAtUtc ? (
                            isExpired ? (
                              <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>Đã hết hạn</span>
                            ) : (
                              new Date(h.expiresAtUtc).toLocaleString('vi-VN')
                            )
                          ) : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            disabled={h.status !== 2 || isExpired}
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownload(h)}
                          >
                            Tải file
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Cấu hình kết xuất báo cáo</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {selectedType && (
            <Box display="flex" flexDirection="column" gap={2.5}>
              <Typography variant="body2" color="text.secondary">
                Đang thiết lập báo cáo: <strong>{selectedType.label}</strong>
              </Typography>

              <TextField
                type="date"
                fullWidth
                label="Từ ngày"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <TextField
                type="date"
                fullWidth
                label="Đến ngày"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />

              <FormControl fullWidth>
                <InputLabel id="format-select-label">Định dạng file</InputLabel>
                <Select
                  labelId="format-select-label"
                  value={format}
                  label="Định dạng file"
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <MenuItem value="Excel">Microsoft Excel (.xlsx)</MenuItem>
                  <MenuItem value="PDF">Adobe PDF (.pdf)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Lọc theo mã chi nhánh / kho (Tùy chọn)"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              />

              <TextField
                fullWidth
                label="Lọc theo mã nhân viên (Tùy chọn)"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleTriggerExport}
            disabled={exportLoading}
            startIcon={exportLoading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Yêu cầu kết xuất
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
