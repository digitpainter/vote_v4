import { useEffect, useState } from 'react';
import { Table, Spin, Card, Typography, Tag, Progress, Divider, Space, Input, Empty } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchOutlined, TeamOutlined, BarChartOutlined, LineChartOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { getActiveStatistics, getVoteTrends } from "../api/vote";
import { VoteTrendData, VoteTrendItem } from '../types/activity';
import DailyVoteChart from '../components/DailyVoteChart';
import CandidateComparisonChart from '../components/CandidateComparisonChart';

const { Title, Text } = Typography;

// 类型定义
interface VoteStat {
  candidateId: number;
  candidateName: string;
  voteCount: number;
  collegeId: string;
  collegeName: string;
}

// 候选人票数统计表格组件
const VoteStatsTable = ({ 
  stats, 
  searchText 
}: { 
  stats: VoteStat[], 
  searchText: string 
}) => {
  // 找出最高票数，用于计算百分比
  const maxVotes = Math.max(...stats.map(s => s.voteCount), 1);

  // 过滤数据
  const filteredData = stats.filter(item => 
    item.candidateName.toLowerCase().includes(searchText.toLowerCase()) || 
    item.collegeName.toLowerCase().includes(searchText.toLowerCase())
  );

  // 表格列定义
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

  return (
    <Table
      columns={columns}
      dataSource={filteredData}
      rowKey="candidateId"
      pagination={false}
      className="mb-8"
      scroll={{ x: 'max-content' }}
    />
  );
};

// 主组件
export default function StatsPage() {
  // 状态管理
  const [stats, setStats] = useState<VoteStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendData, setTrendData] = useState<VoteTrendData | null>(null);
  const [searchText, setSearchText] = useState('');
  const { role } = useAuth();

  // 数据获取
  useEffect(() => {
    // 获取投票统计数据
    const fetchStats = async () => {
      try {
        setLoading(true);
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

    // 获取投票趋势数据
    const fetchTrendData = async () => {
      try {
        setTrendLoading(true);
        const response = await getVoteTrends();
        console.info("API返回投票趋势数据:", response);
        setTrendData(response);
      } catch (error) {
        console.error('获取投票趋势数据失败:', error);
      } finally {
        setTrendLoading(false);
      }
    };

    // 执行数据获取
    fetchStats();
    fetchTrendData();
  }, []);

  return (
    <Spin spinning={loading} tip="加载中...">
      <div className="p-6">
        {/* 候选人得票统计卡片 */}
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
          <VoteStatsTable stats={stats} searchText={searchText} />
        </Card>

        {/* 每日投票趋势卡片 */}
        <Card className="shadow-md mb-6">
          <Title level={4}>
            <LineChartOutlined /> 每日投票趋势
          </Title>
          <Spin spinning={trendLoading} tip="加载趋势数据...">
            <div className="h-80">
              <DailyVoteChart trendData={trendData} />
            </div>
          </Spin>
        </Card>

        {/* 候选人投票对比卡片 */}
        <Card className="shadow-md">
          <Title level={4}>
            <CalendarOutlined /> 候选人投票对比
          </Title>
          <Spin spinning={trendLoading} tip="加载对比数据...">
            <div className="h-80">
              <CandidateComparisonChart trendData={trendData} />
            </div>
          </Spin>
        </Card>
      </div>
    </Spin>
  );
}
