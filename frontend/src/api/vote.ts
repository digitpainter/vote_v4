import { Activity } from '../types/activity';
import { handleApiError } from '../utils/errorHandler';

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