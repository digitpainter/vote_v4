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
  Transfer,
  List,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  StopOutlined,
  UserOutlined,
  MenuOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
  SyncOutlined
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
// Add dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTableSearch } from '../../components/TableSearch';

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

// Add interface for candidate with order information
interface OrderedCandidate extends Candidate {
  order?: number;
}

// Add SortableItem component for DND
function SortableItem({ id, candidate, collegeInfoList }: { id: string, candidate: Candidate | null, collegeInfoList: CollegeInfo[] }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 999 : 1,
    position: 'relative' as const
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className={`flex items-center p-3 border rounded mb-2 bg-white shadow-sm hover:shadow-md transition-all duration-200 ${isDragging ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 mr-3 text-gray-400">
          <MenuOutlined />
        </div>
        <div className="flex-1">
          <span className="font-medium text-gray-800">{candidate?.name}</span>
          <span className="ml-2 text-gray-500">
            - {candidate?.college_id ? getCollegeNameById(collegeInfoList, candidate.college_id.toString()) : '未知学院'}
          </span>
        </div>
      </div>
    </div>
  );
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
  const [orderedTargetKeys, setOrderedTargetKeys] = useState<string[]>([]);
  const { getColumnSearchProps } = useTableSearch<ApiActivity>();

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // 处理拖拽结束事件
  const handleDragEnd = (event: DragEndEvent, isForm: boolean = false) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = orderedTargetKeys.indexOf(active.id.toString());
      const newIndex = orderedTargetKeys.indexOf(over.id.toString());
      
      const newOrderedKeys = arrayMove(orderedTargetKeys, oldIndex, newIndex);
      setOrderedTargetKeys(newOrderedKeys);
      
      // 如果是表单中的拖拽，更新表单值
      if (isForm) {
        form.setFieldsValue({ 
          candidate_ids: newOrderedKeys.map(id => parseInt(id, 10))
        });
      }
    }
  };

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
      width: 200,
      ...getColumnSearchProps({
        dataIndex: 'title',
        placeholder: '搜索活动名称'
      })
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

  // Handle edit activity
  const handleEdit = (activity: ApiActivity) => {
    setModalType('edit');
    setCurrentActivity(activity);
    
    // Initialize ordered candidates 
    setOrderedTargetKeys(activity.candidate_ids.map(id => id.toString()));
    
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

  // Handle add activity
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
    // Clear ordered candidates
    setOrderedTargetKeys([]);
    setIsModalVisible(true);
  };

  // Handle form's candidate selection change
  const handleCandidateSelectionChange = (selectedIds: number[]) => {
    // Update form value
    form.setFieldsValue({ candidate_ids: selectedIds });
    
    // Update ordered keys with the new selection
    const selectedIdsAsStrings = selectedIds.map(id => id.toString());
    
    // Keep existing ordered items that are still selected
    const existingKeys = orderedTargetKeys.filter(key => 
      selectedIdsAsStrings.includes(key)
    );
    
    // Add newly selected items at the end
    const newKeys = selectedIdsAsStrings.filter(key => 
      !orderedTargetKeys.includes(key)
    );
    
    setOrderedTargetKeys([...existingKeys, ...newKeys]);
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
      
      // Get candidate IDs in proper order if we're in edit mode
      // and have ordered some candidates, otherwise use form values
      const candidateIds = modalType === 'edit' && orderedTargetKeys.length > 0
        ? orderedTargetKeys.map(id => parseInt(id, 10))
        : values.candidate_ids;
        
      // Construct API request data format
      const activityData = {
        title: values.title,
        description: values.description,
        start_time: values.timeRange[0].format('YYYY-MM-DDTHH:mm:ss'),
        end_time: values.timeRange[1].format('YYYY-MM-DDTHH:mm:ss'),
        is_active: values.is_active,
        candidate_ids: candidateIds,
        max_votes: values.max_votes,
        min_votes: values.min_votes,
      };
      
      if (modalType === 'create') {
        // Create new activity
        await createActivity(activityData);
        message.success('活动创建成功');
      } else if (currentActivity) {
        // Update existing activity
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
    // Initialize selected candidates and preserve their order
    const candidateIds = activity.candidate_ids.map(id => id.toString());
    setTargetKeys(candidateIds);
    setOrderedTargetKeys(candidateIds);
    setCandidatesModalVisible(true);
  };

  // Handle candidate transfer change
  const handleTransferChange = (newTargetKeys: React.Key[]) => {
    setTargetKeys(newTargetKeys.map(key => key.toString()));
    
    // Update ordered keys by:
    // 1. Keeping existing ordered keys that are still in target keys
    // 2. Adding new keys at the end
    const existingKeys = orderedTargetKeys.filter(key => 
      newTargetKeys.includes(key)
    );
    
    const newKeys = newTargetKeys
      .filter(key => !orderedTargetKeys.includes(key.toString()))
      .map(key => key.toString());
    
    setOrderedTargetKeys([...existingKeys, ...newKeys]);
  };
  
  // Save candidates with their order
  const handleSaveCandidates = async () => {
    if (!selectedActivity) return;
    
    try {
      // Use the ordered candidate IDs instead of targetKeys
      const updatedActivity = {
        ...selectedActivity,
        candidate_ids: orderedTargetKeys.map(key => parseInt(key, 10)),
      };
      
      await updateActivity(selectedActivity.id, updatedActivity);
      message.success('候选人顺序更新成功');
      setCandidatesModalVisible(false);
      fetchActivities();
    } catch (error) {
      message.error('更新候选人失败');
      console.error(error);
    }
  };
  
  // Get candidate information by ID
  const getCandidateById = (id: string) => {
    const candidate = candidates.find(c => c.id.toString() === id);
    return candidate || null;
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
              onChange={handleCandidateSelectionChange}
            >
              {candidates.map(candidate => (
                <Option key={candidate.id} value={candidate.id}>
                  {candidate.name} - {getCollegeNameById(collegeInfoList, candidate.college_id.toString())}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          {/* 候选人排序 */}
          {orderedTargetKeys.length > 0 && (
            <Form.Item label="候选人顺序" extra="可以通过拖拽调整候选人在投票界面中的显示顺序">
              <Card 
                size="small" 
                className="border border-gray-200 rounded-lg shadow-sm"
                bodyStyle={{ maxHeight: '300px', overflow: 'auto', padding: '16px' }}
              >
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, true)}
                >
                  <SortableContext 
                    items={orderedTargetKeys} 
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {orderedTargetKeys.map((id) => (
                        <SortableItem 
                          key={id} 
                          id={id}
                          candidate={getCandidateById(id)}
                          collegeInfoList={collegeInfoList}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </Card>
            </Form.Item>
          )}
          
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
        <div className="mb-4">
          <p>从上方选择要包含在活动中的候选人，下方可通过拖拽调整候选人顺序：</p>
        </div>
        <div className="flex flex-col space-y-4">
          <div className="w-full">
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
                width: '100%',
                height: 250,
              }}
              showSearch
              filterOption={(inputValue, item) =>
                item.title.indexOf(inputValue) !== -1 || item.description.indexOf(inputValue) !== -1
              }
            />
          </div>
          
          <div className="w-full">
            <Card 
              title={
                <div className="flex items-center">
                  <MenuOutlined className="mr-2 text-blue-500" />
                  <span>候选人顺序</span>
                </div>
              } 
              className="w-full border border-gray-200 rounded-lg shadow-sm"
            >
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={orderedTargetKeys} 
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 p-2">
                    {orderedTargetKeys.map((id) => (
                      <SortableItem 
                        key={id} 
                        id={id}
                        candidate={getCandidateById(id)}
                        collegeInfoList={collegeInfoList}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </Card>
          </div>
        </div>
      </Modal>
    </div>
  );
} 