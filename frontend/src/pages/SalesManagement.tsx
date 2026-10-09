import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Tab, Tabs, Chip, List, ListItem, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { ShoppingCart, Description, Receipt, Payment, UploadFile } from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

export default function SalesManagement() {
  const [activeTab, setActiveTab] = useState(0);

  const [contracts, setContracts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]); // Keep local state for payments as there's no GET endpoint
  
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 0, // Enum: 0=Cash, 1=BankTransfer, 2=CreditCard
    referenceNumber: '',
    attachmentUrl: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contractsRes, invoicesRes] = await Promise.all([
        axiosInstance.get('/sales/contracts'),
        axiosInstance.get('/sales/invoices')
      ]);
      if (contractsRes.data?.data) setContracts(contractsRes.data.data);
      if (invoicesRes.data?.data) setInvoices(invoicesRes.data.data);
    } catch (error) {
      console.error('Lỗi tải dữ liệu sales', error);
      setSnackbar({ open: true, message: 'Lỗi tải dữ liệu hợp đồng / hóa đơn', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssueInvoice = async (id: string) => {
    try {
      await axiosInstance.post(`/sales/invoices/${id}/issue`);
      setSnackbar({ open: true, message: 'Hóa đơn đã được phát hành', severity: 'success' });
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi phát hành', severity: 'error' });
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await axiosInstance.delete(`/sales/invoices/${id}`);
      setSnackbar({ open: true, message: 'Đã xóa hóa đơn nháp', severity: 'success' });
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi xóa hóa đơn', severity: 'error' });
    }
  };

  const handleOpenPayment = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentForm({ amount: inv.debtRemaining, method: 1, referenceNumber: '', attachmentUrl: '' });
    setPaymentOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;
    try {
      const payload = {
        invoiceId: selectedInvoice.id,
        amount: paymentForm.amount,
        paymentMethod: paymentForm.method,
        referenceNumber: paymentForm.referenceNumber,
        attachmentUrl: paymentForm.attachmentUrl
      };
      const res = await axiosInstance.post('/sales/payments', payload);
      setSnackbar({ open: true, message: 'Ghi nhận thanh toán thành công', severity: 'success' });
      setPaymentOpen(false);
      
      // Add to local payments list for display
      if (res.data?.data) {
        setPayments([res.data.data, ...payments]);
      }
      
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi ghi nhận thanh toán', severity: 'error' });
    }
  };

  const getInvoiceStatusLabel = (status: number) => {
    const labels = ['Draft', 'Issued', 'Paid', 'Cancelled'];
    return labels[status] || 'N/A';
  };
  
  const getInvoiceStatusColor = (status: number) => {
    switch(status) {
      case 0: return 'default';
      case 1: return 'warning';
      case 2: return 'success';
      case 3: return 'error';
      default: return 'default';
    }
  };

  const getContractStatusLabel = (status: number) => {
    const labels = ['Draft', 'Active', 'Completed', 'Terminated'];
    return labels[status] || 'N/A';
  };

  const getPaymentMethodLabel = (method: number) => {
    const labels = ['Tiền mặt', 'Chuyển khoản', 'Thẻ tín dụng'];
    return labels[method] || 'Khác';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCart /> Doanh Thu & Tài Chính
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} indicatorColor="primary" textColor="primary" sx={{ mb: 3 }}>
        <Tab icon={<Description sx={{ mr: 1, verticalAlign: 'middle' }} />} label="Hợp Đồng" />
        <Tab icon={<Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />} label="Hóa Đơn" />
        <Tab icon={<Payment sx={{ mr: 1, verticalAlign: 'middle' }} />} label="Phiếu Thu (Local)" />
      </Tabs>

      {activeTab === 0 && (
        <Card sx={{ background: '#1a202c', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
              <Table>
                <TableHead sx={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Số hợp đồng</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Khách hàng</TableCell>
                    <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Giá trị (VND)</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Trạng thái</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Giai đoạn thanh toán</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><CircularProgress color="primary" /></TableCell></TableRow>
                  ) : contracts.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>Chưa có hợp đồng nào</TableCell></TableRow>
                  ) : contracts.map((c) => (
                    <TableRow key={c.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.04)' } }}>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{c.contractNumber}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{c.customer?.name}</TableCell>
                      <TableCell align="right" sx={{ color: '#e0e0e0' }}>{c.totalValue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={getContractStatusLabel(c.status)} color={c.status === 1 ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>
                        <List sx={{ p: 0 }}>
                          {c.installments?.map((inst: any, i: number) => (
                            <ListItem key={i} sx={{ p: 0, display: 'flex', justifyContent: 'space-between', color: '#e0e0e0' }}>
                              <Typography variant="body2">{inst.stageName}: {inst.amount.toLocaleString()}</Typography>
                              <Chip label={inst.isPaid ? 'Đã thu' : 'Chưa thu'} color={inst.isPaid ? 'success' : 'default'} size="small" sx={{ ml: 1 }} />
                            </ListItem>
                          ))}
                        </List>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card sx={{ background: '#1a202c', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
              <Table>
                <TableHead sx={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Số hóa đơn</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Khách hàng</TableCell>
                    <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Tổng tiền</TableCell>
                    <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Đã thanh toán</TableCell>
                    <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Còn thiếu</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Trạng thái</TableCell>
                    <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress color="primary" /></TableCell></TableRow>
                  ) : invoices.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>Chưa có hóa đơn nào</TableCell></TableRow>
                  ) : invoices.map((inv) => (
                    <TableRow key={inv.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.04)' } }}>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{inv.invoiceNumber}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{inv.customer?.name}</TableCell>
                      <TableCell align="right" sx={{ color: '#e0e0e0' }}>{inv.totalAmount.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ color: '#e0e0e0' }}>{inv.amountPaid.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <strong style={{ color: inv.debtRemaining > 0 ? '#ff5252' : '#e0e0e0' }}>
                          {inv.debtRemaining.toLocaleString()}
                        </strong>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getInvoiceStatusLabel(inv.status)}
                          color={getInvoiceStatusColor(inv.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {inv.status === 0 /* Draft */ && (
                          <>
                            <Button size="small" variant="contained" color="success" onClick={() => handleIssueInvoice(inv.id)} sx={{ mr: 1 }}>Phát hành</Button>
                            <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteInvoice(inv.id)}>Xóa</Button>
                          </>
                        )}
                        {inv.status === 1 /* Issued */ && (
                          <Button size="small" variant="contained" color="primary" onClick={() => handleOpenPayment(inv)}>Thu tiền</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card sx={{ background: '#1a202c', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <CardContent sx={{ p: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>* Danh sách phiếu thu hiện được lưu ở Local State do API backend chưa hỗ trợ GET payments.</Typography>
            <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
              <Table>
                <TableHead sx={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Mã phiếu thu</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Số hóa đơn</TableCell>
                    <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Số tiền thu</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Phương thức</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Tham chiếu</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>Chưa có phiếu thu nào trong phiên làm việc này</TableCell></TableRow>
                  ) : payments.map((p, idx) => (
                    <TableRow key={idx} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.04)' } }}>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{p.paymentNumber}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{invoices.find(i => i.id === p.invoiceId)?.invoiceNumber || 'N/A'}</TableCell>
                      <TableCell align="right" sx={{ color: '#fff' }}><strong>{p.amount.toLocaleString()} VND</strong></TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{getPaymentMethodLabel(p.paymentMethod)}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{p.referenceNumber || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Payment Form Dialog */}
      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>Ghi nhận thanh toán hóa đơn</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField type="number" fullWidth label="Số tiền thu (VND)" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12}>
              <TextField select fullWidth label="Phương thức thanh toán" value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: Number(e.target.value) })}>
                <MenuItem value={0}>Tiền mặt</MenuItem>
                <MenuItem value={1}>Chuyển khoản</MenuItem>
                <MenuItem value={2}>Thẻ tín dụng</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Mã giao dịch / Số tham chiếu" value={paymentForm.referenceNumber} onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPaymentOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="primary" onClick={handleConfirmPayment}>Lưu phiếu thu</Button>
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
