import {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {Activity} from '../types/activity';
import {Candidate} from '../types/candidate';

interface ActivityContextType {
  activeActivities: Activity[];
  candidates: Candidate[];
  loading: boolean;
  error: string | null;
  refreshActivities: () => Promise<void>;
  refreshCandidates: (candidateIds: string[]) => Promise<Candidate[]>;
}

export const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({children}: { children: ReactNode }) {
  const [activeActivities, setActiveActivities] = useState<Activity[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = async (candidateIds: string[]) => {
    try {
      console.debug(`[API Request][${new Date().toLocaleString()}] Fetching candidates with IDs: ${candidateIds.join(', ')}`);
      const url = new URL('http://localhost:8000/vote/candidates/batch/');
      candidateIds.forEach(id => url.searchParams.append('candidate_ids', id));
      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        mode: 'cors'
      });

      console.debug(`[API Response][${new Date().toLocaleString()}] Candidates fetch status: ${response.status}, content length: ${response.headers.get('Content-Length')}`);

      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }

      const candidatesData = await response.json();
      console.debug(`[API Data][${new Date().toLocaleString()}] Received ${candidatesData.length} candidates`);
      return candidatesData;
    } catch (error) {
      console.error('[API Error] Candidate fetch error:', error);
      throw error;
    }
  };

  const refreshActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      console.debug(`[API Request][${new Date().toLocaleString()}] Fetching active activities`);
      const response = await fetch('http://localhost:8000/vote/activities/active/', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        mode: 'cors'
      });

      console.debug(`[API Response][${new Date().toLocaleString()}] Activities fetch status: ${response.status}`);

      if (!response.ok) {
        throw new Error('Failed to fetch active activities');
      }

      const data = await response.json();
      console.debug(`[API Data][${new Date().toLocaleString()}] Received ${data.length} activities`);
      setActiveActivities(data);

      // Batch fetch candidates
      const allCandidateIds = data.flatMap((activity: Activity) => activity.candidate_ids);
      if (allCandidateIds.length > 0) {
        const candidatesData = await fetchCandidates(allCandidateIds);
        setCandidates(candidatesData);
      }
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
        refreshActivities,
        refreshCandidates: fetchCandidates
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