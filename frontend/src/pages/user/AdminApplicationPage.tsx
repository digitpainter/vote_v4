import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Form, Select, Input, Button, 
  message, Table, Tag, Space, Modal 
} from 'antd';
import { 
  AdminType, 
  ApplicationStatus, 
  AdminApplication 
} from '../../types/admin';
import { createAdminApplication, getMyApplications } from '../../api/admin';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 状态标签颜色映射
const statusColors = {
  [ApplicationStatus.PENDING]: 'orange',
  [ApplicationStatus.APPROVED]: 'green',
  [ApplicationStatus.REJECTED]: 'red',
};

// 状态标签文字映射
const statusLabels = {
  [ApplicationStatus.PENDING]: '审核中',
  [ApplicationStatus.APPROVED]: '已通过',
  [ApplicationStatus.REJECTED]: '已拒绝',
};

// 管理员类型文字映射
const adminTypeLabels = {
  [AdminType.SCHOOL]: '校级管理员',
  [AdminType.COLLEGE]: '院级管理员',
};

const AdminApplicationPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [selectedType, setSelectedType] = useState<AdminType>();
  const [collegeOptions, setCollegeOptions] = useState<{id: string, name: string}[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentApplication, setCurrentApplication] = useState<AdminApplication | null>(null);
  
  // 加载我的申请记录
  const fetchMyApplications = async () => {
    setLoading(true);
    try {
      const data = await getMyApplications();
      setApplications(data);
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('获取申请记录失败');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 组件加载时获取申请记录和学院数据
  useEffect(() => {
    fetchMyApplications();
    // 模拟学院数据，实际项目中应通过API获取
    setCollegeOptions([
      { id: '001', name: '计算机学院' },
      { id: '002', name: '电子工程学院' },
      { id: '003', name: '机械工程学院' },
      { id: '004', name: '理学院' },
      { id: '005', name: '文学院' }
    ]);
  }, []);
  
  // 提交申请
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      await createAdminApplication({
        admin_type: values.admin_type,
        college_id: values.admin_type === AdminType.COLLEGE ? values.college_id : undefined,
        college_name: values.admin_type === AdminType.COLLEGE ? 
          collegeOptions.find(c => c.id === values.college_id)?.name : undefined,
        reason: values.reason
      });
      
      message.success('申请已提交，请等待审核');
      form.resetFields();
      fetchMyApplications();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('提交申请失败');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  // 管理员类型变更
  const handleTypeChange = (value: AdminType) => {
    setSelectedType(value);
  };
  
  // 查看申请详情
  const handleViewDetail = (application: AdminApplication) => {
    setCurrentApplication(application);
    setDetailVisible(true);
  };
  
  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '申请类型',
      dataIndex: 'admin_type',
      key: 'admin_type',
      render: (type: AdminType) => adminTypeLabels[type]
    },
    {
      title: '学院',
      dataIndex: 'college_name',
      key: 'college_name',
      render: (text: string) => text || '不适用'
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ApplicationStatus) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AdminApplication) => (
        <Button type="link" onClick={() => handleViewDetail(record)}>
          查看详情
        </Button>
      )
    }
  ];
  
  // 判断是否有待处理的申请
  const hasPendingApplication = applications.some(app => app.status === ApplicationStatus.PENDING);
  
  return (
    <div className="admin-application-page p-6">
      <Title level={2}>管理员权限申请</Title>
      <Paragraph className="mb-4">
        您可以申请成为校级管理员或院级管理员。申请提交后将由校级管理员审核。
      </Paragraph>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 申请表单 */}
        <Card title="提交申请" className="mb-4">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="admin_type"
              label="申请类型"
              rules={[{ required: true, message: '请选择申请类型' }]}
            >
              <Select 
                placeholder="请选择申请类型" 
                onChange={handleTypeChange}
                disabled={hasPendingApplication}
              >
                <Option value={AdminType.SCHOOL}>校级管理员</Option>
                <Option value={AdminType.COLLEGE}>院级管理员</Option>
              </Select>
            </Form.Item>
            
            {selectedType === AdminType.COLLEGE && (
              <Form.Item
                name="college_id"
                label="所属学院"
                rules={[{ required: true, message: '请选择所属学院' }]}
              >
                <Select 
                  placeholder="请选择所属学院"
                  disabled={hasPendingApplication}
                >
                  {collegeOptions.map(college => (
                    <Option key={college.id} value={college.id}>
                      {college.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            
            <Form.Item
              name="reason"
              label="申请理由"
              rules={[
                { required: true, message: '请填写申请理由' },
                { min: 10, message: '申请理由至少10个字符' }
              ]}
            >
              <TextArea 
                placeholder="请详细说明申请成为管理员的理由" 
                rows={4}
                maxLength={500}
                showCount
                disabled={hasPendingApplication}
              />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
                disabled={hasPendingApplication}
              >
                提交申请
              </Button>
              {hasPendingApplication && (
                <span className="ml-4 text-yellow-500">
                  您有待审核的申请，暂时无法提交新申请
                </span>
              )}
            </Form.Item>
          </Form>
        </Card>
        
        {/* 申请记录 */}
        <Card title="我的申请记录" className="mb-4">
          <Table 
            dataSource={applications} 
            columns={columns} 
            rowKey="id"
            loading={loading}
            pagination={false}
            locale={{ emptyText: '暂无申请记录' }}
          />
        </Card>
      </div>
      
      {/* 详情弹窗 */}
      <Modal
        title="申请详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {currentApplication && (
          <div>
            <p><strong>申请ID：</strong> {currentApplication.id}</p>
            <p><strong>申请类型：</strong> {adminTypeLabels[currentApplication.admin_type]}</p>
            {currentApplication.college_name && (
              <p><strong>学院：</strong> {currentApplication.college_name}</p>
            )}
            <p><strong>申请状态：</strong> 
              <Tag color={statusColors[currentApplication.status]}>
                {statusLabels[currentApplication.status]}
              </Tag>
            </p>
            <p><strong>申请时间：</strong> {new Date(currentApplication.created_at).toLocaleString()}</p>
            
            <div className="my-4">
              <p><strong>申请理由：</strong></p>
              <Paragraph className="bg-gray-50 p-3 rounded">
                {currentApplication.reason}
              </Paragraph>
            </div>
            
            {currentApplication.review_comment && (
              <div className="my-4">
                <p><strong>审核意见：</strong></p>
                <Paragraph className="bg-gray-50 p-3 rounded">
                  {currentApplication.review_comment}
                </Paragraph>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminApplicationPage; 