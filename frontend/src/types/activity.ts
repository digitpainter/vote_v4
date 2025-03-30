export interface Activity {
  candidate_ids: number[];
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  max_votes?: number;
  min_votes?: number;
}

export interface ApiActivity {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  candidate_ids: number[];
  max_votes: number;
  min_votes: number;
}

export interface ActivityFormData {
  title: string;
  description: string;
  timeRange: any; // DatePicker的时间范围类型
  is_active: boolean;
  candidate_ids: number[];
  max_votes: number;
  min_votes: number;
}

export interface Candidate {
  id: number;
  name: string;
  college_id: string;
  college_name: string;
  introduction?: string;
  avatar_url?: string;
  vote_count?: number;
}

export interface VoteTrendItem {
  date: string;
  count: number;
  candidate_id?: number;
  candidate_name?: string;
}

export interface VoteTrendData {
  trends: VoteTrendItem[];
  daily_totals: VoteTrendItem[];
}