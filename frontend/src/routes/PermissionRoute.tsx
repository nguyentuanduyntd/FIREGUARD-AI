import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface PermissionRouteProps {
  requiredPermissions: string[];
}

export default function PermissionRoute({ requiredPermissions }: PermissionRouteProps) {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Admin bypasses all permission checks
  const isAdmin = user.roles.includes('ADMIN');
  if (isAdmin) {
    return <Outlet />;
  }

  // Check if user has at least one of the required permissions
  const hasPermission = requiredPermissions.some((permission) =>
    user.permissions.includes(permission)
  );

  return hasPermission ? <Outlet /> : <Navigate to="/403" replace />;
}
