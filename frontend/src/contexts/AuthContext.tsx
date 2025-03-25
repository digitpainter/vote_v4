import {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {AdminType, UserRole} from '../types/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  checkAuthStatus: () => boolean;
  staffId: string | null;
  name: string | null;
  role: UserRole | null;
  token: string | null;
  adminType : AdminType | null;
  login: (staffId: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const checkAuthStatus = () => {
  const storedToken = localStorage.getItem('token');
  return !!storedToken;
};

export function AuthProvider({children}: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [adminType, setAdminType] = useState<AdminType | null>(null);
  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      refreshUser();
    }
  }, []);

  const login = async () => {
    try {
      console.debug(`[API Request][${new Date().toISOString()}] CAS登录请求，staffId`);
      const response = await fetch(`http://localhost:8000/auth/cas-login`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        redirect: 'follow'
      });

      console.debug(`[API Response][${new Date().toISOString()}] 登录响应状态: ${response.status}`);

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      console.debug(`[API Data][${new Date().toISOString()}] 登录成功，角色: ${data.role}, 访问令牌长度: ${data.access_token?.length}`);
      setIsAuthenticated(true);
      setStaffId(data.staff_id);
      setName(data.name);
      setRole(data.role);
      setToken(data.access_token);
      setAdminType(data.admin_type)
      localStorage.setItem('token', data.access_token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setStaffId(null);
    setName(null);
    setRole(null);
    setToken(null);
    localStorage.removeItem('token');  // 移除手动token存储
  };

  const refreshUser = async () => {
    try {
      console.debug(`[API Request][${new Date().toISOString()}] 刷新用户信息请求`);
      const response = await fetch('http://localhost:8000/auth/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      console.debug(`[API Response][${new Date().toISOString()}] 用户信息刷新响应状态: ${response.status}`);

      if (!response.ok) {
        throw new Error('Failed to refresh user');
      }

      const data = await response.json();
      console.debug(`[API Data][${new Date().toISOString()}] 用户信息刷新成功，staff_id: ${data.staff_id}`);
      setIsAuthenticated(true);
      setStaffId(data.staff_id);
      setName(data.name);
      setRole(data.role);
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
    } catch (error) {
      console.error('[API Error] 用户信息刷新错误:', error);
      logout();
    }
  };

  

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        checkAuthStatus,
        staffId,
        name,
        role,
        token,
        adminType,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
