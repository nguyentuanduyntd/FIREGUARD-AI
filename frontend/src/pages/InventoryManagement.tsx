import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Tab, Tabs, Alert, Chip, CircularProgress, Snackbar, IconButton
} from '@mui/material';
import { Warehouse, Assessment, ArrowUpward, ArrowDownward, CompareArrows, History, Warning, Add, Edit, Delete } from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

export default function InventoryManagement() {
  const [tabIndex, setTabIndex] = useState(0);

  const [stocks, setStocks] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [directOpen, setDirectOpen] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);

  const [directForm, setDirectForm] = useState({
    warehouseId: '',
    modelId: '',
    quantity: 0
  });

  const [receiptForm, setReceiptForm] = useState({
    warehouseId: '',
    modelId: '',
    quantity: 10,
    unitPrice: 150000,
    serialNumbers: ''
  });

  const [issueForm, setIssueForm] = useState({
    warehouseId: '',
    modelId: '',
    quantity: 5,
    unitPrice: 280000,
    serialNumbers: ''
  });

  const [transferForm, setTransferForm] = useState({
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    modelId: '',
    quantity: 5,
    serialNumbers: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stocksRes, txRes, whRes, modelRes] = await Promise.all([
        axiosInstance.get('/inventory/stock'),
        axiosInstance.get('/inventory/transactions'),
        axiosInstance.get('/inventory/warehouses'),
        axiosInstance.get('/equipmentmodel?PageSize=100')
      ]);

      if (stocksRes.data?.data) setStocks(stocksRes.data.data);
      if (txRes.data?.data) setTransactions(txRes.data.data);
      if (whRes.data?.data) {
        setWarehouses(whRes.data.data);
        if (whRes.data.data.length > 0) {
          const firstWh = whRes.data.data[0].id;
          setReceiptForm(prev => ({ ...prev, warehouseId: firstWh }));
          setIssueForm(prev => ({ ...prev, warehouseId: firstWh }));
          setTransferForm(prev => ({ ...prev, sourceWarehouseId: firstWh }));
        }
      }
      if (modelRes.data?.data?.items) {
        setModels(modelRes.data.data.items);
        if (modelRes.data.data.items.length > 0) {
          const firstModel = modelRes.data.data.items[0].id;
          setReceiptForm(prev => ({ ...prev, modelId: firstModel }));
          setIssueForm(prev => ({ ...prev, modelId: firstModel }));
          setTransferForm(prev => ({ ...prev, modelId: firstModel }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch inventory data', error);
      setSnackbar({ open: true, message: 'Lỗi tải dữ liệu kho', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmReceipt = async () => {
    try {
      // 1. Create Receipt Draft
      const payload = {
        warehouseId: receiptForm.warehouseId,
        receiptType: 0, // Import
        notes: 'Nhập kho trực tiếp từ giao diện',
        items: [
          {
            modelId: receiptForm.modelId,
            quantity: receiptForm.quantity,
            unitPrice: receiptForm.unitPrice,
            serialNumbers: receiptForm.serialNumbers ? receiptForm.serialNumbers.split(',').map(s => s.trim()) : []
          }
        ]
      };
      const receiptRes = await axiosInstance.post('/inventory/receipt', payload);
      const receiptId = receiptRes.data.data.id;
      
      // 2. Confirm Receipt
      await axiosInstance.post(`/inventory/receipt/${receiptId}/confirm`);
      
      setSnackbar({ open: true, message: 'Nhập kho thành công', severity: 'success' });
      setReceiptOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi khi nhập kho', severity: 'error' });
    }
  };

  const handleConfirmIssue = async () => {
    try {
      const payload = {
        warehouseId: issueForm.warehouseId,
        issueType: 0, // Export
        notes: 'Xuất kho trực tiếp từ giao diện',
        items: [
          {
            modelId: issueForm.modelId,
            quantity: issueForm.quantity,
            unitPrice: issueForm.unitPrice,
            serialNumbers: issueForm.serialNumbers ? issueForm.serialNumbers.split(',').map(s => s.trim()) : []
          }
        ]
      };
      const issueRes = await axiosInstance.post('/inventory/issue', payload);
      const issueId = issueRes.data.data.id;
      
      await axiosInstance.post(`/inventory/issue/${issueId}/confirm`);
      
      setSnackbar({ open: true, message: 'Xuất kho thành công', severity: 'success' });
      setIssueOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi khi xuất kho (kiểm tra tồn kho hoặc serial)', severity: 'error' });
    }
  };

  const handleConfirmTransfer = async () => {
    try {
      const payload = {
        sourceWarehouseId: transferForm.sourceWarehouseId,
        destinationWarehouseId: transferForm.destinationWarehouseId,
        modelId: transferForm.modelId,
        quantity: transferForm.quantity,
        serialNumbers: transferForm.serialNumbers ? transferForm.serialNumbers.split(',').map(s => s.trim()) : [],
        notes: 'Điều chuyển kho từ giao diện'
      };
      await axiosInstance.post('/inventory/transfer', payload);
      
      setSnackbar({ open: true, message: 'Điều chuyển kho thành công', severity: 'success' });
      setTransferOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi khi điều chuyển', severity: 'error' });
    }
  };

  const handleOpenDirect = (stock?: any) => {
    if (stock) {
      setSelectedStockId(stock.id);
      setDirectForm({
        warehouseId: stock.warehouseId,
        modelId: stock.modelId,
        quantity: stock.quantity
      });
    } else {
      setSelectedStockId(null);
      setDirectForm({
        warehouseId: warehouses.length > 0 ? warehouses[0].id : '',
        modelId: models.length > 0 ? models[0].id : '',
        quantity: 0
      });
    }
    setDirectOpen(true);
  };

  const handleSaveDirect = async () => {
    try {
      if (selectedStockId) {
        await axiosInstance.put(`/inventory/stock/direct/${selectedStockId}`, directForm);
        setSnackbar({ open: true, message: 'Cập nhật tồn kho thành công', severity: 'success' });
      } else {
        await axiosInstance.post('/inventory/stock/direct', directForm);
        setSnackbar({ open: true, message: 'Thêm tồn kho thành công', severity: 'success' });
      }
      setDirectOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi khi lưu tồn kho', severity: 'error' });
    }
  };

  const handleDeleteDirect = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bản ghi tồn kho này không?')) return;
    try {
      await axiosInstance.delete(`/inventory/stock/direct/${id}`);
      setSnackbar({ open: true, message: 'Xóa tồn kho thành công', severity: 'success' });
      fetchData();
    } catch (error: any) {
      console.error(error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi khi xóa tồn kho', severity: 'error' });
    }
  };

  // Define a generic threshold for the UI warning since it might not be provided per stock
  const lowStockItems = stocks.filter(s => s.quantity <= 10); 

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warehouse /> Quản Lý Kho & Tồn Kho
        </Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" color="primary" startIcon={<Add />} onClick={() => handleOpenDirect()}>Thêm trực tiếp</Button>
          <Button variant="contained" color="success" startIcon={<ArrowUpward />} onClick={() => setReceiptOpen(true)}>Nhập kho</Button>
          <Button variant="contained" color="error" startIcon={<ArrowDownward />} onClick={() => setIssueOpen(true)}>Xuất kho</Button>
          <Button variant="contained" color="warning" startIcon={<CompareArrows />} onClick={() => setTransferOpen(true)}>Điều chuyển</Button>
        </Box>
      </Box>

      {lowStockItems.length > 0 && !loading && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
          Có <strong>{lowStockItems.length}</strong> thiết bị sắp hết hàng trong hệ thống! Hãy nhập thêm hàng.
        </Alert>
      )}

      <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} sx={{ mb: 3 }} indicatorColor="primary" textColor="primary">
        <Tab icon={<Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />} label="Bảng tồn kho" />
        <Tab icon={<History sx={{ mr: 1, verticalAlign: 'middle' }} />} label="Lịch sử giao dịch" />
      </Tabs>

      {tabIndex === 0 ? (
        <Card sx={{ background: '#1a202c', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
              <Table>
                <TableHead sx={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Kho hàng</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Mã Model</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Tên thiết bị</TableCell>
                    <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Tồn kho</TableCell>
                    <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Trạng thái</TableCell>
                    <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}><CircularProgress color="primary" /></TableCell>
                    </TableRow>
                  ) : stocks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>Kho trống</TableCell>
                    </TableRow>
                  ) : stocks.map((s) => (
                    <TableRow key={s.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.04)' } }}>
                      <TableCell sx={{ color: '#e0e0e0' }}>{s.warehouse?.name}</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{s.model?.modelCode}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{s.model?.name}</TableCell>
                      <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1em' }}>{s.quantity}</TableCell>
                      <TableCell align="right">
                        {s.quantity <= 10 ? (
                          <Chip label="Cảnh báo tồn thấp" color="warning" size="small" />
                        ) : (
                          <Chip label="An toàn" color="success" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleOpenDirect(s)} title="Sửa"><Edit /></IconButton>
                        <IconButton color="error" onClick={() => handleDeleteDirect(s.id)} title="Xóa"><Delete /></IconButton>
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
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
              <Table>
                <TableHead sx={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Thời gian</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Kho hàng</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Loại giao dịch</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Thiết bị</TableCell>
                    <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Số lượng đổi</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Mã tham chiếu</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Ghi chú</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress color="primary" /></TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>Chưa có giao dịch nào</TableCell>
                    </TableRow>
                  ) : transactions.map((t) => (
                    <TableRow key={t.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.04)' } }}>
                      <TableCell sx={{ color: '#e0e0e0' }}>{new Date(t.createdAtUtc).toLocaleString()}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{t.warehouse?.name}</TableCell>
                      <TableCell>
                        <Chip label={t.transactionType === 0 ? 'Import' : t.transactionType === 1 ? 'Export' : 'Transfer'} color={t.transactionType === 0 ? 'success' : t.transactionType === 1 ? 'error' : 'warning'} size="small" />
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>{t.model?.name}</TableCell>
                      <TableCell align="right">
                        <strong style={{ color: t.quantity > 0 ? '#4caf50' : '#f44336' }}>
                          {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                        </strong>
                      </TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{t.referenceNumber}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{t.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Import Modal */}
      <Dialog open={receiptOpen} onClose={() => setReceiptOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'success.main' }}>Nhập kho thiết bị</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Kho nhập" value={receiptForm.warehouseId} onChange={(e) => setReceiptForm({ ...receiptForm, warehouseId: e.target.value })}>
                {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField select fullWidth label="Mẫu thiết bị" value={receiptForm.modelId} onChange={(e) => setReceiptForm({ ...receiptForm, modelId: e.target.value })}>
                {models.map(m => <MenuItem key={m.id} value={m.id}>{m.modelCode} - {m.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField type="number" fullWidth label="Số lượng nhập" value={receiptForm.quantity} onChange={(e) => setReceiptForm({ ...receiptForm, quantity: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={6}>
              <TextField type="number" fullWidth label="Đơn giá nhập" value={receiptForm.unitPrice} onChange={(e) => setReceiptForm({ ...receiptForm, unitPrice: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Mã Serial thiết bị (cách nhau bằng dấu phẩy)" value={receiptForm.serialNumbers} onChange={(e) => setReceiptForm({ ...receiptForm, serialNumbers: e.target.value })} placeholder="SN001, SN002, SN003..." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReceiptOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="success" onClick={handleConfirmReceipt}>Xác nhận Nhập</Button>
        </DialogActions>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={issueOpen} onClose={() => setIssueOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Xuất kho thiết bị</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Kho xuất" value={issueForm.warehouseId} onChange={(e) => setIssueForm({ ...issueForm, warehouseId: e.target.value })}>
                {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField select fullWidth label="Mẫu thiết bị" value={issueForm.modelId} onChange={(e) => setIssueForm({ ...issueForm, modelId: e.target.value })}>
                {models.map(m => <MenuItem key={m.id} value={m.id}>{m.modelCode} - {m.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField type="number" fullWidth label="Số lượng xuất" value={issueForm.quantity} onChange={(e) => setIssueForm({ ...issueForm, quantity: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={6}>
              <TextField type="number" fullWidth label="Đơn giá bán" value={issueForm.unitPrice} onChange={(e) => setIssueForm({ ...issueForm, unitPrice: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Chọn Serial xuất (cách nhau bằng dấu phẩy)" value={issueForm.serialNumbers} onChange={(e) => setIssueForm({ ...issueForm, serialNumbers: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIssueOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="error" onClick={handleConfirmIssue}>Xác nhận Xuất</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'warning.main' }}>Điều chuyển thiết bị giữa các kho</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={6}>
              <TextField select fullWidth label="Kho nguồn" value={transferForm.sourceWarehouseId} onChange={(e) => setTransferForm({ ...transferForm, sourceWarehouseId: e.target.value })}>
                {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="Kho đích" value={transferForm.destinationWarehouseId} onChange={(e) => setTransferForm({ ...transferForm, destinationWarehouseId: e.target.value })}>
                {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField select fullWidth label="Mẫu thiết bị" value={transferForm.modelId} onChange={(e) => setTransferForm({ ...transferForm, modelId: e.target.value })}>
                {models.map(m => <MenuItem key={m.id} value={m.id}>{m.modelCode} - {m.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField type="number" fullWidth label="Số lượng điều chuyển" value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Serials điều chuyển (cách nhau bằng dấu phẩy)" value={transferForm.serialNumbers} onChange={(e) => setTransferForm({ ...transferForm, serialNumbers: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTransferOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="warning" onClick={handleConfirmTransfer}>Xác nhận điều chuyển</Button>
        </DialogActions>
      </Dialog>

      {/* Direct Stock Modal */}
      <Dialog open={directOpen} onClose={() => setDirectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {selectedStockId ? 'Sửa thông tin tồn kho' : 'Thêm sản phẩm tồn kho trực tiếp'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Kho hàng" value={directForm.warehouseId} onChange={(e) => setDirectForm({ ...directForm, warehouseId: e.target.value })}>
                {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField select fullWidth label="Mẫu thiết bị (Model)" value={directForm.modelId} onChange={(e) => setDirectForm({ ...directForm, modelId: e.target.value })}>
                {models.map(m => <MenuItem key={m.id} value={m.id}>{m.modelCode} - {m.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField type="number" fullWidth label="Số lượng tồn kho" value={directForm.quantity} onChange={(e) => setDirectForm({ ...directForm, quantity: Number(e.target.value) })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDirectOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="primary" onClick={handleSaveDirect}>Lưu Thay Đổi</Button>
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
