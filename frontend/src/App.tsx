import './App.css'
import { ActivityProvider } from './contexts/ActivityContext'
import { ConfigProvider, Layout } from 'antd';
import { HeaderComponent } from './components/HeaderComponent';
import { FooterComponent } from './components/FooterComponent';
import { ContentArea } from './components/ContentArea';
import { AuthProvider } from './contexts/AuthContext';
import { Routes, Route } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import CASLoginPage from './pages/CASLoginPage';

function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
      <Layout className='p-20px'>
        <AuthProvider>
          <ActivityProvider>
            <Routes>
              <Route path="/login" element={<CASLoginPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <HeaderComponent />
                  <ContentArea />
                  <FooterComponent />
                </ProtectedRoute>
              } />
            </Routes>
          </ActivityProvider>
        </AuthProvider>
      </Layout>
    </ConfigProvider>
  )
}

export default App
