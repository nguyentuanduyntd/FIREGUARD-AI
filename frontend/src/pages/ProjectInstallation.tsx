import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Card, CardContent, Grid, Button, Box, Chip,
  LinearProgress, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, Tabs, Tab, Avatar, IconButton, Divider,
  CardMedia, Paper, Tooltip, Badge
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ListAlt as ListAltIcon,
  CameraAlt as CameraAltIcon,
  Engineering as EngineeringIcon,
  Group as GroupIcon,
  AddPhotoAlternate as AddPhotoIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  PlayCircleOutline as StartIcon,
  DoneAll as DoneIcon,
  RadioButtonUnchecked as PendingIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Preset sample photos for fast field reporting
const SAMPLE_FIELD_PHOTOS = [
  {
    name: 'Lắp Tủ Trung Tâm Báo Cháy',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Thi Công Đầu Báo Khói & Nhiệt',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Kéo Cáp Tín Hiệu Chống Cháy',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Kiểm Tra Áp Lực Đường Ống PCCC',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80'
  }
];

interface WorkerAssignment {
  id: string;
  workerName: string;
  workerRole: string;
  assignedTask: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  notes: string;
}

const DEFAULT_WORKERS: WorkerAssignment[] = [
  {
    id: 'w1',
    workerName: 'Nhân công 1',
    workerRole: 'Thợ chính',
    assignedTask: 'Lắp đặt tủ trung tâm báo cháy & đấu nối nguồn điện dự phòng',
    status: 'IN_PROGRESS',
    notes: 'Đang đấu nối loop 1 và loop 2'
  },
  {
    id: 'w2',
    workerName: 'Nhân công 2',
    workerRole: 'Thợ kéo cáp',
    assignedTask: 'Kéo dây tín hiệu chống cháy tầng 1 đến tầng 3',
    status: 'IN_PROGRESS',
    notes: 'Đã hoàn tất luồn ống gen chống cháy tầng 1'
  },
  {
    id: 'w3',
    workerName: 'Nhân công 3',
    workerRole: 'Thợ gắn thiết bị',
    assignedTask: 'Bắt đế và lắp đặt 32 đầu báo khói quang học',
    status: 'PENDING',
    notes: 'Chờ hoàn tất kéo cáp sẽ gắn đầu báo'
  },
  {
    id: 'w4',
    workerName: 'Nhân công 4',
    workerRole: 'Thợ phụ / Nghiệm thu',
    assignedTask: 'Lắp đặt còi đèn chớp báo cháy & dọn dẹp mặt bằng thi công',
    status: 'PENDING',
    notes: 'Chuẩn bị bình xịt test khói cho buổi nghiệm thu'
  }
];

