import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SentimentVeryDissatisfied as ErrorIcon } from '@mui/icons-material';

export default function Page404() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="80vh"
        textAlign="center"
      >
        <ErrorIcon color="primary" sx={{ fontSize: 100, mb: 2 }} />
        <Typography variant="h1" fontWeight="bold" color="primary" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" fontWeight="semibold" gutterBottom>
          Không tìm thấy trang
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển.
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/dashboard')} size="large">
          Quay lại Trang chủ
        </Button>
      </Box>
    </Container>
  );
}
