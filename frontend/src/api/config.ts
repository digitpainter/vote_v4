import { getApiBaseUrl, getCasBaseUrl, getCasCallbackUrl } from '../utils/env';

// API基础URL
export const API_BASE_URL = getApiBaseUrl();

// CAS服务URL
export const CAS_BASE_URL = getCasBaseUrl();

// CAS回调URL
export const CAS_CALLBACK_URL = getCasCallbackUrl();

// 创建带有基础URL的完整URL
export const getFullUrl = (path: string): string => {
  // 如果路径已经是完整URL，则直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 确保路径以/开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}; 