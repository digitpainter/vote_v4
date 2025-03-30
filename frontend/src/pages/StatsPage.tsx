import { useEffect, useState } from 'react';
import { Table, Spin, Card, Typography, Tag, Progress, Divider, Space, Input } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchOutlined, TrophyOutlined, TeamOutlined, BarChartOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { getActiveStatistics } from "../api/vote";

const { Title, Text } = Typography;

interface VoteStat {
  candidateId: number;
  candidateName: string;
  voteCount: number;
  collegeId: string;
  collegeName: string;
}

interface TrendData {
  date: string;
  count: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<VoteStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<TrendData[]>([]);
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

    fetchStats();
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
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_, __, index) => (
        <div className="flex justify-center">
          {index < 3 ? (
            <TrophyOutlined style={{ 
              fontSize: '24px', 
              color: ['#FFD700', '#C0C0C0', '#CD7F32'][index] 
            }} />
          ) : (
            <Tag color="blue">{index + 1}</Tag>
          )}
        </div>
      ),
      fixed: 'left'
    },
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
      sorter: (a, b) => a.voteCount - b.voteCount,
      defaultSortOrder: 'descend',
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
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条数据`
            }}
            className="mb-8"
            rowClassName={(record, index) => 
              index < 3 ? 'bg-blue-50 hover:bg-blue-100' : ''
            }
            scroll={{ x: 'max-content' }}
          />
        </Card>

        <Card className="shadow-md">
          <Title level={4}>
            <BarChartOutlined /> 投票趋势
          </Title>
          <div className="h-96">
            {/* 图表将在这里 */}
          </div>
        </Card>
      </div>
    </Spin>
  );
}