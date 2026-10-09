import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerManagement from './pages/CustomerManagement';
import InventoryManagement from './pages/InventoryManagement';
import ProjectManagement from './pages/ProjectManagement';
import ProjectInstallation from './pages/ProjectInstallation';
import ServiceRequestManagement from './pages/ServiceRequestManagement';
import AIConsultingChat from './pages/AIConsultingChat';
import AIPreliminaryQuotation from './pages/AIPreliminaryQuotation';
import AIDiagnostic from './pages/AIDiagnostic';
import MaintenanceTracking from './pages/MaintenanceTracking';
import MapDashboard from './pages/MapDashboard';
import KpiDashboard from './pages/KpiDashboard';
import ReportManagement from './pages/ReportManagement';
import AuditLogViewer from './pages/AuditLogViewer';
import UserManagement from './pages/UserManagement';
import CustomerCatalog from './pages/CustomerCatalog';
import CatalogManagement from './pages/CatalogManagement';
import EquipmentQRManagement from './pages/EquipmentQRManagement';
import Page403 from './pages/Page403';
import Page404 from './pages/Page404';
import Page500 from './pages/Page500';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import EmployeeLayout from './layouts/EmployeeLayout';
import CustomerLayout from './layouts/CustomerLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import useAuth from './hooks/useAuth';
import { Card, Typography, Box, CircularProgress } from '@mui/material';

// Inline Stub Component for non-implemented pages
function StubPage({ name }: { name: string }) {
  return (
    <Card sx={{ p: 4, backgroundColor: 'background.paper', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Phân hệ: {name}
      </Typography>
      <Typography color="text.secondary">
        Chức năng đang được tích hợp. Vui lòng quay lại sau khi hoàn thiện backend services.
      </Typography>
    </Card>
  );
}

export default function App() {
  const { checkSession, loading } = useAuth();

  useEffect(() => {
    checkSession();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ backgroundColor: 'transparent' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<Page403 />} />
        <Route path="/500" element={<Page500 />} />
        <Route path="/404" element={<Page404 />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          
          {/* Admin Specific Operations */}
          <Route element={<AdminLayout />}>
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/settings" element={<StubPage name="Cài đặt Hệ thống" />} />
            <Route path="/ai-service" element={<StubPage name="Cấu hình AI Core Service" />} />
            <Route path="/admin/audit-logs" element={<AuditLogViewer />} />
          </Route>

          {/* Company Employee Operations */}
          <Route element={<EmployeeLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sales/customers" element={<CustomerManagement />} />
            <Route path="/catalog" element={<CatalogManagement />} />
            <Route path="/inventory" element={<InventoryManagement />} />
            <Route path="/projects" element={<ProjectManagement />} />
            <Route path="/projects/installation" element={<ProjectInstallation />} />
            <Route path="/map-dashboard" element={<MapDashboard />} />
            <Route path="/kpi" element={<KpiDashboard />} />
            <Route path="/reports" element={<ReportManagement />} />
          </Route>

          {/* Shared Features Available to All Authenticated Roles */}
          <Route element={<DashboardLayout />}>
            <Route path="/services" element={<ServiceRequestManagement />} />
            <Route path="/products" element={<CustomerCatalog />} />
            <Route path="/scan" element={<EquipmentQRManagement />} />
            <Route path="/equipment-qr" element={<EquipmentQRManagement />} />
            <Route path="/ai-consulting" element={<AIConsultingChat />} />
            <Route path="/ai-preliminary-quotation" element={<AIPreliminaryQuotation />} />
            <Route path="/ai-diagnostic" element={<AIDiagnostic />} />
            <Route path="/maintenance-tracking" element={<MaintenanceTracking />} />
          </Route>

        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
