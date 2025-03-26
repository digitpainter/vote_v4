import { useEffect ,useState ,useRef} from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router';

export default function CasCallbackPage() {
    console.log('cas callback page');
    const [searchParams] = useSearchParams();
    const { refreshUser } = useAuth();
    const navigate = useNavigate();
    const ticket = searchParams.get('ticket');
    const abortControllerRef = useRef<AbortController>(null);

    useEffect(() => {
      abortControllerRef.current = new AbortController();
      const {signal} = abortControllerRef.current;
      const handleLogin = async () => {
        try {
          const response = await fetch(`http://localhost:8000/auth/cas-callback?ticket=${ticket}`, {
            signal: signal,
          });
          if (!response.ok) {
            throw new Error('CAS认证失败');
          }
          const data = await response.json();
          if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            await refreshUser();
            navigate('/');
          } else {
            throw new Error('无效的令牌响应');
          }
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            localStorage.removeItem('token');
            console.error('登录失败:', error);
            navigate('/login');
          }
        } finally {
        }
      };

      handleLogin();
      return () => {if (abortControllerRef.current) {abortControllerRef.current.abort();}}
    }, [ticket]);

    return <div>处理登录中...</div>;
};