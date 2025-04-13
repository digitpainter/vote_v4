import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import { AdminLog, AdminLogQuery } from '../types/adminLog';

// API基础路径常量
const BASE_URL = 'http://localhost:8000';

/**
 * 获取管理员操作日志列表
 * @param params 查询参数
 * @returns 日志列表
 */
export const getAdminLogs = async (params: AdminLogQuery = {}): Promise<AdminLog[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/admin-logs`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      // withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('[API Error] 获取管理员日志失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取管理员日志失败: ' + message);
    }
    throw error;
  }
}; 