import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router';

export default function CasCallbackPage() {
    const [searchParams] = useSearchParams();
    const ticket = searchParams.get('ticket');
    console.log(ticket);
    useEffect(() => {
      if (ticket) {
        // 将 ticket 发送到后端验证
        fetch(`http://localhost:8000/auth/cas-callback?ticket=${ticket}`, {
          method: 'GET',
        })
          .then(res => res.json())
          .then(data => {
            // 存储 token 或用户信息
            console.log(data);
            localStorage.setItem('token', data.token);
          });
      }
    }, [ticket]);
  
    return <div>Processing login...</div>;
  };