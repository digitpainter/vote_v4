import {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {AdminType, UserRole} from '../types/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  checkAuthStatus: () => boolean;
  staffId: string | null;
  name: string | null;
  role: UserRole | null;
  token: string | null;
  adminType : AdminType | null;
  adminCollegeId: string | null;
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
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [adminType, setAdminType] = useState<AdminType | null>(null);
  const [adminCollegeId, SetAdminCollegeId] = useState<string | null>(null);
  useEffect(() => {
    // Check for existing token on mount
    console.debug(`AuthProvider 检查token`)
    console.debug(`AuthProvider 检查token ${localStorage.getItem('token')}`)
    setLoading(true);
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async () => {
    console.debug(`[API Request][${new Date().toISOString()}] 登录请求`);
    try {
      const url = `http://localhost:8001/login?service=http://localhost:5173/cas-callback`;
      window.location.href = url;
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setStaffId(null);
    setName(null);
    setAdminType(null);
    setRole(null);
    setToken(null);
    SetAdminCollegeId(null);
    localStorage.removeItem('token');  // 移除手动token存储
    const url = `http://localhost:8001/logout?service=http://localhost:5173/cas-callback`;
    window.location.href = url;
  };

  const refreshUser = async () => {
    try {
      console.debug(`[API Request][${new Date().toISOString()}] 刷新用户信息请求，token: ${localStorage.getItem('token')}`);
      const response = await fetch('http://localhost:8000/auth/users/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      });

      console.debug(`[API Response][${new Date().toISOString()}] 用户信息刷新响应状态: ${response.status}`);

      if (!response.ok) {
        throw new Error('Failed to refresh user');
      }

      const data = await response.json();
      console.debug(`[API Data][${new Date().toISOString()}] 用户信息刷新成功，staff_id: ${data.staff_id}`);
      console.debug(`[API Data][${new Date().toISOString()}] 用户信息刷新成功，data: ${data}`);
      console.debug(`[API Data][${new Date().toISOString()}] 用户信息刷新成功，data: ${data.username}`);

      setIsAuthenticated(true);
      setStaffId(data.staff_id);
      setName(data.username);
      setAdminType(data.admin_type);
      setRole(data.role);
      SetAdminCollegeId(data.college_id);
    } catch (error) {
      console.error('[API Error] 用户信息刷新错误:', error);
      logout();
    }
  };

  

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        checkAuthStatus,
        staffId,
        name,
        role,
        token,
        adminType,
        adminCollegeId,
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
