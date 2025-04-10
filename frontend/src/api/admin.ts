import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import { Admin, AdminCreate, AdminUpdate } from '../types/admin';

// API基础路径常量
const BASE_URL = 'http://localhost:8000';

/**
 * 获取所有管理员（带分页）
 * @param skip 跳过的记录数
 * @param limit 返回的记录数
 * @returns 管理员列表
 */
export const getAdmins = async (skip = 0, limit = 100): Promise<Admin[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/admin`, {
      params: { skip, limit },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('[API Error] 获取管理员列表失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取管理员列表失败: ' + message);
    }
    throw error;
  }
};

/**
 * 根据ID获取管理员信息
 * @param stuffId 管理员ID
 * @returns 管理员信息
 */
export const getAdmin = async (stuffId: string): Promise<Admin> => {
  try {
    const response = await axios.get(`${BASE_URL}/admin/${stuffId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error(`[API Error] 获取管理员(ID: ${stuffId})信息失败:`, error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error(`获取管理员信息失败: ${message}`);
    }
    throw error;
  }
};

/**
 * 创建新管理员
 * @param admin 管理员信息
 * @returns 创建的管理员信息
 */
export const createAdmin = async (admin: AdminCreate): Promise<Admin> => {
  try {
    const response = await axios.post(`${BASE_URL}/admin`, admin, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('[API Error] 创建管理员失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('创建管理员失败: ' + message);
    }
    throw error;
  }
};

/**
 * 更新管理员信息
 * @param stuffId 管理员ID
 * @param admin 更新的管理员信息
 * @returns 更新后的管理员信息
 */
export const updateAdmin = async (stuffId: string, admin: AdminUpdate): Promise<Admin> => {
  try {
    const response = await axios.put(`${BASE_URL}/admin/${stuffId}`, admin, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error(`[API Error] 更新管理员(ID: ${stuffId})失败:`, error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error(`更新管理员失败: ${message}`);
    }
    throw error;
  }
};

/**
 * 删除管理员
 * @param stuffId 管理员ID
 * @returns 是否删除成功
 */
export const deleteAdmin = async (stuffId: string): Promise<boolean> => {
  try {
    await axios.delete(`${BASE_URL}/admin/${stuffId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true
    });
    return true;
  } catch (error) {
    console.error(`[API Error] 删除管理员(ID: ${stuffId})失败:`, error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error(`删除管理员失败: ${message}`);
    }
    throw error;
  }
}; 