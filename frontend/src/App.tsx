import './App.css'
import { ActivityProvider } from './contexts/ActivityContext'
import { ConfigProvider, Layout } from 'antd';
import { HeaderComponent } from './components/HeaderComponent';
import { FooterComponent } from './components/FooterComponent';
import { ContentArea } from './components/ContentArea';
import { AuthProvider } from './contexts/AuthContext';
import { Routes, Route } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import CASLoginPage from './pages/CASLoginPage'
import CasCallbackPage from './pages/CasCallbackPage';
import { SidebarController } from './components/SidebarController';
import Sidebar from './components/Sidebar';
import { useState } from 'react';

function App() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
      <Layout className='p-20px'>
        <AuthProvider>
          <ActivityProvider>
            <Routes>
              <Route path="/login" element={<CASLoginPage />} />
              <Route path="/cas-callback" element={<CasCallbackPage />} />
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
