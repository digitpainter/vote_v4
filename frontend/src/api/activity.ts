import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import { Activity } from '../types/activity';
import { Candidate } from '../types/candidate';
import { API_BASE_URL } from './config';

/**
 * 获取当前活跃的活动列表
 * @returns 活跃活动列表
 */
export const fetchActiveActivities = async (): Promise<Activity[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/vote/activities/active/`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });

    return response.data;
  } catch (error) {
    console.error('[API Error] 获取活跃活动列表失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取活跃活动列表失败: ' + message);
    }
    throw error;
  }
};

/**
 * 批量获取候选人信息
 * @param candidateIds 候选人ID数组
 * @returns 候选人信息数组
 */
export const fetchCandidatesByIds = async (candidateIds: string[]): Promise<Candidate[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/vote/candidates/batch/`, {
      params: {
        candidate_ids: candidateIds
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });

    const candidatesData = response.data;
    
    // 根据candidateIds的顺序重新排列candidatesData
    const orderedCandidatesData = candidateIds.map(id => {
      return candidatesData.find((candidate: any) => candidate.id.toString() === id.toString());
    }).filter(Boolean);
    
    return orderedCandidatesData;
  } catch (error) {
    console.error('[API Error] 获取候选人信息失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      const message = handleApiError(error.response.status, error.response.data);
      throw new Error('获取候选人信息失败: ' + message);
    }
    throw error;
  }
}; 