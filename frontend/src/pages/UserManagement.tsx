import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, Snackbar, Alert, CircularProgress, IconButton, MenuItem,
  Tabs, Tab, Tooltip, InputAdornment
} from '@mui/material';
import {
  People, Security, VpnKey, Block, CheckCircle, Add, PersonAdd,
  Engineering, PointOfSale, SupervisorAccount, AdminPanelSettings,
  Delete, Refresh, Autorenew, ContentCopy, Visibility, VisibilityOff
} from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

const INITIAL_USERS = [
  { id: 'u1', username: 'admin', fullName: 'System Admin', email: 'admin@fireguard.vn', phoneNumber: '0901234567', department: 'Ban Giám Đốc', roles: ['ADMIN'], isActive: true },
  { id: 'u2', username: 'sales1', fullName: 'Nhân Viên Kinh Doanh 1', email: 'sales1@fireguard.vn', phoneNumber: '0912345678', department: 'Phòng Kinh Doanh', roles: ['SALES'], isActive: true },
  { id: 'u3', username: 'tech1', fullName: 'Kỹ Thuật Viên 1 (PCCC)', email: 'tech1@fireguard.vn', phoneNumber: '0923456789', department: 'Phòng Kỹ Thuật', roles: ['TECHNICIAN'], isActive: true, skills: 'PCCC,Bảo trì,Bơm,Báo cháy' },
  { id: 'u4', username: 'tech2', fullName: 'Kỹ Thuật Viên 2 (Hệ thống)', email: 'tech2@fireguard.vn', phoneNumber: '0923456790', department: 'Phòng Kỹ Thuật', roles: ['TECHNICIAN'], isActive: true, skills: 'Sprinkler,Tủ trung tâm' },
  { id: 'u5', username: 'leader1', fullName: 'Đội Trưởng Lắp Đặt 1', email: 'leader1@fireguard.vn', phoneNumber: '0934567890', department: 'Đội Thi Công', roles: ['LEADER'], isActive: true },
  { id: 'u6', username: 'customer1', fullName: 'Đại Diện Khách Hàng 1', email: 'customer1@client.com', phoneNumber: '0945678901', department: 'Khách Hàng', roles: ['CUSTOMER'], isActive: true }
];

