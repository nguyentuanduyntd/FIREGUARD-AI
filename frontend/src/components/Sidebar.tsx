import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { RootState } from '../store';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Typography,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  QrCode as QrCodeIcon,
  BarChart as BarChartIcon,
  Psychology as PsychologyIcon,
  SupportAgent as SupportAgentIcon,
  Map as MapIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Storefront as StorefrontIcon,
  Engineering as EngineeringIcon,
} from '@mui/icons-material';

const drawerWidth = 260;

interface SidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
}

export default function Sidebar({ mobileOpen, handleDrawerToggle }: SidebarProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!user) return null;

  const userRoles = (user?.roles || []).map((r: any) => String(r).trim().toUpperCase());

  // Navigation Items defined dynamically
  const menuItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, roles: ['ADMIN', 'SALES', 'TECHNICIAN', 'INSTALLATION_LEADER', 'INSTALLATION_MEMBER'] },
    { text: 'Tư vấn PCCC AI', path: '/ai-consulting', icon: <PsychologyIcon />, roles: ['ADMIN', 'SALES', 'TECHNICIAN', 'CUSTOMER'] },
    { text: 'Báo giá sơ bộ AI', path: '/ai-preliminary-quotation', icon: <PsychologyIcon />, roles: ['ADMIN', 'SALES', 'TECHNICIAN', 'CUSTOMER'] },
    { text: 'Chẩn đoán lỗi AI', path: '/ai-diagnostic', icon: <PsychologyIcon />, roles: ['ADMIN', 'SALES', 'TECHNICIAN', 'CUSTOMER'] },
    { text: 'Theo dõi bảo trì', path: '/maintenance-tracking', icon: <PsychologyIcon />, roles: ['ADMIN', 'SALES', 'TECHNICIAN', 'CUSTOMER'] },
    { text: 'Sản phẩm & Lắp đặt', path: '/products', icon: <StorefrontIcon />, roles: ['ADMIN', 'SALES', 'CUSTOMER'] },
    {
      text: userRoles.some(r => ['ADMIN', 'INSTALLATION_LEADER', 'LEADER'].includes(r))
        ? 'Bản đồ Điều phối thi công'
        : 'Bản đồ Nhận việc & Chỉ đường',
      path: '/map-dashboard',
      icon: <MapIcon />,
      roles: ['ADMIN', 'INSTALLATION_LEADER', 'LEADER', 'TECHNICIAN', 'INSTALLATION_MEMBER']
    },
    { text: 'Báo cáo & Thống kê', path: '/reports', icon: <AssessmentIcon />, roles: ['ADMIN', 'SALES'] },
    { text: 'Nhật ký hệ thống', path: '/admin/audit-logs', icon: <SecurityIcon />, roles: ['ADMIN'] },
    { text: 'Tài khoản & Quyền', path: '/admin/users', icon: <PeopleIcon />, roles: ['ADMIN'] },
    { text: 'Khách hàng (CRM)', path: '/sales/customers', icon: <BusinessIcon />, roles: ['ADMIN', 'SALES'] },
    { text: 'Danh mục thiết bị', path: '/catalog', icon: <StorefrontIcon />, roles: ['ADMIN', 'SALES'] },
    { text: 'Quản lý kho', path: '/inventory', icon: <InventoryIcon />, roles: ['ADMIN', 'SALES'] },
    { text: 'Dự án thi công', path: '/projects', icon: <AssignmentIcon />, roles: ['ADMIN', 'INSTALLATION_LEADER', 'LEADER'] },
    { text: 'Thi công & Lắp đặt', path: '/projects/installation', icon: <EngineeringIcon />, roles: ['ADMIN', 'INSTALLATION_LEADER', 'LEADER'] },
    { text: 'Sửa chữa & Bảo trì', path: '/services', icon: <SupportAgentIcon />, roles: ['ADMIN', 'TECHNICIAN', 'CUSTOMER'] },
    { text: 'Mã QR & Hạn bảo trì, lắp đặt', path: '/scan', icon: <QrCodeIcon />, roles: ['ADMIN', 'INSTALLATION_LEADER', 'TECHNICIAN', 'CUSTOMER', 'SALES', 'LEADER'] },
    { text: 'Đánh giá KPI', path: '/kpi', icon: <BarChartIcon />, roles: ['ADMIN', 'SALES', 'TECHNICIAN'] },
    { text: 'Trí tuệ nhân tạo AI', path: '/ai-service', icon: <PsychologyIcon />, roles: ['ADMIN'] },
    { text: 'Cài đặt hệ thống', path: '/settings', icon: <SettingsIcon />, roles: ['ADMIN'] },
  ];

  const filteredMenu = menuItems.filter((item) =>
    item.roles.some((role) => userRoles.includes(role.toUpperCase()))
  );

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography variant="h6" color="primary" fontWeight="bold" letterSpacing={1}>
          FIREGUARD AI
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
        {filteredMenu.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.text}
              component={Link}
              to={item.path}
              onClick={handleDrawerToggle}
              selected={active}
              sx={{
                borderRadius: 2,
                mb: 1,
                backgroundColor: active ? 'rgba(255, 61, 0, 0.08)' : 'transparent',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 61, 0, 0.15)',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 61, 0, 0.2)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              <ListItemIcon sx={{ color: active ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 500 }} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', backgroundColor: 'background.paper' },
        }}
      >
        {drawerContent}
      </Drawer>
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', backgroundColor: 'background.paper', borderRight: '1px solid rgba(255,255,255,0.08)' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
export { drawerWidth };
