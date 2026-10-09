import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Box } from '@mui/material';
import DashboardLayout from './DashboardLayout';

export default function EmployeeLayout() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const employeeRoles = ['ADMIN', 'SALES', 'TECHNICIAN', 'INSTALLATION_LEADER', 'INSTALLATION_MEMBER'];
  const isEmployee = user.roles.some((role) => employeeRoles.includes(role));

  if (user.roles.includes('CUSTOMER')) {
    return <Navigate to="/services" replace />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'transparent' }}>
      {isEmployee ? <DashboardLayout /> : <Navigate to="/403" replace />}
    </Box>
  );
}
