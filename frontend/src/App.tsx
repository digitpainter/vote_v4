import './App.css'
import { ActivityProvider } from './contexts/ActivityContext'
import { ConfigProvider, Layout } from 'antd';
import { HeaderComponent } from './components/HeaderComponent';
import { FooterComponent } from './components/FooterComponent';
import { ContentArea } from './components/ContentArea';
import { AuthProvider } from './contexts/AuthContext';
import { Routes, Route } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import CASLoginPage from './pages/CASLoginPage'
import CasCallbackPage from './pages/CasCallbackPage';
import StatsPage from './pages/StatsPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import { SidebarController } from './components/SidebarController';
import { UserRole, AdminType } from './types/auth';

// 导入管理后台页面
import AdminLayout from './pages/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import ActivitiesPage from './pages/admin/ActivitiesPage';
import CandidatesPage from './pages/admin/CandidatesPage';
import DataPage from './pages/admin/DataPage';
import AdminsPage from './pages/admin/AdminsPage';

function App() {


  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
      <Layout className='p-20px'>
        <AuthProvider>
          <ActivityProvider>
            <Routes>
              <Route path="/login" element={<CASLoginPage />} />
              <Route path="/cas-callback" element={<CasCallbackPage />} />
              <Route path="/access-denied" element={<AccessDeniedPage />} />
              <Route path="/stats" element={
                <RoleBasedRoute 
                  allowedRoles={[UserRole.TEACHER]} 
                  requiresAdmin={true}
                >
                  <StatsPage />
                </RoleBasedRoute>
              } />
              
              {/* 管理后台路由 */}
              <Route path="/admin" element={
                <RoleBasedRoute requiresAdmin={true}>
                  <AdminLayout />
                </RoleBasedRoute>
              }>
                <Route index element={<DashboardPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="activities" element={<ActivitiesPage />} />
                <Route path="candidates" element={<CandidatesPage />} />
                <Route path="data" element={<DataPage />} />
                <Route path="admins" element={<AdminsPage />} />
              </Route>
              
              <Route path="/" element={
                <ProtectedRoute>
                  <HeaderComponent />
                  <ContentArea />
                  <FooterComponent />
                </ProtectedRoute>
              } />
            </Routes>
          </ActivityProvider>
          <SidebarController />
        </AuthProvider>
      </Layout>
    </ConfigProvider>
  )
}

export default App
