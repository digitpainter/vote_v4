import { Drawer, Menu, Avatar, Button } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, AdminType } from '../types/auth';
import { Link } from 'react-router';
import { 
  HomeOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';

const roleMap: Record<UserRole, string> = {
  [UserRole.UNDERGRADUATE]: '本科生',
  [UserRole.TEACHER]: '教师',
  [UserRole.GRADUATE]: '研究生',
  [UserRole.PHD]: '博士生',
};

const adminTypeMap: Record<AdminType, string> = {
  [AdminType.SCHOOL]: '校级管理员',
  [AdminType.COLLEGE]: '院级管理员',
};

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps = {}) {
  const { staffId, name , role , adminType , adminCollegeId, logout} = useAuth();

  const handleMenuClick = () => {
    if (onClose) {
      onClose();
    }
  };

  // 判断是否是管理员
  const isAdmin = adminType !== undefined;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <Menu
          mode="inline"
          items={[
            { 
              key: '1', 
              icon: <HomeOutlined />,
              label: <Link to="/" onClick={handleMenuClick}>投票</Link> 
            },
            { 
              key: '2', 
              icon: <BarChartOutlined />,
              label: <Link to="/stats" onClick={handleMenuClick}>统计</Link> 
            },
            // 仅向管理员显示管理选项
            ...(isAdmin ? [{ 
              key: '3', 
              icon: <SettingOutlined />,
              label: <Link to="/admin" onClick={handleMenuClick}>管理后台</Link>,
              children: [
                { 
                  key: '3-1', 
                  label: <Link to="/admin/dashboard" onClick={handleMenuClick}>仪表盘</Link> 
                },
                { 
                  key: '3-2', 
                  label: <Link to="/admin/activities" onClick={handleMenuClick}>活动管理</Link> 
                },
                { 
                  key: '3-3', 
                  label: <Link to="/admin/candidates" onClick={handleMenuClick}>候选人管理</Link> 
                },
                { 
                  key: '3-4', 
                  label: <Link to="/admin/data" onClick={handleMenuClick}>数据下载</Link> 
                },
              ]
            }] : []),
          ]}
        />
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <Avatar size="large" shape="square" style={{ backgroundColor: '#1890ff'}} icon={<UserOutlined />} gap={-1}>{name?.slice(0, 1)}</Avatar>
          <div className="flex items-center gap-6">
            <div>
              <div className="font-medium">{staffId}</div>
              <div className="font-medium">{role ? roleMap[role] : ''}</div>
              {adminType && (
                <>
                  <div className="font-medium">{adminTypeMap[adminType]}</div>
                  <div className="font-medium">{adminCollegeId}</div>
                </>
              )}
              <div className="mt-4 flex justify-end">
                <Button type="primary" danger onClick={logout}>
                  退出登录
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}