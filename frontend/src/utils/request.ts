import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { notification } from 'antd';

interface BackendErrorResponse {
  detail?: string;
  code?: number;
}

const instance = axios.create({
  baseURL: "localhost:5173",
  timeout: 10000,
  withCredentials: true
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<BackendErrorResponse>) => {
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.detail || '请求处理失败，请稍后重试';
      
      notification.error({
        message: `请求错误 (${status})`,
        description: errorMessage,
        duration: 4.5
      });

    //   if (status === 401) {
    //     localStorage.removeItem('access_token');
    //     window.location.href = '/login';
    //   }
    } else if (error.request) {
      notification.error({
        message: '网络错误',
        description: '无法连接到服务器，请检查网络连接',
        duration: 4.5
      });
    } else {
      notification.error({
        message: '未知错误',
        description: '发生意外错误，请联系管理员',
        duration: 4.5
      });
    }
    return Promise.reject(error);
  }
);

export default instance;