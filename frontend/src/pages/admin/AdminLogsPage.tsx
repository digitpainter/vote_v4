import React, { useEffect, useState } from 'react';
import { Table, Card, Typography, Tag, DatePicker, Select, Input, Button, Space, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import moment from 'moment';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { getAdminLogs } from '../../api/adminLog';
import { AdminLog, AdminActionType } from '../../types/adminLog';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const actionTypeColors = {
  [AdminActionType.CREATE]: 'green',
  [AdminActionType.UPDATE]: 'blue',
  [AdminActionType.DELETE]: 'red',
  [AdminActionType.VIEW]: 'purple',
  [AdminActionType.EXPORT]: 'orange',
  [AdminActionType.OTHER]: 'default',
};

const actionTypeLabels = {
  [AdminActionType.CREATE]: '创建',
  [AdminActionType.UPDATE]: '更新',
  [AdminActionType.DELETE]: '删除',
  [AdminActionType.VIEW]: '查看',
  [AdminActionType.EXPORT]: '导出',
  [AdminActionType.OTHER]: '其他',
};

const AdminLogsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [filters, setFilters] = useState({
    admin_id: '',
    action_type: undefined as AdminActionType | undefined,
    resource_type: '',
    dateRange: [] as [moment.Moment, moment.Moment] | [],
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        admin_id: filters.admin_id || undefined,
        action_type: filters.action_type,
        resource_type: filters.resource_type || undefined,
        start_date: filters.dateRange[0]?.format('YYYY-MM-DD HH:mm:ss'),
        end_date: filters.dateRange[1]?.format('YYYY-MM-DD HH:mm:ss'),
      };

      const data = await getAdminLogs(params);
      setLogs(data);
    } catch (error) {
      console.error('获取管理员日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleReset = () => {
    setFilters({
      admin_id: '',
      action_type: undefined,
      resource_type: '',
      dateRange: [],
    });
    fetchLogs();
  };

  const columns: ColumnsType<AdminLog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '管理员',
      dataIndex: 'admin_name',
      key: 'admin_name',
      render: (text, record) => (
        <Tooltip title={`ID: ${record.admin_id}`}>
          <span>{text} ({record.admin_type})</span>
        </Tooltip>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'action_type',
      key: 'action_type',
      render: (text) => (
        <Tag color={actionTypeColors[text as AdminActionType] || 'default'}>
          {actionTypeLabels[text as AdminActionType] || text}
        </Tag>
      ),
    },
    {
      title: '资源类型',
      dataIndex: 'resource_type',
      key: 'resource_type',
    },
    {
      title: '资源ID',
      dataIndex: 'resource_id',
      key: 'resource_id',
      width: 100,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 130,
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div className="admin-logs-page">
      <div className="mb-4">
        <Title level={2}>管理员操作日志</Title>
        <Card className="mb-4">
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="管理员ID"
              value={filters.admin_id}
              onChange={(e) => setFilters({ ...filters, admin_id: e.target.value })}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="操作类型"
              value={filters.action_type}
              onChange={(val) => setFilters({ ...filters, action_type: val })}
              style={{ width: 200 }}
              allowClear
            >
              {Object.entries(actionTypeLabels).map(([key, label]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
            <Input
              placeholder="资源类型"
              value={filters.resource_type}
              onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
              style={{ width: 200 }}
              allowClear
            />
            <RangePicker
              showTime
              value={filters.dateRange as [moment.Moment, moment.Moment] | undefined}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates as [moment.Moment, moment.Moment] | [] })}
              style={{ width: 380 }}
            />
            <Space>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={fetchLogs}
              >
                搜索
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </div>
        </Card>
      </div>

      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />
    </div>
  );
};

export default AdminLogsPage; 