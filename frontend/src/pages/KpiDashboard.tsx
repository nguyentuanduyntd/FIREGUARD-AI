// Frontend React implementation of KpiDashboard
import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, CircularProgress, Alert, Divider, IconButton
} from '@mui/material';
import {
  BarChart as KpiIcon,
  Calculate as CalcIcon,
  Edit as EditIcon,
  CheckCircle as ApproveIcon,
  TrendingUp as LeaderboardIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

interface KpiRecord {
  id: string;
  technicianId: string;
  technician: {
    fullName: string;
  };
  year: number;
  month: number;
  onTimeRate: number;
  acceptanceRate: number;
  responseTimeMinutes: number;
  completedJobs: number;
  customerRating: number;
  firstTimeFixRate: number;
  callbackCount: number;
  lateCount: number;
  complianceRate: number;
  reportQualityScore: number;
  complaintCount: number;
  rawKpiScore: number;
  adjustedScore: number;
  adjustmentValue: number;
  adjustmentReason?: string;
  adjustedBy?: string;
  adjustedAtUtc?: string;
  aiSummary?: string;
  proposedBonus: number;
  approvedBonus: number;
  adminNotes?: string;
  isApproved: boolean;
}

export default function KpiDashboard() {
  const [kpis, setKpis] = useState<KpiRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Selected KPI Detail State
  const [selectedKpi, setSelectedKpi] = useState<KpiRecord | null>(null);
  
  // Adjust Dialog State
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustValue, setAdjustValue] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Approve Dialog State
  const [approveOpen, setApproveOpen] = useState(false);
  const [approvedBonus, setApprovedBonus] = useState(0);
  const [adminNotes, setAdminNotes] = useState('');

  const fetchKpis = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/kpi');
      setKpis(res.data.data || []);
      if (selectedKpi) {
        const updated = (res.data.data || []).find((k: KpiRecord) => k.id === selectedKpi.id);
        if (updated) setSelectedKpi(updated);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const handleCalculateKpi = async () => {
    setCalcLoading(true);
    setMsg(null);
    try {
      await axiosInstance.post('/kpi/calculate');
      setMsg({ type: 'success', text: 'Đã chạy tính toán lại KPI tháng này thành công cho toàn bộ kỹ thuật viên.' });
      fetchKpis();
    } catch (error) {
      setMsg({ type: 'error', text: 'Không thể tính toán KPI.' });
    } finally {
      setCalcLoading(false);
    }
  };

  const handleAdjustSubmit = async () => {
    if (!selectedKpi) return;
    try {
      await axiosInstance.post(`/kpi/${selectedKpi.id}/adjust`, {
        adjustmentValue: adjustValue,
        reason: adjustReason
      });
      setMsg({ type: 'success', text: 'Ghi nhận điều chỉnh điểm KPI và lưu lịch sử audit thành công.' });
      setAdjustOpen(false);
      fetchKpis();
    } catch (error) {
      setMsg({ type: 'error', text: 'Điều chỉnh điểm thất bại.' });
    }
  };

  const handleApproveSubmit = async () => {
    if (!selectedKpi) return;
    try {
      await axiosInstance.post(`/kpi/${selectedKpi.id}/approve`, {
        approvedBonus: approvedBonus,
        adminNotes: adminNotes
      });
      setMsg({ type: 'success', text: 'Đã phê duyệt hoàn tất bảng đánh giá KPI tháng này.' });
      setApproveOpen(false);
      fetchKpis();
    } catch (error) {
      setMsg({ type: 'error', text: 'Phê duyệt thất bại.' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <KpiIcon fontSize="large" /> Đánh Giá Hiệu Suất KPI Kỹ Thuật Viên
        </Typography>

        <Button
          variant="contained"
          color="secondary"
          startIcon={calcLoading ? <CircularProgress size={20} color="inherit" /> : <CalcIcon />}
          onClick={handleCalculateKpi}
          disabled={calcLoading}
          sx={{ borderRadius: 3, fontWeight: 'bold' }}
        >
          Tính toán KPI tháng này
        </Button>
      </Box>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* KPI Leaderboard Table */}
        <Grid item xs={12} md={7}>
          <Card sx={{ background: '#1a202c', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Box px={3} py={2} bgcolor="rgba(255, 255, 255, 0.05)" display="flex" alignItems="center" gap={1} borderBottom="1px solid rgba(255, 255, 255, 0.1)">
              <LeaderboardIcon color="primary" />
              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#fff' }}>Bảng xếp hạng hiệu suất kỹ thuật viên</Typography>
            </Box>
            <CardContent>
              {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : kpis.length === 0 ? (
                <Box p={3} textAlign="center" color="text.secondary">
                  Chưa có dữ liệu KPI tháng này. Vui lòng click nút "Tính toán KPI".
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
                  <Table size="small">
                    <TableHead sx={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                      <TableRow>
                        <TableCell sx={{ color: '#ff7043', fontWeight: 'bold' }}>Họ & tên</TableCell>
                        <TableCell align="center" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Đơn hoàn thành</TableCell>
                        <TableCell align="center" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Điểm Raw</TableCell>
                        <TableCell align="center" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Điểm Adjusted</TableCell>
                        <TableCell align="center" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Trạng thái</TableCell>
                        <TableCell align="right" sx={{ color: '#ff7043', fontWeight: 'bold' }}>Chi tiết</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {kpis.map((k) => (
                        <TableRow 
                          key={k.id} 
                          hover 
                          selected={selectedKpi?.id === k.id}
                          sx={{ 
                            '&:hover': { background: 'rgba(255, 255, 255, 0.04)' },
                            '&.Mui-selected': { background: 'rgba(255, 61, 0, 0.15)' }
                          }}
                        >
                          <TableCell sx={{ color: '#ffffff' }}><strong>{k.technician?.fullName}</strong></TableCell>
                          <TableCell align="center" sx={{ color: '#ffffff' }}>{k.completedJobs}</TableCell>
                          <TableCell align="center" sx={{ color: '#ffffff' }}>{k.rawKpiScore}</TableCell>
                          <TableCell align="center">
                            <Chip label={k.adjustedScore} color={k.adjustedScore >= 80 ? "success" : k.adjustedScore >= 60 ? "primary" : "error"} size="small" />
                          </TableCell>
                          <TableCell align="center">
                            {k.isApproved ? <Chip label="Đã duyệt" color="success" variant="outlined" size="small" /> : <Chip label="Chờ duyệt" color="warning" variant="outlined" size="small" />}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton color="info" onClick={() => setSelectedKpi(k)}>
                              <InfoIcon />
                            </IconButton>
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

        {/* Selected KPI Detail Breakdown */}
        <Grid item xs={12} md={5}>
          {selectedKpi ? (
            <Card sx={{ p: 3, borderRadius: 3, background: '#1a202c', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                Chi Tiết KPI: {selectedKpi.technician?.fullName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }} display="block" mb={2}>
                Tháng {selectedKpi.month} / Năm {selectedKpi.year}
              </Typography>
              <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

              {/* Sub-metrics */}
              <Grid container spacing={1.5} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Tỷ lệ đi đúng giờ</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: '#ffffff' }}>{selectedKpi.onTimeRate}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Tỷ lệ nhận đơn</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: '#ffffff' }}>{selectedKpi.acceptanceRate}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Đánh giá trung bình</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: '#ffffff' }}>{selectedKpi.customerRating} / 5 ⭐</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Sửa đạt lần đầu</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: '#ffffff' }}>{selectedKpi.firstTimeFixRate}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Số lần trễ giờ</Typography>
                  <Typography variant="body2" fontWeight="bold" color="error">{selectedKpi.lateCount} lần</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Khiếu nại</Typography>
                  <Typography variant="body2" fontWeight="bold" color={selectedKpi.complaintCount > 0 ? "error" : "primary"}>{selectedKpi.complaintCount} lần</Typography>
                </Grid>
              </Grid>

              {/* AI Summary Recommendation */}
              {selectedKpi.aiSummary && (
                <Paper sx={{ p: 2.5, bgcolor: 'rgba(255, 193, 7, 0.1)', mb: 3, borderLeft: '5px solid #ffb300', border: '1px solid rgba(255, 193, 7, 0.3)', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="#ffb74d" gutterBottom>
                    Đánh giá & Khuyến nghị từ AI:
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, fontStyle: 'italic', color: '#e2e8f0' }}>
                    {selectedKpi.aiSummary}
                  </Typography>
                  <Box mt={1.5}>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }} display="block">Tiền thưởng AI đề xuất:</Typography>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                      {selectedKpi.proposedBonus.toLocaleString('vi-VN')} ₫
                    </Typography>
                  </Box>
                </Paper>
              )}

              {/* Audited Adjustments */}
              {selectedKpi.adjustmentValue !== 0 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <strong>Điều chỉnh điểm: {selectedKpi.adjustmentValue > 0 ? `+${selectedKpi.adjustmentValue}` : selectedKpi.adjustmentValue}</strong><br/>
                  Lý do: {selectedKpi.adjustmentReason}<br/>
                  Thực hiện bởi: {selectedKpi.adjustedBy} lúc {new Date(selectedKpi.adjustedAtUtc!).toLocaleString('vi-VN')}
                </Alert>
              )}

              {/* Approved info */}
              {selectedKpi.isApproved && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  <strong>Đã phê duyệt hoàn tất!</strong><br/>
                  Tiền thưởng thực lĩnh: <strong>{selectedKpi.approvedBonus.toLocaleString('vi-VN')} ₫</strong><br/>
                  Ghi chú Admin: {selectedKpi.adminNotes || 'Không có.'}
                </Alert>
              )}

              {/* Action Buttons */}
              {!selectedKpi.isApproved && (
                <Box display="flex" gap={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setAdjustValue(selectedKpi.adjustmentValue);
                      setAdjustReason(selectedKpi.adjustmentReason || '');
                      setAdjustOpen(true);
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    Điều chỉnh điểm
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<ApproveIcon />}
                    onClick={() => {
                      setApprovedBonus(Number(selectedKpi.proposedBonus));
                      setAdminNotes('');
                      setApproveOpen(true);
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    Phê duyệt
                  </Button>
                </Box>
              )}
            </Card>
          ) : (
            <Card sx={{ p: 4, textAlign: 'center', color: 'text.secondary', borderRadius: 3, background: '#1a202c', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              Chọn một kỹ thuật viên trong bảng để xem phân tích KPI chi tiết, đánh giá AI và duyệt thưởng.
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Adjust Score Dialog */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Điều chỉnh điểm KPI (Audit Trail)</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              type="number"
              fullWidth
              label="Giá trị điều chỉnh (e.g. +5 hoặc -10)"
              value={adjustValue}
              onChange={(e) => setAdjustValue(Number(e.target.value))}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Lý do điều chỉnh (Bắt buộc)"
              placeholder="VD: Tham gia hỗ trợ dập tắt đám cháy khẩn cấp ngoài ca..."
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleAdjustSubmit} disabled={!adjustReason.trim()}>
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Phê duyệt KPI & Khen thưởng</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              type="number"
              fullWidth
              label="Tiền thưởng quyết định (VND)"
              value={approvedBonus}
              onChange={(e) => setApprovedBonus(Number(e.target.value))}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Ghi chú phê duyệt"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveOpen(false)}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleApproveSubmit}>
            Xác nhận phê duyệt
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
