import { useState } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button,
  TextField, MenuItem, Chip, CircularProgress, Alert, Paper,
  Divider, List, ListItem, ListItemIcon, ListItemText, Rating
} from '@mui/material';
import {
  Build as BuildIcon,
  CheckCircle as CorrectIcon,
  Cancel as IncorrectIcon,
  Warning as WarningIcon,
  Security as SafetyIcon,
  HourglassEmpty as WaitIcon,
  EscalatorWarning as EscalateIcon,
  ThumbsUpDown as FeedbackIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

interface DiagnosisResponse {
  likelyCauses: string[];
  confidenceLevel: number;
  safetyCheckSteps: string[];
  partsToReplace: string[];
  urgencyLevel: string;
  shouldStopUsing: boolean;
  shouldEscalate: boolean;
}

export default function AIDiagnostic() {
  const [form, setForm] = useState({
    equipmentModel: 'Tủ trung tâm báo cháy FireSmart 8 kênh',
    equipmentAge: 2,
    symptoms: 'Đèn LED báo lỗi (Fault) màu vàng nhấp nháy liên tục, còi chíp trên bo mạch kêu bíp bíp mỗi 30 giây.',
    repairHistory: 'Đã thay pin dự phòng cách đây 6 tháng.',
    lastMaintenance: 'Bảo trì định kỳ vào quý 1/2026, vệ sinh bụi bo mạch.',
    errorCode: 'FAULT-LINE-02',
    imageUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [logId, setLogId] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null);
  
  // Feedback states
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    isCorrect: true,
    notes: ''
  });

  const handleDiagnose = async () => {
    setLoading(true);
    setDiagnosis(null);
    setLogId(null);
    setFeedbackSubmitted(false);
    setFeedbackForm({ isCorrect: true, notes: '' });

    try {
      const response = await axiosInstance.post('/ai/diagnosis', {
        equipmentModel: form.equipmentModel,
        equipmentAge: Number(form.equipmentAge),
        symptoms: form.symptoms,
        repairHistory: form.repairHistory,
        lastMaintenance: form.lastMaintenance,
        errorCode: form.errorCode,
        imageUrl: form.imageUrl
      });
      
      const resData = response.data;
      const logIdVal = resData?.logId || resData?.LogId || null;
      const diagVal = resData?.diagnosis || resData?.Diagnosis || resData;

      setLogId(logIdVal);
      setDiagnosis(diagVal);
    } catch (err) {
      console.error(err);
      alert('Không thể thực hiện chẩn đoán AI. Vui lòng kiểm tra lại kết nối.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (correct: boolean) => {
    if (!logId) return;
    try {
      await axiosInstance.post(`/ai/diagnosis/${logId}/feedback`, {
        isCorrect: correct,
        technicianFeedback: feedbackForm.notes
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Lỗi lưu phản hồi đánh giá.');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BuildIcon fontSize="large" /> Trợ Lý Chẩn Đoán Lỗi AI (Kỹ Thuật Viên)
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Công cụ hỗ trợ chẩn đoán nguyên nhân sự cố thiết bị PCCC, đưa ra quy trình kiểm tra an toàn và đề xuất linh kiện thay thế.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Form Pane */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#131522', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="primary.light" mb={3}>
                Thông Tin Thiết Bị Sự Cố
              </Typography>

              <Box display="flex" flexDirection="column" gap={2.5}>
                <TextField
                  select
                  fullWidth
                  label="Model thiết bị"
                  value={form.equipmentModel}
                  onChange={(e) => setForm({ ...form, equipmentModel: e.target.value })}
                >
                  <MenuItem value="Tủ trung tâm báo cháy FireSmart 8 kênh">Tủ trung tâm báo cháy FireSmart 8 kênh</MenuItem>
                  <MenuItem value="Đầu báo khói quang Horings AH-0311">Đầu báo khói quang Horings AH-0311</MenuItem>
                  <MenuItem value="Đầu báo nhiệt liên hợp không dây FireSmart">Đầu báo nhiệt liên hợp không dây FireSmart</MenuItem>
                  <MenuItem value="Máy bơm chữa cháy bù áp Pentax 2HP">Máy bơm chữa cháy bù áp Pentax 2HP</MenuItem>
                  <MenuItem value="Đầu phun Sprinkler hướng xuống Tyco 68°C">Đầu phun Sprinkler hướng xuống Tyco 68°C</MenuItem>
                  <MenuItem value="Bình chữa cháy khí CO2 Yamato 3kg">Bình chữa cháy khí CO2 Yamato 3kg</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  type="number"
                  label="Tuổi thọ hoạt động (số năm)"
                  value={form.equipmentAge}
                  onChange={(e) => setForm({ ...form, equipmentAge: Number(e.target.value) })}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Triệu chứng lỗi chi tiết"
                  placeholder="Mô tả hành vi lạ, âm thanh, rung lắc..."
                  value={form.symptoms}
                  onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                />

                <TextField
                  fullWidth
                  label="Mã lỗi hiển thị (nếu có)"
                  placeholder="VD: FAULT-LINE-02 hoặc E102"
                  value={form.errorCode}
                  onChange={(e) => setForm({ ...form, errorCode: e.target.value })}
                />

                <TextField
                  fullWidth
                  label="Lịch sử sửa chữa gần đây"
                  placeholder="VD: Đã thay pin dự phòng bo mạch"
                  value={form.repairHistory}
                  onChange={(e) => setForm({ ...form, repairHistory: e.target.value })}
                />

                <TextField
                  fullWidth
                  label="Thông tin lần bảo trì gần nhất"
                  placeholder="VD: Quét bụi bo mạch tháng trước"
                  value={form.lastMaintenance}
                  onChange={(e) => setForm({ ...form, lastMaintenance: e.target.value })}
                />

                <TextField
                  fullWidth
                  label="Đường dẫn hình ảnh chụp lỗi (nếu có)"
                  placeholder="http://..."
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />

                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleDiagnose}
                  disabled={loading}
                  sx={{
                    mt: 1,
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #ff3d00 0%, #d50000 100%)',
                    boxShadow: '0 4px 16px rgba(255, 61, 0, 0.2)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ff6d00 0%, #b71c1c 100%)'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Bắt Đầu Chẩn Đoán'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Diagnosis Pane */}
        <Grid item xs={12} md={8}>
          <Card sx={{
            backgroundColor: '#131522',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 4,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520 }}>
              {diagnosis ? (
                <Box display="flex" flexDirection="column" gap={3}>
                  
                  {/* Urgent / Warnings indicators */}
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" color="text.secondary">
                        Độ khẩn cấp sự cố:
                      </Typography>
                      <Chip
                        label={diagnosis.urgencyLevel}
                        color={
                          diagnosis.urgencyLevel === 'Rất cao' ? 'error' :
                          diagnosis.urgencyLevel === 'Cao' ? 'warning' : 'default'
                        }
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>

                    {diagnosis.shouldStopUsing && (
                      <Alert severity="error" icon={<WarningIcon />} sx={{ backgroundColor: 'rgba(211,47,47,0.15)', color: '#ff8a80', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 3 }}>
                        <strong>KHUYẾN NGHỊ AN TOÀN: NGỪNG SỬ DỤNG THIẾT BỊ NGAY LẬP TỨC.</strong> Có nguy cơ mất an toàn PCCC nghiêm trọng hoặc hỏng hóc lan truyền.
                      </Alert>
                    )}

                    {diagnosis.shouldEscalate && (
                      <Alert severity="warning" icon={<EscalateIcon />} sx={{ backgroundColor: 'rgba(245,124,0,0.15)', color: '#ffb74d', border: '1px solid rgba(245,124,0,0.3)', borderRadius: 3 }}>
                        <strong>YÊU CẦU:</strong> Chuyển tiếp sự cố này cho kỹ sư trưởng hoặc chuyên gia từ hãng sản xuất.
                      </Alert>
                    )}
                  </Box>

                  {/* Safety Policy warning */}
                  <Alert severity="info" sx={{ py: 0.5, px: 2, borderRadius: 2 }}>
                    <strong>Quy tắc nghiệp vụ:</strong> Báo cáo này chỉ mang tính tham khảo hỗ trợ kỹ thuật. Kỹ thuật viên không được tự ý báo cáo hoàn thành sửa chữa khi chưa đo đạc trực tiếp bằng thiết bị chuyên dùng.
                  </Alert>

                  {/* Likely Causes */}
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary.light" mb={1}>
                      Nguyên Nhân Có Khả Năng Nhất (Độ tin cậy: {(diagnosis.confidenceLevel * 100).toFixed(0)}%)
                    </Typography>
                    <List dense sx={{ p: 0 }}>
                      {diagnosis.likelyCauses.map((cause, idx) => (
                        <ListItem key={idx} sx={{ p: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <WarningIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                          </ListItemIcon>
                          <ListItemText primary={cause} primaryTypographyProps={{ fontSize: 13, color: 'text.secondary' }} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  {/* Safety checks */}
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary.light" mb={1} display="flex" alignItems="center" gap={1}>
                      <SafetyIcon fontSize="small" /> Quy Trình Kiểm Tra An Toàn Bắt Buộc:
                    </Typography>
                    <List dense sx={{ p: 0 }}>
                      {diagnosis.safetyCheckSteps.map((step, idx) => (
                        <ListItem key={idx} sx={{ p: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <WaitIcon sx={{ color: 'info.main', fontSize: 16 }} />
                          </ListItemIcon>
                          <ListItemText primary={`${idx + 1}. ${step}`} primaryTypographyProps={{ fontSize: 13, color: 'text.secondary' }} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  {/* Parts to replace */}
                  {diagnosis.partsToReplace?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" color="primary.light" mb={1}>
                        Linh Kiện Khuyến Nghị Thay Thế:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {diagnosis.partsToReplace.map((part, idx) => (
                          <Chip key={idx} label={part} variant="outlined" color="primary" size="small" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', my: 1 }} />

                  {/* Technician Feedback & Rating loop */}
                  <Box sx={{ p: 2.5, backgroundColor: '#1b1d30', borderRadius: 3 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom display="flex" alignItems="center" gap={1} color="primary.light">
                      <FeedbackIcon fontSize="small" /> Đánh Giá Kết Quả Chẩn Đoán (Vận hành mô hình):
                    </Typography>
                    
                    {!feedbackSubmitted ? (
                      <Box mt={2}>
                        <Typography variant="body2" color="text.secondary" mb={1.5}>
                          Khuyến nghị của AI có chính xác với sự cố thực tế không?
                        </Typography>
                        <Box display="flex" gap={2} mb={2}>
                          <Button
                            variant="outlined"
                            color="success"
                            startIcon={<CorrectIcon />}
                            onClick={() => handleFeedback(true)}
                          >
                            Chính xác (Đúng)
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<IncorrectIcon />}
                            onClick={() => handleFeedback(false)}
                          >
                            Sai lệch (Sai)
                          </Button>
                        </Box>
                        <TextField
                          fullWidth
                          size="small"
                          label="Ghi chú đánh giá của bạn (nếu có)"
                          value={feedbackForm.notes}
                          onChange={(e) => setFeedbackForm({ ...feedbackForm, notes: e.target.value })}
                        />
                      </Box>
                    ) : (
                      <Alert severity="success" sx={{ mt: 1 }}>
                        Cảm ơn đóng góp của bạn! Ý kiến phản hồi đã được lưu lại để phục vụ huấn luyện và tối ưu hóa hệ thống AI.
                      </Alert>
                    )}
                  </Box>

                </Box>
              ) : (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={2} py={8}>
                  <BuildIcon sx={{ fontSize: 80, color: 'text.disabled', opacity: 0.2 }} />
                  <Typography color="text.secondary" variant="body1" textAlign="center" maxWidth={400}>
                    Vui lòng nhập đầy đủ thông số triệu chứng kỹ thuật bên trái, sau đó bấm "Bắt Đầu Chẩn Đoán" để nhận hỗ trợ kỹ thuật từ AI.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
