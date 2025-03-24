import './App.css'
import { ActivityProvider } from './contexts/ActivityContext'
import { ConfigProvider, Layout } from 'antd';
import { HeaderComponent } from './components/HeaderComponent';
import { FooterComponent } from './components/FooterComponent';
import { ContentArea } from './components/ContentArea';


function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
      <Layout className='p-20px'>
        <ActivityProvider>
          <HeaderComponent />
          <ContentArea />
          <FooterComponent />
        </ActivityProvider>
      </Layout>
    </ConfigProvider>
  )
}

export default App
