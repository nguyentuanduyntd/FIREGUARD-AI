import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Chip, Snackbar, Alert, CircularProgress
} from '@mui/material';
import { Add, AssignmentInd, MyLocation, FactCheck, Transform } from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

export default function SurveyManagement() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [equipmentModels, setEquipmentModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [createForm, setCreateForm] = useState({
    customerId: '',
    addressId: '',
    scheduledDate: new Date().toISOString().slice(0, 16)
  });

  const [assignForm, setAssignForm] = useState({
    assignedUserId: 'f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5' // Mock ID for demonstration
  });

  const [completeForm, setCompleteForm] = useState({
    area: 500,
    floorCount: 3,
    buildingType: 'Nhà xưởng Cơ khí',
    roomCount: 10,
    buildingMaterial: 'Bê tông cốt thép',
    riskLevel: 'Cao',
    existingPcccSystem: 'Chưa có hệ thống tự động, chỉ có bình chữa cháy xách tay cũ.',
    customerRequirements: 'Lắp đặt hệ thống báo cháy tự động',
    resultNotes: 'Cần triển khai sớm.',
    images: [] as string[],
    proposedItems: [{ modelId: '', quantity: 10, notes: 'Lắp đặt tại hành lang' }]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [surveysRes, customersRes, modelsRes] = await Promise.all([
        axiosInstance.get('/survey'),
        axiosInstance.get('/customer?PageSize=100'),
        axiosInstance.get('/equipmentmodel?PageSize=100')
      ]);
      
      if (surveysRes.data?.data) setSurveys(surveysRes.data.data);
      if (customersRes.data?.data?.items) {
        setCustomers(customersRes.data.data.items);
        if (customersRes.data.data.items.length > 0) {
          const firstCust = customersRes.data.data.items[0];
          setCreateForm(prev => ({
            ...prev,
            customerId: firstCust.id,
            addressId: firstCust.addresses && firstCust.addresses.length > 0 ? firstCust.addresses[0].id : ''
          }));
        }
      }
      if (modelsRes.data?.data?.items) {
        setEquipmentModels(modelsRes.data.data.items);
        if (modelsRes.data.data.items.length > 0) {
          setCompleteForm(prev => ({
            ...prev,
            proposedItems: [{ ...prev.proposedItems[0], modelId: modelsRes.data.data.items[0].id }]
          }));
        }
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu', error);
      setSnackbar({ open: true, message: 'Lỗi tải dữ liệu khảo sát', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    try {
      await axiosInstance.post('/survey', createForm);
      setSnackbar({ open: true, message: 'Tạo phiếu khảo sát thành công', severity: 'success' });
      setOpen(false);
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi tạo phiếu khảo sát', severity: 'error' });
    }
  };

  const handleAssign = async () => {
    if (!selectedSurvey) return;
    try {
      await axiosInstance.post(`/survey/${selectedSurvey.id}/assign`, assignForm);
      setSnackbar({ open: true, message: 'Phân công thành công', severity: 'success' });
      setAssignOpen(false);
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi phân công', severity: 'error' });
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      // Mock GPS coordinates for HN
      const payload = { latitude: 21.027764, longitude: 105.834160 };
      await axiosInstance.post(`/survey/${id}/checkin`, payload);
      setSnackbar({ open: true, message: 'Đã check-in GPS thành công', severity: 'success' });
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi check-in', severity: 'error' });
    }
  };

  const handleComplete = async () => {
    if (!selectedSurvey) return;
    try {
      await axiosInstance.post(`/survey/${selectedSurvey.id}/complete`, completeForm);
      setSnackbar({ open: true, message: 'Đã lưu kết quả khảo sát', severity: 'success' });
      setCompleteOpen(false);
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi lưu kết quả', severity: 'error' });
    }
  };

  const handleConvertToQuotation = async (id: string) => {
    try {
      await axiosInstance.post(`/survey/${id}/convert`);
      setSnackbar({ open: true, message: 'Đã chuyển đổi thành Báo Giá thành công!', severity: 'success' });
      fetchData();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi chuyển báo giá', severity: 'error' });
    }
  };

  const getStatusLabel = (status: number) => {
    const labels = ['Pending', 'Assigned', 'CheckedIn', 'Completed', 'Converted', 'Cancelled'];
    return labels[status] || 'N/A';
  };

  const getStatusColor = (status: number) => {
    switch(status) {
      case 0: return 'default';
      case 1: return 'warning';
      case 2: return 'info';
      case 3: return 'success';
      case 4: return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentInd /> Khảo Sát & Tư Vấn Thiết Kế
        </Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setOpen(true)}>
          Tạo Yêu Cầu Khảo Sát
        </Button>
      </Box>

      <Card sx={{ background: '#1a202c', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
            <Table>
              <TableHead sx={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                <TableRow>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Mã khảo sát</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Khách hàng</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Địa chỉ</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Ngày dự kiến</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Trạng thái</TableCell>
                  <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><CircularProgress color="primary" /></TableCell></TableRow>
                ) : surveys.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>Chưa có yêu cầu khảo sát</TableCell></TableRow>
                ) : surveys.map((s) => (
                  <TableRow key={s.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.04)' } }}>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{s.requestNumber}</TableCell>
                    <TableCell sx={{ color: '#e0e0e0' }}>{s.customer?.name}</TableCell>
                    <TableCell sx={{ color: '#e0e0e0' }}>{s.address?.addressLine || 'N/A'}</TableCell>
                    <TableCell sx={{ color: '#e0e0e0' }}>{new Date(s.scheduledDate).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={getStatusLabel(s.status)} color={getStatusColor(s.status) as any} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      {s.status === 0 /* Pending */ && (
                        <Button size="small" variant="outlined" color="primary" startIcon={<AssignmentInd />} onClick={() => { setSelectedSurvey(s); setAssignOpen(true); }}>Phân công</Button>
                      )}
                      {s.status === 1 /* Assigned */ && (
                        <Button size="small" variant="contained" color="info" startIcon={<MyLocation />} onClick={() => handleCheckIn(s.id)}>Check-in GPS</Button>
                      )}
                      {s.status === 2 /* CheckedIn */ && (
                        <Button size="small" variant="contained" color="success" startIcon={<FactCheck />} onClick={() => { setSelectedSurvey(s); setCompleteOpen(true); }}>Nhập kết quả</Button>
                      )}
                      {s.status === 3 /* Completed */ && (
                        <Button size="small" variant="contained" color="secondary" startIcon={<Transform />} onClick={() => handleConvertToQuotation(s.id)}>Tạo báo giá</Button>
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
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>Tạo yêu cầu khảo sát</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Khách hàng" value={createForm.customerId} onChange={(e) => {
                const cust = customers.find(c => c.id === e.target.value);
                setCreateForm({
                  ...createForm,
                  customerId: e.target.value,
                  addressId: cust?.addresses?.length > 0 ? cust.addresses[0].id : ''
                });
              }}>
                {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            {customers.find(c => c.id === createForm.customerId)?.addresses?.length > 0 && (
              <Grid item xs={12}>
                <TextField select fullWidth label="Địa chỉ" value={createForm.addressId} onChange={(e) => setCreateForm({ ...createForm, addressId: e.target.value })}>
                  {customers.find(c => c.id === createForm.customerId)?.addresses?.map((a: any) => (
                    <MenuItem key={a.id} value={a.id}>{a.addressLine}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                type="datetime-local"
                fullWidth
                label="Ngày dự kiến khảo sát"
                InputLabelProps={{ shrink: true }}
                value={createForm.scheduledDate}
                onChange={(e) => setCreateForm({ ...createForm, scheduledDate: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="primary" onClick={handleCreate}>Tạo phiếu</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>Phân công khảo sát</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="ID Nhân viên / Kỹ sư phụ trách" value={assignForm.assignedUserId} onChange={(e) => setAssignForm({ ...assignForm, assignedUserId: e.target.value })} placeholder="Nhập User ID" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAssignOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="primary" onClick={handleAssign}>Xác nhận</Button>
        </DialogActions>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={completeOpen} onClose={() => setCompleteOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'success.main' }}>Nhập kết quả khảo sát thực tế</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={4}>
              <TextField type="number" fullWidth label="Diện tích (m2)" value={completeForm.area} onChange={(e) => setCompleteForm({ ...completeForm, area: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={4}>
              <TextField type="number" fullWidth label="Số tầng" value={completeForm.floorCount} onChange={(e) => setCompleteForm({ ...completeForm, floorCount: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={4}>
              <TextField type="number" fullWidth label="Số phòng" value={completeForm.roomCount} onChange={(e) => setCompleteForm({ ...completeForm, roomCount: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Loại công trình" value={completeForm.buildingType} onChange={(e) => setCompleteForm({ ...completeForm, buildingType: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Vật liệu xây dựng chính" value={completeForm.buildingMaterial} onChange={(e) => setCompleteForm({ ...completeForm, buildingMaterial: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="Mức độ rủi ro cháy nổ" value={completeForm.riskLevel} onChange={(e) => setCompleteForm({ ...completeForm, riskLevel: e.target.value })}>
                <MenuItem value="Thấp">Thấp</MenuItem>
                <MenuItem value="Trung bình">Trung bình</MenuItem>
                <MenuItem value="Cao">Cao</MenuItem>
                <MenuItem value="Rất cao">Rất cao</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Hệ thống PCCC hiện tại" value={completeForm.existingPcccSystem} onChange={(e) => setCompleteForm({ ...completeForm, existingPcccSystem: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Yêu cầu từ khách hàng" value={completeForm.customerRequirements} onChange={(e) => setCompleteForm({ ...completeForm, customerRequirements: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1, color: '#ff7043' }}>Đề xuất thiết bị</Typography>
              <Box display="flex" gap={2}>
                <TextField select sx={{ flex: 2 }} label="Mẫu thiết bị đề xuất" value={completeForm.proposedItems[0].modelId} onChange={(e) => {
                  const newItems = [...completeForm.proposedItems];
                  newItems[0].modelId = e.target.value;
                  setCompleteForm({ ...completeForm, proposedItems: newItems });
                }}>
                  {equipmentModels.map(m => <MenuItem key={m.id} value={m.id}>{m.modelCode} - {m.name}</MenuItem>)}
                </TextField>
                <TextField type="number" sx={{ flex: 1 }} label="Số lượng" value={completeForm.proposedItems[0].quantity} onChange={(e) => {
                  const newItems = [...completeForm.proposedItems];
                  newItems[0].quantity = Number(e.target.value);
                  setCompleteForm({ ...completeForm, proposedItems: newItems });
                }} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Ghi chú thêm" value={completeForm.resultNotes} onChange={(e) => setCompleteForm({ ...completeForm, resultNotes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCompleteOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="success" onClick={handleComplete}>Hoàn thành khảo sát</Button>
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
