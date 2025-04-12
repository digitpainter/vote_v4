import { Drawer, Menu, Avatar, Button } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, AdminType } from '../types/auth';
import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { getAllCollegeInfo, CollegeInfo, getCollegeNameById } from '../api/college';
import { getMainMenuItems } from '../constants/menuItems';

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
  const isAdmin = adminType != undefined;
  console.log("adminType");
  console.log(adminType);
  console.log("isAdmin");
  console.log(isAdmin);
  // 判断是否有权限访问统计页
  const canAccessStats = role === UserRole.TEACHER || isAdmin;
  console.log("canAccessStats");
  console.log(canAccessStats);

  // 获取菜单项
  const menuItems = getMainMenuItems(handleMenuClick, canAccessStats, isAdmin);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <Menu
          mode="inline"
          items={menuItems}
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