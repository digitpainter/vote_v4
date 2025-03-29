import { useState, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { batchVote } from '../api/vote';
import { ActivityContext } from '../contexts/ActivityContext';

export default function VotePage() {
  const { currentUser } = useAuth();
  const { currentActivity } = useContext(ActivityContext);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);

  const handleSubmit = async () => {
    try {
      if (!currentActivity?.id) throw new Error('请先选择投票活动');
      
      const response = await batchVote({
        activityId: currentActivity.id,
        candidateIds: selectedCandidates
      }, currentUser.token);

      alert(`成功提交${response.successCount}票`);
      setSelectedCandidates([]);
    } catch (error) {
      alert(error.message || '投票失败');
    }
  };

  return (
    <div>
      {/* 候选人选择界面 */}
      <button onClick={handleSubmit}>提交投票</button>
    </div>
  );
}