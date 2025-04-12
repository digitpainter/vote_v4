import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Timeline, Typography, Badge } from 'antd';
import { 
  UserOutlined, 
  FileTextOutlined, 
  RiseOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';
import {
  fetchTotalStats,
  DashboardStats
} from '../../api/dashboard';
import { getAdminLogs } from '../../api/adminLog';
import { AdminLog, AdminActionType } from '../../types/adminLog';

const { Title, Text } = Typography;

export default function DashboardPage() {
  // 初始化统计数据
  const [stats, setStats] = useState<DashboardStats>({
    totalActivities: 0,
    totalCandidates: 0,
    totalVotes: 0,
    activeActivities: 0
  });
  
  const [recentLogs, setRecentLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await fetchTotalStats();
      
      // 计算活动中的活动数量
      const activeActivitiesCount = data.activities.filter(activity => activity.is_active).length;
      
      setStats({
        totalActivities: data.total_activities,
        totalCandidates: data.total_candidates,
        totalVotes: data.total_votes,
        activeActivities: activeActivitiesCount
      });
      
      setLoading(false);
    } catch (error) {
      console.error('获取统计数据失败:', error);
      setLoading(false);
    }
  };

  // 加载最近管理员日志数据
  const loadRecentLogs = async () => {
    try {
      setLogsLoading(true);
      const logs = await getAdminLogs({ limit: 5 });
      setRecentLogs(logs);
      setLogsLoading(false);
    } catch (error) {
      console.error('获取管理员日志失败:', error);
      setLogsLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    // 获取实际统计数据
    fetchStats();
    
    // 加载管理员日志数据
    loadRecentLogs();
  }, []);

  // 获取图标颜色
  const getActivityIcon = (actionType: AdminActionType) => {
    switch(actionType) {
      case AdminActionType.VIEW:
        return <Badge status="processing" color="blue" />;
      case AdminActionType.CREATE:
        return <Badge status="success" />;
      case AdminActionType.UPDATE:
        return <Badge status="warning" />;
      case AdminActionType.DELETE:
        return <Badge status="error" />;
      case AdminActionType.EXPORT:
        return <Badge status="default" color="purple" />;
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
            loading={logsLoading}
          >
            <Timeline
              items={recentLogs.map(log => ({
                color: log.action_type === AdminActionType.VIEW ? 'blue' : 
                       log.action_type === AdminActionType.CREATE ? 'green' : 
                       log.action_type === AdminActionType.UPDATE ? 'orange' : 
                       log.action_type === AdminActionType.DELETE ? 'red' : 'gray',
                children: (
                  <div>
                    <div className="flex items-center gap-2">
                      {getActivityIcon(log.action_type)}
                      <Text strong>{log.admin_name}</Text>
                      <Text type="secondary" className="text-xs">{new Date(log.created_at).toLocaleString()}</Text>
                    </div>
                    <div className="ml-5">{log.description}</div>
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