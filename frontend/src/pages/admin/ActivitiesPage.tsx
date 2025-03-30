import { useState, useEffect, useRef } from 'react';
import { 
  Typography, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  message, 
  Popconfirm,
  Switch,
  Card,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import type { InputRef } from 'antd';
import type { ColumnType } from 'antd/es/table';
import type { FilterConfirmProps } from 'antd/es/table/interface';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 活动类型定义
interface Activity {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'pending' | 'ended';
  createdAt: string;
  candidateCount: number;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);

  // 模拟获取数据
  useEffect(() => {
    setTimeout(() => {
      const dummyData: Activity[] = [
        {
          id: '1',
          name: '2024学生会选举',
          description: '2024年度学生会主席团选举活动',
          startTime: '2024-03-15 00:00:00',
          endTime: '2024-03-30 23:59:59',
          status: 'active',
          createdAt: '2024-03-10 14:30:00',
          candidateCount: 8
        },
        {
          id: '2',
          name: '优秀教师评选',
          description: '2024年度优秀教师评选活动',
          startTime: '2024-04-01 00:00:00',
          endTime: '2024-04-15 23:59:59',
          status: 'pending',
          createdAt: '2024-03-20 10:15:00',
          candidateCount: 12
        },
        {
          id: '3',
          name: '最佳班级评选',
          description: '2023年度最佳班级评选活动',
          startTime: '2023-12-01 00:00:00',
          endTime: '2023-12-15 23:59:59',
          status: 'ended',
          createdAt: '2023-11-25 09:20:00',
          candidateCount: 10
        }
      ];
      setActivities(dummyData);
      setLoading(false);
    }, 1000);
  }, []);

  // 搜索处理函数
  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: keyof Activity,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  // 创建搜索过滤框
  const getColumnSearchProps = (dataIndex: keyof Activity): ColumnType<Activity> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`搜索 ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            重置
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            关闭
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  // 表格列定义
  const columns: TableColumnsType<Activity> = [
    {
      title: '活动名称',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name'),
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      sorter: (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      sorter: (a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: '进行中', value: 'active' },
        { text: '待开始', value: 'pending' },
        { text: '已结束', value: 'ended' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        let color = '';
        let text = '';
        let icon = null;
        
        switch(status) {
          case 'active':
            color = 'green';
            text = '进行中';
            icon = <CheckCircleOutlined />;
            break;
          case 'pending':
            color = 'blue';
            text = '待开始';
            icon = <ClockCircleOutlined />;
            break;
          case 'ended':
            color = 'gray';
            text = '已结束';
            icon = <StopOutlined />;
            break;
        }
        
        return (
          <Tag color={color} icon={icon}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: '候选人数',
      dataIndex: 'candidateCount',
      key: 'candidateCount',
      sorter: (a, b) => a.candidateCount - b.candidateCount,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个活动吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 处理新增活动
  const handleAdd = () => {
    setModalType('create');
    setCurrentActivity(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 处理编辑活动
  const handleEdit = (activity: Activity) => {
    setModalType('edit');
    setCurrentActivity(activity);
    form.setFieldsValue({
      name: activity.name,
      description: activity.description,
      // 其他表单字段设置
    });
    setIsModalVisible(true);
  };

  // 处理查看活动
  const handleView = (activity: Activity) => {
    // 跳转到活动详情页或展示详情弹窗
    message.info(`查看活动：${activity.name}`);
  };

  // 处理删除活动
  const handleDelete = (id: string) => {
    // 实际项目中应该调用API删除
    setActivities(activities.filter(item => item.id !== id));
    message.success('活动已删除');
  };

  // 处理表单提交
  const handleFormSubmit = () => {
    form.validateFields().then(values => {
      // 实际项目中应该调用API保存
      if (modalType === 'create') {
        // 新增活动
        const newActivity: Activity = {
          id: `${Math.floor(Math.random() * 1000)}`,
          name: values.name,
          description: values.description,
          startTime: values.timeRange[0].format('YYYY-MM-DD HH:mm:ss'),
          endTime: values.timeRange[1].format('YYYY-MM-DD HH:mm:ss'),
          status: new Date(values.timeRange[0]) > new Date() ? 'pending' : 'active',
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          candidateCount: 0
        };
        setActivities([...activities, newActivity]);
        message.success('活动创建成功');
      } else {
        // 更新活动
        if (currentActivity) {
          const updatedActivities = activities.map(item => 
            item.id === currentActivity.id 
              ? { 
                  ...item, 
                  name: values.name, 
                  description: values.description,
                  startTime: values.timeRange[0].format('YYYY-MM-DD HH:mm:ss'),
                  endTime: values.timeRange[1].format('YYYY-MM-DD HH:mm:ss'),
                }
              : item
          );
          setActivities(updatedActivities);
          message.success('活动更新成功');
        }
      }
      setIsModalVisible(false);
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>活动管理</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
        >
          新增活动
        </Button>
      </div>
      
      {/* 活动列表 */}
      <Card className="mb-6 shadow-sm">
        <Table 
          columns={columns} 
          dataSource={activities}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      {/* 添加/编辑活动弹窗 */}
      <Modal
        title={modalType === 'create' ? '新增活动' : '编辑活动'}
        open={isModalVisible}
        onOk={handleFormSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={modalType === 'create' ? '创建' : '保存'}
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          name="activityForm"
        >
          <Form.Item
            name="name"
            label="活动名称"
            rules={[{ required: true, message: '请输入活动名称' }]}
          >
            <Input placeholder="请输入活动名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="活动描述"
            rules={[{ required: true, message: '请输入活动描述' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入活动描述" />
          </Form.Item>
          <Form.Item
            name="timeRange"
            label="活动时间范围"
            rules={[{ required: true, message: '请选择活动时间范围' }]}
          >
            <RangePicker 
              showTime 
              format="YYYY-MM-DD HH:mm:ss" 
              className="w-full" 
            />
          </Form.Item>
          {modalType === 'create' && (
            <Form.Item
              name="isActive"
              label="立即生效"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
} 