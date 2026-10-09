// Frontend React implementation of MaintenanceTracking
import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, Tabs, Tab, IconButton, CircularProgress, Alert
} from '@mui/material';
import {
  SettingsBackupRestore as ScanIcon,
  CheckCircle as AcceptIcon,
  Cancel as DeclineIcon,
  AccessTime as PendingIcon,
  Engineering as MaintenanceIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

interface EquipmentAsset {
  id: string;
  serialNumber: string;
  model: {
    name: string;
  };
  customer?: {
    name: string;
  };
}

interface MaintenanceReminder {
  id: string;
  equipmentAssetId: string;
  equipmentAsset: EquipmentAsset;
  scheduledDate: string;
  reminderType: 'Overdue' | '3Days' | '7Days' | '30Days';
  status: 0 | 1 | 2 | 3 | 4; // Pending, Proposed, Accepted, Declined, Postponed
  declineReason?: string;
}

export default function MaintenanceTracking() {
  const [tabIndex, setTabIndex] = useState(0);
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Decline Dialog State
  const [declineOpen, setDeclineOpen] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const fetchReminders = async () => {
    setLoading(true);
    try {
      // If admin tab (tab 0), load all reminders, else load customer reminders (tab 1)
      const endpoint = tabIndex === 0 ? '/maintenancereminder' : '/maintenancereminder/customer';
      const response = await axiosInstance.get(endpoint);
      setReminders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [tabIndex]);

  const handleTriggerScan = async () => {
    setScanLoading(true);
    setMsg(null);
    try {
      await axiosInstance.post('/maintenancereminder/scan');
      setMsg({ type: 'success', text: 'Đã hoàn tất quét toàn bộ hệ thống thiết bị và tạo nhắc nhở bảo trì.' });
      fetchReminders();
    } catch (error) {
      setMsg({ type: 'error', text: 'Không thể khởi chạy quy trình quét thiết bị.' });
    } finally {
      setScanLoading(false);
    }
  };

  const handleResponse = async (id: string, status: number, reason?: string) => {
    setMsg(null);
    try {
      await axiosInstance.post(`/maintenancereminder/${id}/respond`, {
        status: status,
        declineReason: reason
      });
      setMsg({ type: 'success', text: 'Đã gửi phản hồi về lịch bảo trì thành công.' });
      fetchReminders();
    } catch (error) {
      setMsg({ type: 'error', text: 'Gửi phản hồi thất bại.' });
    }
  };

  const openDeclineDialog = (id: string) => {
    setSelectedReminderId(id);
    setDeclineReason('');
    setDeclineOpen(true);
  };

  const submitDecline = () => {
    if (selectedReminderId) {
      handleResponse(selectedReminderId, 3, declineReason); // 3 = Declined
      setDeclineOpen(false);
    }
  };

  const getReminderTypeChip = (type: string) => {
    switch (type) {
      case 'Overdue':
        return <Chip label="Quá hạn" color="error" size="small" />;
      case '3Days':
        return <Chip label="Còn 3 ngày" color="warning" size="small" />;
      case '7Days':
        return <Chip label="Còn 7 ngày" color="info" size="small" />;
      case '30Days':
        return <Chip label="Còn 30 ngày" color="default" size="small" />;
      default:
        return <Chip label={type} size="small" />;
    }
  };

  const getStatusChip = (status: number) => {
    switch (status) {
      case 0:
        return <Chip label="Đang chờ" color="default" variant="outlined" size="small" icon={<PendingIcon />} />;
      case 1:
        return <Chip label="Chờ phản hồi" color="warning" variant="outlined" size="small" icon={<PendingIcon />} />;
      case 2:
        return <Chip label="Đã chấp nhận" color="success" size="small" icon={<AcceptIcon />} />;
      case 3:
        return <Chip label="Đã từ chối" color="error" size="small" icon={<DeclineIcon />} />;
      case 4:
        return <Chip label="Tạm dời lịch" color="info" size="small" icon={<PendingIcon />} />;
      default:
        return <Chip label="Không rõ" size="small" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MaintenanceIcon /> Quản Lý & Nhắc Nhở Bảo Trì Định Kỳ
        </Typography>
        
        {tabIndex === 0 && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={scanLoading ? <CircularProgress size={20} color="inherit" /> : <ScanIcon />}
            onClick={handleTriggerScan}
            disabled={scanLoading}
            sx={{ borderRadius: 3, fontWeight: 'bold' }}
          >
            Chạy quét thiết bị hàng ngày
          </Button>
        )}
      </Box>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      <Card sx={{ background: '#1a202c', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} indicatorColor="primary" textColor="primary" variant="fullWidth">
            <Tab label="Danh sách thiết bị sắp bảo trì (Admin)" sx={{ fontWeight: 'bold' }} />
            <Tab label="Đề xuất lịch hẹn bảo trì (Khách hàng)" sx={{ fontWeight: 'bold' }} />
          </Tabs>
        </Box>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : reminders.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={8}>
              <Typography color="textSecondary" variant="body1">
                Không tìm thấy nhắc nhở bảo trì nào phù hợp.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
              <Table>
                <TableHead sx={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Mã S/N</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Tên thiết bị</TableCell>
                    {tabIndex === 0 && <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Khách hàng</TableCell>}
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Ngày bảo trì đề xuất</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Mức độ</TableCell>
                    <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Trạng thái</TableCell>
                    <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reminders.map((r) => (
                    <TableRow key={r.id} hover sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.04)' } }}>
                      <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>{r.equipmentAsset?.serialNumber}</TableCell>
                      <TableCell sx={{ color: '#e2e8f0' }}>{r.equipmentAsset?.model?.name}</TableCell>
                      {tabIndex === 0 && <TableCell sx={{ color: '#e2e8f0' }}>{r.equipmentAsset?.customer?.name || 'Vãng lai'}</TableCell>}
                      <TableCell sx={{ color: '#e2e8f0' }}>{new Date(r.scheduledDate).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>{getReminderTypeChip(r.reminderType)}</TableCell>
                      <TableCell>
                        {getStatusChip(r.status)}
                        {r.declineReason && (
                          <Box fontSize={11} color="error.main" mt={0.5}>
                            Lý do từ chối: {r.declineReason}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {tabIndex === 1 && r.status === 1 && ( // Proposed status waiting for client response
                          <Box display="flex" justifyContent="flex-end" gap={1}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<AcceptIcon />}
                              onClick={() => handleResponse(r.id, 2)} // 2 = Accepted
                              sx={{ borderRadius: 2, fontWeight: 'bold' }}
                            >
                              Xác nhận lịch
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeclineIcon />}
                              onClick={() => openDeclineDialog(r.id)}
                              sx={{ borderRadius: 2 }}
                            >
                              Từ chối
                            </Button>
                          </Box>
                        )}
                        {tabIndex === 0 && (
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            Tự động quản lý bởi AI
                          </Typography>
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

      {/* Decline Reason Dialog */}
      <Dialog open={declineOpen} onClose={() => setDeclineOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Từ chối đề xuất lịch bảo trì</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Vui lòng nhập lý do từ chối lịch đề xuất hoặc đề xuất thời gian hẹn khác để kỹ thuật viên liên hệ lại.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Lý do từ chối / Đề xuất dời lịch"
            placeholder="VD: Nhà xưởng bận sản xuất, xin dời sang chiều thứ 7 tuần sau..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeclineOpen(false)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={submitDecline} disabled={!declineReason.trim()}>
            Gửi từ chối
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
