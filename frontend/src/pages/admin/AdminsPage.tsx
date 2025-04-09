import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  message, 
  Typography, 
  Popconfirm, 
  Tag 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UserAddOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Admin, AdminType, AdminCreate, AdminUpdate } from '../../types/admin';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../../api/admin';
import { getColleges } from '../../api/college';

const { Title } = Typography;
const { Option } = Select;

interface College {
  id: string;
  name: string;
}

const AdminsPage: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [form] = Form.useForm();

  // Fetch admins and colleges on component mount
  useEffect(() => {
    fetchAdmins();
    fetchColleges();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await getAdmins();
      setAdmins(data);
    } catch (error: any) {
      console.error('获取管理员列表失败:', error);
      if (error.response?.data?.detail) {
        message.error(`获取管理员列表失败: ${error.response.data.detail}`);
      } else {
        message.error('获取管理员列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const data = await getColleges();
      setColleges(data);
    } catch (error) {
      message.error('获取院系列表失败');
    }
  };

  const showAddModal = () => {
    setModalTitle('添加管理员');
    setEditingAdmin(null);
    form.resetFields();
    setModalVisible(true);
  };

  const showEditModal = (admin: Admin) => {
    setModalTitle('编辑管理员');
    setEditingAdmin(admin);
    form.setFieldsValue({
      stuff_id: admin.stuff_id,
      admin_type: admin.admin_type,
      college_id: admin.college_id,
      college_name: admin.college_name
    });
    setModalVisible(true);
  };

  const handleAdminTypeChange = (value: AdminType) => {
    // If admin type is SCHOOL, clear college fields
    if (value === AdminType.SCHOOL) {
      form.setFieldsValue({ college_id: undefined, college_name: undefined });
    }
  };

  const handleCollegeChange = (value: string) => {
    // 不再需要设置 college_name，因为我们在提交时会处理
    console.log(`Selected college ID: ${value}`);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 额外验证：如果是院级管理员，必须有院系ID
      if (values.admin_type === AdminType.COLLEGE && (!values.college_id)) {
        message.error('院级管理员必须选择有效的院系');
        return;
      }
      
      // 检查 stuff_id 是否已存在（仅在创建新管理员时）
      if (!editingAdmin && values.stuff_id) {
        const existingAdmin = admins.find(admin => admin.stuff_id === values.stuff_id);
        if (existingAdmin) {
          message.error(`工号 ${values.stuff_id} 已被使用，请使用其他工号`);
          return;
        }
      }
      
      let adminData: AdminCreate | AdminUpdate = {
        ...values,
        college_id: values.admin_type === AdminType.COLLEGE ? values.college_id : undefined,
      };
      
      // 如果是院级管理员，通过 college_id 获取 college_name
      if (values.admin_type === AdminType.COLLEGE && values.college_id) {
        const selectedCollege = colleges.find(c => c.id === values.college_id);
        if (selectedCollege) {
          adminData.college_name = selectedCollege.name;
        } else {
          message.error('无法获取所选院系的名称，请重新选择');
          return;
        }
      } else {
        adminData.college_name = undefined;
      }

      if (editingAdmin) {
        // Update existing admin
        await updateAdmin(editingAdmin.stuff_id, adminData as AdminUpdate);
        message.success('管理员更新成功');
      } else {
        // Create new admin
        await createAdmin(adminData as AdminCreate);
        message.success('管理员添加成功');
      }

      setModalVisible(false);
      fetchAdmins();
    } catch (error: any) {
      console.error('操作失败:', error);
      // 从错误响应中提取详细信息
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else if (error.message) {
        message.error(error.message);
      } else {
        message.error('操作失败，请重试');
      }
    }
  };

  const handleDelete = async (stuffId: string) => {
    try {
      await deleteAdmin(stuffId);
      message.success('管理员删除成功');
      fetchAdmins();
    } catch (error: any) {
      console.error('删除失败:', error);
      // 从错误响应中提取详细信息
      if (error.response?.data?.detail) {
        message.error(`删除失败: ${error.response.data.detail}`);
      } else {
        message.error('删除失败，请重试');
      }
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '工号',
      dataIndex: 'stuff_id',
      key: 'stuff_id',
    },
    {
      title: '管理员类型',
      dataIndex: 'admin_type',
      key: 'admin_type',
      render: (type: AdminType) => (
        <Tag color={type === AdminType.SCHOOL ? 'blue' : 'green'}>
          {type === AdminType.SCHOOL ? '校级管理员' : '院级管理员'}
        </Tag>
      ),
    },
    {
      title: '院系',
      dataIndex: 'college_id',
      key: 'college_id',
      render: (collegeId: string, record: Admin) => {
        if (!collegeId || record.admin_type === AdminType.SCHOOL) return '-';
        
        // 查找匹配的院系名称
        const college = colleges.find(c => c.id === collegeId);
        return college ? college.name : collegeId;
      },
    },

    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Admin) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此管理员吗？"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            onConfirm={() => handleDelete(record.stuff_id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>管理员权限管理</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={showAddModal}
        >
          添加管理员
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={admins} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={modalTitle}
        open={modalVisible}
        onCancel={handleCancel}
        onOk={handleSubmit}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          name="adminForm"
        >
          <Form.Item
            name="stuff_id"
            label="工号"
            rules={[{ required: true, message: '请输入工号' }]}
          >
            <Input placeholder="请输入工号" disabled={!!editingAdmin} />
          </Form.Item>

          <Form.Item
            name="admin_type"
            label="管理员类型"
            rules={[{ required: true, message: '请选择管理员类型' }]}
          >
            <Select placeholder="请选择管理员类型" onChange={handleAdminTypeChange}>
              <Option value={AdminType.SCHOOL}>校级管理员</Option>
              <Option value={AdminType.COLLEGE}>院级管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.admin_type !== currentValues.admin_type}
          >
            {({ getFieldValue }) => 
              getFieldValue('admin_type') === AdminType.COLLEGE ? (
                <>
                  <Form.Item
                    name="college_id"
                    label="院系"
                    rules={[
                      { 
                        required: getFieldValue('admin_type') === AdminType.COLLEGE, 
                        message: '请选择院系' 
                      }
                    ]}
                  >
                    <Select placeholder="请选择院系" onChange={handleCollegeChange}>
                      {Array.isArray(colleges) && colleges.map(college => (
                        <Option key={college.id} value={college.id}>{college.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminsPage; 