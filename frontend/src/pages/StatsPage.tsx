import { useEffect, useState } from 'react';
import { Table, Spin, Card, Typography, Tag, Progress, Divider, Space, Input, Empty } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchOutlined, TrophyOutlined, TeamOutlined, BarChartOutlined, LineChartOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { getActiveStatistics, getVoteTrends } from "../api/vote";
import { VoteTrendData, VoteTrendItem } from '../types/activity';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, TooltipProps } from 'recharts';

const { Title, Text } = Typography;

interface VoteStat {
  candidateId: number;
  candidateName: string;
  voteCount: number;
  collegeId: string;
  collegeName: string;
}

export default function StatsPage() {
  const [stats, setStats] = useState<VoteStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendData, setTrendData] = useState<VoteTrendData | null>(null);
  const [searchText, setSearchText] = useState('');
  const { role } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getActiveStatistics();
        const data = response.map((item: any) => ({
          candidateId: item.candidate_id,
          candidateName: item.name,
          collegeId: item.college_id,
          collegeName: item.college_id,
          voteCount: item.vote_count
        }));
        setStats(data);
      } catch (error) {
        console.error('获取统计信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTrendData = async () => {
      try {
        setTrendLoading(true);
        const response = await getVoteTrends();
        setTrendData(response);
      } catch (error) {
        console.error('获取投票趋势数据失败:', error);
      } finally {
        setTrendLoading(false);
      }
    };

    fetchStats();
    fetchTrendData();
  }, []);

  // 找出最高票数，用于计算百分比
  const maxVotes = Math.max(...stats.map(s => s.voteCount), 1);

  // 过滤数据
  const filteredData = stats.filter(item => 
    item.candidateName.toLowerCase().includes(searchText.toLowerCase()) || 
    item.collegeName.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: TableColumnsType<VoteStat> = [
    { 
      title: <><TeamOutlined /> 学院</>,
      dataIndex: 'collegeName',
      width: 150,
      render: (text) => <Text strong>{text}</Text>
    },
    { 
      title: '姓名', 
      dataIndex: 'candidateName', 
      width: 150,
      render: (text) => <Text strong>{text}</Text>
    },
    { 
      title: <><BarChartOutlined /> 得票统计</>,
      dataIndex: 'voteCount',
      render: (votes) => (
        <div className="flex items-center gap-4">
          <Progress 
            percent={Math.round((votes / maxVotes) * 100)} 
            format={() => votes}
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>
      ),
    }
  ];

  // 配置每日投票量趋势图
  const DailyVoteChart = () => {
    if (!trendData || !trendData.daily_totals || trendData.daily_totals.length === 0) {
      return <Empty description="暂无投票趋势数据" className="h-full flex flex-col justify-center" />;
    }

    // 处理日期格式
    const formattedData = trendData.daily_totals.map(item => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString('zh-CN', {
        month: 'numeric',
        day: 'numeric'
      })
    }));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="formattedDate"
            tick={{ fontSize: 12 }}
            label={{ 
              value: '日期', 
              position: 'insideBottomRight', 
              offset: -5,
              fontSize: 12 
            }}
          />
          <YAxis 
            label={{ 
              value: '投票数', 
              angle: -90, 
              position: 'insideLeft',
              offset: 0,
              fontSize: 12
            }} 
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value} 票`, '投票数']}
            labelFormatter={(label: string) => `日期: ${label}`}
            contentStyle={{ 
              borderRadius: '4px', 
              border: 'none', 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' 
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="count"
            name="投票数"
            stroke="#1890ff"
            fill="url(#colorCount)"
            activeDot={{ r: 6, strokeWidth: 1 }}
            strokeWidth={2}
          />
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1890ff" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1} />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // 配置候选人投票对比图
  const CandidateComparisonChart = () => {
    if (!trendData || !trendData.trends || trendData.trends.length === 0) {
      return <Empty description="暂无候选人对比数据" className="h-full flex flex-col justify-center" />;
    }

    // 根据总投票数排序，获取前5名候选人
    const candidateTotals = {} as Record<number, { id: number, name: string, total: number }>;
    
    trendData.trends.forEach(item => {
      if (item.candidate_id && item.candidate_name) {
        if (!candidateTotals[item.candidate_id]) {
          candidateTotals[item.candidate_id] = {
            id: item.candidate_id,
            name: item.candidate_name,
            total: 0
          };
        }
        candidateTotals[item.candidate_id].total += item.count;
      }
    });
    
    const topCandidates = Object.values(candidateTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(c => c.id);
    
    // 获取所有日期，并按时间排序
    const allDates = [...new Set(trendData.trends.map(item => item.date))].sort();
    
    // 为每个候选人准备数据
    const chartData = allDates.map(date => {
      const dataPoint = {
        date: new Date(date).toLocaleDateString('zh-CN', {
          month: 'numeric',
          day: 'numeric'
        })
      } as any;
      
      // 为每个候选人添加当天的投票数
      topCandidates.forEach(candidateId => {
        const candidateData = trendData.trends.find(
          item => item.date === date && item.candidate_id === candidateId
        );
        
        const candidateName = candidateTotals[candidateId]?.name || '';
        dataPoint[candidateName] = candidateData ? candidateData.count : 0;
      });
      
      return dataPoint;
    });

    // 生成颜色数组
    const colors = ['#1890ff', '#f5222d', '#52c41a', '#faad14', '#722ed1'];

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date"
            tick={{ fontSize: 12 }}
            label={{ 
              value: '日期', 
              position: 'insideBottomRight', 
              offset: -5,
              fontSize: 12 
            }}
          />
          <YAxis 
            label={{ 
              value: '投票数', 
              angle: -90, 
              position: 'insideLeft',
              offset: 0,
              fontSize: 12
            }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [`${value} 票`, name]}
            contentStyle={{ 
              borderRadius: '4px', 
              border: 'none', 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' 
            }}
          />
          <Legend />
          {topCandidates.map((candidateId, index) => {
            const candidateName = candidateTotals[candidateId]?.name || '';
            return (
              <Line
                key={candidateId}
                type="monotone"
                dataKey={candidateName}
                name={candidateName}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6, strokeWidth: 1 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Spin spinning={loading} tip="加载中...">
      <div className="p-6">
        <Card 
          className="mb-6 shadow-md"
          title={
            <div className="flex justify-between items-center">
              <Title level={4} className="mb-0">
                <BarChartOutlined /> 候选人得票统计
              </Title>
              <Input
                placeholder="搜索候选人或学院"
                prefix={<SearchOutlined />}
                onChange={e => setSearchText(e.target.value)}
                className="w-64"
                allowClear
              />
            </div>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="candidateId"
            pagination={false}
            className="mb-8"
            scroll={{ x: 'max-content' }}
          />
        </Card>

        <Card className="shadow-md mb-6">
          <Title level={4}>
            <LineChartOutlined /> 每日投票趋势
          </Title>
          <Spin spinning={trendLoading} tip="加载趋势数据...">
            <div className="h-80">
              <DailyVoteChart />
            </div>
          </Spin>
        </Card>

        <Card className="shadow-md">
          <Title level={4}>
            <CalendarOutlined /> 候选人投票对比
          </Title>
          <Spin spinning={trendLoading} tip="加载对比数据...">
            <div className="h-80">
              <CandidateComparisonChart />
            </div>
          </Spin>
        </Card>
      </div>
    </Spin>
  );
}
