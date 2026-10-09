import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, Divider, Snackbar, Alert, CircularProgress, MenuItem
} from '@mui/material';
import { Add, Visibility, CheckCircle, Cancel, RequestQuote, FileDownload, History, Delete } from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

export default function QuotationManagement() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [equipmentModels, setEquipmentModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [formData, setFormData] = useState({
    customerId: '',
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    discountAmount: 0,
    vatRate: 10,
    notes: 'Báo giá thiết bị và dịch vụ',
    items: [
      { itemType: 0, modelId: '', name: 'Thiết bị', quantity: 1, unitPrice: 0 }
    ]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quotationsRes, customersRes, modelsRes] = await Promise.all([
        axiosInstance.get('/quotation'),
        axiosInstance.get('/customer?PageSize=100'),
        axiosInstance.get('/equipmentmodel?PageSize=100')
      ]);
      if (quotationsRes.data?.data) setQuotations(quotationsRes.data.data);
      if (customersRes.data?.data?.items) {
        setCustomers(customersRes.data.data.items);
        if (customersRes.data.data.items.length > 0) {
          setFormData(prev => ({ ...prev, customerId: customersRes.data.data.items[0].id }));
        }
      }
      if (modelsRes.data?.data?.items) {
        setEquipmentModels(modelsRes.data.data.items);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu', error);
      setSnackbar({ open: true, message: 'Lỗi tải dữ liệu báo giá', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    try {
      await axiosInstance.post('/quotation', formData);
      setSnackbar({ open: true, message: 'Tạo báo giá nháp thành công', severity: 'success' });
      setOpen(false);
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi tạo báo giá', severity: 'error' });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: number) => {
    try {
      await axiosInstance.post(`/quotation/${id}/status`, { status: newStatus });
      setSnackbar({ open: true, message: 'Cập nhật trạng thái thành công', severity: 'success' });
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi cập nhật trạng thái', severity: 'error' });
    }
  };

  const handleNewVersion = async (id: string) => {
    try {
      await axiosInstance.post(`/quotation/${id}/version`);
      setSnackbar({ open: true, message: 'Đã khởi tạo phiên bản mới', severity: 'success' });
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi tạo phiên bản mới', severity: 'error' });
    }
  };

  const loadQuotationDetailsForPdf = async (id: string) => {
    try {
      const res = await axiosInstance.get(`/quotation/${id}`);
      if (res.data?.data) {
        setSelectedQuotation(res.data.data);
        setPdfOpen(true);
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Lỗi tải chi tiết báo giá', severity: 'error' });
    }
  };

  const handleDownloadPdf = async (id: string) => {
    window.open(`${(import.meta as any).env.VITE_API_URL}/quotation/${id}/pdf`, '_blank');
  };

  const getStatusLabel = (status: number) => {
    const labels = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Cancelled'];
    return labels[status] || 'N/A';
  };

  const getStatusColor = (status: number) => {
    switch(status) {
      case 0: return 'default';
      case 1: return 'primary';
      case 2: return 'success';
      case 3: return 'error';
      case 4: return 'warning';
      case 5: return 'default';
      default: return 'default';
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemType: 0, modelId: '', name: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RequestQuote /> Quản Lý Báo Giá
        </Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setOpen(true)}>
          Tạo Báo Giá Mới
        </Button>
      </Box>

      <Card sx={{ background: '#1a202c', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
            <Table>
              <TableHead sx={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                <TableRow>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Số báo giá</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Khách hàng</TableCell>
                  <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Tổng thanh toán</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Hạn hiệu lực</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Trạng thái</TableCell>
                  <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><CircularProgress color="primary" /></TableCell></TableRow>
                ) : quotations.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>Chưa có báo giá nào</TableCell></TableRow>
                ) : quotations.map((q) => (
                  <TableRow key={q.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.04)' } }}>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{q.quotationNumber} (v{q.version})</TableCell>
                    <TableCell sx={{ color: '#e0e0e0' }}>{q.customer?.name}</TableCell>
                    <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>{q.totalAmount.toLocaleString()} đ</TableCell>
                    <TableCell sx={{ color: '#e0e0e0' }}>{new Date(q.expirationDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={getStatusLabel(q.status)} color={getStatusColor(q.status) as any} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="info" onClick={() => loadQuotationDetailsForPdf(q.id)}><Visibility /></IconButton>
                      {q.status === 0 /* Draft */ && (
                        <Button size="small" sx={{ ml: 1 }} variant="contained" color="primary" onClick={() => handleUpdateStatus(q.id, 1)}>Gửi KH</Button>
                      )}
                      {q.status === 1 /* Sent */ && (
                        <>
                          <IconButton color="success" title="Khách đồng ý" onClick={() => handleUpdateStatus(q.id, 2)}><CheckCircle /></IconButton>
                          <IconButton color="error" title="Khách từ chối" onClick={() => handleUpdateStatus(q.id, 3)}><Cancel /></IconButton>
                          <IconButton color="warning" onClick={() => handleNewVersion(q.id)} title="Tạo phiên bản mới"><History /></IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>Tạo báo giá</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Khách hàng" value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}>
                {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField type="datetime-local" fullWidth label="Hạn hiệu lực" InputLabelProps={{ shrink: true }} value={formData.expirationDate} onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <TextField type="number" fullWidth label="Chiết khấu giảm giá (VND)" value={formData.discountAmount} onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={4}>
              <TextField type="number" fullWidth label="Thuế VAT (%)" value={formData.vatRate} onChange={(e) => setFormData({ ...formData, vatRate: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" color="secondary" sx={{ mt: 2, mb: 1 }}>Hạng mục báo giá</Typography>
              {formData.items.map((item, index) => (
                <Box key={index} display="flex" gap={1} mb={2} alignItems="center">
                  <TextField select sx={{ width: '150px' }} label="Loại" value={item.itemType} onChange={(e) => {
                    const newItems = [...formData.items];
                    newItems[index].itemType = Number(e.target.value);
                    setFormData({ ...formData, items: newItems });
                  }}>
                    <MenuItem value={0}>Thiết bị</MenuItem>
                    <MenuItem value={1}>Vật tư phụ</MenuItem>
                    <MenuItem value={2}>Dịch vụ</MenuItem>
                  </TextField>
                  
                  {item.itemType === 0 ? (
                    <TextField select sx={{ flex: 2 }} label="Chọn thiết bị" value={item.modelId} onChange={(e) => {
                      const newItems = [...formData.items];
                      const model = equipmentModels.find(m => m.id === e.target.value);
                      newItems[index].modelId = e.target.value;
                      newItems[index].name = model ? model.name : '';
                      newItems[index].unitPrice = model ? model.sellingPrice : 0;
                      setFormData({ ...formData, items: newItems });
                    }}>
                      {equipmentModels.map(m => <MenuItem key={m.id} value={m.id}>{m.modelCode} - {m.name} ({m.sellingPrice.toLocaleString()} đ)</MenuItem>)}
                    </TextField>
                  ) : (
                    <TextField sx={{ flex: 2 }} label="Tên mục" value={item.name} onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[index].name = e.target.value;
                      setFormData({ ...formData, items: newItems });
                    }} />
                  )}

                  <TextField type="number" sx={{ width: '100px' }} label="Số lượng" value={item.quantity} onChange={(e) => {
                    const newItems = [...formData.items];
                    newItems[index].quantity = Number(e.target.value);
                    setFormData({ ...formData, items: newItems });
                  }} />
                  
                  <TextField type="number" sx={{ width: '150px' }} label="Đơn giá (VND)" value={item.unitPrice} onChange={(e) => {
                    const newItems = [...formData.items];
                    newItems[index].unitPrice = Number(e.target.value);
                    setFormData({ ...formData, items: newItems });
                  }} />
                  
                  <IconButton color="error" onClick={() => handleRemoveItem(index)} disabled={formData.items.length === 1}><Delete /></IconButton>
                </Box>
              ))}
              <Button variant="outlined" onClick={handleAddItem} startIcon={<Add />}>Thêm hạng mục</Button>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Ghi chú điều khoản báo giá" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="primary" onClick={handleCreate}>Tạo nháp</Button>
        </DialogActions>
      </Dialog>

      {/* PDF Printable preview */}
      <Dialog open={pdfOpen} onClose={() => setPdfOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>Chi tiết Báo Giá</DialogTitle>
        <DialogContent dividers>
          {selectedQuotation && (
            <Box p={3} sx={{ background: '#fff', border: '1px solid #ddd', borderRadius: 2, color: '#333' }}>
              <Grid container justifyContent="space-between" mb={4}>
                <Grid item>
                  <Typography variant="h5" fontWeight="bold" color="error.main">FIREGUARD AI</Typography>
                  <Typography variant="body2">Hệ thống phòng cháy chữa cháy thông minh</Typography>
                </Grid>
                <Grid item sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" fontWeight="bold">BÁO GIÁ THIẾT BỊ & DỊCH VỤ</Typography>
                  <Typography variant="body2">Mã: {selectedQuotation.quotationNumber}</Typography>
                  <Typography variant="body2">Phiên bản: {selectedQuotation.version}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="subtitle1" fontWeight="bold" mb={1}>Kính gửi quý khách hàng: {selectedQuotation.customer?.name}</Typography>
              <Typography variant="body2" mb={3}>Ngày hiệu lực: {new Date(selectedQuotation.expirationDate).toLocaleDateString()}</Typography>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ background: '#fafafa' }}>
                    <TableRow>
                      <TableCell><strong>STT</strong></TableCell>
                      <TableCell><strong>Danh mục vật tư / Dịch vụ</strong></TableCell>
                      <TableCell align="right"><strong>Số lượng</strong></TableCell>
                      <TableCell align="right"><strong>Đơn giá (VND)</strong></TableCell>
                      <TableCell align="right"><strong>Thành tiền</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedQuotation.items?.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{item.unitPrice.toLocaleString()}</TableCell>
                        <TableCell align="right">{(item.quantity * item.unitPrice).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                <Typography variant="body2">Cộng tiền hàng: {selectedQuotation.subTotal.toLocaleString()} VND</Typography>
                <Typography variant="body2">Chiết khấu: -{selectedQuotation.discountAmount.toLocaleString()} VND</Typography>
                <Typography variant="body2">Thuế VAT: {selectedQuotation.vatAmount.toLocaleString()} VND</Typography>
                <Typography variant="h6" color="error.main">Tổng cộng: {selectedQuotation.totalAmount.toLocaleString()} VND</Typography>
              </Box>

              <Box mt={4}>
                <Typography variant="body2" fontStyle="italic">Ghi chú: {selectedQuotation.notes || 'Không có ghi chú thêm.'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {selectedQuotation && (
            <Button startIcon={<FileDownload />} variant="contained" color="secondary" onClick={() => handleDownloadPdf(selectedQuotation.id)}>Mở bản in HTML/PDF</Button>
          )}
          <Button onClick={() => setPdfOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
