import { useEffect, useState } from 'react';
import { Table, Spin, Card, Typography, Tag, Progress, Divider, Space, Input, Empty } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchOutlined, TeamOutlined, BarChartOutlined, LineChartOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { getActiveStatistics, getVoteTrends } from "../api/vote";
import { VoteTrendData, VoteTrendItem } from '../types/activity';
import DailyVoteChart from '../components/DailyVoteChart';
import CandidateComparisonChart from '../components/CandidateComparisonChart';
import { getAllCollegeInfo } from '../api/college';

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
  const [collegeInfoList, setCollegeInfoList] = useState<any[]>([]);

  // 数据获取
  useEffect(() => {
    const fetchCollegeInfo = async () => {
      try {
        const data = await getAllCollegeInfo();
        setCollegeInfoList(data);
      } catch (error) {
        console.error('获取学院信息失败:', error);
      }
    };
    fetchCollegeInfo();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getActiveStatistics();
        const data = response.map((item: any) => ({
          candidateId: item.candidate_id,
          candidateName: item.name,
          collegeId: item.college_id,
          collegeName: collegeInfoList.find(college => college.YXDM === item.college_id)?.YXDM_TEXT || '未知学院',
          voteCount: item.vote_count
        }));
        setStats(data);
      } catch (error) {
        console.error('获取统计信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (collegeInfoList.length > 0) {
      fetchStats();
    }
  }, [collegeInfoList]);

  // 获取投票趋势数据
  useEffect(() => {
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

    if (stats.length > 0) {
      fetchTrendData();
    }
  }, [stats]);

  return (
    <Spin spinning={loading} tip="加载中...">
      <div className="p-8 bg-gray-50">
        {/* 候选人得票统计卡片 */}
        <div className="mb-8">
        <Card 
          className="relative hover:shadow-lg transition-shadow duration-300 shadow-md mb-8"
          title={
            <div className="flex justify-between items-center py-2">
              <Title level={4} className="mb-0">
                <BarChartOutlined className="mr-2 text-blue-500" /> 候选人得票统计
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
        </div>
        {/* 每日投票趋势卡片 */}
        <div className="mb-8">
          <Card 
            className="relative hover:shadow-lg transition-shadow duration-300 shadow-md"
          title={
            <div className="py-2">
              <Title level={4} className="mb-0">
                <LineChartOutlined className="mr-2 text-blue-500" /> 每日投票趋势
              </Title>
            </div>
          }
        >
          <Spin spinning={trendLoading} tip="加载趋势数据...">
            <div className="h-96">
              <DailyVoteChart trendData={trendData} />
            </div>
          </Spin>
        </Card>
        </div>
        {/* 候选人投票对比卡片 */}
        <div className="mb-8">
          <Card 
            className="relative hover:shadow-lg transition-shadow duration-300 shadow-md"
            title={
              <div className="py-2">
                <Title level={4} className="mb-0">
                  <CalendarOutlined className="mr-2 text-blue-500" /> 候选人投票对比
                </Title>
              </div>
            }
          >
            <Spin spinning={trendLoading} tip="加载对比数据...">
              <div className="h-96">
                <CandidateComparisonChart trendData={trendData} />
              </div>
            </Spin>
          </Card>
        </div>
      </div>
    </Spin>
  );
}
