import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Timeline, Typography, Badge } from 'antd';
import { 
  UserOutlined, 
  FileTextOutlined, 
  RiseOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';

const { Title, Text } = Typography;

// 定义仪表盘统计数据类型
interface DashboardStats {
  totalActivities: number;
  totalCandidates: number;
  totalVotes: number;
  activeActivities: number;
}

// 定义最近活动类型
interface RecentActivity {
  id: string;
  name: string;
  type: 'vote' | 'create' | 'update' | 'delete';
  time: string;
  description: string;
}

export default function DashboardPage() {
  // 模拟数据
  const [stats, setStats] = useState<DashboardStats>({
    totalActivities: 0,
    totalCandidates: 0,
    totalVotes: 0,
    activeActivities: 0
  });
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // 模拟API获取数据
  useEffect(() => {
    // 这里应该是实际的API请求
    setTimeout(() => {
      setStats({
        totalActivities: 12,
        totalCandidates: 68,
        totalVotes: 4328,
        activeActivities: 3
      });
      
      setRecentActivities([
        { 
          id: '1', 
          name: '管理员', 
          type: 'create', 
          time: '2024-03-29 14:32:45', 
          description: '创建了新活动【2024学生会选举】' 
        },
        { 
          id: '2', 
          name: '张三', 
          type: 'vote', 
          time: '2024-03-29 13:15:22', 
          description: '在【2024学生会选举】中投票' 
        },
        { 
          id: '3', 
          name: '管理员', 
          type: 'update', 
          time: '2024-03-28 10:05:13', 
          description: '更新了活动【2024学生会选举】信息' 
        },
        { 
          id: '4', 
          name: '李四', 
          type: 'vote', 
          time: '2024-03-27 16:42:01', 
          description: '在【2024学生会选举】中投票' 
        },
        { 
          id: '5', 
          name: '管理员', 
          type: 'delete', 
          time: '2024-03-26 09:30:56', 
          description: '删除了候选人【王五】' 
        }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

  // 获取图标颜色
  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'vote':
        return <Badge status="processing" color="blue" />;
      case 'create':
        return <Badge status="success" />;
      case 'update':
        return <Badge status="warning" />;
      case 'delete':
        return <Badge status="error" />;
      default:
        return <Badge status="default" />;
    }
  };

  return (
    <div>
      <Title level={2}>管理后台</Title>
      <Text type="secondary" className="mb-6 block">欢迎使用投票系统管理后台，您可以在这里管理活动、候选人和查看数据。</Text>
      
      {/* 统计卡片区域 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="text-center">
            <Statistic 
              title="总活动数" 
              value={stats.totalActivities} 
              prefix={<FileTextOutlined className="text-blue-500 mr-2" />} 
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="text-center">
            <Statistic 
              title="候选人数" 
              value={stats.totalCandidates}
              prefix={<UserOutlined className="text-green-500 mr-2" />} 
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="text-center">
            <Statistic 
              title="总投票数" 
              value={stats.totalVotes} 
              prefix={<RiseOutlined className="text-orange-500 mr-2" />} 
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="text-center">
            <Statistic 
              title="进行中活动" 
              value={stats.activeActivities} 
              prefix={<ClockCircleOutlined className="text-purple-500 mr-2" />} 
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
      
      {/* 最近活动时间线 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={24}>
          <Card 
            title="最近活动" 
            className="h-full" 
            loading={loading}
          >
            <Timeline
              items={recentActivities.map(activity => ({
                color: activity.type === 'vote' ? 'blue' : 
                       activity.type === 'create' ? 'green' : 
                       activity.type === 'update' ? 'orange' : 'red',
                children: (
                  <div>
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.type)}
                      <Text strong>{activity.name}</Text>
                      <Text type="secondary" className="text-xs">{activity.time}</Text>
                    </div>
                    <div className="ml-5">{activity.description}</div>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
} 