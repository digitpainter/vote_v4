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
  Select, 
  Upload, 
  message, 
  Popconfirm,
  Card,
  Tooltip,
  Avatar,
  Divider,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UploadOutlined, 
  TeamOutlined,
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import type { InputRef } from 'antd';
import type { ColumnType } from 'antd/es/table';
import type { FilterConfirmProps } from 'antd/es/table/interface';
import type { UploadFile } from 'antd/es/upload/interface';
import { getAllCandidates, updateCandidate, createCandidate, deleteCandidate, removeCandidateFromActivity, getAllActivities } from '../../api/vote';
import { Activity } from '../../types/activity';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 候选人类型定义，根据API的返回格式调整
interface Candidate {
  id: number;
  name: string;
  college_id: string;
  college_name: string;
  bio: string;
  photo: string;
  vote_count: number;
  activities?: Activity[]; // 添加关联活动字段
}

// 编辑/创建候选人时提交的数据格式
interface CandidateFormData {
  name: string;
  college_id: string;
  photo: string;
  bio: string;
  college_name: string;
  quote?: string;
  review?: string;
  video_url?: string;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentActivityId, setCurrentActivityId] = useState<number | null>(null);

  // 获取候选人数据
  const fetchCandidates = async () => {
    try {
      const data = await getAllCandidates();
      setCandidates(data);
      return data;
    } catch (error) {
      console.error('获取候选人失败:', error);
      message.error('获取候选人列表失败');
      return [];
    }
  };

  // 获取活动数据
  const fetchActivities = async () => {
    try {
      const data = await getAllActivities();
      setActivities(data);
      return data;
    } catch (error) {
      console.error('获取活动失败:', error);
      message.error('获取活动列表失败');
      return [];
    }
  };

  // 为候选人关联活动信息
  const mapCandidatesToActivities = () => {
    if (candidates.length === 0 || activities.length === 0) return;

    const updatedCandidates = candidates.map(candidate => {
      const relatedActivities = activities.filter(activity => 
        activity.candidate_ids.includes(candidate.id)
      );
      return {
        ...candidate,
        activities: relatedActivities
      };
    });

    setCandidates(updatedCandidates);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [candidatesData, activitiesData] = await Promise.all([
          fetchCandidates(),
          fetchActivities()
        ]);
        
        // 初始数据加载时手动关联活动
        if (candidatesData.length > 0 && activitiesData.length > 0) {
          const updatedCandidates = candidatesData.map((candidate: Candidate) => {
            const relatedActivities = activitiesData.filter((activity: Activity) => 
              activity.candidate_ids.includes(candidate.id)
            );
            return {
              ...candidate,
              activities: relatedActivities
            };
          });
          setCandidates(updatedCandidates);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // 仅在活动数据变化时重新关联
  useEffect(() => {
    if (activities.length > 0 && candidates.length > 0) {
      const candidateIds = candidates.map(c => c.id);
      const updatedCandidates = [...candidates];
      
      // 只更新现有候选人的活动关联，不创建新的候选人对象
      for (let i = 0; i < updatedCandidates.length; i++) {
        const candidate = updatedCandidates[i];
        const relatedActivities = activities.filter(activity => 
          activity.candidate_ids.includes(candidate.id)
        );
        updatedCandidates[i] = {
          ...candidate,
          activities: relatedActivities
        };
      }
      
      setCandidates(updatedCandidates);
    }
  }, [activities]);

  // 刷新数据
  const refreshData = async () => {
    setLoading(true);
    try {
      const [candidatesData, activitiesData] = await Promise.all([
        fetchCandidates(),
        fetchActivities()
      ]);
      
      // 手动关联数据而不是依赖useEffect
      if (candidatesData.length > 0 && activitiesData.length > 0) {
        const updatedCandidates = candidatesData.map((candidate: Candidate) => {
          const relatedActivities = activitiesData.filter((activity: Activity) => 
            activity.candidate_ids.includes(candidate.id)
          );
          return {
            ...candidate,
            activities: relatedActivities
          };
        });
        setCandidates(updatedCandidates);
      }
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索处理函数
  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: keyof Candidate,
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
  const getColumnSearchProps = (dataIndex: keyof Candidate): ColumnType<Candidate> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`搜索${dataIndex === 'name' ? '姓名' : dataIndex === 'college_name' ? '学院' : ''}`}
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
      (record[dataIndex]?.toString() || '')
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
        <span style={{ backgroundColor: '#ffc069', padding: 0 }}>
          {(text?.toString() || '').split(new RegExp(`(${searchText})`, 'gi')).map((fragment: string, i: number) => 
            fragment.toLowerCase() === searchText.toLowerCase() ? 
              <span key={i} className="bg-yellow-200">{fragment}</span> : fragment
          )}
        </span>
      ) : (
        text
      ),
  });

  // 表格列定义
  const columns: TableColumnsType<Candidate> = [
    {
      title: '候选人',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name'),
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.photo} size="large" />
          <Text strong>{text}</Text>
        </div>
      ),
    },
    {
      title: '所属学院',
      dataIndex: 'college_name',
      key: 'college_name',
      ...getColumnSearchProps('college_name'),
      filters: Array.from(new Set(candidates.map(c => c.college_name))).map(collegeName => ({
        text: collegeName,
        value: collegeName,
      })),
      onFilter: (value, record) => record.college_name === value,
    },
    {
      title: '简介',
      dataIndex: 'bio',
      key: 'bio',
      ellipsis: true,
    },
    {
      title: '参与活动',
      key: 'activities',
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {record.activities && record.activities.length > 0 ? (
            record.activities.map(activity => (
              <Tag 
                key={activity.id} 
                color="green"
                icon={<CalendarOutlined />}
                style={{ margin: '2px 0' }}
              >
                {activity.title}
              </Tag>
            ))
          ) : (
            <Text type="secondary">未参与任何活动</Text>
          )}
        </Space>
      ),
    },
    {
      title: '获得票数',
      dataIndex: 'vote_count',
      key: 'vote_count',
      sorter: (a, b) => a.vote_count - b.vote_count,
      render: (votes) => <Tag color="blue">{votes}</Tag>,
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
              title="确定要删除这位候选人吗？"
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

  // 处理新增候选人
  const handleAdd = () => {
    setModalType('create');
    setCurrentCandidate(null);
    form.resetFields();
    setFileList([]);
    setIsModalVisible(true);
  };

  // 处理编辑候选人
  const handleEdit = (candidate: Candidate) => {
    setModalType('edit');
    setCurrentCandidate(candidate);
    form.setFieldsValue({
      name: candidate.name,
      college_id: candidate.college_id,
      bio: candidate.bio,
      college_name: candidate.college_name,
    });
    setFileList([
      {
        uid: '-1',
        name: 'candidate-photo.png',
        status: 'done',
        url: candidate.photo,
      },
    ]);
    setIsModalVisible(true);
  };

  // 处理查看候选人详情
  const handleView = (candidate: Candidate) => {
    setCurrentCandidate(candidate);
    if (candidate.activities && candidate.activities.length > 0) {
      setCurrentActivityId(candidate.activities[0].id);
    }
    setViewModalVisible(true);
  };

  // 处理删除候选人
  const handleDelete = async (id: number) => {
    try {
      await deleteCandidate(id);
      message.success('候选人已删除');
      // 刷新候选人列表和活动关联
      refreshData();
    } catch (error) {
      console.error('删除候选人失败:', error);
      message.error('删除候选人失败');
    }
  };

  // 从活动中移除候选人
  const handleRemoveFromActivity = async (activityId: number, candidateId: number) => {
    try {
      await removeCandidateFromActivity(activityId, candidateId);
      message.success('已从活动中移除该候选人');
      // 刷新活动和候选人数据
      refreshData();
      setViewModalVisible(false);
    } catch (error) {
      console.error('从活动中移除候选人失败:', error);
      message.error('从活动中移除候选人失败');
    }
  };

  // 处理表单提交
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 准备要提交的数据
      const candidateData: CandidateFormData = {
        name: values.name,
        college_id: values.college_id,
        college_name: values.college_name,
        photo: fileList.length > 0 && fileList[0].url 
          ? fileList[0].url 
          : 'https://placekitten.com/200/200', // 默认图片
        bio: values.bio,
        quote: values.quote,
        review: values.review,
        video_url: values.video_url
      };
      
      if (modalType === 'create') {
        // 创建新候选人
        await createCandidate(candidateData);
        message.success('候选人创建成功');
      } else if (currentCandidate) {
        // 更新现有候选人
        await updateCandidate(currentCandidate.id, candidateData);
        message.success('候选人更新成功');
      }
      
      setIsModalVisible(false);
      // 刷新候选人列表和活动关联
      refreshData();
    } catch (error) {
      console.error('提交表单失败:', error);
      message.error('操作失败，请检查输入并重试');
    }
  };

  // 处理活动选择变更
  const handleActivityChange = (activityId: number) => {
    setCurrentActivityId(activityId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>候选人管理</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
        >
          新增候选人
        </Button>
      </div>
      
      {/* 候选人列表 */}
      <Card className="mb-6 shadow-sm">
        <Table 
          columns={columns} 
          dataSource={candidates}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      {/* 添加/编辑候选人弹窗 */}
      <Modal
        title={modalType === 'create' ? '新增候选人' : '编辑候选人'}
        open={isModalVisible}
        onOk={handleFormSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={modalType === 'create' ? '创建' : '保存'}
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          name="candidateForm"
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入候选人姓名' }]}
          >
            <Input placeholder="请输入候选人姓名" />
          </Form.Item>
          
          <Form.Item
            name="college_id"
            label="学院ID"
            rules={[{ required: true, message: '请输入学院ID' }]}
          >
            <Input placeholder="请输入学院ID" />
          </Form.Item>
          
          <Form.Item
            name="college_name"
            label="学院名称"
            rules={[{ required: true, message: '请输入学院名称' }]}
          >
            <Input placeholder="请输入学院名称" />
          </Form.Item>
          
          <Form.Item
            name="bio"
            label="个人简介"
            rules={[{ required: true, message: '请输入个人简介' }]}
          >
            <TextArea rows={4} placeholder="请输入个人简介" />
          </Form.Item>
          
          <Form.Item
            name="quote"
            label="个人格言"
          >
            <Input placeholder="请输入个人格言" />
          </Form.Item>
          
          <Form.Item
            name="review"
            label="评价"
          >
            <TextArea rows={3} placeholder="请输入评价" />
          </Form.Item>
          
          <Form.Item
            name="video_url"
            label="视频链接"
          >
            <Input placeholder="请输入视频链接" />
          </Form.Item>
          
          <Form.Item
            name="photo"
            label="照片"
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              maxCount={1}
            >
              {fileList.length === 0 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传照片</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 候选人详情弹窗 */}
      <Modal
        title="候选人详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={700}
      >
        {currentCandidate && (
          <div className="p-4">
            <Row gutter={24}>
              <Col span={8}>
                <div className="flex justify-center">
                  <Avatar src={currentCandidate.photo} size={120} />
                </div>
                <div className="text-center mt-4">
                  <Tag icon={<TeamOutlined />} color="blue">
                    {currentCandidate.college_name}
                  </Tag>
                </div>
              </Col>
              <Col span={16}>
                <Title level={3}>{currentCandidate.name}</Title>
                <Divider />
                <div className="mb-4">
                  <Text strong>学院ID：</Text>
                  <Text>{currentCandidate.college_id}</Text>
                </div>
                <div className="mb-4">
                  <Text strong>当前票数：</Text>
                  <Tag color="blue">{currentCandidate.vote_count}</Tag>
                </div>
                <div className="mb-4">
                  <Text strong>个人简介：</Text>
                  <Paragraph>{currentCandidate.bio}</Paragraph>
                </div>
                
                {/* 关联活动部分 */}
                <div className="mb-4">
                  <Text strong>参与的活动：</Text>
                  {currentCandidate.activities && currentCandidate.activities.length > 0 ? (
                    <div className="mt-2">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {currentCandidate.activities.map(activity => (
                          <Card 
                            key={activity.id} 
                            size="small" 
                            title={
                              <Space>
                                <CalendarOutlined />
                                <span>{activity.title}</span>
                              </Space>
                            }
                            extra={
                              <Popconfirm
                                title="确定要从该活动中移除此候选人吗？"
                                onConfirm={() => handleRemoveFromActivity(activity.id, currentCandidate.id)}
                                okText="确定"
                                cancelText="取消"
                              >
                                <Button danger size="small">移除</Button>
                              </Popconfirm>
                            }
                            style={{ marginBottom: 8 }}
                          >
                            <p>
                              <Text type="secondary">
                                活动时间: {new Date(activity.start_time).toLocaleDateString()} - {new Date(activity.end_time).toLocaleDateString()}
                              </Text>
                            </p>
                            <p>
                              <Text type="secondary">
                                活动状态: {activity.is_active ? <Tag color="green">进行中</Tag> : <Tag color="default">已结束</Tag>}
                              </Text>
                            </p>
                          </Card>
                        ))}
                      </Space>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <Text type="secondary">该候选人未参与任何活动</Text>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
} 