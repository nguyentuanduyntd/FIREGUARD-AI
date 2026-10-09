// Frontend React implementation of AuditLogViewer
import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, CircularProgress, Alert, Divider, MenuItem, Select, FormControl,
  InputLabel, IconButton, TablePagination
} from '@mui/material';
import {
  Security as SecurityIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  DeleteSweep as PurgeIcon,
  CompareArrows as CompareIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

interface AuditRecord {
  id: string;
  operator?: string;
  timestampUtc: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  module: string;
  entityName?: string;
  entityId?: string;
  beforeValues?: string;
  afterValues?: string;
  correlationId?: string;
  isSuccess: boolean;
  errorMessage?: string;
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [isSuccess, setIsSuccess] = useState<string>('all');
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState<AuditRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Purge Dialog State
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const successParam = isSuccess === 'true' ? '&isSuccess=true' : isSuccess === 'false' ? '&isSuccess=false' : '';
      const moduleParam = module ? `&module=${module}` : '';
      const searchParam = search ? `&search=${search}` : '';
      
      const res = await axiosInstance.get(`/audit?pageNumber=${page + 1}&pageSize=${rowsPerPage}${searchParam}${moduleParam}${successParam}`);
      setLogs(res.data.data.items || []);
      setTotalCount(res.data.data.totalCount || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, module, isSuccess]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  const handlePurgeSubmit = async () => {
    try {
      await axiosInstance.post(`/audit/purge?retentionDays=${retentionDays}`);
      setMsg({ type: 'success', text: `Đã dọn dẹp và xóa hoàn toàn các log cũ hơn ${retentionDays} ngày.` });
      setPurgeOpen(false);
      setPage(0);
      fetchLogs();
    } catch (error) {
      setMsg({ type: 'error', text: 'Dọn dẹp nhật ký thất bại.' });
    }
  };

  const getPrettifiedJson = (jsonStr?: string) => {
    if (!jsonStr) return 'N/A';
    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonStr;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityIcon fontSize="large" /> Nhật Ký Kiểm Toán Hệ Thống (Audit Log)
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Lưu vết toàn bộ thao tác thêm, sửa, xóa dữ liệu nhạy cảm, thông tin IP người dùng và phiên đăng nhập để phục vụ điều tra bảo mật.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          color="error"
          startIcon={<PurgeIcon />}
          onClick={() => setPurgeOpen(true)}
          sx={{ borderRadius: 3, fontWeight: 'bold' }}
        >
          Dọn dẹp nhật ký
        </Button>
      </Box>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card sx={{ mb: 4, p: 2, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleSearchSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Tìm kiếm người thực hiện, hành động, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton type="submit">
                      <SearchIcon />
                    </IconButton>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="module-filter-label">Phân hệ / Module</InputLabel>
                <Select
                  labelId="module-filter-label"
                  value={module}
                  label="Phân hệ / Module"
                  onChange={(e) => { setModule(e.target.value); setPage(0); }}
                >
                  <MenuItem value="">Tất cả phân hệ</MenuItem>
                  <MenuItem value="IAM">Tài khoản & Phân quyền (IAM)</MenuItem>
                  <MenuItem value="Catalog">Thiết bị PCCC (Catalog)</MenuItem>
                  <MenuItem value="CRM">Khách hàng (CRM)</MenuItem>
                  <MenuItem value="Inventory">Kho hàng (Inventory)</MenuItem>
                  <MenuItem value="Sales">Báo giá & Hợp đồng (Sales)</MenuItem>
                  <MenuItem value="Services">Sửa chữa & Điều phối</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Kết quả</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={isSuccess}
                  label="Kết quả"
                  onChange={(e) => { setIsSuccess(e.target.value); setPage(0); }}
                >
                  <MenuItem value="all">Tất cả trạng thái</MenuItem>
                  <MenuItem value="true">Thành công</MenuItem>
                  <MenuItem value="false">Thất bại</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={2}>
              <Button type="submit" variant="contained" fullWidth sx={{ borderRadius: 2 }}>
                Lọc dữ liệu
              </Button>
            </Grid>
          </Grid>
        </form>
      </Card>

      {/* Audit Log Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={5}>
              <CircularProgress />
            </Box>
          ) : logs.length === 0 ? (
            <Box p={4} textAlign="center" color="text.secondary">
              Không tìm thấy nhật ký kiểm toán phù hợp.
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Thời gian (UTC)</strong></TableCell>
                    <TableCell><strong>Người thực hiện</strong></TableCell>
                    <TableCell><strong>Module</strong></TableCell>
                    <TableCell><strong>Hành động</strong></TableCell>
                    <TableCell><strong>Đối tượng (ID)</strong></TableCell>
                    <TableCell align="center"><strong>Kết quả</strong></TableCell>
                    <TableCell><strong>IP Address</strong></TableCell>
                    <TableCell align="right"><strong>Chi tiết</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id} hover>
                      <TableCell>{new Date(l.timestampUtc).toLocaleString('vi-VN')}</TableCell>
                      <TableCell><strong>{l.operator}</strong></TableCell>
                      <TableCell><Chip label={l.module} size="small" color="primary" variant="outlined" /></TableCell>
                      <TableCell>{l.action}</TableCell>
                      <TableCell>
                        <span style={{ fontSize: 11, fontFamily: 'monospace' }}>
                          {l.entityName} ({l.entityId?.substring(0, 8) || 'N/A'})
                        </span>
                      </TableCell>
                      <TableCell align="center">
                        {l.isSuccess ? (
                          <Chip label="Thành công" color="success" size="small" />
                        ) : (
                          <Chip label="Thất bại" color="error" size="small" />
                        )}
                      </TableCell>
                      <TableCell>{l.ipAddress || 'System'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="info"
                          onClick={() => {
                            setSelectedLog(l);
                            setDetailOpen(true);
                          }}
                        >
                          <InfoIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </CardContent>
      </Card>

      {/* Details View Modal */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Chi tiết Nhật ký Kiểm toán</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {selectedLog && (
            <Box display="flex" flexDirection="column" gap={2}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Người thực hiện</Typography>
                  <Typography variant="body2" fontWeight="bold">{selectedLog.operator}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Thời gian (UTC)</Typography>
                  <Typography variant="body2" fontWeight="bold">{new Date(selectedLog.timestampUtc).toLocaleString('vi-VN')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">IP Address</Typography>
                  <Typography variant="body2" fontWeight="bold">{selectedLog.ipAddress || 'System'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Correlation ID</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace', fontSize: 11 }}>{selectedLog.correlationId || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">User Agent</Typography>
                  <Typography variant="body2" sx={{ fontSize: 12 }}>{selectedLog.userAgent || 'System Process'}</Typography>
                </Grid>
              </Grid>

              {selectedLog.errorMessage && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  <strong>Lỗi hệ thống:</strong> {selectedLog.errorMessage}
                </Alert>
              )}

              <Divider sx={{ my: 1 }} />

              {/* Side-by-side JSON comparison */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
                    Dữ liệu trước (Before Values)
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: '#f8f9fa', overflowX: 'auto', maxHeight: 300 }}>
                    <pre style={{ margin: 0, fontSize: 11, fontFamily: 'monospace' }}>
                      {getPrettifiedJson(selectedLog.beforeValues)}
                    </pre>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                    Dữ liệu sau (After Values)
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: '#f8f9fa', overflowX: 'auto', maxHeight: 300 }}>
                    <pre style={{ margin: 0, fontSize: 11, fontFamily: 'monospace' }}>
                      {getPrettifiedJson(selectedLog.afterValues)}
                    </pre>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)} variant="contained">Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Purge Dialog */}
      <Dialog open={purgeOpen} onClose={() => setPurgeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Dọn dẹp nhật ký hệ thống</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Lựa chọn khoảng thời gian lưu trữ (Retention Policy). Các log cũ hơn số ngày chỉ định sẽ bị xóa vĩnh viễn.
            </Typography>
            <TextField
              type="number"
              fullWidth
              label="Số ngày lưu trữ tối thiểu"
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurgeOpen(false)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handlePurgeSubmit}>
            Xác nhận xóa log
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
