import { Drawer, Menu, Avatar, Button } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, AdminType } from '../types/auth';
import { Link } from 'react-router';

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

export default function Sidebar() {
  const { staffId, name , role , adminType , adminCollegeId,logout} = useAuth();

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <Menu
          mode="inline"
          items={[
            { key: '1', label: <Link to="/">投票</Link> },
            { key: '2', label: <Link to="/stats">统计</Link> },
            { key: '3', label: <Link to="/manage">管理</Link> }, 
          ]}
        />
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <Avatar size="large" shape="square" style={{ backgroundColor: '#1890ff'}} gap={-1}>{name}</Avatar>
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