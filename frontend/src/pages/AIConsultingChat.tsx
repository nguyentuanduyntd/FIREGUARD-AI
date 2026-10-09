import { useState, useRef, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, Grid, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, List, ListItem, ListItemIcon, ListItemText, CircularProgress,
  IconButton, Divider, Alert
} from '@mui/material';
import {
  Send as SendIcon,
  AssignmentTurnedIn as SurveyIcon,
  Psychology as RobotIcon,
  HelpOutline as QuestionIcon,
  CheckCircleOutline as CheckIcon,
  AttachMoney as MoneyIcon,
  ContactPhone as ContactIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';

interface ChatbotEquipment {
  itemCode: string;
  quantity: number;
  name?: string;
  price?: number;
}

interface ChatbotResponse {
  responseText: string;
  followupQuestions: string[];
  preliminaryRecommendations: string[];
  suggestedEquipment: ChatbotEquipment[];
  canConvertToSurvey: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  structured?: ChatbotResponse;
}

export default function AIConsultingChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là Trợ lý Ảo FireGuard AI. Tôi có thể tư vấn giải pháp và thiết bị phòng cháy chữa cháy (PCCC) cho công trình của bạn. Hãy mô tả quy mô, số tầng hoặc diện tích công trình của bạn nhé!',
      structured: {
        responseText: 'Xin chào! Tôi là Trợ lý Ảo FireGuard AI. Tôi có thể tư vấn giải pháp và thiết bị phòng cháy chữa cháy (PCCC) cho công trình của bạn. Hãy mô tả quy mô, số tầng hoặc diện tích công trình của bạn nhé!',
        followupQuestions: [
          'Tôi có nhà 3 tầng, diện tích 80 mét vuông mỗi tầng.',
          'Tư vấn trang bị PCCC cho nhà kho chứa vật liệu dễ cháy.',
          'Quy định lắp đặt đầu báo khói độc lập cho hộ gia đình.'
        ],
        preliminaryRecommendations: [],
        suggestedEquipment: [],
        canConvertToSurvey: false
      }
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dialog State
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [surveyForm, setSurveyForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 16)
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Build conversation history for API
      const apiHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await axiosInstance.post('/ai/chat', {
        message: textToSend,
        history: apiHistory
      });

      const data: ChatbotResponse = response.data;
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.responseText,
        structured: data
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Rất tiếc, đã có lỗi kết nối đến máy chủ AI. Vui lòng thử lại sau giây lát!',
        structured: {
          responseText: 'Rất tiếc, đã có lỗi kết nối đến máy chủ AI. Vui lòng thử lại sau giây lát!',
          followupQuestions: [],
          preliminaryRecommendations: [],
          suggestedEquipment: [],
          canConvertToSurvey: false
        }
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSurvey = () => {
    setSurveyOpen(true);
  };

  const submitSurveyBooking = async () => {
    // Simulate booking save & log message
    setSurveyOpen(false);
    setSuccessOpen(true);

    // Append system message confirmation to chat
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `🎉 Đã đăng ký lịch khảo sát thực tế thành công!\n- Khách hàng: ${surveyForm.customerName}\n- Địa điểm: ${surveyForm.address}\n- Thời gian: ${new Date(surveyForm.scheduledDate).toLocaleString('vi-VN')}\nKỹ thuật viên của FireGuard AI sẽ liên hệ hỗ trợ bạn qua số điện thoại: ${surveyForm.phone}.`,
    }]);
  };

  // Get the latest structured response to render in the right-side dashboard
  const latestStructured = [...messages].reverse().find(m => m.role === 'assistant' && m.structured)?.structured;

  // Calculate totals
  const totalCost = latestStructured?.suggestedEquipment?.reduce((sum, item) => {
    return sum + (item.quantity * (item.price || 0));
  }, 0) || 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <RobotIcon fontSize="large" /> Tư Vấn Thiết Kế PCCC Bằng AI
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Trợ lý AI giúp thiết kế hệ thống báo cháy, đề xuất thiết bị và tính toán giá dự kiến.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ height: 'calc(100vh - 200px)', minHeight: 650 }}>
        {/* Chat Stream (Left Pane) */}
        <Grid item xs={12} md={7} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Card sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#131522',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            {/* Header info */}
            <Box px={3} py={2} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#4caf50', display: 'inline-block' }} />
              <Typography variant="subtitle2" fontWeight="bold">FireGuard AI Consultant</Typography>
            </Box>

            {/* Messages body */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <Box
                    key={index}
                    sx={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Paper sx={{
                      px: 2.5,
                      py: 1.5,
                      borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      background: isUser
                        ? 'linear-gradient(135deg, #ff3d00 0%, #c30000 100%)'
                        : '#1e293b',
                      color: '#ffffff',
                      boxShadow: isUser ? '0 4px 16px rgba(255,61,0,0.2)' : 'none',
                      whiteSpace: 'pre-line'
                    }}>
                      <Typography variant="body1" sx={{ lineHeight: 1.6 }}>{msg.content}</Typography>
                    </Paper>
                    
                    {/* Follow-up question suggestion chips inside chat */}
                    {!isUser && msg.structured && msg.structured.followupQuestions?.length > 0 && (
                      <Box mt={1.5} display="flex" flexWrap="wrap" gap={1}>
                        {msg.structured.followupQuestions.map((q, qIdx) => (
                          <Chip
                            key={qIdx}
                            label={q}
                            onClick={() => handleSend(q)}
                            icon={<QuestionIcon fontSize="small" />}
                            sx={{
                              backgroundColor: 'rgba(255,255,255,0.03)',
                              color: 'primary.light',
                              border: '1px solid rgba(255, 61, 0, 0.2)',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 61, 0, 0.1)',
                                borderColor: 'primary.main'
                              },
                              py: 2,
                              px: 1,
                              borderRadius: 2
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                );
              })}
              {loading && (
                <Box display="flex" alignItems="center" gap={2} sx={{ alignSelf: 'flex-start' }}>
                  <Paper sx={{ px: 3, py: 1.5, borderRadius: '20px 20px 20px 4px', background: '#1e293b' }}>
                    <CircularProgress size={20} color="primary" />
                  </Paper>
                </Box>
              )}
              <div ref={chatEndRef} />
            </Box>

            {/* Input area */}
            <Box px={3} py={2} sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#0f111a' }}>
              <Box display="flex" gap={1.5}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Nhập câu trả lời hoặc câu hỏi của bạn..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1b1d30',
                      borderRadius: 3,
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: '#fff',
                      '& fieldset': { border: 'none' },
                      '&:hover fieldset': { border: 'none' },
                      '&.Mui-focused fieldset': { border: 'none' }
                    }
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={() => handleSend(inputText)}
                  disabled={!inputText.trim() || loading}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: '#fff',
                    borderRadius: 3,
                    width: 52,
                    height: 52,
                    '&:hover': { backgroundColor: 'primary.dark' },
                    '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Consulting Dashboard (Right Pane) */}
        <Grid item xs={12} md={5} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Card sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#131522',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 4,
            p: 3,
            overflowY: 'auto'
          }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom color="primary.light">
              Bảng Đề Xuất PCCC Chi Tiết
            </Typography>
            <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

            {latestStructured ? (
              <Box display="flex" flexDirection="column" gap={3} sx={{ height: '100%' }}>
                {/* Recommendations */}
                {latestStructured.preliminaryRecommendations?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="warning.main" display="flex" alignItems="center" gap={1}>
                      <CheckIcon fontSize="small" /> Khuyến Nghị Sơ Bộ:
                    </Typography>
                    <List dense sx={{ p: 0 }}>
                      {latestStructured.preliminaryRecommendations.map((rec, rIdx) => (
                        <ListItem key={rIdx} sx={{ p: 0, py: 0.5, alignItems: 'flex-start' }}>
                          <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                            <CheckIcon sx={{ color: 'success.main', fontSize: 16 }} />
                          </ListItemIcon>
                          <ListItemText primary={rec} primaryTypographyProps={{ fontSize: 13, color: 'text.secondary' }} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Equipment Table */}
                {latestStructured.suggestedEquipment?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary.light" display="flex" alignItems="center" gap={1}>
                      <MoneyIcon fontSize="small" /> Danh Mục Thiết Bị Đề Xuất & Báo Giá:
                    </Typography>
                    <TableContainer component={Paper} sx={{ backgroundColor: '#1b1d30', borderRadius: 3, mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ borderBottom: '2px solid rgba(255,255,255,0.05)' }}>
                            <TableCell sx={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Thiết bị</TableCell>
                            <TableCell align="center" sx={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>SL</TableCell>
                            <TableCell align="right" sx={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Đơn giá</TableCell>
                            <TableCell align="right" sx={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Tổng</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {latestStructured.suggestedEquipment.map((item, idx) => {
                            const price = item.price || 0;
                            const total = item.quantity * price;
                            return (
                              <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 }, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
                                  <strong>{item.itemCode}</strong>
                                  <Box fontSize={10} color="text.disabled">{item.name || 'Đang tải...'}</Box>
                                </TableCell>
                                <TableCell align="center" sx={{ color: 'text.secondary', fontSize: 12 }}>{item.quantity}</TableCell>
                                <TableCell align="right" sx={{ color: 'text.secondary', fontSize: 12 }}>
                                  {price > 0 ? `${price.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}
                                </TableCell>
                                <TableCell align="right" sx={{ color: 'text.primary', fontSize: 12, fontWeight: 'bold' }}>
                                  {total > 0 ? `${total.toLocaleString('vi-VN')} ₫` : '—'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow sx={{ backgroundColor: 'rgba(255,61,0,0.05)' }}>
                            <TableCell colSpan={3} sx={{ color: 'primary.light', fontSize: 12, fontWeight: 'bold' }}>
                              Tổng giá trị ước tính:
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'primary.main', fontSize: 13, fontWeight: 'bold' }}>
                              {totalCost.toLocaleString('vi-VN')} ₫
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                      * Lưu ý: Giá trị trên chỉ mang tính chất dự toán sơ bộ dựa trên mô tả nhanh.
                    </Typography>
                  </Box>
                )}

                {/* Survey Booking CTA */}
                {latestStructured.canConvertToSurvey && (
                  <Box mt="auto" pt={2}>
                    <Alert severity="info" sx={{ mb: 2, backgroundColor: 'rgba(2,136,209,0.08)', color: 'info.light', border: '1px solid rgba(2,136,209,0.2)' }}>
                      Mô hình AI đã thiết lập đủ thông số cơ bản. Hãy đăng ký khảo sát thực tế để nhận hồ sơ thiết kế chính xác và có hiệu lực pháp lý.
                    </Alert>
                    <Button
                      fullWidth
                      variant="contained"
                      color="warning"
                      size="large"
                      startIcon={<SurveyIcon />}
                      onClick={handleBookSurvey}
                      sx={{
                        borderRadius: 3,
                        py: 1.5,
                        fontWeight: 'bold',
                        fontSize: 15,
                        background: 'linear-gradient(135deg, #ff9100 0%, #ff3d00 100%)',
                        boxShadow: '0 4px 20px rgba(255, 61, 0, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #ffab40 0%, #ff6d00 100%)'
                        }
                      }}
                    >
                      Đăng Ký Khảo Sát Thực Tế
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={2} py={8}>
                <RobotIcon sx={{ fontSize: 60, color: 'text.disabled', opacity: 0.3 }} />
                <Typography color="text.secondary" variant="body2" textAlign="center" maxWidth={280}>
                  Hãy trò chuyện với AI, mô tả về diện tích, số tầng hoặc loại công trình để hiển thị bảng đề xuất thiết bị chi tiết tại đây.
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Booking Form Dialog */}
      <Dialog open={surveyOpen} onClose={() => setSurveyOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Lên lịch khảo sát công trình</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              fullWidth
              label="Tên khách hàng / Đơn vị"
              placeholder="VD: Nguyễn Văn A"
              value={surveyForm.customerName}
              onChange={(e) => setSurveyForm({ ...surveyForm, customerName: e.target.value })}
              InputProps={{ startAdornment: <ContactIcon color="disabled" sx={{ mr: 1 }} /> }}
            />
            <TextField
              fullWidth
              label="Số điện thoại liên hệ"
              placeholder="VD: 0987xxxxxx"
              value={surveyForm.phone}
              onChange={(e) => setSurveyForm({ ...surveyForm, phone: e.target.value })}
            />
            <TextField
              fullWidth
              label="Địa chỉ khảo sát"
              placeholder="Số nhà, ngõ/ngách, Quận/Huyện, Tỉnh thành"
              value={surveyForm.address}
              onChange={(e) => setSurveyForm({ ...surveyForm, address: e.target.value })}
            />
            <TextField
              fullWidth
              label="Ngày & giờ dự kiến"
              type="datetime-local"
              value={surveyForm.scheduledDate}
              onChange={(e) => setSurveyForm({ ...surveyForm, scheduledDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSurveyOpen(false)}>Hủy bỏ</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!surveyForm.customerName || !surveyForm.phone || !surveyForm.address}
            onClick={submitSurveyBooking}
          >
            Xác nhận đặt lịch
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Alert Dialog */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main', fontWeight: 'bold' }}>
          <CheckIcon /> Đăng ký thành công!
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Lịch khảo sát thực tế đã được gửi thành công đến bộ phận Kinh doanh. Chúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất để xác nhận.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessOpen(false)} autoFocus>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