export default function ProjectInstallation() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Crew worker assignments (stored in localStorage keyed by project id)
  const [workers, setWorkers] = useState<WorkerAssignment[]>(DEFAULT_WORKERS);

  // Progress update state
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [newProgress, setNewProgress] = useState<number>(0);
  const [progressNote, setProgressNote] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Photo viewer dialog
  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [activePhotoView, setActivePhotoView] = useState<string>('');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      const savedCrew = localStorage.getItem(`crew_assignments_${selectedProject.id}`);
      if (savedCrew) {
        try {
          setWorkers(JSON.parse(savedCrew));
        } catch {
          setWorkers(DEFAULT_WORKERS);
        }
      } else {
        setWorkers(DEFAULT_WORKERS);
      }
    }
  }, [selectedProject]);

  const saveWorkersState = (newWorkers: WorkerAssignment[]) => {
    setWorkers(newWorkers);
    if (selectedProject) {
      localStorage.setItem(`crew_assignments_${selectedProject.id}`, JSON.stringify(newWorkers));
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/project');
      setProjects(res.data?.data || []);
    } catch (err) {
      console.error('Lỗi tải dự án:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async (id: string) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/project/${id}`);
      setSelectedProject(res.data?.data);
    } catch (err) {
      console.error('Lỗi chi tiết dự án:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorker = (id: string, field: keyof WorkerAssignment, value: any) => {
    const updated = workers.map(w => (w.id === id ? { ...w, [field]: value } : w));
    saveWorkersState(updated);
  };

  const handleWorkerStatusChange = (id: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'DONE') => {
    const updated = workers.map(w => (w.id === id ? { ...w, status: newStatus } : w));
    saveWorkersState(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProgress = async () => {
    if (!progressNote.trim()) {
      alert('Vui lòng nhập ghi chú hoặc nhật ký công việc hôm nay!');
      return;
    }

    try {
      setActionLoading(true);
      const photoToSend = selectedPhotoUrl || SAMPLE_FIELD_PHOTOS[0].url;

      await axiosInstance.post(`/project/${selectedProject.id}/progress`, {
        progressPercentage: Number(newProgress),
        notes: progressNote,
        imageUrl: photoToSend
      });

      setMsg({ type: 'success', text: 'Đã gửi báo cáo tiến độ và hình ảnh về Dashboard Admin thành công!' });
      setProgressDialogOpen(false);
      setProgressNote('');
      setSelectedPhotoUrl('');

      await loadProjectDetails(selectedProject.id);
      fetchProjects();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Lỗi cập nhật tiến độ' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleHandover = async () => {
    if (selectedProject.progressPercentage < 100) {
      alert('Tiến độ thi công phải đạt 100% mới có thể nghiệm thu bàn giao!');
      return;
    }
    if (!window.confirm('Xác nhận nghiệm thu công trình và bàn giao cho khách hàng?')) return;

    try {
      setActionLoading(true);
      await axiosInstance.post(`/project/${selectedProject.id}/acceptance`, {
        acceptanceRecordUrl: 'https://example.com/acceptance.pdf'
      });
      setMsg({ type: 'success', text: 'Nghiệm thu bàn giao thành công! Hệ thống đã kích hoạt thời hạn bảo hành.' });
      loadProjectDetails(selectedProject.id);
      fetchProjects();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Lỗi bàn giao' });
    } finally {
      setActionLoading(false);
    }
  };

  const { user } = useSelector((state: RootState) => state.auth);
  const isAuthorized = user?.roles?.some((r: string) =>
    ['ADMIN', 'INSTALLATION_LEADER', 'LEADER'].includes(r.toUpperCase())
  );

  if (!isAuthorized) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ p: 4, borderRadius: 3, border: '1px solid #ff9800' }}>
          <Typography variant="h5" fontWeight="bold" color="warning.main" gutterBottom>
            Khu Vực Hạn Chế Quyền Truy Cập
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Phân hệ <strong>Thi Công & Lắp Đặt</strong> chỉ dành riêng cho tài khoản <strong>Quản trị viên (Admin)</strong> và <strong>Đội trưởng lắp đặt (Installation Leader)</strong>.
          </Typography>
        </Alert>
      </Container>
    );
  }

  if (loading && !selectedProject && projects.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 5 }}>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EngineeringIcon fontSize="large" /> Phân Hệ Thi Công & Quản Lý Đội Trưởng
          </Typography>
          <Typography color="text.secondary" variant="subtitle1">
            Không gian dành riêng cho Đội trưởng: Phân công tổ thợ (Nhân công 1, 2, 3, 4) và cập nhật tiến độ kèm ảnh chụp hiện trường gửi về Admin.
          </Typography>
        </Box>
      </Box>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      {/* PROJECT LIST VIEW */}
      {!selectedProject ? (
        <Box>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Danh Sách Công Trình & Dự Án Đang Phụ Trách ({projects.length})
          </Typography>
          <Grid container spacing={3}>
            {projects.map(p => (
              <Grid item xs={12} md={6} lg={4} key={p.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(255, 61, 0, 0.15)' }
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                      <Typography variant="h6" fontWeight="bold" noWrap sx={{ maxWidth: '70%' }}>
                        {p.name}
                      </Typography>
                      <Chip
                        label={p.status === 3 ? 'Đang thi công' : p.status === 6 ? 'Đã hoàn thành' : 'Sẵn sàng'}
                        color={p.status === 3 ? 'warning' : p.status === 6 ? 'success' : 'info'}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Khách hàng: <strong>{p.customer?.companyName || 'Công trình tiêu chuẩn'}</strong>
                    </Typography>

                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" fontWeight="bold">Tiến độ thi công</Typography>
                        <Typography variant="caption" fontWeight="bold" color="primary.main">{p.progressPercentage}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={p.progressPercentage}
                        sx={{ height: 10, borderRadius: 5 }}
                        color={p.progressPercentage === 100 ? 'success' : 'primary'}
                      />
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center" pt={1}>
                      <Typography variant="caption" color="text.secondary">
                        Hạn: {new Date(p.endDate).toLocaleDateString()}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<EngineeringIcon />}
                        onClick={() => loadProjectDetails(p.id)}
                      >
                        Vào Quản Lý
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        /* PROJECT DETAIL & LEADER WORKSPACE */
        <Box>
          <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => setSelectedProject(null)}
            >
              Quay lại danh sách dự án
            </Button>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CameraAltIcon />}
                onClick={() => {
                  setNewProgress(selectedProject.progressPercentage);
                  setProgressDialogOpen(true);
                }}
              >
                Báo Cáo Tiến Độ & Ảnh
              </Button>
              {selectedProject.status !== 6 && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleHandover}
                  disabled={selectedProject.progressPercentage < 100 || actionLoading}
                >
                  Nghiệm Thu Bàn Giao
                </Button>
              )}
            </Box>
          </Box>

          {/* Project Summary Banner */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, rgba(255,61,0,0.1) 0%, rgba(33,150,243,0.05) 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={7}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {selectedProject.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chủ đầu tư: <strong>{selectedProject.customer?.companyName || 'Công trình tiêu chuẩn'}</strong> | Địa chỉ: {selectedProject.customer?.address || 'Hà Nội'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" fontWeight="bold">Tổng Tiến Độ Công Trình</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">{selectedProject.progressPercentage}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={selectedProject.progressPercentage}
                  sx={{ height: 14, borderRadius: 7 }}
                  color={selectedProject.progressPercentage === 100 ? 'success' : 'primary'}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Tabs for Workspace */}
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{ mb: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Tab icon={<GroupIcon />} iconPosition="start" label="Phân Công Tổ Thợ (Nhân Công 1, 2, 3, 4)" />
            <Tab icon={<CameraAltIcon />} iconPosition="start" label="Nhật Ký & Ảnh Báo Cáo Hiện Trường" />
          </Tabs>

          {/* TAB 0: CREW & WORKER MANAGEMENT */}
          {activeTab === 0 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Bảng Phân Công Công Việc Nhân Công Nội Bộ
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đội trưởng quản lý và giao việc trực tiếp cho các nhân công (Nhân công 1, 2, 3, 4). Dữ liệu được lưu trữ tự động trên thiết bị của đội trưởng.
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {workers.map((worker, index) => (
                  <Grid item xs={12} md={6} key={worker.id}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'background.paper',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.04)'
                      }}
                    >
                      <CardContent>
                        {/* Worker Header */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ bgcolor: index === 0 ? 'primary.main' : index === 1 ? 'secondary.main' : index === 2 ? 'warning.main' : 'info.main', fontWeight: 'bold' }}>
                              {index + 1}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {worker.workerName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {worker.workerRole}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={
                              worker.status === 'DONE'
                                ? 'Đã xong'
                                : worker.status === 'IN_PROGRESS'
                                ? 'Đang làm'
                                : 'Chưa bắt đầu'
                            }
                            color={
                              worker.status === 'DONE'
                                ? 'success'
                                : worker.status === 'IN_PROGRESS'
                                ? 'warning'
                                : 'default'
                            }
                            size="small"
                          />
                        </Box>

                        {/* Task description */}
                        <TextField
                          label="Công việc được phân công"
                          fullWidth
                          size="small"
                          value={worker.assignedTask}
                          onChange={e => handleUpdateWorker(worker.id, 'assignedTask', e.target.value)}
                          sx={{ mb: 2 }}
                        />

                        {/* Notes */}
                        <TextField
                          label="Ghi chú hiện trường của nhân công"
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                          value={worker.notes}
                          onChange={e => handleUpdateWorker(worker.id, 'notes', e.target.value)}
                          sx={{ mb: 2 }}
                        />

                        {/* Status Buttons */}
                        <Box display="flex" gap={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant={worker.status === 'PENDING' ? 'contained' : 'outlined'}
                            color="inherit"
                            startIcon={<PendingIcon />}
                            onClick={() => handleWorkerStatusChange(worker.id, 'PENDING')}
                          >
                            Chưa làm
                          </Button>
                          <Button
                            size="small"
                            variant={worker.status === 'IN_PROGRESS' ? 'contained' : 'outlined'}
                            color="warning"
                            startIcon={<StartIcon />}
                            onClick={() => handleWorkerStatusChange(worker.id, 'IN_PROGRESS')}
                          >
                            Đang làm
                          </Button>
                          <Button
                            size="small"
                            variant={worker.status === 'DONE' ? 'contained' : 'outlined'}
                            color="success"
                            startIcon={<DoneIcon />}
                            onClick={() => handleWorkerStatusChange(worker.id, 'DONE')}
                          >
                            Hoàn thành
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* TAB 1: PROGRESS LOGS & PHOTOS */}
          {activeTab === 1 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold">
                  Nhật Ký & Hình Ảnh Đã Gửi Về Admin
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CameraAltIcon />}
                  onClick={() => {
                    setNewProgress(selectedProject.progressPercentage);
                    setProgressDialogOpen(true);
                  }}
                >
                  Gửi Báo Cáo Mới
                </Button>
              </Box>

              {selectedProject.progressLogs?.length > 0 ? (
                <Grid container spacing={3}>
                  {selectedProject.progressLogs.map((log: any) => (
                    <Grid item xs={12} md={6} lg={4} key={log.id}>
                      <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {log.imageUrl && (
                          <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                            <CardMedia
                              component="img"
                              height="200"
                              image={log.imageUrl}
                              alt="Ảnh thi công"
                              sx={{ objectFit: 'cover', cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'scale(1.05)' } }}
                              onClick={() => {
                                setActivePhotoView(log.imageUrl);
                                setPhotoViewOpen(true);
                              }}
                            />
                            <Chip
                              label={`Mốc ${log.progressPercentage}%`}
                              color="primary"
                              size="small"
                              sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 'bold' }}
                            />
                          </Box>
                        )}
                        <CardContent>
                          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                            {new Date(log.createdAtUtc || log.logDateUtc || Date.now()).toLocaleString()}
                          </Typography>
                          <Typography variant="body1" fontWeight={500} mb={1}>
                            {log.notes}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Người gửi: <strong>{log.createdBy || 'Đội trưởng thi công'}</strong>
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">Chưa có ảnh hoặc báo cáo tiến độ nào được gửi cho dự án này.</Alert>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* PROGRESS UPDATE & PHOTO REPORT DIALOG */}
      <Dialog
        open={progressDialogOpen}
        onClose={() => setProgressDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Báo Cáo Tiến Độ Thi Công & Tải Ảnh Hiện Trường
        </DialogTitle>
        <DialogContent dividers>
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography fontWeight="bold">Phần trăm hoàn thành tổng thể:</Typography>
              <Typography fontWeight="bold" color="primary.main">{newProgress}%</Typography>
            </Box>
            <input
              type="range"
              min="0"
              max="100"
              value={newProgress}
              onChange={e => setNewProgress(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#ff3d00', height: '8px' }}
            />
          </Box>

          <TextField
            label="Ghi chú chi tiết nhật ký thi công trong ngày *"
            multiline
            rows={3}
            fullWidth
            value={progressNote}
            onChange={e => setProgressNote(e.target.value)}
            placeholder="Ví dụ: Đội trưởng đã cùng 4 nhân công hoàn thành đấu nối tủ trung tâm và kéo cáp tầng 2..."
            sx={{ mb: 3 }}
          />

          {/* Photo Selection / Upload */}
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Hình Ảnh Thực Địa Hiện Trường (Gửi về Dashboard Admin):
          </Typography>

          {/* Upload input */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
            >
              Chọn Ảnh Từ Thiết Bị / Camera
              <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
            </Button>
            {selectedPhotoUrl && (
              <Chip label="Đã chọn ảnh" color="success" size="small" onDelete={() => setSelectedPhotoUrl('')} />
            )}
          </Box>

          {/* Preset Photo Pickers */}
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Hoặc chọn nhanh ảnh mẫu nghiệp vụ PCCC hiện trường:
          </Typography>
          <Grid container spacing={1.5} mb={2}>
            {SAMPLE_FIELD_PHOTOS.map((photo, i) => (
              <Grid item xs={6} sm={3} key={i}>
                <Box
                  onClick={() => setSelectedPhotoUrl(photo.url)}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: selectedPhotoUrl === photo.url ? '3px solid #ff3d00' : '1px solid rgba(255,255,255,0.1)',
                    position: 'relative'
                  }}
                >
                  <img src={photo.url} alt={photo.name} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                  <Typography variant="caption" sx={{ p: 0.5, display: 'block', fontSize: 10, textAlign: 'center' }} noWrap>
                    {photo.name}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Preview selected photo */}
          {selectedPhotoUrl && (
            <Box mt={2}>
              <Typography variant="caption" fontWeight="bold" display="block" mb={0.5}>Xem trước ảnh báo cáo:</Typography>
              <img
                src={selectedPhotoUrl}
                alt="Preview"
                style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialogOpen(false)}>Hủy</Button>
          <Button
            onClick={handleUpdateProgress}
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
          >
            {actionLoading ? 'Đang gửi...' : 'Gửi Báo Cáo Về Admin'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FULL PHOTO ZOOM DIALOG */}
      <Dialog open={photoViewOpen} onClose={() => setPhotoViewOpen(false)} maxWidth="md">
        <DialogContent sx={{ p: 1 }}>
          <img src={activePhotoView} alt="Zoom" style={{ width: '100%', height: 'auto', borderRadius: 6 }} />
        </DialogContent>
      </Dialog>
    </Container>
  );
}