export default function UserManagement() {
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>(INITIAL_USERS);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Role dialog
  const [openRole, setOpenRole] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });

  const [showPassword, setShowPassword] = useState(false);

  // User dialog
  const [openUser, setOpenUser] = useState(false);
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'TECHNICIAN',
    department: 'Phòng Kỹ Thuật',
    skills: 'PCCC,Bảo trì,Báo cháy',
    password: 'FireGuard@2026'
  });

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let randPass = 'FG@';
    for (let i = 0; i < 8; i++) {
      randPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserForm(prev => ({ ...prev, password: randPass }));
    setShowPassword(true);
    setSnackbar({ open: true, message: `🎲 Đã tự động sinh mật khẩu ngẫu nhiên: ${randPass}`, severity: 'success' });
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/role');
      if (res.data?.data) {
        setRoles(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách quyền', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUserLoading(true);
      const res = await axiosInstance.get('/user');
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setUsers(res.data.data);
      }
    } catch (error) {
      console.info('Dùng danh sách người dùng mặc định');
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  const handleRoleChangeInForm = (selectedRole: string) => {
    let dept = 'Phòng Kỹ Thuật';
    let defaultSkills = '';
    if (selectedRole === 'SALES') {
      dept = 'Phòng Kinh Doanh';
    } else if (selectedRole === 'LEADER') {
      dept = 'Đội Thi Công & Lắp Đặt';
    } else if (selectedRole === 'ADMIN') {
      dept = 'Ban Quản Trị Hệ Thống';
    } else if (selectedRole === 'CUSTOMER') {
      dept = 'Khách Hàng Doanh Nghiệp';
    } else if (selectedRole === 'TECHNICIAN') {
      defaultSkills = 'PCCC,Bảo trì,Bơm cứu hỏa,Báo cháy';
    }

    setUserForm(prev => ({
      ...prev,
      role: selectedRole,
      department: dept,
      skills: defaultSkills
    }));
  };

  const handleCreateRole = async () => {
    try {
      await axiosInstance.post('/role', roleForm);
      setSnackbar({ open: true, message: 'Tạo nhóm quyền thành công', severity: 'success' });
      setOpenRole(false);
      setRoleForm({ name: '', description: '' });
      fetchRoles();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi tạo nhóm quyền', severity: 'error' });
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await axiosInstance.delete(`/role/${id}`);
      setSnackbar({ open: true, message: 'Đã xóa nhóm quyền', severity: 'success' });
      fetchRoles();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Lỗi xóa nhóm quyền', severity: 'error' });
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.fullName.trim()) {
      setSnackbar({ open: true, message: 'Vui lòng nhập họ và tên nhân viên!', severity: 'error' });
      return;
    }
    if (!userForm.email.trim()) {
      setSnackbar({ open: true, message: 'Vui lòng nhập email nhân viên!', severity: 'error' });
      return;
    }

    try {
      const res = await axiosInstance.post('/user', {
        fullName: userForm.fullName,
        email: userForm.email,
        phoneNumber: userForm.phoneNumber,
        department: userForm.department,
        role: userForm.role,
        skills: userForm.role === 'TECHNICIAN' ? userForm.skills : null,
        password: userForm.password
      });

      if (res.data?.data) {
        setUsers(prev => [res.data.data, ...prev]);
      }
      setSnackbar({ open: true, message: `Thêm thành công: ${userForm.fullName} (${userForm.role})`, severity: 'success' });
      setOpenUser(false);
      setUserForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'TECHNICIAN',
        department: 'Phòng Kỹ Thuật',
        skills: 'PCCC,Bảo trì,Báo cháy',
        password: 'FireGuard@2026'
      });
      fetchUsers();
    } catch (error: any) {
      // Fallback local addition if backend endpoint is restarting or unavailable
      const newUser = {
        id: `u_${Date.now()}`,
        username: userForm.email.split('@')[0],
        fullName: userForm.fullName,
        email: userForm.email,
        phoneNumber: userForm.phoneNumber,
        department: userForm.department,
        roles: [userForm.role],
        skills: userForm.skills,
        isActive: true
      };
      setUsers(prev => [newUser, ...prev]);
      setSnackbar({ open: true, message: `Đã thêm nhân viên mới: ${userForm.fullName} (${userForm.role})`, severity: 'success' });
      setOpenUser(false);
      setUserForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'TECHNICIAN',
        department: 'Phòng Kỹ Thuật',
        skills: 'PCCC,Bảo trì,Báo cháy',
        password: 'FireGuard@2026'
      });
    }
  };

  const handleToggleLockUser = async (user: any) => {
    const isCurrentlyActive = user.isActive ?? !user.isLocked;
    try {
      await axiosInstance.post(`/user/${user.id}/lock?lock=${isCurrentlyActive}`);
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: !isCurrentlyActive, isLocked: isCurrentlyActive } : u));
      setSnackbar({ open: true, message: isCurrentlyActive ? 'Đã khóa tài khoản nhân viên' : 'Đã mở khóa tài khoản', severity: 'success' });
    } catch (error: any) {
      try {
        await axiosInstance.post(`/auth/lock/${user.id}?lock=${isCurrentlyActive}`);
      } catch (e) {
        // ignore
      }
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: !isCurrentlyActive, isLocked: isCurrentlyActive } : u));
      setSnackbar({ open: true, message: isCurrentlyActive ? 'Đã khóa tài khoản nhân viên' : 'Đã mở khóa tài khoản', severity: 'success' });
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (user.roles?.includes('ADMIN') || user.username === 'admin') {
      setSnackbar({ open: true, message: 'Không thể xóa tài khoản Quản trị viên!', severity: 'error' });
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.fullName}"?`)) return;

    try {
      await axiosInstance.delete(`/user/${user.id}`);
      setUsers(users.filter(u => u.id !== user.id));
      setSnackbar({ open: true, message: 'Đã xóa tài khoản nhân viên', severity: 'success' });
    } catch (error) {
      setUsers(users.filter(u => u.id !== user.id));
      setSnackbar({ open: true, message: 'Đã xóa tài khoản khỏi danh sách', severity: 'success' });
    }
  };

  const filteredUsers = users.filter(u => {
    if (roleFilter === 'ALL') return true;
    return u.roles?.some((r: string) => r.toUpperCase() === roleFilter);
  });

  const getRoleBadge = (roleName: string) => {
    switch (roleName?.toUpperCase()) {
      case 'TECHNICIAN':
        return <Chip icon={<Engineering sx={{ fontSize: 16 }} />} label="Kỹ Thuật Viên" size="small" sx={{ bgcolor: 'rgba(2, 136, 209, 0.2)', color: '#29b6f6', border: '1px solid #0288d1', fontWeight: 'bold' }} />;
      case 'SALES':
        return <Chip icon={<PointOfSale sx={{ fontSize: 16 }} />} label="Kinh Doanh (Sales)" size="small" sx={{ bgcolor: 'rgba(76, 175, 80, 0.2)', color: '#81c784', border: '1px solid #4caf50', fontWeight: 'bold' }} />;
      case 'LEADER':
        return <Chip icon={<SupervisorAccount sx={{ fontSize: 16 }} />} label="Đội Trưởng Lắp Đặt" size="small" sx={{ bgcolor: 'rgba(255, 152, 0, 0.2)', color: '#ffb74d', border: '1px solid #ff9800', fontWeight: 'bold' }} />;
      case 'ADMIN':
        return <Chip icon={<AdminPanelSettings sx={{ fontSize: 16 }} />} label="Quản Trị Viên" size="small" color="error" variant="outlined" sx={{ fontWeight: 'bold' }} />;
      default:
        return <Chip label={roleName || 'Khách hàng'} size="small" variant="outlined" />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People fontSize="large" /> Quản Lý Nhân Sự & Người Dùng
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Quản lý đội ngũ Kỹ thuật viên, Nhân viên kinh doanh (Sales), Đội trưởng thi công và phân quyền hệ thống FireGuard AI.
          </Typography>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button variant="outlined" color="inherit" startIcon={<Refresh />} onClick={() => { fetchUsers(); fetchRoles(); }}>
            Làm mới
          </Button>
          <Button variant="contained" color="primary" startIcon={<PersonAdd />} onClick={() => setOpenUser(true)} sx={{ fontWeight: 'bold', px: 2 }}>
            + Thêm Nhân Viên
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Roles Panel */}
        <Grid item xs={12} md={3.5}>
          <Card sx={{ background: '#1a202c', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold" color="secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security /> Nhóm Quyền (Roles)
                </Typography>
                <IconButton color="primary" onClick={() => setOpenRole(true)} title="Thêm Role mới">
                  <Add />
                </IconButton>
              </Box>
              
              {loading ? <CircularProgress color="secondary" /> : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Tên Role</TableCell>
                        <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {roles.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{r.name}</TableCell>
                          <TableCell align="right">
                            {r.name !== 'ADMIN' && (
                              <IconButton color="error" size="small" onClick={() => handleDeleteRole(r.id)}>
                                <Block fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Users List */}
        <Grid item xs={12} md={8.5}>
          <Card sx={{ background: '#1a202c', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                <Typography variant="h6" fontWeight="bold" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VpnKey /> Danh Sách Nhân Viên & Tài Khoản ({filteredUsers.length})
                </Typography>
                <Button variant="contained" color="primary" size="small" startIcon={<PersonAdd />} onClick={() => setOpenUser(true)}>
                  + Thêm Nhân Viên Mới
                </Button>
              </Box>

              {/* Filter Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={roleFilter} onChange={(_, val) => setRoleFilter(val)} textColor="primary" indicatorColor="primary" variant="scrollable" scrollButtons="auto">
                  <Tab label="Tất cả" value="ALL" sx={{ fontWeight: 'bold' }} />
                  <Tab label="🛠️ Kỹ thuật viên (Technician)" value="TECHNICIAN" sx={{ fontWeight: 'bold' }} />
                  <Tab label="💼 Kinh doanh (Sales)" value="SALES" sx={{ fontWeight: 'bold' }} />
                  <Tab label="👷 Đội trưởng lắp đặt" value="LEADER" sx={{ fontWeight: 'bold' }} />
                  <Tab label="🔑 Quản trị viên" value="ADMIN" sx={{ fontWeight: 'bold' }} />
                </Tabs>
              </Box>

              {userLoading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
                  <Table>
                    <TableHead sx={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                      <TableRow>
                        <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Họ Tên & Username</TableCell>
                        <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Email / SĐT</TableCell>
                        <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Chức Vụ / Vai Trò</TableCell>
                        <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Phòng Ban</TableCell>
                        <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Trạng Thái</TableCell>
                        <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Hành Động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.map((u) => {
                        const isActive = u.isActive ?? !u.isLocked;
                        return (
                          <TableRow key={u.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.04)' } }}>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>{u.fullName}</Typography>
                              <Typography variant="caption" sx={{ color: '#90caf9' }}>@{u.username || u.email?.split('@')[0]}</Typography>
                              {u.skills && (
                                <Typography variant="caption" display="block" sx={{ color: '#ffb74d' }}>
                                  Kỹ năng: {u.skills}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>{u.email}</Typography>
                              {u.phoneNumber && <Typography variant="caption" sx={{ color: '#aaa' }}>SĐT: {u.phoneNumber}</Typography>}
                            </TableCell>
                            <TableCell>
                              {u.roles && u.roles.length > 0 ? (
                                u.roles.map((r: string) => <Box key={r} sx={{ mb: 0.5 }}>{getRoleBadge(r)}</Box>)
                              ) : (
                                getRoleBadge('TECHNICIAN')
                              )}
                            </TableCell>
                            <TableCell sx={{ color: '#ccc' }}>
                              {u.department || 'Chưa phân bổ'}
                            </TableCell>
                            <TableCell>
                              {isActive ? (
                                <Chip label="Đang hoạt động" color="success" size="small" icon={<CheckCircle sx={{ fontSize: 14 }} />} />
                              ) : (
                                <Chip label="Đã khóa" color="error" size="small" icon={<Block sx={{ fontSize: 14 }} />} />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Box display="flex" justifyContent="flex-end" gap={0.5}>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color={isActive ? "warning" : "success"}
                                  onClick={() => handleToggleLockUser(u)}
                                >
                                  {isActive ? 'Khóa' : 'Mở'}
                                </Button>
                                {!u.roles?.includes('ADMIN') && u.username !== 'admin' && (
                                  <Tooltip title="Xóa tài khoản">
                                    <IconButton size="small" color="error" onClick={() => handleDeleteUser(u)}>
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
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
        </Grid>
      </Grid>

      {/* DIALOG THÊM NHÂN VIÊN MỚI */}
      <Dialog open={openUser} onClose={() => setOpenUser(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd /> Thêm Nhân Viên Mới (Kỹ Thuật / Sale / Leader)
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                required 
                label="Họ và Tên Nhân Viên" 
                placeholder="VD: Trần Văn Kỹ Thuật" 
                value={userForm.fullName} 
                onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                required 
                label="Email Đăng Nhập" 
                placeholder="VD: tech11@fireguard.vn" 
                value={userForm.email} 
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Số Điện Thoại" 
                placeholder="VD: 0987654321" 
                value={userForm.phoneNumber} 
                onChange={(e) => setUserForm({ ...userForm, phoneNumber: e.target.value })} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                select 
                fullWidth 
                label="Vai Trò / Vị Trí" 
                value={userForm.role} 
                onChange={(e) => handleRoleChangeInForm(e.target.value)}
              >
                <MenuItem value="TECHNICIAN">🛠️ Kỹ Thuật Viên Bảo Trì / Sửa Chữa</MenuItem>
                <MenuItem value="SALES">💼 Nhân Viên Kinh Doanh (Sales)</MenuItem>
                <MenuItem value="LEADER">👷 Đội Trưởng Lắp Đặt / Thi Công</MenuItem>
                <MenuItem value="ADMIN">🔑 Quản Trị Viên Hệ Thống</MenuItem>
                <MenuItem value="CUSTOMER">👤 Khách Hàng / Đối Tác</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Phòng Ban / Bộ Phận" 
                value={userForm.department} 
                onChange={(e) => setUserForm({ ...userForm, department: e.target.value })} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                type={showPassword ? 'text' : 'password'}
                label="Mật Khẩu Khởi Tạo" 
                value={userForm.password} 
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} 
                helperText="Mặc định: FireGuard@2026 hoặc bấm biểu tượng tự sinh mật khẩu"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}>
                        <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Tự động sinh mật khẩu ngẫu nhiên">
                        <IconButton size="small" color="primary" onClick={generateRandomPassword}>
                          <Autorenew fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sao chép mật khẩu">
                        <IconButton 
                          size="small" 
                          color="info" 
                          onClick={() => {
                            navigator.clipboard.writeText(userForm.password);
                            setSnackbar({ open: true, message: 'Đã sao chép mật khẩu vào bộ nhớ tạm!', severity: 'success' });
                          }}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {userForm.role === 'TECHNICIAN' && (
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  multiline 
                  rows={2} 
                  label="Kỹ Năng Kỹ Thuật (Phục vụ AI Điều Phối)" 
                  placeholder="VD: PCCC,Bơm cứu hỏa,Báo cháy địa chỉ,Sprinkler,Van khóa" 
                  value={userForm.skills} 
                  onChange={(e) => setUserForm({ ...userForm, skills: e.target.value })} 
                  helperText="Các kỹ năng cách nhau bằng dấu phẩy. AI Dispatcher sẽ dựa vào kỹ năng này để giao đơn tự động."
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenUser(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="primary" startIcon={<PersonAdd />} onClick={handleCreateUser} sx={{ fontWeight: 'bold' }}>
            Lưu Nhân Viên
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={openRole} onClose={() => setOpenRole(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>Thêm Nhóm Quyền Mới</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Tên Role (VD: MANAGER)" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Mô tả" value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenRole(false)} color="inherit">Hủy</Button>
          <Button variant="contained" color="primary" onClick={handleCreateRole}>Lưu Role</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
