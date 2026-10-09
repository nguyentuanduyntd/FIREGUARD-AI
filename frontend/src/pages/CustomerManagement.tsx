import { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Tabs, Tab, List, ListItem, ListItemText, Chip, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { Add, Edit, Visibility, Business, Person, Phone, Email, LocationOn } from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

interface Customer {
  id: string;
  name: string;
  taxCode?: string;
  email: string;
  phone: string;
  customerType: number | string; // 0 = Individual, 1 = Company (depending on enum serialization)
  representativeName?: string;
  addresses?: any[];
  contacts?: any[];
  notes?: any[];
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [formData, setFormData] = useState({
    name: '',
    taxCode: '',
    email: '',
    phone: '',
    customerType: 1, // 1 for Company, 0 for Individual
    representativeName: ''
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/customer?PageSize=100');
      // The API returns ApiResponse<PaginatedList<Customer>>
      // PaginatedList has an 'items' property
      if (res.data && res.data.data && res.data.data.items) {
        setCustomers(res.data.data.items);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Failed to fetch customers', error);
      setSnackbar({ open: true, message: 'Lỗi khi tải danh sách khách hàng', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpen = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name || '',
        taxCode: customer.taxCode || '',
        email: customer.email || '',
        phone: customer.phone || '',
        customerType: customer.customerType === 'Individual' || customer.customerType === 0 ? 0 : 1,
        representativeName: customer.representativeName || ''
      });
    } else {
      setSelectedCustomer(null);
      setFormData({ name: '', taxCode: '', email: '', phone: '', customerType: 1, representativeName: '' });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        customerType: formData.customerType,
        taxCode: formData.taxCode,
        representativeName: formData.representativeName,
        email: formData.email,
        phone: formData.phone,
        addresses: [],
        contacts: []
      };

      if (selectedCustomer) {
        await axiosInstance.put(`/customer/${selectedCustomer.id}`, payload);
        setSnackbar({ open: true, message: 'Cập nhật khách hàng thành công', severity: 'success' });
      } else {
        await axiosInstance.post('/customer', payload);
        setSnackbar({ open: true, message: 'Thêm khách hàng thành công', severity: 'success' });
      }
      setOpen(false);
      fetchCustomers();
    } catch (error: any) {
      console.error('Save failed', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi khi lưu khách hàng', severity: 'error' });
    }
  };

  const handleView = async (customer: Customer) => {
    try {
      // Fetch details including relations
      const res = await axiosInstance.get(`/customer/${customer.id}`);
      if (res.data && res.data.data) {
        setSelectedCustomer(res.data.data);
      } else {
        setSelectedCustomer(customer);
      }
    } catch (error) {
      console.error('View detail failed', error);
      setSelectedCustomer(customer);
    }
    setViewOpen(true);
    setTabIndex(0);
  };

  const isCompany = (type: any) => type === 1 || type === 'Company';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business /> Quản Lý Khách Hàng
        </Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => handleOpen()}>
          Thêm Khách Hàng
        </Button>
      </Box>

      <Card sx={{ background: '#1a202c', backdropFilter: 'blur(10px)', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Họ và tên / Tên công ty</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Loại khách</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Số điện thoại</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Mã số thuế</TableCell>
                  <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <CircularProgress color="primary" />
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((c) => (
                    <TableRow key={c.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.04)' } }}>
                      <TableCell sx={{ color: '#ffffff', fontWeight: 500 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {isCompany(c.customerType) ? <Business color="primary" /> : <Person sx={{ color: '#9e9e9e' }} />}
                          {c.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={isCompany(c.customerType) ? 'Doanh nghiệp' : 'Cá nhân'} color={isCompany(c.customerType) ? 'primary' : 'secondary'} size="small" />
                      </TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{c.phone}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{c.email}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{c.taxCode || 'N/A'}</TableCell>
                      <TableCell align="right">
                        <IconButton color="info" title="Xem chi tiết" onClick={() => handleView(c)}><Visibility /></IconButton>
                        <IconButton color="primary" title="Chỉnh sửa" onClick={() => handleOpen(c)}><Edit /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {selectedCustomer ? 'Cập nhật thông tin khách hàng' : 'Thêm khách hàng mới'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Loại khách hàng"
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: Number(e.target.value) })}
              >
                <MenuItem value={1}>Doanh nghiệp</MenuItem>
                <MenuItem value={0}>Cá nhân</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Tên khách hàng" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Grid>
            {formData.customerType === 1 && (
              <>
                <Grid item xs={6}>
                  <TextField fullWidth label="Mã số thuế" value={formData.taxCode} onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Người đại diện" value={formData.representativeName} onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })} />
                </Grid>
              </>
            )}
            <Grid item xs={6}>
              <TextField fullWidth label="Số điện thoại" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="primary" onClick={handleSave}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Detail view with Tabs & Notes */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business color="primary" /> {selectedCustomer?.name}
        </DialogTitle>
        <DialogContent dividers>
          <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} indicatorColor="primary" textColor="primary" variant="fullWidth">
            <Tab label="Thông tin chung" />
            <Tab label="Địa chỉ thi công" />
            <Tab label="Lịch sử chăm sóc" />
          </Tabs>

          <Box sx={{ mt: 3 }}>
            {tabIndex === 0 && selectedCustomer && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">Email liên hệ</Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                    <Email sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                    {selectedCustomer.email}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary" variant="body2">Số điện thoại</Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                    <Phone sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                    {selectedCustomer.phone}
                  </Typography>
                </Grid>
                {isCompany(selectedCustomer.customerType) && (
                  <>
                    <Grid item xs={6}>
                      <Typography color="textSecondary" variant="body2">Mã số thuế</Typography>
                      <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                        {selectedCustomer.taxCode || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography color="textSecondary" variant="body2">Người đại diện pháp luật</Typography>
                      <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                        {selectedCustomer.representativeName || 'Chưa cập nhật'}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            )}

            {tabIndex === 1 && (
              <List>
                {selectedCustomer?.addresses && selectedCustomer.addresses.length > 0 ? (
                  selectedCustomer.addresses.map((addr: any, idx: number) => (
                    <ListItem key={idx} sx={{ background: 'rgba(255,255,255,0.03)', borderRadius: 2, mb: 1 }}>
                      <LocationOn color="primary" sx={{ mr: 2 }} />
                      <ListItemText primary={<strong>{addr.addressLine}</strong>} secondary={`${addr.ward || ''} ${addr.district || ''} ${addr.city || ''}`} />
                    </ListItem>
                  ))
                ) : (
                  <Typography color="textSecondary" variant="body2" sx={{ p: 2 }}>Chưa có địa chỉ nào được ghi nhận.</Typography>
                )}
              </List>
            )}

            {tabIndex === 2 && (
              <List>
                {selectedCustomer?.notes && selectedCustomer.notes.length > 0 ? (
                  selectedCustomer.notes.map((note: any, idx: number) => (
                    <ListItem key={idx} sx={{ background: 'rgba(255,255,255,0.03)', borderRadius: 2, mb: 1 }}>
                      <ListItemText primary={<strong>{note.noteType}</strong>} secondary={`${new Date(note.createdAtUtc).toLocaleDateString()} - ${note.content}`} />
                    </ListItem>
                  ))
                ) : (
                  <Typography color="textSecondary" variant="body2" sx={{ p: 2 }}>Chưa có lịch sử chăm sóc.</Typography>
                )}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" color="primary" onClick={() => setViewOpen(false)}>Đóng</Button>
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
