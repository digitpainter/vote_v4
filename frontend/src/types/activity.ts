export interface Activity {
  candidate_ids: number[];
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
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