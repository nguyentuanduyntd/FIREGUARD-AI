import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { clearCredentials } from '../store/authSlice';
import axiosInstance from '../api/axiosInstance';
import {
  AppBar,
  IconButton,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import React, { useState } from 'react';
import { useSignalR } from '../hooks/useSignalR';

interface HeaderProps {
  handleDrawerToggle: () => void;
}

export default function Header({ handleDrawerToggle }: HeaderProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      dispatch(clearCredentials());
      navigate('/login');
    }
  };

  const { connectionStatus } = useSignalR();

  const getStatusIndicator = () => {
    switch (connectionStatus) {
      case 'Connected':
        return (
          <Chip
            icon={<WifiIcon style={{ fontSize: 16 }} />}
            label="Live"
            color="success"
            size="small"
            variant="outlined"
            sx={{
              borderColor: 'success.main',
              color: 'success.main',
              fontWeight: 'bold',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.6 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.6 },
              },
            }}
          />
        );
      case 'Connecting':
      case 'Reconnecting':
        return (
          <Chip
            icon={<WifiIcon style={{ fontSize: 16 }} />}
            label={connectionStatus === 'Connecting' ? 'Connecting' : 'Reconnecting'}
            color="warning"
            size="small"
            variant="outlined"
            sx={{
              borderColor: 'warning.main',
              color: 'warning.main',
              fontWeight: 'bold',
              animation: 'pulse 1s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.4 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.4 },
              },
            }}
          />
        );
      case 'Disconnected':
      default:
        return (
          <Chip
            icon={<WifiOffIcon style={{ fontSize: 16 }} />}
            label="Offline"
            color="error"
            size="small"
            variant="outlined"
            sx={{
              borderColor: 'error.main',
              color: 'error.main',
              fontWeight: 'bold',
            }}
          />
        );
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - 260px)` },
        ml: { md: `260px` },
        backgroundColor: 'background.paper',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" noWrap component="div" sx={{ color: 'text.primary', fontWeight: 600 }}>
          Hệ thống Quản lý Thiết bị PCCC
        </Typography>

        <Box display="flex" alignItems="center" gap={2}>
          {getStatusIndicator()}

          <IconButton color="inherit">
            <Badge badgeContent={3} color="primary">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {user && (
            <>
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                onClick={handleMenuOpen}
                sx={{ cursor: 'pointer' }}
              >
                <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                  {user.fullName.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.primary', fontWeight: 500 }}>
                  {user.fullName}
                </Typography>
              </Box>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={() => { handleMenuClose(); if (user.roles.includes('ADMIN')) { navigate('/settings'); } else { navigate('/ai-consulting'); } }}>
                  <PersonIcon sx={{ mr: 1, fontSize: 20 }} /> Hồ sơ cá nhân
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> Đăng xuất
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
