import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoleBasedRoute from '../RoleBasedRoute';
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

describe('RoleBasedRoute', () => {
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
        <RoleBasedRoute>
          <div>Protected Content</div>
        </RoleBasedRoute>
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
        <RoleBasedRoute>
          <div>Protected Content</div>
        </RoleBasedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    expect(screen.getByText('Navigate to: /login')).toBeInTheDocument();
  });

  it('renders children when user has allowed role', () => {
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
        <RoleBasedRoute allowedRoles={[UserRole.TEACHER]}>
          <div>Protected Content</div>
        </RoleBasedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to access-denied when user does not have allowed role', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      loading: false,
      checkAuthStatus: vi.fn().mockReturnValue(true),
      staffId: '123456',
      name: 'Test User',
      role: UserRole.UNDERGRADUATE,
      token: 'test-token',
      adminType: null,
      adminCollegeId: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    });

    render(
      <MemoryRouter>
        <RoleBasedRoute allowedRoles={[UserRole.TEACHER]}>
          <div>Protected Content</div>
        </RoleBasedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    expect(screen.getByText('Navigate to: /access-denied')).toBeInTheDocument();
  });

  it('renders children when user is admin and requiresAdmin is true', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      loading: false,
      checkAuthStatus: vi.fn().mockReturnValue(true),
      staffId: '123456',
      name: 'Test User',
      role: UserRole.TEACHER,
      token: 'test-token',
      adminType: AdminType.SCHOOL,
      adminCollegeId: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    });

    render(
      <MemoryRouter>
        <RoleBasedRoute requiresAdmin={true}>
          <div>Admin Content</div>
        </RoleBasedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('renders children when user has correct admin type', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      loading: false,
      checkAuthStatus: vi.fn().mockReturnValue(true),
      staffId: '123456',
      name: 'Test User',
      role: UserRole.TEACHER,
      token: 'test-token',
      adminType: AdminType.COLLEGE,
      adminCollegeId: '123',
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    });

    render(
      <MemoryRouter>
        <RoleBasedRoute adminTypes={[AdminType.COLLEGE]}>
          <div>College Admin Content</div>
        </RoleBasedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('College Admin Content')).toBeInTheDocument();
  });

  it('redirects to access-denied when user has wrong admin type', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      loading: false,
      checkAuthStatus: vi.fn().mockReturnValue(true),
      staffId: '123456',
      name: 'Test User',
      role: UserRole.TEACHER,
      token: 'test-token',
      adminType: AdminType.COLLEGE,
      adminCollegeId: '123',
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    });

    render(
      <MemoryRouter>
        <RoleBasedRoute adminTypes={[AdminType.SCHOOL]}>
          <div>School Admin Content</div>
        </RoleBasedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    expect(screen.getByText('Navigate to: /access-denied')).toBeInTheDocument();
  });
}); 