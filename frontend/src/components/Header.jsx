import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Drawer } from 'antd';
import { HomeOutlined, BarChartOutlined, TrophyOutlined, MenuOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header } = Layout;

function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '游戏',
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '统计',
    },
    {
      key: '/leaderboard',
      icon: <TrophyOutlined />,
      label: '排行榜',
    },
  ];
  
  const showDrawer = () => {
    setVisible(true);
  };
  
  const onClose = () => {
    setVisible(false);
  };
  
  const handleMenuClick = (key) => {
    navigate(key);
    setVisible(false);
  };

  return (
    <Header className="header" style={{ position: 'fixed', width: '100%', zIndex: 1000 }}>
      <div className="logo" />
      
      {/* 桌面端菜单 */}
      {!isMobile && (
        <div className="desktop-menu">
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </div>
      )}
      
      {/* 移动端菜单按钮 */}
      {isMobile && (
        <div className="mobile-menu">
          <Button type="text" icon={<MenuOutlined />} onClick={showDrawer} style={{ color: 'white' }} />
          <Drawer
            title="菜单"
            placement="right"
            onClose={onClose}
            open={visible}
            width={200}
          >
            <Menu
              mode="vertical"
              selectedKeys={[location.pathname]}
              onClick={({ key }) => handleMenuClick(key)}
            >
              {menuItems.map(item => (
                <Menu.Item key={item.key} icon={item.icon}>
                  {item.label}
                </Menu.Item>
              ))}
            </Menu>
          </Drawer>
        </div>
      )}
    </Header>
  );
}

export default AppHeader; 