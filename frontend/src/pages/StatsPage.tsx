import { useEffect, useState } from 'react';
import { Table, Spin } from 'antd';
import type { TableColumnsType } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import {getActiveStatistics } from "../api/vote"

interface VoteStat {
  candidateId: number;
  candidateName: string;
  voteCount: number;
}

interface TrendData {
  date: string;
  count: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<VoteStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const { role } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getActiveStatistics();
        setStats(response.map((item: any) => ({
          candidateId: item.candidate_id,
          candidateName: item.name,
          collegeId:item.college_id,
          collegeName:item.college_id,
          voteCount: item.vote_count
        })));
      } catch (error) {
        console.error('获取统计信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const columns: TableColumnsType<VoteStat> = [
    { title: '学院', dataIndex: 'collegeName'},
    { title: '姓名', dataIndex: 'candidateName' },
    { title: '得票数', dataIndex: 'voteCount', sorter: (a, b) => a.voteCount - b.voteCount },
  ];

  return (
    <Spin spinning={loading} tip="加载中...">
      <div className="p-6"/>
      <h2 className="text-xl font-bold mb-4">候选人得票统计</h2>
      <Table
        columns={columns}
        dataSource={stats}
        rowKey="candidateId"
        pagination={false}
        className="mb-8"
      />

      <h2 className="text-xl font-bold mb-4">投票趋势</h2>
      <div className="h-96">
      </div>
    </Spin>
  );
}