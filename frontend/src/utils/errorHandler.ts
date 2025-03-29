import { notification } from 'antd';

export function handleApiError(status: number, message: any) {
  notification.error({
    message: status ? `服务器错误 ${status}` : '服务器错误',
    description: typeof message === 'string' ? message : JSON.stringify(message),
    showProgress: true,
    pauseOnHover: true,
    placement: 'topLeft',
    onClose:() => {
      if (status === 401) {
        window.location.href = '/login';
      }
    }
  });
  return  typeof message === 'string' ? message : JSON.stringify(message);
};