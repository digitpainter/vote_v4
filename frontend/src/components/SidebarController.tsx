import { FloatButton, Drawer } from 'antd';
import { useState } from 'react';
import Sidebar from './Sidebar';

export function SidebarController() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  const scrollToCandidateTable = () => {
    const candidateTableElement = document.querySelector('.mt-8 .dir-rtl');
    if (candidateTableElement) {
      candidateTableElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <FloatButton.Group>
        <FloatButton.BackTop visibilityHeight={400} style={{ right: 24, bottom: 24 }} />
        <FloatButton
          icon={<span className="anticon">🗳️</span>}
          onClick={scrollToCandidateTable}
          tooltip="前往投票区"
          style={{ right: 24, bottom: 136 }}
        />
        <FloatButton
          icon={<span className="anticon">☰</span>}
          onClick={() => setSidebarVisible(true)}
          style={{ right: 24, bottom: 80 }}
        />
      </FloatButton.Group>
      <Drawer
        placement="right"
        closable={true}
        onClose={closeSidebar}
        open={sidebarVisible}
        width={280}
      >
        <Sidebar onClose={closeSidebar} />
      </Drawer>
    </>
  );
}