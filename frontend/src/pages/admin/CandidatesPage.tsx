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
  Col,
  Spin,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UploadOutlined, 
  TeamOutlined,
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import type { InputRef } from 'antd';
import type { ColumnType } from 'antd/es/table';
import type { FilterConfirmProps } from 'antd/es/table/interface';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import { getAllCandidates, updateCandidate, createCandidate, deleteCandidate, removeCandidateFromActivity, getAllActivities, uploadImage } from '../../api/vote';
import { getAllCollegeInfo, CollegeInfo, getCollegeNameById } from '../../api/college';
import { Activity } from '../../types/activity';
import { useTableSearch } from '../../components/TableSearch';

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
  quote?: string;
  review?: string;
  video_url?: string;
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
  const [collegeInfoList, setCollegeInfoList] = useState<CollegeInfo[]>([]);
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
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const { getColumnSearchProps } = useTableSearch<Candidate>();

  // 获取候选人数据并更新学院名称
  const fetchCandidates = async () => {
    try {
      const data = await getAllCandidates();
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

  // 获取学院信息
  const fetchCollegeInfo = async () => {
    try {
      const data = await getAllCollegeInfo();
      setCollegeInfoList(data);
      return data;
    } catch (error) {
      console.error('获取学院信息失败:', error);
      message.error('获取学院信息失败');
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

  // 根据college_id更新所有候选人的college_name
  const updateCandidatesCollegeName = (candidates: Candidate[], collegeList: CollegeInfo[]) => {
    if (!collegeList.length) return candidates;
    
    return candidates.map(candidate => ({
      ...candidate,
      college_name: getCollegeNameById(collegeList, candidate.college_id)
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [candidatesData, activitiesData, collegeData] = await Promise.all([
          fetchCandidates(),
          fetchActivities(),
          fetchCollegeInfo()
        ]);
        
        // 根据college_id更新college_name
        const updatedWithCollegeNames = updateCandidatesCollegeName(candidatesData, collegeData);
        
        // 初始数据加载时手动关联活动
        if (updatedWithCollegeNames.length > 0 && activitiesData.length > 0) {
          const updatedCandidates = updatedWithCollegeNames.map((candidate: Candidate) => {
            const relatedActivities = activitiesData.filter((activity: Activity) => 
              activity.candidate_ids.includes(candidate.id)
            );
            return {
              ...candidate,
              activities: relatedActivities
            };
          });
          setCandidates(updatedCandidates);
        } else {
          setCandidates(updatedWithCollegeNames);
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
      
      // 更新学院名称
      const updatedWithCollegeNames = updateCandidatesCollegeName(candidatesData, collegeInfoList);
      
      // 手动关联数据而不是依赖useEffect
      if (updatedWithCollegeNames.length > 0 && activitiesData.length > 0) {
        const updatedCandidates = updatedWithCollegeNames.map((candidate: Candidate) => {
          const relatedActivities = activitiesData.filter((activity: Activity) => 
            activity.candidate_ids.includes(candidate.id)
          );
          return {
            ...candidate,
            activities: relatedActivities
          };
        });
        setCandidates(updatedCandidates);
      } else {
        setCandidates(updatedWithCollegeNames);
      }
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns: TableColumnsType<Candidate> = [
    {
      title: '候选人',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ...getColumnSearchProps({
        dataIndex: 'name',
        placeholder: '搜索候选人姓名'
      }),
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.photo} size="large" />
          <Text strong>{text}</Text>
        </div>
      ),
    },
    {
      title: '所属学院',
      dataIndex: 'college_id',
      key: 'college_name',
      width: 200,
      ...getColumnSearchProps({
        dataIndex: 'college_name',
        placeholder: '搜索学院名称'
      }),
      render: (collegeId, record) => getCollegeNameById(collegeInfoList, collegeId),
      filters: Array.from(new Set(collegeInfoList.map(c => c.YXDM_TEXT))).map(collegeName => ({
        text: collegeName,
        value: collegeName,
      })),
      onFilter: (value, record) => {
        const collegeName = getCollegeNameById(collegeInfoList, record.college_id);
        return collegeName.toLowerCase().includes(value.toString().toLowerCase());
      },
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
      width: 150,
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
      width: 150,
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
      college_name: getCollegeNameById(collegeInfoList, candidate.college_id),
      quote: candidate.quote,
      review: candidate.review,
      video_url: candidate.video_url
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

  // 处理图片上传前的预处理
  const beforeUpload = (file: RcFile) => {
    // 检查文件类型
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
      return Upload.LIST_IGNORE;
    }
    
    // 检查文件大小
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过2MB!');
      return Upload.LIST_IGNORE;
    }

    // 执行上传操作
    handleUpload(file);
    return false; // 阻止自动上传
  };

  // 处理图片上传
  const handleUpload = async (file: RcFile) => {
    try {
      setUploading(true);
      const imageUrl = await uploadImage(file);
      
      // 更新文件列表显示
      setFileList([
        {
          uid: '-1',
          name: file.name,
          status: 'done',
          url: imageUrl,
        },
      ]);
      
      // 保存上传后的图片URL
      setUploadedImageUrl(imageUrl);
      message.success('图片上传成功');
    } catch (error) {
      console.error('图片上传失败:', error);
      message.error('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 处理表单提交
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 从学院信息接口获取学院名称
      let collegeName = '';
      if (values.college_id && collegeInfoList.length > 0) {
        collegeName = getCollegeNameById(collegeInfoList, values.college_id);
      }

      // 使用上传后的图片URL，如果没有上传图片则使用默认图片或当前候选人的图片
      const photoUrl = uploadedImageUrl || 
                      (fileList.length > 0 && fileList[0].url ? fileList[0].url : 
                      (currentCandidate?.photo || 'https://placekitten.com/200/200'));
      
      // 准备要提交的数据
      const candidateData: CandidateFormData = {
        name: values.name,
        college_id: values.college_id,
        college_name: collegeName,
        photo: photoUrl,
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
      
      // 重置上传状态
      setUploadedImageUrl('');
      setIsModalVisible(false);
      // 刷新候选人列表和活动关联
      refreshData();
    } catch (error) {
      console.error('提交表单失败:', error);
      message.error('操作失败，请检查输入并重试');
    }
  };

  // 处理取消弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
    setUploadedImageUrl('');
  };

  // 处理学院选择
  const handleCollegeChange = (value: string) => {
    if (collegeInfoList.length > 0) {
      const collegeName = getCollegeNameById(collegeInfoList, value);
      form.setFieldsValue({ college_name: collegeName });
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
        onCancel={handleCancel}
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
            label="所属学院"
            rules={[{ required: true, message: '请选择所属学院' }]}
          >
            <Select 
              placeholder="请选择所属学院"
              onChange={handleCollegeChange}
              showSearch
              optionFilterProp="children"
            >
              {collegeInfoList.map(college => (
                <Option key={college.YXDM} value={college.YXDM}>{college.YXDM_TEXT}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="college_name"
            label="学院名称"
            hidden
          >
            <Input disabled />
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
            extra="支持JPG/PNG格式，大小不超过2MB"
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={beforeUpload}
              maxCount={1}
              showUploadList={{
                showPreviewIcon: true,
                showRemoveIcon: true,
                showDownloadIcon: false,
              }}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                  <div style={{ marginTop: 8 }}>
                    {uploading ? '上传中' : '上传照片'}
                  </div>
                </div>
              )}
            </Upload>
            {uploading && <Spin tip="图片上传中..." />}
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
                    {getCollegeNameById(collegeInfoList, currentCandidate.college_id)}
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