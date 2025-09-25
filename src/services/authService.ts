import { apiClient } from './api';
import { LoginForm, RegisterForm, User, ApiResponse } from '@/types';

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

interface RefreshResponse {
  token: string;
  refreshToken: string;
}

class AuthService {
  async login(credentials: LoginForm): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'ログインに失敗しました');
    }

    return response.data;
  }

  async register(userData: RegisterForm): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      acceptTerms: userData.acceptTerms,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'アカウント作成に失敗しました');
    }

    return response.data;
  }

  async logout(token: string): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      // Ignore logout errors, we'll clear local storage anyway
      console.warn('Logout request failed:', error);
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    const response = await apiClient.post<RefreshResponse>('/auth/refresh', {
      refreshToken,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'トークンの更新に失敗しました');
    }

    return response.data;
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.success;
    } catch (error) {
      return false;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const response = await apiClient.post('/auth/reset-password', {
      email,
    });

    if (!response.success) {
      throw new Error(response.error || 'パスワードリセットの送信に失敗しました');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await apiClient.post('/auth/reset-password/confirm', {
      token,
      newPassword,
    });

    if (!response.success) {
      throw new Error(response.error || 'パスワードリセットに失敗しました');
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });

    if (!response.success) {
      throw new Error(response.error || 'パスワード変更に失敗しました');
    }
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>('/auth/profile', profileData);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'プロフィール更新に失敗しました');
    }

    return response.data;
  }

  async deleteAccount(): Promise<void> {
    const response = await apiClient.delete('/auth/account');

    if (!response.success) {
      throw new Error(response.error || 'アカウント削除に失敗しました');
    }
  }
}

export const authService = new AuthService();