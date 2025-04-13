import { AxiosResponse } from 'axios';

// API基础路径常量
export const API_BASE_URL = 'http://localhost:8000';

/**
 * 处理API错误
 * @param statusCode HTTP状态码
 * @param responseData 响应数据
 * @returns 错误消息
 */
export const handleApiError = (statusCode: number, responseData: any): string => {
  switch (statusCode) {
    case 400:
      return responseData.detail || '请求参数有误';
    case 401:
      return '未授权，请重新登录';
    case 403:
      return '权限不足';
    case 404:
      return '请求的资源不存在';
    case 500:
      return '服务器内部错误';
    default:
      return '未知错误';
  }
}; 