import { Layout, Menu, Typography, Avatar, Space, Breadcrumb } from 'antd';
import { Outlet, Link, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { adminMenuItems } from '../constants/menuItems';

const { Header, Content, Footer, Sider } = Layout;
const { Title, Text } = Typography;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { name, staffId, logout } = useAuth();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState('dashboard');

  // 根据当前路径设置选中的菜单项
  useEffect(() => {
    const path = location.pathname.split('/')[2] || 'dashboard';
    setSelectedKey(path);
  }, [location.pathname]);

  // 生成面包屑
  const getBreadcrumb = () => {
    const pathSnippets = location.pathname.split('/').filter((i: string) => i);
    const breadcrumbItems = [
      { title: <Link to="/">首页</Link> },
      { title: <Link to="/admin">管理后台</Link> }
    ];

    if (pathSnippets.length > 1) {
      const key = pathSnippets[1];
      const item = adminMenuItems.find(item => item.key === key);
      if (item) {
        breadcrumbItems.push({ title: item.label });
      }
    }

    return breadcrumbItems;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
        className="shadow-md"
      >
        <div className="p-4 flex justify-center">
          <Title level={4} className="text-center m-0">
            投票系统后台
          </Title>
        </div>
        <div className="p-4 flex flex-col items-center mb-4">
          <Avatar size={collapsed ? 40 : 64} className="mb-2 bg-blue-500">
            {name?.slice(0, 1) || "管"}
          </Avatar>
          {!collapsed && (
            <div className="text-center">
              <Text strong>{name || "管理员"}</Text>
              <div className="text-xs text-gray-500">{staffId || "Admin"}</div>
            </div>
          )}
        </div>
        <Menu 
          theme="light" 
          defaultSelectedKeys={['dashboard']} 
          selectedKeys={[selectedKey]}
          mode="inline" 
          items={adminMenuItems} 
        />
      </Sider>
      <Layout>
        <Header className="p-0 bg-white flex justify-between items-center px-6 shadow-sm">
          <Breadcrumb items={getBreadcrumb()} />
        </Header>
        <Content className="m-4">
          <div className="p-6 bg-white rounded-lg min-h-full">
            <Outlet />
          </div>
        </Content>
        <Footer className="text-center text-gray-500">
          投票系统管理后台 ©{new Date().getFullYear()} 版权所有
        </Footer>
      </Layout>
    </Layout>
  );
} 