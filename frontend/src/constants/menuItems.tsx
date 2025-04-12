import { Link } from 'react-router';
import { 
  HomeOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  AppstoreOutlined,
  TeamOutlined,
  DownloadOutlined,
  DashboardOutlined,
  FileTextOutlined
} from '@ant-design/icons';

// 管理后台菜单项
export const adminMenuItems = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: <Link to="/admin/dashboard">仪表盘</Link>,
  },
  {
    key: 'activities',
    icon: <AppstoreOutlined />,
    label: <Link to="/admin/activities">活动管理</Link>,
  },
  {
    key: 'candidates',
    icon: <UserOutlined />,
    label: <Link to="/admin/candidates">候选人管理</Link>,
  },
  {
    key: 'admins',
    icon: <TeamOutlined />,
    label: <Link to="/admin/admins">管理员权限</Link>,
  },
  {
    key: 'data',
    icon: <DownloadOutlined />,
    label: <Link to="/admin/data">数据下载</Link>,
  },
  {
    key: 'logs',
    icon: <FileTextOutlined />,
    label: <Link to="/admin/logs">操作日志</Link>,
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: <Link to="/admin/settings">系统设置</Link>,
  },
];

// 主页菜单项 - 用于侧边栏
export const getMainMenuItems = (handleMenuClick: () => void, canAccessStats: boolean, isAdmin: boolean) => {
  return [
    { 
      key: '1', 
      icon: <HomeOutlined />,
      label: <Link to="/" onClick={handleMenuClick}>投票</Link> 
    },
    // 只向教师和管理员显示统计选项
    ...(canAccessStats ? [{ 
      key: '2', 
      icon: <BarChartOutlined />,
      label: <Link to="/stats" onClick={handleMenuClick}>统计</Link> 
    }] : []),
    // 仅向管理员显示管理选项
    ...(isAdmin ? [{ 
      key: '3', 
      icon: <SettingOutlined />,
      label: <Link to="/admin" onClick={handleMenuClick}>管理后台</Link>,
      children: adminMenuItems.map((item, index) => ({
        key: `3-${index + 1}`,
        label: <Link to={`/admin/${item.key}`} onClick={handleMenuClick}>{item.label.props.children}</Link>
      }))
    }] : []),
  ];
}; 