import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '../types/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  staffId: string | null;
  name: string | null;
  role: UserRole | null;
  token: string | null;
  login: (staffId: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      refreshUser();
    }
  }, []);

  const login = async (staffId: string) => {
    try {
      const response = await fetch('http://localhost:8000/cas-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ staff_id: staffId }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setIsAuthenticated(true);
      setStaffId(data.staff_id);
      setName(data.name);
      setRole(data.role);
      setToken(data.access_token);
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
    localStorage.removeItem('token');
  };

  const refreshUser = async () => {
    try {
      const response = await fetch('http://localhost:8000/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh user');
      }

      const data = await response.json();
      setIsAuthenticated(true);
      setStaffId(data.staff_id);
      setName(data.name);
      setRole(data.role);
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
    } catch (error) {
      console.error('Refresh error:', error);
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        staffId,
        name,
        role,
        token,
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