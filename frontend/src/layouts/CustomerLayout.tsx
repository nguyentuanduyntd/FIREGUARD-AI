import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import DashboardLayout from './DashboardLayout';

export default function CustomerLayout() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const isCustomerOrAdmin = user.roles.includes('CUSTOMER') || user.roles.includes('ADMIN');

  return isCustomerOrAdmin ? <DashboardLayout /> : <Navigate to="/403" replace />;
}
