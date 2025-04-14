import axios from 'axios';
import { Activity, VoteTrendData } from '../types/activity';
import { handleApiError } from '../utils/errorHandler';
import { API_BASE_URL } from './config';

/**
 * 获取所有活动
 * @returns 活动列表
 */
export const getAllActivities = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/vote/activities/`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      // withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error] 获取活动列表失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取活动列表失败: ' + message);
    }
    throw error;
  }
};

/**
 * 修改活动
 * @param activityId 活动ID
 * @param activityData 活动数据
 * @returns 更新后的活动
 */
export const updateActivity = async (activityId: number, activityData: any) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/vote/activities/${activityId}`, activityData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error] 更新活动失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('更新活动失败: ' + message);
    }
    throw error;
  }
};

/**
 * 创建活动
 * @param activityData 活动数据
 * @returns 创建的活动
 */
export const createActivity = async (activityData: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/vote/activities/`, activityData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error] 创建活动失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('创建活动失败: ' + message);
    }
    throw error;
  }
};

/**
 * 删除活动
 * @param activityId 活动ID
 * @returns 是否删除成功
 */
export const deleteActivity = async (activityId: number) => {
  try {
    await axios.delete(`${API_BASE_URL}/vote/activities/${activityId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return true;
  } catch (error) {
    console.error('[API Error] 删除活动失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('删除活动失败: ' + message);
    }
    throw error;
  }
};

/**
 * 获取所有候选人
 * @returns 候选人列表
 */
export const getAllCandidates = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/vote/candidates/batch`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error] 获取候选人列表失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取候选人列表失败: ' + message);
    }
    throw error;
  }
};

/**
 * 获取特定候选人
 * @param candidateIds 候选人ID数组
 * @returns 候选人信息
 */
export const getCandidatesByIds = async (candidateIds: number[]) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/vote/candidates/batch`, {
      params: { 
        candidate_ids: candidateIds.map(id => id.toString())
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error] 获取候选人详情失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取候选人详情失败: ' + message);
    }
    throw error;
  }
};

/**
 * 更新候选人信息
 * @param candidateId 候选人ID
 * @param candidateData 候选人数据
 * @returns 更新后的候选人信息
 */
export const updateCandidate = async (candidateId: number, candidateData: any) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/vote/candidates/${candidateId}`, candidateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error] 更新候选人失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('更新候选人失败: ' + message);
    }
    throw error;
  }
};

/**
 * 上传候选人图片
 * @param candidateId 候选人ID
 * @param imageFile 图片文件
 * @returns 上传结果
 */
export const uploadCandidateImage = async (candidateId: number, imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const response = await axios.post(`${API_BASE_URL}/vote/candidates/${candidateId}/upload-image`, formData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error] 上传候选人图片失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('上传候选人图片失败: ' + message);
    }
    throw error;
  }
};

/**
 * 提交投票
 * @param activityId 活动ID
 * @param candidateIds 候选人ID数组
 * @returns 投票结果
 */
export const submitVotes = async (activityId: Activity['id'], candidateIds: string[]) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/vote/vote/batch`, null, {
      params: {
        activity_id: activityId.toString(),
        candidate_ids: candidateIds
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error] 提交投票失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('提交投票失败: ' + message);
    }
    throw error;
  }
};

/**
 * 获取活动投票情况
 * @param activityId 活动ID
 * @returns 投票情况
 */
export const getActivityVotes = async (activityId: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/vote/activities/${activityId}/my-votes`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error] 获取活动投票情况失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取活动投票情况失败: ' + message);
    }
    throw error;
  }
};

/**
 * 获取活动统计数据
 * @returns 统计数据
 */
export const getActiveStatistics = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/vote/active-statistics`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error] 获取活动统计数据失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取活动统计数据失败: ' + message);
    }
    throw error;
  }
};

/**
 * 获取投票趋势数据
 * @returns 投票趋势数据
 */
export const getVoteTrends = async (): Promise<VoteTrendData> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/vote/vote-trends`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error] 获取投票趋势数据失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取投票趋势数据失败: ' + message);
    }
    throw error;
  }
};

/**
 * 从活动中移除候选人
 * @param activityId 活动ID
 * @param candidateId 候选人ID
 * @returns 是否移除成功
 */
export const removeCandidateFromActivity = async (activityId: number, candidateId: number) => {
  try {
    await axios.delete(`${API_BASE_URL}/vote/activities/${activityId}/candidates/${candidateId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return true;
  } catch (error) {
    console.error('[API Error] 从活动中移除候选人失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('从活动中移除候选人失败: ' + message);
    }
    throw error;
  }
};

/**
 * 上传图片
 * @param file 图片文件
 * @returns 图片URL
 */
export const uploadImage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_BASE_URL}/vote/upload-image/`, formData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return response.data.image_url;
  } catch (error) {
    console.error('[API Error] 上传图片失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('上传图片失败: ' + message);
    }
    throw error;
  }
};

/**
 * 创建候选人
 * @param candidateData 候选人数据
 * @returns 创建的候选人信息
 */
export const createCandidate = async (candidateData: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/vote/candidates/`, candidateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error] 创建候选人失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('创建候选人失败: ' + message);
    }
    throw error;
  }
};

/**
 * 删除候选人
 * @param candidateId 候选人ID
 * @returns 是否删除成功
 */
export const deleteCandidate = async (candidateId: number) => {
  try {
    await axios.delete(`${API_BASE_URL}/vote/candidates/${candidateId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      //withCredentials: true
    });
    
    return true;
  } catch (error) {
    console.error('[API Error] 删除候选人失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('删除候选人失败: ' + message);
    }
    throw error;
  }
};