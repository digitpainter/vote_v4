import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

// API基础路径常量
const BASE_URL = 'http://localhost:8000';

// 类型定义
export interface VoteRecord {
  voter_id: string;
  voter_college_name: string;
}

export interface CandidateStats {
  rank: number;
  college_id?: string;
  college_name: string;
  candidate_name: string;
  vote_count: number;
}

export interface ExportResponse {
  activity: {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
  };
  export_type: string;
  data: {
    total_voters: number;
    records: VoteRecord[] | CandidateStats[];
  };
}

export interface College {
  YXDM: string;
  YXDM_TEXT: string;
}

export type ExportType = 'vote_records' | 'candidate_stats';
export type ExportFormat = 'excel' | 'csv';

/**
 * 获取活动列表
 * @returns 活动列表
 */
export const fetchActivities = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/vote/activities/`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true
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
 * 获取学院列表
 * @returns 学院列表
 */
export const fetchColleges = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/vote/colleges/`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('[API Error] 获取学院列表失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取学院列表失败: ' + message);
    }
    throw error;
  }
};

/**
 * 获取预览数据
 * @param params 请求参数
 * @returns 预览数据
 */
export const fetchPreviewData = async (params: {
  activity_id: number;
  export_type: ExportType;
  college_id?: string;
  start_date?: string;
  end_date?: string;
}) => {
  try {
    const response = await axios.get(`${BASE_URL}/vote/preview`, { 
      params,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('[API Error] 获取预览数据失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取预览数据失败: ' + message);
    }
    throw error;
  }
};

/**
 * 导出数据
 * @param params 请求参数
 * @returns 导出数据
 */
export const exportData = async (params: {
  activity_id: number;
  export_type: ExportType;
  format: ExportFormat;
  college_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<ExportResponse> => {
  try {
    const response = await axios.get<ExportResponse>(`${BASE_URL}/vote/export`, { 
      params,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('[API Error] 获取导出数据失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取导出数据失败: ' + message);
    }
    throw error;
  }
}; 