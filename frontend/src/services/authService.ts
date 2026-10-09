import axiosInstance from '../api/axiosInstance';
import { LoginRequest, TokenResponse, UserDto } from '../types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
  },

  getCurrentUser: async (token?: string): Promise<UserDto> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axiosInstance.get('/auth/me', { headers });
    return response.data.data;
  },

  refreshToken: async (): Promise<TokenResponse> => {
    const response = await axiosInstance.post('/auth/refresh', {});
    return response.data.data;
  },

  registerCustomer: async (data: { fullName: string; email: string; password: string; phoneNumber?: string; address?: string }): Promise<TokenResponse> => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data.data;
  },
};
export default authService;
