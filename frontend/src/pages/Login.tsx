import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
  Alert,
  Chip,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Engineering as TechIcon,
  SupportAgent as SalesIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Badge as BadgeIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập Email hoặc Tên đăng nhập'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự'),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Vui lòng nhập họ và tên'),
  email: z.string().email('Email không đúng định dạng'),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  password: z.string().min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;
type RegisterFormInputs = z.infer<typeof registerSchema>;

const DEMO_ACCOUNTS = [
  { role: 'Admin', icon: <AdminIcon fontSize="small" />, username: 'admin@fireguard.vn', altUser: 'admin', password: 'FireGuard@2026', color: '#ff3d00' },
  { role: 'Kỹ thuật viên', icon: <TechIcon fontSize="small" />, username: 'tech1@fireguard.vn', altUser: 'tech1', password: 'FireGuard@2026', color: '#00b0ff' },
  { role: 'Kinh doanh', icon: <SalesIcon fontSize="small" />, username: 'sales1@fireguard.vn', altUser: 'sales1', password: 'FireGuard@2026', color: '#00e676' },
  { role: 'Khách hàng', icon: <PersonIcon fontSize="small" />, username: 'customer1@client.com', altUser: 'customer1', password: 'FireGuard@2026', color: '#ff9100' },
];

