import { Drawer, Menu, Avatar, Button } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, AdminType } from '../types/auth';
import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { 
  HomeOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';
import { getAllCollegeInfo, CollegeInfo, getCollegeNameById } from '../api/college';

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
  const { staffId, name, role, adminType, adminCollegeId, logout } = useAuth();
  const [collegeInfoList, setCollegeInfoList] = useState<CollegeInfo[]>([]);

  // 获取学院信息
  useEffect(() => {
    const fetchCollegeInfo = async () => {
      try {
        const data = await getAllCollegeInfo();
        setCollegeInfoList(data);
      } catch (error) {
        console.error('获取学院信息失败:', error);
      }
    };
    
    if (adminCollegeId) {
      fetchCollegeInfo();
    }
  }, [adminCollegeId]);

  // 获取学院名称
  const getCollegeName = () => {
    if (!adminCollegeId || collegeInfoList.length === 0) return '';
    return getCollegeNameById(collegeInfoList, adminCollegeId);
  };

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
        <div className="flex flex-col items-center mb-4">
          <Avatar size={64} className="mb-2 bg-blue-500">
            {name?.slice(0, 1)}
          </Avatar>
          <div className="text-center">
            <div className="font-medium">{name || "管理员"}</div>
            <div className="text-xs text-gray-500">{staffId || "Admin"}</div>
            {role && <div className="text-xs text-gray-500">{roleMap[role]}</div>}
            {adminType && (
              <div className="text-xs text-gray-500">
                {adminTypeMap[adminType]} 
                {adminCollegeId && (
                  <span> - {getCollegeName() || adminCollegeId}</span>
                )}
              </div>
            )}
            <div className="mt-4">
              <Button type="primary" danger size="small" onClick={logout}>
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}