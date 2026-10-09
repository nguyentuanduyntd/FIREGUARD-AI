import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

import { ToastProvider } from './hooks/useToast.tsx';
import { SignalRProvider } from './hooks/useSignalR.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// A sleek modern dark/light themed UI
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff3d00', // Vibrant fire red
    },
    secondary: {
      main: '#00e5ff', // Cyan accent
    },
    background: {
      default: 'transparent',
      paper: 'rgba(21, 24, 36, 0.8)',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#050508',
          backgroundImage: `
            radial-gradient(circle at 15% 50%, rgba(255, 61, 0, 0.12) 0%, transparent 40%),
            radial-gradient(circle at 85% 30%, rgba(0, 229, 255, 0.12) 0%, transparent 40%),
            radial-gradient(circle at 50% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.02) 0%, transparent 60%)
          `,
          backgroundAttachment: 'fixed',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 15s ease infinite',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(12px)',
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToastProvider>
            <SignalRProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </SignalRProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
