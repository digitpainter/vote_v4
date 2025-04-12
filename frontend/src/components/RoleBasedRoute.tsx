import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router'
import { ReactNode } from 'react'
import { UserRole, AdminType } from '../types/auth'

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiresAdmin?: boolean;
  adminTypes?: AdminType[];
}

export default function RoleBasedRoute({ 
  children, 
  allowedRoles = [], 
  requiresAdmin = false,
  adminTypes = []
}: RoleBasedRouteProps) {
  const { isAuthenticated, loading, role, adminType } = useAuth()

  if (loading) {
    return <div>加载中...</div>
  }

  // 如果未登录，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 检查访问权限
  // 如果是管理员且允许管理员访问，则允许访问
  const isAdmin = !!adminType;
  const hasAdminAccess = requiresAdmin && isAdmin;
  
  // 如果有指定管理员类型且当前管理员类型不匹配，则不允许访问
  const hasValidAdminType = adminTypes.length === 0 || (isAdmin && adminTypes.includes(adminType));
  
  // 如果有指定允许的角色且当前角色匹配，则允许访问
  const hasRoleAccess = allowedRoles.length === 0 || (role && allowedRoles.includes(role));
  
  // 如果同时指定了角色和管理员，则满足其中一个条件即可
  const hasAccess = hasAdminAccess || (hasRoleAccess && hasValidAdminType);

  if (!hasAccess) {
    return <Navigate to="/access-denied" replace />
  }

  return <>{children}</>
} 