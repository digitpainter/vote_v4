import { Activity } from '../types/activity';

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
      console.error("Failed to submit votes",response)
      throw new Error('Failed to submit votes');
    }

    return await response.json();
  } catch (error) {
    console.error('[API Error] Vote submission error:', error);
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
      console.error("Failed to get activity votes", response);
      throw new Error('Failed to get activity votes');
    }

    return await response.json();
  } catch (error) {
    console.error('[API Error] Get activity votes error:', error);
    throw error;
  }
};