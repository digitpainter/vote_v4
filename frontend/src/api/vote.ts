
interface BatchVoteParams {
  activityId: number;
  candidateIds: number[];
}

export const batchVote = async (params: BatchVoteParams, token: string) => {
  try {
    const response = await fetch('/vote/vote/batch', 
      { candidate_ids: params.candidateIds, activity_id: params.activityId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || '投票请求失败');
    }
    throw new Error('未知错误');
  }
};