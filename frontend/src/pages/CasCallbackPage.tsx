import { useEffect ,useState ,useRef} from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router';
import { handleCasCallback } from '../api/auth';

export default function CasCallbackPage() {
    console.debug('CasCallbackPage cas callback page');
    const [searchParams] = useSearchParams();
    const { refreshUser } = useAuth();
    const navigate = useNavigate();
    const ticket = searchParams.get('ticket');
    const requestCompleted = useRef(false); // 标记请求是否完成
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController>(null);

    useEffect(() => {
      // 如果没有ticket或请求已完成，直接返回
      if (!ticket || requestCompleted.current) return;
      // 创建新的AbortController
      abortControllerRef.current = new AbortController();
      const {signal} = abortControllerRef.current;
      const handleLogin = async () => {
        try {
          const data = await handleCasCallback(ticket);
          console.debug('CasCallbackPage handleLogin data');
          console.debug(`[API Response][${new Date().toISOString()}] 登录响应 ${JSON.stringify(data)}`);
          if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            // 标记请求已完成，防止重复处理
            requestCompleted.current = true;
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
      return () => {if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
    }, [ticket]);

    return <div>处理登录中...</div>;
};