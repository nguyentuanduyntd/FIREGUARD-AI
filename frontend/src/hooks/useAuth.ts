import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setCredentials, clearCredentials, setLoading } from '../store/authSlice';
import authService from '../services/authService';
import { LoginRequest } from '../types';

export function useAuth() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  const login = async (credentials: LoginRequest) => {
    dispatch(setLoading(true));
    try {
      // Step 1: Call API to log in
      const tokenData = await authService.login(credentials);
      
      // Step 2: Get user info from /auth/me with explicit access token
      const profile = await authService.getCurrentUser(tokenData.accessToken);

      // Step 3: Save in Redux
      dispatch(
        setCredentials({
          user: profile,
          accessToken: tokenData.accessToken,
        })
      );
      return { success: true, user: profile };
    } catch (error: any) {
      dispatch(clearCredentials());
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const logout = async () => {
    dispatch(setLoading(true));
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(clearCredentials());
    }
  };

  const checkSession = async () => {
    dispatch(setLoading(true));
    try {
      // Step 1: Try rotating refresh token from HttpOnly cookie
      const tokenData = await authService.refreshToken();

      // Step 2: Get current user profile
      const profile = await authService.getCurrentUser();

      dispatch(
        setCredentials({
          user: profile,
          accessToken: tokenData.accessToken,
        })
      );
    } catch (error) {
      // Refresh token expired or absent: clear session silently
      dispatch(clearCredentials());
    } finally {
      dispatch(setLoading(false));
    }
  };

  const registerCustomer = async (data: { fullName: string; email: string; password: string; phoneNumber?: string; address?: string }) => {
    dispatch(setLoading(true));
    try {
      const tokenData = await authService.registerCustomer(data);
      if (tokenData?.accessToken) {
        const profile = await authService.getCurrentUser(tokenData.accessToken);
        dispatch(
          setCredentials({
            user: profile,
            accessToken: tokenData.accessToken,
          })
        );
        return { success: true, user: profile };
      }
      return { success: true, user: null };
    } catch (error: any) {
      dispatch(clearCredentials());
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkSession,
    registerCustomer,
  };
}
export default useAuth;