export default function Login() {
  const { login, registerCustomer, loading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tabIndex, setTabIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    setValue: setLoginValue,
    formState: { errors: loginErrors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@fireguard.vn',
      password: 'FireGuard@2026',
      rememberMe: false,
    },
  });

  const {
    register: registerReg,
    handleSubmit: handleSubmitReg,
    formState: { errors: regErrors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const handleSelectDemo = (username: string, pass: string) => {
    setTabIndex(0);
    setLoginValue('email', username, { shouldValidate: true });
    setLoginValue('password', pass, { shouldValidate: true });
    setErrorMsg(null);
  };

  const onLoginSubmit = async (data: LoginFormInputs) => {
    setErrorMsg(null);
    try {
      const result = await login({ email: data.email, password: data.password });
      if (result.success) {
        showToast('Đăng nhập thành công!', 'success');
        const roles = result.user?.roles || [];
        if (roles.includes('CUSTOMER') && !roles.some((r: string) => ['ADMIN', 'SALES', 'TECHNICIAN'].includes(r))) {
          navigate('/services');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Email hoặc mật khẩu không chính xác.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    }
  };

  const onRegisterSubmit = async (data: RegisterFormInputs) => {
    setErrorMsg(null);
    try {
      const result = await registerCustomer({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
        address: data.address,
      });
      if (result.success) {
        showToast('🎉 Đăng ký tài khoản Khách hàng thành công!', 'success');
        navigate('/services');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Đăng ký không thành công. Vui lòng thử lại.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1f0505 0%, #0f111a 60%, #1a0802 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: { xs: 3, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'background.paper',
            borderRadius: 4,
            border: '1px solid rgba(255, 61, 0, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(255, 61, 0, 0.05)',
          }}
        >
          {/* Logo with FireRed and Orange accent */}
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Typography
              variant="h3"
              fontWeight="bold"
              sx={{
                background: 'linear-gradient(90deg, #ff3d00 30%, #ff9100 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: 2,
              }}
            >
              FIREGUARD AI
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }} align="center">
            Hệ thống điều phối cứu nạn & Quản lý thiết bị PCCC thông minh
          </Typography>

          {/* Mode Switching Tabs */}
          <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabIndex}
              onChange={(_, val) => { setTabIndex(val); setErrorMsg(null); }}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Đăng Nhập" icon={<LockIcon fontSize="small" />} iconPosition="start" sx={{ fontWeight: 'bold' }} />
              <Tab label="Đăng Ký Khách Hàng" icon={<PersonAddIcon fontSize="small" />} iconPosition="start" sx={{ fontWeight: 'bold' }} />
            </Tabs>
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {tabIndex === 0 ? (
            <>
              {/* Quick Demo Accounts Selection */}
              <Box sx={{ width: '100%', mb: 2, p: 1.5, bgcolor: 'rgba(255, 61, 0, 0.05)', borderRadius: 2, border: '1px dashed rgba(255, 61, 0, 0.3)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}>
                  ⚡ CHỌN NHANH TÀI KHOẢN DEMO (Click để tự điền):
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {DEMO_ACCOUNTS.map((acc) => (
                    <Chip
                      key={acc.role}
                      icon={acc.icon}
                      label={`${acc.role}`}
                      size="small"
                      onClick={() => handleSelectDemo(acc.username, acc.password)}
                      sx={{
                        cursor: 'pointer',
                        fontWeight: 500,
                        color: '#fff',
                        backgroundColor: 'rgba(255, 255, 255, 0.07)',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        '&:hover': {
                          backgroundColor: `${acc.color}33`,
                          borderColor: acc.color,
                        },
                      }}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>

              <Box component="form" onSubmit={handleSubmitLogin(onLoginSubmit)} noValidate sx={{ width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Tên đăng nhập hoặc Email"
                  placeholder="admin hoặc admin@fireguard.vn"
                  autoComplete="username"
                  autoFocus
                  {...registerLogin('email')}
                  error={!!loginErrors.email}
                  helperText={loginErrors.email?.message}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#ff3d00',
                      },
                    },
                  }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  {...registerLogin('password')}
                  error={!!loginErrors.password}
                  helperText={loginErrors.password?.message}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#ff3d00',
                      },
                    },
                  }}
                />

                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mt: 1, mb: 1 }}
                >
                  <FormControlLabel
                    control={<Checkbox color="primary" {...registerLogin('rememberMe')} />}
                    label={<Typography variant="body2">Ghi nhớ đăng nhập</Typography>}
                  />
                  <Button
                    variant="text"
                    color="primary"
                    onClick={() => showToast('Chức năng khôi phục mật khẩu đang được phát triển.', 'info')}
                    sx={{ fontSize: '0.875rem' }}
                  >
                    Quên mật khẩu?
                  </Button>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    mt: 2,
                    mb: 1,
                    height: 48,
                    fontSize: 16,
                    background: 'linear-gradient(90deg, #b71c1c 0%, #ff3d00 50%, #ff5722 100%)',
                    color: '#fff',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #801010 0%, #d82c00 50%, #d84315 100%)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Đăng nhập'}
                </Button>

                <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 1 }}>
                  💡 Mật khẩu tất cả tài khoản mẫu: <strong style={{ color: '#ff9100' }}>FireGuard@2026</strong> (viết hoa F và G)
                </Typography>
              </Box>
            </>
          ) : (
            /* Customer Register Form */
            <Box component="form" onSubmit={handleSubmitReg(onRegisterSubmit)} noValidate sx={{ width: '100%' }}>
              <TextField
                margin="dense"
                required
                fullWidth
                label="Họ và Tên Khách Hàng / Đại Diện Doanh Nghiệp"
                placeholder="VD: Nguyễn Văn An"
                {...registerReg('fullName')}
                error={!!regErrors.fullName}
                helperText={regErrors.fullName?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="dense"
                required
                fullWidth
                label="Email Đăng Nhập"
                placeholder="VD: an.nguyen@gmail.com"
                {...registerReg('email')}
                error={!!regErrors.email}
                helperText={regErrors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="dense"
                fullWidth
                label="Số Điện Thoại Liên Hệ"
                placeholder="VD: 0987654321"
                {...registerReg('phoneNumber')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="dense"
                fullWidth
                label="Địa Chỉ Công Trình / Trụ Sở PCCC"
                placeholder="VD: 123 Đường Láng, Đống Đa, Hà Nội"
                {...registerReg('address')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HomeIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="dense"
                required
                fullWidth
                label="Tạo Mật Khẩu"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu tối thiểu 6 ký tự"
                {...registerReg('password')}
                error={!!regErrors.password}
                helperText={regErrors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 1,
                  height: 48,
                  fontSize: 16,
                  background: 'linear-gradient(90deg, #ff3d00 0%, #ff9100 100%)',
                  color: '#fff',
                  fontWeight: 'bold',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #d82c00 0%, #e68200 100%)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Tạo Tài Khoản Khách Hàng Ngay'}
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
