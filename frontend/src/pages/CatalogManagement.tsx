import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, CardMedia, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { Add, Edit, Delete, Category, ShoppingCart, UploadFile, PhotoLibrary } from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

interface EquipmentModel {
  id: string;
  modelCode: string;
  name: string;
  categoryId: string;
  brandId: string;
  unitId: string;
  supplierId?: string;
  category?: { name: string };
  brand?: { name: string };
  unit?: { name: string };
  supplier?: { name: string };
  purchasePrice: number;
  sellingPrice: number;
  warrantyMonths: number;
  maintenanceIntervalMonths: number;
  imageUrl?: string;
  isActive: boolean;
}

export default function CatalogManagement() {
  const [models, setModels] = useState<EquipmentModel[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<EquipmentModel | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Quick Order State
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);
  const [quickOrderModel, setQuickOrderModel] = useState<EquipmentModel | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [quickOrderData, setQuickOrderData] = useState({
    customerName: '',
    phone: '',
    address: '',
    quantity: 1,
    isLargeProject: false
  });

  const [formData, setFormData] = useState({
    modelCode: '',
    name: '',
    categoryId: '',
    brandId: '',
    unitId: '',
    supplierId: '',
    purchasePrice: 0,
    sellingPrice: 0,
    warrantyMonths: 12,
    maintenanceIntervalMonths: 6,
    imageUrl: '',
    isActive: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modelsRes, catRes, brandRes, unitRes, suppRes] = await Promise.all([
        axiosInstance.get('/equipmentmodel?PageSize=100'),
        axiosInstance.get('/catalog/categories'),
        axiosInstance.get('/catalog/brands'),
        axiosInstance.get('/catalog/units'),
        axiosInstance.get('/catalog/suppliers')
      ]);
      
      if (modelsRes.data?.data?.items) {
        setModels(modelsRes.data.data.items);
      }
      if (catRes.data?.data) setCategories(catRes.data.data);
      if (brandRes.data?.data) setBrands(brandRes.data.data);
      if (unitRes.data?.data) setUnits(unitRes.data.data);
      if (suppRes.data?.data) setSuppliers(suppRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setSnackbar({ open: true, message: 'Lỗi khi tải dữ liệu danh mục', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpen = (model?: EquipmentModel) => {
    if (model) {
      setSelectedModel(model);
      setFormData({
        modelCode: model.modelCode,
        name: model.name,
        categoryId: model.categoryId,
        brandId: model.brandId,
        unitId: model.unitId,
        supplierId: model.supplierId || '',
        purchasePrice: model.purchasePrice,
        sellingPrice: model.sellingPrice,
        warrantyMonths: model.warrantyMonths,
        maintenanceIntervalMonths: model.maintenanceIntervalMonths || 6,
        imageUrl: model.imageUrl || '',
        isActive: model.isActive
      });
    } else {
      setSelectedModel(null);
      setFormData({
        modelCode: '',
        name: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        brandId: brands.length > 0 ? brands[0].id : '',
        unitId: units.length > 0 ? units[0].id : '',
        supplierId: suppliers.length > 0 ? suppliers[0].id : '',
        purchasePrice: 0,
        sellingPrice: 0,
        warrantyMonths: 12,
        maintenanceIntervalMonths: 6,
        imageUrl: '',
        isActive: true
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      if (!payload.supplierId) delete (payload as any).supplierId;

      if (selectedModel) {
        await axiosInstance.put(`/equipmentmodel/${selectedModel.id}`, payload);
        setSnackbar({ open: true, message: 'Cập nhật thiết bị thành công', severity: 'success' });
      } else {
        await axiosInstance.post('/equipmentmodel', payload);
        setSnackbar({ open: true, message: 'Thêm thiết bị mới thành công', severity: 'success' });
      }
      setOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Save failed', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi khi lưu thiết bị', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa thiết bị này không?')) return;
    try {
      await axiosInstance.delete(`/equipmentmodel/${id}`);
      setSnackbar({ open: true, message: 'Xóa thiết bị thành công', severity: 'success' });
      fetchData();
    } catch (error: any) {
      console.error('Delete failed', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi khi xóa thiết bị. Thiết bị có thể đang được sử dụng.', severity: 'error' });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      setUploadingImage(true);
      const res = await axiosInstance.post('/equipmentmodel/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.data) {
        setFormData({ ...formData, imageUrl: res.data.data });
        setSnackbar({ open: true, message: 'Tải ảnh lên thành công!', severity: 'success' });
      }
    } catch (error: any) {
      console.error('Image upload failed', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi khi tải ảnh lên.', severity: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenGallery = async () => {
    try {
      setLoadingGallery(true);
      setGalleryOpen(true);
      const res = await axiosInstance.get('/equipmentmodel/images');
      if (res.data?.data) {
        setGalleryImages(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load gallery images', error);
      setSnackbar({ open: true, message: 'Lỗi khi tải thư viện ảnh', severity: 'error' });
    } finally {
      setLoadingGallery(false);
    }
  };
  
  const handleSelectGalleryImage = (url: string) => {
    setFormData({ ...formData, imageUrl: url });
    setGalleryOpen(false);
    setSnackbar({ open: true, message: 'Đã chọn ảnh từ thư viện', severity: 'success' });
  };

  const handleOpenQuickOrder = (model: EquipmentModel) => {
    setQuickOrderModel(model);
    setQuickOrderData({
      customerName: '',
      phone: '',
      address: '',
      quantity: 1,
      isLargeProject: false
    });
    setQuickOrderOpen(true);
  };

  const handleQuickOrderSubmit = async () => {
    if (!quickOrderModel) return;
    try {
      setSubmittingOrder(true);
      const payload = {
        customerName: quickOrderData.customerName,
        phone: quickOrderData.phone,
        address: quickOrderData.address,
        productId: quickOrderModel.id,
        quantity: quickOrderData.quantity,
        isLargeProject: quickOrderData.isLargeProject
      };
      await axiosInstance.post('/sales/quick-order', payload);
      setSnackbar({ open: true, message: 'Tạo đơn hàng thành công!', severity: 'success' });
      setQuickOrderOpen(false);
    } catch (error: any) {
      console.error('Quick order failed', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi khi tạo đơn hàng.', severity: 'error' });
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Category /> Danh Mục Thiết Bị PCCC
        </Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => handleOpen()}>
          Thêm Thiết Bị
        </Button>
      </Box>

      <Card sx={{ background: '#1a202c', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
            <Table>
              <TableHead sx={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                <TableRow>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Hình ảnh</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Mã Model</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Tên thiết bị</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Phân loại</TableCell>
                  <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Thương hiệu</TableCell>
                  <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Giá mua (VND)</TableCell>
                  <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Giá bán (VND)</TableCell>
                  <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Bảo hành</TableCell>
                  <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      <CircularProgress color="primary" />
                    </TableCell>
                  </TableRow>
                ) : models.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Không có thiết bị nào
                    </TableCell>
                  </TableRow>
                ) : (
                  models.map((m) => (
                    <TableRow key={m.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.04)' } }}>
                      <TableCell>
                        {m.imageUrl ? (
                          <CardMedia
                            component="img"
                            image={m.imageUrl}
                            alt={m.name}
                            sx={{ width: 50, height: 50, borderRadius: 1 }}
                          />
                        ) : (
                          <Box sx={{ width: 50, height: 50, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Category sx={{ color: 'rgba(255,255,255,0.3)' }} />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{m.modelCode}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{m.name}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{m.category?.name}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0' }}>{m.brand?.name}</TableCell>
                      <TableCell align="right" sx={{ color: '#fff' }}>{m.purchasePrice.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ color: '#fff' }}>{m.sellingPrice.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ color: '#e0e0e0' }}>{m.warrantyMonths}T</TableCell>
                      <TableCell align="right">
                        <IconButton color="secondary" onClick={() => handleOpenQuickOrder(m)} title="Tạo Đơn & Điều Phối"><ShoppingCart /></IconButton>
                        <IconButton color="primary" onClick={() => handleOpen(m)} title="Sửa"><Edit /></IconButton>
                        <IconButton color="error" onClick={() => handleDelete(m.id)} title="Xóa"><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Model Dialog Form */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {selectedModel ? 'Cập nhật thông tin thiết bị' : 'Thêm thiết bị mới'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="Mã Model" value={formData.modelCode} onChange={(e) => setFormData({ ...formData, modelCode: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Tên thiết bị" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="Phân loại (Category)" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="Thương hiệu (Brand)" value={formData.brandId} onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}>
                {brands.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="Đơn vị tính (Unit)" value={formData.unitId} onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}>
                {units.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="Nhà cung cấp (Supplier)" value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}>
                <MenuItem value="">-- Không có --</MenuItem>
                {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField type="number" fullWidth label="Giá mua (VND)" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={6}>
              <TextField type="number" fullWidth label="Giá bán (VND)" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={6}>
              <TextField type="number" fullWidth label="Bảo hành (tháng)" value={formData.warrantyMonths} onChange={(e) => setFormData({ ...formData, warrantyMonths: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={6}>
              <TextField type="number" fullWidth label="Chu kỳ bảo trì (tháng)" value={formData.maintenanceIntervalMonths} onChange={(e) => setFormData({ ...formData, maintenanceIntervalMonths: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={2} alignItems="center">
                <TextField fullWidth label="URL Hình ảnh" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={uploadingImage ? <CircularProgress size={20} /> : <UploadFile />}
                  disabled={uploadingImage}
                  sx={{ minWidth: 150, height: 56 }}
                >
                  Tải Ảnh Lên
                  <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<PhotoLibrary />}
                  onClick={handleOpenGallery}
                  sx={{ minWidth: 160, height: 56 }}
                >
                  Thư Viện Ảnh
                </Button>
              </Box>
              {formData.imageUrl && (
                <Box mt={2} sx={{ width: '100%', height: 200, bgcolor: '#f5f5f5', borderRadius: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                  <img src={formData.imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="primary" onClick={handleSave}>Lưu</Button>
        </DialogActions>
      </Dialog>
      
      {/* Quick Order Dialog */}
      <Dialog open={quickOrderOpen} onClose={() => setQuickOrderOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCart /> Tạo Đơn & Điều Phối Nhanh
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Sản phẩm: <strong>{quickOrderModel?.name}</strong> - Giá: {quickOrderModel?.sellingPrice.toLocaleString()} VND
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField 
                fullWidth required label="Tên khách hàng" 
                value={quickOrderData.customerName} 
                onChange={e => setQuickOrderData({...quickOrderData, customerName: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth required label="Số điện thoại" 
                value={quickOrderData.phone} 
                onChange={e => setQuickOrderData({...quickOrderData, phone: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth type="number" required label="Số lượng" 
                value={quickOrderData.quantity} 
                onChange={e => setQuickOrderData({...quickOrderData, quantity: Number(e.target.value)})} 
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth required label="Địa chỉ lắp đặt / Giao hàng" 
                value={quickOrderData.address} 
                onChange={e => setQuickOrderData({...quickOrderData, address: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                select fullWidth required label="Phân loại dự án" 
                value={quickOrderData.isLargeProject ? "true" : "false"} 
                onChange={e => setQuickOrderData({...quickOrderData, isLargeProject: e.target.value === "true"})}
              >
                <MenuItem value="false">Đơn nhỏ (Gọi Kỹ Thuật Viên)</MenuItem>
                <MenuItem value="true">Dự án lớn (Giao Đội Lắp Đặt)</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setQuickOrderOpen(false)} color="inherit" disabled={submittingOrder}>Hủy</Button>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleQuickOrderSubmit}
            disabled={submittingOrder || !quickOrderData.customerName || !quickOrderData.phone || !quickOrderData.address}
          >
            {submittingOrder ? <CircularProgress size={24} /> : 'Xác nhận Tạo Đơn'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Gallery Dialog */}
      <Dialog open={galleryOpen} onClose={() => setGalleryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhotoLibrary /> Thư Viện Ảnh Đã Tải Lên
        </DialogTitle>
        <DialogContent dividers>
          {loadingGallery ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : galleryImages.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" py={4}>Thư viện ảnh trống.</Typography>
          ) : (
            <Grid container spacing={2}>
              {galleryImages.map((url, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 150, 
                      bgcolor: '#f5f5f5', 
                      borderRadius: 2, 
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: formData.imageUrl === url ? '3px solid #1976d2' : '1px solid #ddd',
                      '&:hover': { opacity: 0.8 }
                    }}
                    onClick={() => handleSelectGalleryImage(url)}
                  >
                    <img src={url} alt={`Gallery ${index}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setGalleryOpen(false)} color="inherit">Đóng</Button>
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
