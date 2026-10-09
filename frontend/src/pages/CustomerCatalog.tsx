import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button,
  CircularProgress, Snackbar, Alert, Chip, Fab, Badge, IconButton, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import { ShoppingCart as ShoppingCartIcon, Delete as DeleteIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import axiosInstance from '../api/axiosInstance';

export default function CustomerCatalog() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cart and Order Dialog State
  const [cart, setCart] = useState<{product: any, quantity: number}[]>([]);
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    address: '',
    phone: '',
    notes: '',
    desiredTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/equipmentmodel?PageSize=100');
      if (res.data?.data?.items) {
        setProducts(res.data.data.items);
      } else if (res.data?.data) {
        setProducts(res.data.data);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: any) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    setSuccessMsg(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  const updateCartItemQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeCartItem = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const handleCloseCartDialog = () => {
    setCartDialogOpen(false);
  };

  const handleOrderSubmit = async () => {
    if (cart.length === 0) return;
    try {
      setSubmitting(true);
      setErrorMsg('');
      
      // Fetch customer list to find our CRM customer ID
      const custRes = await axiosInstance.get('/customer?PageSize=100');
      const myCustomer = custRes.data?.data?.items?.find((c: any) => c.email === user?.email);
      const customerId = myCustomer?.id || user?.id; // fallback
      const addressId = myCustomer?.addresses?.[0]?.id || '';

      let fullDescription = `Khách hàng đặt mua và yêu cầu lắp đặt các thiết bị sau:\n`;
      let totalAmount = 0;
      cart.forEach((item, index) => {
         fullDescription += `${index + 1}. ${item.product.name} (Mã: ${item.product.modelCode}) - Số lượng: ${item.quantity}\n`;
         totalAmount += item.product.sellingPrice * item.quantity;
      });

      if (orderForm.phone) fullDescription += `\nSĐT Liên Hệ: ${orderForm.phone}`;
      if (orderForm.notes) fullDescription += `\nGhi chú: ${orderForm.notes}`;
      fullDescription += `\nTổng tiền dự kiến (vật tư): ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}`;

      const payload = {
        customerId: customerId,
        addressId: addressId,
        newAddressLine: orderForm.address || (!addressId ? 'Địa chỉ nhận hàng (Mặc định)' : ''),
        description: fullDescription,
        urgency: 1, // Medium
        requestType: 3, // Installation
        desiredTime: new Date(orderForm.desiredTime).toISOString()
      };

      await axiosInstance.post('/service', payload);
      setSuccessMsg(`Đã gửi yêu cầu đặt hàng thành công! Đội thi công sẽ liên hệ sớm nhất.`);
      setCartDialogOpen(false);
      setCart([]);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Sản Phẩm & Lắp Đặt
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Khám phá các thiết bị PCCC chất lượng cao và yêu cầu lắp đặt tận nơi.
      </Typography>

      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <Box sx={{ height: 180, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Placeholder Image */}
                <img 
                  src={product.imageUrl || `https://placehold.co/400x300/e0e0e0/666666?text=${encodeURIComponent(product.name.split(' ')[0])}`} 
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/e0e0e0/666666?text=No+Image';
                  }}
                />
              </Box>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: '1.1rem', lineHeight: 1.3, minHeight: '2.6em' }}>
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph sx={{ flexGrow: 1 }}>
                  {product.description}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={2}>
                  <Chip label={`Mã: ${product.modelCode}`} size="small" variant="outlined" />
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.sellingPrice)}
                  </Typography>
                </Box>
                
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ShoppingCartIcon />}
                  onClick={() => handleAddToCart(product)}
                  sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                >
                  Thêm vào giỏ hàng
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar open={!!successMsg} autoHideDuration={6000} onClose={() => setSuccessMsg('')}>
        <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%' }}>
          {successMsg}
        </Alert>
      </Snackbar>
      <Snackbar open={!!errorMsg} autoHideDuration={6000} onClose={() => setErrorMsg('')}>
        <Alert onClose={() => setErrorMsg('')} severity="error" sx={{ width: '100%' }}>
          {errorMsg}
        </Alert>
      </Snackbar>
      {/* Cart Dialog */}
      <Dialog open={cartDialogOpen} onClose={handleCloseCartDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Giỏ Hàng Của Bạn</span>
          <Chip label={`${cart.reduce((sum, item) => sum + item.quantity, 0)} Sản phẩm`} color="primary" />
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          {/* Cart Items */}
          <Box flex={1}>
            <Typography variant="h6" fontWeight="bold" mb={2}>Sản phẩm đã chọn</Typography>
            {cart.length === 0 ? (
              <Typography color="text.secondary">Giỏ hàng đang trống.</Typography>
            ) : (
              <List>
                {cart.map((item, index) => (
                  <Box key={item.product.id}>
                    <ListItem sx={{ px: 0, py: 2 }}>
                      <Box display="flex" flexDirection="column" flexGrow={1} mr={2}>
                        <Typography variant="subtitle1" fontWeight="bold">{item.product.name}</Typography>
                        <Typography variant="body2" color="primary.main" fontWeight="bold">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.product.sellingPrice)}
                        </Typography>
                        <Box display="flex" alignItems="center" mt={1}>
                          <IconButton size="small" onClick={() => updateCartItemQuantity(item.product.id, -1)} disabled={item.quantity <= 1}>
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ mx: 2 }}>{item.quantity}</Typography>
                          <IconButton size="small" onClick={() => updateCartItemQuantity(item.product.id, 1)}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <ListItemSecondaryAction>
                        <IconButton edge="end" color="error" onClick={() => removeCartItem(item.product.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < cart.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
            
            {cart.length > 0 && (
              <Box mt={2} p={2} bgcolor="#f8f9fa" borderRadius={2} border="1px solid #e0e0e0">
                <Typography variant="h6" color="primary.main" display="flex" justifyContent="space-between" fontWeight="bold">
                  <span>Tổng tiền (tạm tính):</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0)
                  )}</span>
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Checkout Form */}
          <Box flex={1} borderLeft={{ xs: 'none', md: '1px solid #e0e0e0' }} pl={{ xs: 0, md: 4 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>Thông tin lắp đặt</Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Địa chỉ lắp đặt / nhận hàng"
                variant="outlined"
                fullWidth
                value={orderForm.address}
                onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                required
              />
              <TextField
                label="Số điện thoại liên hệ"
                variant="outlined"
                fullWidth
                value={orderForm.phone}
                onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                required
              />
              <TextField
                label="Thời gian mong muốn lắp đặt"
                type="datetime-local"
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={orderForm.desiredTime}
                onChange={(e) => setOrderForm({ ...orderForm, desiredTime: e.target.value })}
              />
              <TextField
                label="Ghi chú thêm (Nếu có)"
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button onClick={handleCloseCartDialog} color="inherit">
            Đóng
          </Button>
          <Button 
            onClick={handleOrderSubmit} 
            variant="contained" 
            color="primary"
            disabled={submitting || cart.length === 0 || !orderForm.address || !orderForm.phone}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartIcon />}
            sx={{ px: 4, py: 1 }}
          >
            {submitting ? 'Đang xử lý...' : 'Tiến hành Đặt Hàng'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <Fab 
          color="secondary" 
          aria-label="cart"
          onClick={() => setCartDialogOpen(true)}
          sx={{ position: 'fixed', bottom: 32, right: 32, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
        >
          <Badge badgeContent={cart.reduce((sum, item) => sum + item.quantity, 0)} color="error">
            <ShoppingCartIcon />
          </Badge>
        </Fab>
      )}
    </Container>
  );
}
