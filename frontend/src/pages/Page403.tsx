import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Block as BlockIcon } from '@mui/icons-material';

export default function Page403() {
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
        <BlockIcon color="error" sx={{ fontSize: 100, mb: 2 }} />
        <Typography variant="h1" fontWeight="bold" color="error" gutterBottom>
          403
        </Typography>
        <Typography variant="h5" fontWeight="semibold" gutterBottom>
          Truy cập bị từ chối
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Bạn không có quyền truy cập vào chức năng hoặc trang này. Vui lòng quay lại hoặc liên hệ quản trị viên.
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/dashboard')} size="large">
          Quay lại Trang chủ
        </Button>
      </Box>
    </Container>
  );
}
