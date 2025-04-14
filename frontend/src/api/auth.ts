import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import { API_BASE_URL, CAS_BASE_URL, CAS_CALLBACK_URL } from './config';

/**
 * 处理CAS回调并获取access token
 * @param ticket CAS认证票据
 * @returns 包含access_token的响应数据
 */
export const handleCasCallback = async (ticket: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/cas-callback`, {
      params: { ticket },
      headers: {
        'Content-Type': 'application/json'
      },
      // withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('[API Error] CAS认证失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('CAS认证失败: ' + message);
    }
    throw new Error('CAS认证失败');
  }
};

/**
 * 获取当前用户信息
 * @returns 用户信息
 */
export const fetchCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/auth/users/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      // withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('[API Error] 用户信息获取失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('用户信息获取失败: ' + message);
    }
    throw error;
  }
};

/**
 * 获取CAS登录URL
 * @returns CAS登录URL
 */
export const getCasLoginUrl = () => {
  return `${CAS_BASE_URL}/login?service=${CAS_CALLBACK_URL}`;
};

/**
 * 获取CAS登出URL
 * @returns CAS登出URL
 */
export const getCasLogoutUrl = () => {
  return `${CAS_BASE_URL}/logout`;
}; 