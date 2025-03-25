import './App.css'
import { ActivityProvider } from './contexts/ActivityContext'
import { ConfigProvider, Layout } from 'antd';
import { HeaderComponent } from './components/HeaderComponent';
import { FooterComponent } from './components/FooterComponent';
import { ContentArea } from './components/ContentArea';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
      <Layout className='p-20px'>
        <ActivityProvider>
          <AuthProvider>
          <HeaderComponent />
          <ContentArea />
          <FooterComponent />
          </AuthProvider>
        </ActivityProvider>
      </Layout>
    </ConfigProvider>
  )
}

export default App
