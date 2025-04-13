import {Layout} from 'antd';

const {Footer} = Layout;

export function FooterComponent() {
  return (
    <Footer style={{
      textAlign: 'center', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      backgroundImage: 'url(/image/Footer.svg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      padding: '20px'
    }}>
      <img
        src="/image/logo.svg"
        alt="Logo"
        style={{ height: '40px', marginBottom: '10px' }}
      />
      <span style={{ color: 'white' }}>
        Copyright ©{new Date().getFullYear()} All Rights Reserved　南京航空航天大学研究生院　版权所有
      </span>
    </Footer>
  );
}