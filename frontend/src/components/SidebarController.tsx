import { FloatButton, Drawer } from 'antd';
import { useState } from 'react';
import Sidebar from './Sidebar';

export function SidebarController() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <>
      <FloatButton.Group>
        <FloatButton.BackTop visibilityHeight={400} style={{ right: 24, bottom: 24 }} />
        <FloatButton
          icon={<span className="anticon">☰</span>}
          onClick={() => setSidebarVisible(true)}
          style={{ right: 24, bottom: 80 }}
        />
      </FloatButton.Group>
      <Drawer
        placement="right"
        closable={true}
        onClose={() => setSidebarVisible(false)}
        open={sidebarVisible}
        width={280}
      >
        <Sidebar />
      </Drawer>
    </>
  );
}