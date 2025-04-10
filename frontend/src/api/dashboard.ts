import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

// API基础路径常量
const BASE_URL = 'http://localhost:8000';

// 类型定义
export interface TotalStatsResponse {
  total_votes: number;
  total_activities: number;
  total_candidates: number;
  activities: Array<{
    activity_id: number;
    activity_title: string;
    is_active: boolean;
    vote_count: number;
  }>;
}

export interface DashboardStats {
  totalActivities: number;
  totalCandidates: number;
  totalVotes: number;
  activeActivities: number;
}

export interface RecentActivity {
  id: string;
  name: string;
  type: 'vote' | 'create' | 'update' | 'delete';
  time: string;
  description: string;
}

/**
 * 获取总体统计数据
 * @returns 统计数据
 */
export const fetchTotalStats = async (): Promise<TotalStatsResponse> => {
  try {
    const response = await axios.get<TotalStatsResponse>(
      `${BASE_URL}/vote/statistics/total`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error('[API Error] 获取统计数据失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取统计数据失败: ' + message);
    }
    throw error;
  }
};

/**
 * 获取最近活动数据
 * @returns 最近活动列表
 */
export const fetchRecentActivities = (): RecentActivity[] => {
  // 注意：这是模拟数据，实际项目中应替换为API调用
  return [
    { 
      id: '1', 
      name: '管理员', 
      type: 'create', 
      time: '2024-03-29 14:32:45', 
      description: '创建了新活动【2024学生会选举】' 
    },
    { 
      id: '2', 
      name: '张三', 
      type: 'vote', 
      time: '2024-03-29 13:15:22', 
      description: '在【2024学生会选举】中投票' 
    },
    { 
      id: '3', 
      name: '管理员', 
      type: 'update', 
      time: '2024-03-28 10:05:13', 
      description: '更新了活动【2024学生会选举】信息' 
    },
    { 
      id: '4', 
      name: '李四', 
      type: 'vote', 
      time: '2024-03-27 16:42:01', 
      description: '在【2024学生会选举】中投票' 
    },
    { 
      id: '5', 
      name: '管理员', 
      type: 'delete', 
      time: '2024-03-26 09:30:56', 
      description: '删除了候选人【王五】' 
    }
  ];
}; 