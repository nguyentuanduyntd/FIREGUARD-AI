import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Box } from '@mui/material';
import DashboardLayout from './DashboardLayout';

export default function AdminLayout() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.roles.includes('ADMIN');

  return isAdmin ? (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'transparent' }}>
      <DashboardLayout />
    </Box>
  ) : (
    <Navigate to="/403" replace />
  );
}
