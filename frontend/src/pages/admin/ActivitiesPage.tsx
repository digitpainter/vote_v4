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
  Tooltip,
  Select,
  InputNumber,
  Transfer
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  StopOutlined,
  UserOutlined
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import type { InputRef } from 'antd';
import type { ColumnType } from 'antd/es/table';
import type { FilterConfirmProps } from 'antd/es/table/interface';
import { 
  getAllActivities, 
  createActivity, 
  updateActivity, 
  deleteActivity,
  getAllCandidates 
} from '../../api/vote';
import { getAllCollegeInfo, CollegeInfo, getCollegeNameById } from '../../api/college';
import { Activity, ApiActivity, ActivityFormData, Candidate } from '../../types/activity';
import dayjs from 'dayjs';
import type { TransferDirection } from 'antd/es/transfer';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

// 定义transfer项目类型
interface TransferItem {
  key: string;
  title: string;
  description: string;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [candidatesModalVisible, setCandidatesModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [currentActivity, setCurrentActivity] = useState<ApiActivity | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ApiActivity | null>(null);
  const [collegeInfoList, setCollegeInfoList] = useState<CollegeInfo[]>([]);

  // 加载活动数据
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await getAllActivities();
      setActivities(data);
    } catch (error) {
      message.error('获取活动列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 加载候选人数据
  const fetchCandidates = async () => {
    try {
      const data = await getAllCandidates();
      setCandidates(data);
    } catch (error) {
      message.error('获取候选人列表失败');
      console.error(error);
    }
  };

  // 加载学院信息
  const fetchCollegeInfo = async () => {
    try {
      const data = await getAllCollegeInfo();
      setCollegeInfoList(data);
    } catch (error) {
      console.error('获取学院信息失败:', error);
      message.error('获取学院信息失败');
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchActivities();
    fetchCandidates();
    fetchCollegeInfo();
  }, []);

  // 搜索处理函数
  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: keyof ApiActivity,
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
  const getColumnSearchProps = (dataIndex: keyof ApiActivity): ColumnType<ApiActivity> => ({
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
      (record[dataIndex] as string)
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

  // 获取活动状态
  const getActivityStatus = (activity: ApiActivity): 'active' | 'pending' | 'ended' => {
    const now = new Date();
    const startTime = new Date(activity.start_time);
    const endTime = new Date(activity.end_time);
    
    if (now < startTime) {
      return 'pending';
    } else if (now > endTime) {
      return 'ended';
    } else {
      return 'active';
    }
  };

  // 表格列定义
  const columns: TableColumnsType<ApiActivity> = [
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title',
      ...getColumnSearchProps('title'),
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 300,
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      sorter: (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '结束时间',
      dataIndex: 'end_time',
      key: 'end_time',
      sorter: (a, b) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime(),
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        const status = getActivityStatus(record);
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
      filters: [
        { text: '进行中', value: 'active' },
        { text: '待开始', value: 'pending' },
        { text: '已结束', value: 'ended' },
      ],
      onFilter: (value, record) => getActivityStatus(record) === value,
    },
    {
      title: '是否激活',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '已激活' : '未激活'}
        </Tag>
      ),
      filters: [
        { text: '已激活', value: true },
        { text: '未激活', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: '候选人数',
      dataIndex: 'candidate_ids',
      key: 'candidate_count',
      render: (candidateIds) => candidateIds.length,
      sorter: (a, b) => a.candidate_ids.length - b.candidate_ids.length,
    },
    {
      title: '投票设置',
      key: 'votes_settings',
      render: (_, record) => (
        <span>
          {record.min_votes} - {record.max_votes} 票
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="管理候选人">
            <Button 
              type="text" 
              icon={<UserOutlined />} 
              onClick={() => handleManageCandidates(record)} 
            />
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
    form.setFieldsValue({
      is_active: true,
      max_votes: 1,
      min_votes: 1,
      candidate_ids: [],
    });
    setIsModalVisible(true);
  };

  // 处理编辑活动
  const handleEdit = (activity: ApiActivity) => {
    setModalType('edit');
    setCurrentActivity(activity);
    form.setFieldsValue({
      title: activity.title,
      description: activity.description,
      timeRange: [dayjs(activity.start_time), dayjs(activity.end_time)],
      is_active: activity.is_active,
      max_votes: activity.max_votes,
      min_votes: activity.min_votes,
      candidate_ids: activity.candidate_ids,
    });
    setIsModalVisible(true);
  };

  // 处理删除活动
  const handleDelete = async (id: number) => {
    try {
      await deleteActivity(id);
      message.success('活动已删除');
      fetchActivities();
    } catch (error) {
      message.error('删除活动失败');
      console.error(error);
    }
  };

  // 处理表单提交
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 构建API请求数据格式
      const activityData = {
        title: values.title,
        description: values.description,
        start_time: values.timeRange[0].format('YYYY-MM-DDTHH:mm:ss'),
        end_time: values.timeRange[1].format('YYYY-MM-DDTHH:mm:ss'),
        is_active: values.is_active,
        candidate_ids: values.candidate_ids,
        max_votes: values.max_votes,
        min_votes: values.min_votes,
      };
      
      if (modalType === 'create') {
        // 创建新活动
        await createActivity(activityData);
        message.success('活动创建成功');
      } else if (currentActivity) {
        // 更新现有活动
        await updateActivity(currentActivity.id, activityData);
        message.success('活动更新成功');
      }
      
      setIsModalVisible(false);
      fetchActivities();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('操作失败');
      }
      console.error(error);
    }
  };

  // 处理管理候选人
  const handleManageCandidates = (activity: ApiActivity) => {
    setSelectedActivity(activity);
    // 初始化选中的候选人
    setTargetKeys(activity.candidate_ids.map(id => id.toString()));
    setCandidatesModalVisible(true);
  };

  // 处理候选人transfer变化
  const handleTransferChange = (newTargetKeys: React.Key[]) => {
    setTargetKeys(newTargetKeys.map(key => key.toString()));
  };

  // 保存候选人变更
  const handleSaveCandidates = async () => {
    if (!selectedActivity) return;
    
    try {
      // 构建更新请求
      const updatedActivity = {
        ...selectedActivity,
        candidate_ids: targetKeys.map(key => parseInt(key, 10)),
      };
      
      await updateActivity(selectedActivity.id, updatedActivity);
      message.success('候选人更新成功');
      setCandidatesModalVisible(false);
      fetchActivities();
    } catch (error) {
      message.error('更新候选人失败');
      console.error(error);
    }
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
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          name="activityForm"
        >
          <Form.Item
            name="title"
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
            <TextArea rows={4} placeholder="请输入活动描述" />
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
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="min_votes"
              label="最少投票数"
              rules={[{ required: true, message: '请输入最少投票数' }]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>
            
            <Form.Item
              name="max_votes"
              label="最多投票数"
              rules={[
                { required: true, message: '请输入最多投票数' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('min_votes') <= value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('最多票数必须大于或等于最少票数'));
                  },
                }),
              ]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </div>
          
          <Form.Item
            name="candidate_ids"
            label="选择候选人"
          >
            <Select
              mode="multiple"
              placeholder="请选择候选人"
              style={{ width: '100%' }}
              optionFilterProp="children"
            >
              {candidates.map(candidate => (
                <Option key={candidate.id} value={candidate.id}>
                  {candidate.name} - {getCollegeNameById(collegeInfoList, candidate.college_id)}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="is_active"
            label="是否激活"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 候选人管理弹窗 */}
      <Modal
        title="管理候选人"
        open={candidatesModalVisible}
        onOk={handleSaveCandidates}
        onCancel={() => setCandidatesModalVisible(false)}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <p className="mb-4">选择要包含在活动中的候选人：</p>
        <Transfer
          dataSource={candidates.map(c => ({
            key: c.id.toString(),
            title: c.name,
            description: getCollegeNameById(collegeInfoList, c.college_id) || '',
            disabled: false,
          }))}
          titles={['可选候选人', '已选候选人']}
          targetKeys={targetKeys}
          onChange={handleTransferChange}
          render={item => (
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.title}</span>
              <span className="text-gray-500">- {item.description}</span>
            </div>
          )}
          listStyle={{
            width: 350,
            height: 400,
          }}
          showSearch
          filterOption={(inputValue, item) =>
            item.title.indexOf(inputValue) !== -1 || item.description.indexOf(inputValue) !== -1
          }
        />
      </Modal>
    </div>
  );
} 