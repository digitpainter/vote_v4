import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Tabs, Table, Tag, Button, 
  Space, Modal, Form, Input, Radio, message 
} from 'antd';
import { 
  AdminType, 
  ApplicationStatus, 
  AdminApplication 
} from '../../types/admin';
import { getAllApplications, reviewApplication } from '../../api/admin';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
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

const AdminApplicationsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [currentTab, setCurrentTab] = useState<ApplicationStatus | 'all'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [currentApplication, setCurrentApplication] = useState<AdminApplication | null>(null);
  
  // 加载申请列表
  const fetchApplications = async (status?: ApplicationStatus) => {
    setLoading(true);
    try {
      const data = await getAllApplications(status);
      setApplications(data);
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('获取申请列表失败');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 组件加载时获取全部申请
  useEffect(() => {
    fetchApplications();
  }, []);
  
  // 处理标签页切换
  const handleTabChange = (key: string) => {
    setCurrentTab(key as ApplicationStatus | 'all');
    if (key === 'all') {
      fetchApplications();
    } else {
      fetchApplications(key as ApplicationStatus);
    }
  };
  
  // 打开申请详情/审核弹窗
  const handleOpenModal = (application: AdminApplication) => {
    setCurrentApplication(application);
    form.resetFields();
    if (application.status === ApplicationStatus.PENDING) {
      form.setFieldsValue({
        status: ApplicationStatus.APPROVED,
        review_comment: ''
      });
    }
    setModalVisible(true);
  };
  
  // 审核申请
  const handleReview = async () => {
    if (!currentApplication) return;
    
    try {
      // 非待审核状态不允许修改
      if (currentApplication.status !== ApplicationStatus.PENDING) {
        setModalVisible(false);
        return;
      }
      
      const values = await form.validateFields();
      setProcessing(true);
      
      await reviewApplication(currentApplication.id, {
        status: values.status,
        review_comment: values.review_comment
      });
      
      message.success('审核完成');
      setModalVisible(false);
      
      // 刷新当前列表
      if (currentTab === 'all') {
        fetchApplications();
      } else {
        fetchApplications(currentTab as ApplicationStatus);
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('审核失败');
      }
    } finally {
      setProcessing(false);
    }
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
      title: '申请人',
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: AdminApplication) => (
        <span>{text} ({record.staff_id})</span>
      )
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
        <Button 
          type={record.status === ApplicationStatus.PENDING ? "primary" : "link"}
          onClick={() => handleOpenModal(record)}
        >
          {record.status === ApplicationStatus.PENDING ? '审核' : '查看'}
        </Button>
      )
    }
  ];
  
  return (
    <div className="admin-applications-page">
      <div className="mb-4">
        <Title level={2}>管理员申请审核</Title>
        <Paragraph>
          在这里您可以审核用户提交的管理员权限申请。
        </Paragraph>
      </div>
      
      <Tabs activeKey={currentTab} onChange={handleTabChange}>
        <TabPane tab="全部" key="all" />
        <TabPane tab="待审核" key={ApplicationStatus.PENDING} />
        <TabPane tab="已通过" key={ApplicationStatus.APPROVED} />
        <TabPane tab="已拒绝" key={ApplicationStatus.REJECTED} />
      </Tabs>
      
      <Card>
        <Table 
          columns={columns} 
          dataSource={applications} 
          rowKey="id" 
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>
      
      {/* 申请详情/审核弹窗 */}
      <Modal
        title={
          currentApplication?.status === ApplicationStatus.PENDING 
            ? "审核申请" 
            : "申请详情"
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={
          currentApplication?.status === ApplicationStatus.PENDING 
            ? [
                <Button key="cancel" onClick={() => setModalVisible(false)}>
                  取消
                </Button>,
                <Button 
                  key="submit" 
                  type="primary" 
                  loading={processing}
                  onClick={handleReview}
                >
                  提交审核
                </Button>
              ]
            : [
                <Button key="close" onClick={() => setModalVisible(false)}>
                  关闭
                </Button>
              ]
        }
        width={600}
      >
        {currentApplication && (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p><strong>申请ID：</strong> {currentApplication.id}</p>
              <p><strong>申请人：</strong> {currentApplication.username} ({currentApplication.staff_id})</p>
              <p><strong>申请类型：</strong> {adminTypeLabels[currentApplication.admin_type]}</p>
              {currentApplication.college_name && (
                <p><strong>学院：</strong> {currentApplication.college_name}</p>
              )}
              <p><strong>申请时间：</strong> {new Date(currentApplication.created_at).toLocaleString()}</p>
              
              {currentApplication.status !== ApplicationStatus.PENDING && (
                <p>
                  <strong>状态：</strong> 
                  <Tag color={statusColors[currentApplication.status]} className="ml-2">
                    {statusLabels[currentApplication.status]}
                  </Tag>
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <p><strong>申请理由：</strong></p>
              <div className="p-3 bg-gray-50 rounded">
                {currentApplication.reason}
              </div>
            </div>
            
            {currentApplication.status === ApplicationStatus.PENDING ? (
              <Form
                form={form}
                layout="vertical"
              >
                <Form.Item
                  name="status"
                  label="审核结果"
                  rules={[{ required: true, message: '请选择审核结果' }]}
                  initialValue={ApplicationStatus.APPROVED}
                >
                  <Radio.Group>
                    <Space direction="vertical">
                      <Radio value={ApplicationStatus.APPROVED}>
                        <span className="text-green-600">通过申请</span>
                      </Radio>
                      <Radio value={ApplicationStatus.REJECTED}>
                        <span className="text-red-600">拒绝申请</span>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>
                
                <Form.Item
                  name="review_comment"
                  label="审核意见"
                >
                  <TextArea 
                    placeholder="请输入审核意见（可选）" 
                    rows={4}
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              </Form>
            ) : currentApplication.review_comment ? (
              <div>
                <p><strong>审核意见：</strong></p>
                <div className="p-3 bg-gray-50 rounded">
                  {currentApplication.review_comment}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminApplicationsPage; 