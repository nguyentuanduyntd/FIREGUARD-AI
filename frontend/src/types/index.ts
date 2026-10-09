export interface UserDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  isActive: boolean;
  roles: string[];
  permissions: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt: string;
  user?: UserDto; // Optional if sent back directly on login
}

export interface LoginRequest {
  email: string;
  password?: string;
}
