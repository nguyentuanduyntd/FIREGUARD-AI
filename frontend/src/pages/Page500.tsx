import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { WarningAmber as WarningIcon } from '@mui/icons-material';

export default function Page500() {
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
        <WarningIcon color="warning" sx={{ fontSize: 100, mb: 2 }} />
        <Typography variant="h1" fontWeight="bold" color="warning" gutterBottom>
          500
        </Typography>
        <Typography variant="h5" fontWeight="semibold" gutterBottom>
          Lỗi hệ thống
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Đã có lỗi xảy ra từ máy chủ của chúng tôi. Vui lòng quay lại sau ít phút.
        </Typography>
        <Button variant="contained" color="warning" onClick={() => navigate('/dashboard')} size="large">
          Quay lại Trang chủ
        </Button>
      </Box>
    </Container>
  );
}
