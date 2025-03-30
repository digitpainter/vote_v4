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
  EyeOutlined
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import type { InputRef } from 'antd';
import type { ColumnType } from 'antd/es/table';
import type { FilterConfirmProps } from 'antd/es/table/interface';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 候选人类型定义
interface Candidate {
  id: string;
  name: string;
  collegeId: string;
  collegeName: string;
  introduction: string;
  imageUrl: string;
  voteCount: number;
  activityId: string;
  activityName: string;
}

// 活动类型简化定义
interface Activity {
  id: string;
  name: string;
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

  // 模拟获取数据
  useEffect(() => {
    // 模拟API调用
    setTimeout(() => {
      const dummyActivities: Activity[] = [
        { id: '1', name: '2024学生会选举' },
        { id: '2', name: '优秀教师评选' },
        { id: '3', name: '最佳班级评选' }
      ];
      
      const dummyCandidates: Candidate[] = [
        {
          id: '1',
          name: '张三',
          collegeId: 'CS',
          collegeName: '计算机学院',
          introduction: '计算机科学与技术专业大三学生，担任班长，多次获得奖学金',
          imageUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
          voteCount: 245,
          activityId: '1',
          activityName: '2024学生会选举'
        },
        {
          id: '2',
          name: '李四',
          collegeId: 'CS',
          collegeName: '计算机学院',
          introduction: '软件工程专业大四学生，学生会主席，组织多项校园活动',
          imageUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
          voteCount: 189,
          activityId: '1',
          activityName: '2024学生会选举'
        },
        {
          id: '3',
          name: '王五',
          collegeId: 'BU',
          collegeName: '商学院',
          introduction: '金融专业研究生，多次参加商业竞赛并获奖',
          imageUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
          voteCount: 156,
          activityId: '1',
          activityName: '2024学生会选举'
        },
        {
          id: '4',
          name: '赵六',
          collegeId: 'LT',
          collegeName: '文学院',
          introduction: '中文系大三学生，校园文学社社长，发表多篇文学作品',
          imageUrl: 'https://randomuser.me/api/portraits/men/4.jpg',
          voteCount: 132,
          activityId: '1',
          activityName: '2024学生会选举'
        },
        {
          id: '5',
          name: '钱七',
          collegeId: 'SC',
          collegeName: '理学院',
          introduction: '物理专业大四学生，多次参加科研项目，发表多篇论文',
          imageUrl: 'https://randomuser.me/api/portraits/men/5.jpg',
          voteCount: 98,
          activityId: '1',
          activityName: '2024学生会选举'
        }
      ];
      
      setActivities(dummyActivities);
      setCandidates(dummyCandidates);
      setLoading(false);
    }, 1000);
  }, []);

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
          placeholder={`搜索${dataIndex === 'name' ? '姓名' : dataIndex === 'collegeName' ? '学院' : ''}`}
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
        <span style={{ backgroundColor: '#ffc069', padding: 0 }}>
          {text.toString().split(new RegExp(`(${searchText})`, 'gi')).map((fragment: string, i: number) => 
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
          <Avatar src={record.imageUrl} size="large" />
          <Text strong>{text}</Text>
        </div>
      ),
    },
    {
      title: '所属学院',
      dataIndex: 'collegeName',
      key: 'collegeName',
      ...getColumnSearchProps('collegeName'),
      filters: Array.from(new Set(candidates.map(c => c.collegeName))).map(collegeName => ({
        text: collegeName,
        value: collegeName,
      })),
      onFilter: (value, record) => record.collegeName === value,
    },
    {
      title: '简介',
      dataIndex: 'introduction',
      key: 'introduction',
      ellipsis: true,
    },
    {
      title: '所属活动',
      dataIndex: 'activityName',
      key: 'activityName',
      filters: Array.from(new Set(candidates.map(c => c.activityName))).map(activityName => ({
        text: activityName,
        value: activityName,
      })),
      onFilter: (value, record) => record.activityName === value,
    },
    {
      title: '获得票数',
      dataIndex: 'voteCount',
      key: 'voteCount',
      sorter: (a, b) => a.voteCount - b.voteCount,
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
      collegeId: candidate.collegeId,
      introduction: candidate.introduction,
      activityId: candidate.activityId,
    });
    setFileList([
      {
        uid: '-1',
        name: 'candidate-photo.png',
        status: 'done',
        url: candidate.imageUrl,
      },
    ]);
    setIsModalVisible(true);
  };

  // 处理查看候选人详情
  const handleView = (candidate: Candidate) => {
    setCurrentCandidate(candidate);
    setViewModalVisible(true);
  };

  // 处理删除候选人
  const handleDelete = (id: string) => {
    // 实际项目中应该调用API删除
    setCandidates(candidates.filter(item => item.id !== id));
    message.success('候选人已删除');
  };

  // 处理表单提交
  const handleFormSubmit = () => {
    form.validateFields().then(values => {
      // 实际项目中应该调用API保存
      const imageUrl = fileList.length > 0 && fileList[0].url 
        ? fileList[0].url 
        : 'https://randomuser.me/api/portraits/lego/1.jpg';
      
      const activityObj = activities.find(a => a.id === values.activityId);
      
      if (modalType === 'create') {
        // 新增候选人
        const newCandidate: Candidate = {
          id: `${Math.floor(Math.random() * 1000)}`,
          name: values.name,
          collegeId: values.collegeId,
          collegeName: values.collegeId === 'CS' ? '计算机学院' : 
                      values.collegeId === 'BU' ? '商学院' : 
                      values.collegeId === 'LT' ? '文学院' : '理学院',
          introduction: values.introduction,
          imageUrl: imageUrl,
          voteCount: 0,
          activityId: values.activityId,
          activityName: activityObj ? activityObj.name : '',
        };
        setCandidates([...candidates, newCandidate]);
        message.success('候选人创建成功');
      } else {
        // 更新候选人
        if (currentCandidate) {
          const updatedCandidates = candidates.map(item => 
            item.id === currentCandidate.id 
              ? { 
                  ...item, 
                  name: values.name, 
                  collegeId: values.collegeId,
                  collegeName: values.collegeId === 'CS' ? '计算机学院' : 
                              values.collegeId === 'BU' ? '商学院' : 
                              values.collegeId === 'LT' ? '文学院' : '理学院',
                  introduction: values.introduction,
                  imageUrl: imageUrl,
                  activityId: values.activityId,
                  activityName: activityObj ? activityObj.name : item.activityName,
                }
              : item
          );
          setCandidates(updatedCandidates);
          message.success('候选人更新成功');
        }
      }
      setIsModalVisible(false);
    });
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
            name="collegeId"
            label="所属学院"
            rules={[{ required: true, message: '请选择所属学院' }]}
          >
            <Select placeholder="请选择所属学院">
              <Option value="CS">计算机学院</Option>
              <Option value="BU">商学院</Option>
              <Option value="LT">文学院</Option>
              <Option value="SC">理学院</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="introduction"
            label="个人简介"
            rules={[{ required: true, message: '请输入个人简介' }]}
          >
            <TextArea rows={4} placeholder="请输入个人简介" />
          </Form.Item>
          
          <Form.Item
            name="activityId"
            label="所属活动"
            rules={[{ required: true, message: '请选择所属活动' }]}
          >
            <Select placeholder="请选择所属活动">
              {activities.map(activity => (
                <Option key={activity.id} value={activity.id}>{activity.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="image"
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
                  <Avatar src={currentCandidate.imageUrl} size={120} />
                </div>
                <div className="text-center mt-4">
                  <Tag icon={<TeamOutlined />} color="blue">
                    {currentCandidate.collegeName}
                  </Tag>
                </div>
              </Col>
              <Col span={16}>
                <Title level={3}>{currentCandidate.name}</Title>
                <Divider />
                <div className="mb-4">
                  <Text strong>所属活动：</Text>
                  <Text>{currentCandidate.activityName}</Text>
                </div>
                <div className="mb-4">
                  <Text strong>当前票数：</Text>
                  <Tag color="blue">{currentCandidate.voteCount}</Tag>
                </div>
                <div className="mb-4">
                  <Text strong>个人简介：</Text>
                  <Paragraph>{currentCandidate.introduction}</Paragraph>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
} 