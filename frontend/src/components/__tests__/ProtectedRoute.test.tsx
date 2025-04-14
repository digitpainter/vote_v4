import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '../ProtectedRoute';
import * as AuthContext from '../../contexts/AuthContext';
import { MemoryRouter } from 'react-router';
import { UserRole, AdminType } from '../../types/auth';

// 模拟 AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// 模拟 react-router 的 Navigate 组件
vi.mock('react-router', () => ({
  Navigate: vi.fn().mockImplementation(({ to }) => (
    <div data-testid="navigate-mock">Navigate to: {to}</div>
  ))
}));

describe('ProtectedRoute', () => {
  it('renders loading state when authentication is loading', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      loading: true,
      checkAuthStatus: vi.fn().mockReturnValue(false),
      staffId: null,
      name: null,
      role: null,
      token: null,
      adminType: null,
      adminCollegeId: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('redirects to login page when user is not authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      loading: false,
      checkAuthStatus: vi.fn().mockReturnValue(false),
      staffId: null,
      name: null,
      role: null,
      token: null,
      adminType: null,
      adminCollegeId: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    expect(screen.getByText('Navigate to: /login')).toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      loading: false,
      checkAuthStatus: vi.fn().mockReturnValue(true),
      staffId: '123456',
      name: 'Test User',
      role: UserRole.TEACHER,
      token: 'test-token',
      adminType: null,
      adminCollegeId: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
}); 