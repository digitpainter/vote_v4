import {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {handleApiError} from '../utils/errorHandler';
import {Activity} from '../types/activity';
import {Candidate} from '../types/candidate';
import { fetchActiveActivities, fetchCandidatesByIds } from '../api/activity';

interface ActivityContextType {
  activeActivities: Activity[];
  candidates: Candidate[];
  loading: boolean;
  error: string | null;
  maxVotes: number;
  minVotes: number;
  refreshActivities: () => Promise<void>;
  refreshCandidates: (candidateIds: string[]) => Promise<Candidate[]>;
}

export const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({children}: { children: ReactNode }) {
  const [activeActivities, setActiveActivities] = useState<Activity[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxVotes, setMaxVotes] = useState(0);
  const [minVotes, setMinVotes] = useState(0);

  const refreshActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      console.debug(`[API Request][${new Date().toLocaleString()}] Fetching active activities`);
      const data = await fetchActiveActivities();
      console.debug(`[API Data][${new Date().toLocaleString()}] Received ${data.length} activities`);
      setActiveActivities(data);

      // Batch fetch candidates
      const allCandidateIds = data.flatMap((activity: Activity) => 
        activity.candidate_ids.map(id => id.toString())
      );
      if (allCandidateIds.length > 0) {
        const candidatesData = await fetchCandidatesByIds(allCandidateIds);
        setCandidates(candidatesData);
      }
      const { max_votes, min_votes } = data[0] || {};
      setMaxVotes(max_votes || 0);
      setMinVotes(min_votes || 0);
    } catch (error) {
      console.error('[API Error] Activity refresh error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshActivities();
  }, []);

  return (
    <ActivityContext.Provider
      value={{
        activeActivities,
        candidates,
        loading,
        error,
        maxVotes,
        minVotes,
        refreshActivities,
        refreshCandidates: fetchCandidatesByIds
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}