import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm">
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="100vh"
            textAlign="center"
          >
            <ErrorIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Đã xảy ra sự cố
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Hệ thống gặp lỗi không mong muốn. Vui lòng thử tải lại trang hoặc liên hệ quản trị viên.
            </Typography>
            <Button variant="contained" color="primary" onClick={this.handleReload} size="large">
              Tải lại trang
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
