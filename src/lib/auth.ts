import { supabase } from './supabase';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  token: string | null;
  error: string | null;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting login for:', credentials.email);

      // Call the authenticate_user function
      const { data, error } = await supabase
        .rpc('authenticate_user', {
          p_email: credentials.email,
          p_password: credentials.password
        });

      if (error) {
        console.error('Authentication error:', error);
        return {
          user: null,
          token: null,
          error: 'Email atau password salah. Silakan periksa kembali.'
        };
      }

      if (!data || data.length === 0) {
        return {
          user: null,
          token: null,
          error: 'Email atau password salah. Silakan periksa kembali.'
        };
      }

      const authResult = data[0];
      
      const userObj: User = {
        id: authResult.user_id,
        email: authResult.email,
        full_name: authResult.full_name,
        avatar_url: null,
        role: authResult.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.user = userObj;
      this.token = authResult.token;
      localStorage.setItem('auth_token', authResult.token);
      localStorage.setItem('auth_user', JSON.stringify(userObj));

      console.log('✅ Login successful:', userObj.email, userObj.role);

      return {
        user: userObj,
        token: authResult.token,
        error: null
      };

    } catch (error) {
      console.error('❌ Login exception:', error);
      return {
        user: null,
        token: null,
        error: 'Terjadi kesalahan saat login. Silakan coba lagi.'
      };
    }
  }

  async validateSession(): Promise<User | null> {
    if (!this.token) {
      console.log('❌ No token found');
      return null;
    }

    try {
      console.log('🔍 Validating session...');

      // For demo purposes, validate using localStorage data
      const storedUser = localStorage.getItem('auth_user');
      if (!storedUser) {
        console.log('❌ No stored user data');
        this.clearAuth();
        return null;
      }

      const userData = JSON.parse(storedUser);
      
      // Verify the profile still exists in the database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Profile query error:', profileError);
        this.clearAuth();
        return null;
      }

      if (!profileData) {
        console.log('❌ Profile not found in database');
        this.clearAuth();
        return null;
      }

      const user: User = {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url,
        role: profileData.role,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at
      };

      this.user = user;
      console.log('✅ Session valid:', user.email, user.role);

      return user;

    } catch (error) {
      console.error('❌ Session validation exception:', error);
      this.clearAuth();
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('👋 Logging out...');
      
      if (this.token) {
        // Call logout function to invalidate session
        await supabase.rpc('logout_user', {
          p_token: this.token
        });
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      this.clearAuth();
      console.log('✅ Logged out successfully');
    }
  }

  private clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }
}

export const authService = new AuthService();