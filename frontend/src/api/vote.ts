import { Activity, VoteTrendData } from '../types/activity';
import { handleApiError } from '../utils/errorHandler';

// 获取所有活动
export async function getAllActivities() {
  try {
    const response = await fetch('http://localhost:8000/vote/activities/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      const message = handleApiError(response.status, await response.json());
      throw new Error('获取活动列表失败: ' + message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[API Error] 获取活动列表错误:', error);
    throw error;
  }
}

// 修改活动
export async function updateActivity(activityId: number, activityData: any) {
  try {
    const response = await fetch(`http://localhost:8000/vote/activities/${activityId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(activityData),
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      const message = handleApiError(response.status, await response.json());
      throw new Error('更新活动失败: ' + message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[API Error] 更新活动错误:', error);
    throw error;
  }
}

// 创建活动
export async function createActivity(activityData: any) {
  try {
    const response = await fetch('http://localhost:8000/vote/activities/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(activityData),
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      const message = handleApiError(response.status, await response.json());
      throw new Error('创建活动失败: ' + message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[API Error] 创建活动错误:', error);
    throw error;
  }
}

// 删除活动
export async function deleteActivity(activityId: number) {
  try {
    const response = await fetch(`http://localhost:8000/vote/activities/${activityId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      const message = handleApiError(response.status, await response.json());
      throw new Error('删除活动失败: ' + message);
    }
    
    return true;
  } catch (error) {
    console.error('[API Error] 删除活动错误:', error);
    throw error;
  }
}

// 获取所有候选人
export async function getAllCandidates() {
  try {
    const response = await fetch('http://localhost:8000/vote/candidates/batch', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      const message = handleApiError(response.status, await response.json());
      throw new Error('获取候选人列表失败: ' + message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[API Error] 获取候选人列表错误:', error);
    throw error;
  }
}

export async function submitVotes(activityId: Activity['id'], candidateIds: string[]) {
  try {

    const url = new URL('http://localhost:8000/vote/vote/batch');
    url.searchParams.append('activity_id', activityId.toString());
    candidateIds.forEach(id => url.searchParams.append('candidate_ids', id));

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
      mode: 'cors'
    });
    if (!response.ok) {
      const message = handleApiError(response.status ,await response.json());
      // const error_info = await response.json();
      const error = new Error(`Failed to submit votes ${message}`);
      throw error;
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export  async function getActivityVotes (activityId: number) {
  try {
    const response = await fetch(`http://localhost:8000/vote/activities/${activityId}/my-votes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
      mode: 'cors'
    });
    if (!response.ok) {
      const message = handleApiError(response.status ,await response.json());
      throw new Error('Failed to get activity votes ' + message);
    }

    return await response.json();
  } catch (error) {
    console.error('[API Error] Get activity votes error:', error);
    throw error;
  }
};

export async function getActiveStatistics() {
  try {
    const response = await fetch(`http://localhost:8000/vote/active-statistics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      const message = handleApiError(response.status, await response.json());
      throw new Error('Failed to get statistics data: ' + message);
    }
    return await response.json();
  } catch (error) {
    console.error('[API Error] Get voting statistics error:', error);
    throw error;
  }
}

export async function getVoteTrends(): Promise<VoteTrendData> {
  try {
    const response = await fetch(`http://localhost:8000/vote/vote-trends`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
      mode: 'cors'
    });
    console.info("getVoteTrends", response)
    if (!response.ok) {
      const message = handleApiError(response.status, await response.json());
      throw new Error('Failed to get vote trends data: ' + message);
    }
    return await response.json();
  } catch (error) {
    console.error('[API Error] Get vote trends error:', error);
    throw error;
  }
}