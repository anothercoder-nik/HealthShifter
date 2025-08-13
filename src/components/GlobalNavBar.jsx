"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { 
  Layout, 
  Menu, 
  Button, 
  Avatar, 
  Dropdown, 
  Space, 
  Typography,
  Badge,
  Drawer,
  Modal
} from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  LoginOutlined,
  MenuOutlined,
  DashboardOutlined
} from '@ant-design/icons';

const { Header } = Layout;
const { Text } = Typography;

export default function GlobalNavBar() {
  const { user, loading, isManager, isEmployee, logout, fullLogout } = useAuth();
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  useEffect(() => {
    if (user && user.email_verified === false) {
      setShowVerifyModal(true);
    }
  }, [user?.email_verified]);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.name || user?.email || 'Profile',
      disabled: true
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
  onClick: () => fullLogout()
    },
  ];

  const getMenuItems = () => {
    const items = [
      {
        key: 'home',
        icon: <HomeOutlined />,
        label: <Link href="/">Home</Link>,
      }
    ];

    if (user) {
  if (isManager() && user.email_verified !== false) {
        items.push({
          key: 'manager',
          icon: <DashboardOutlined />,
          label: <Link href="/manager">Manager Dashboard</Link>,
        });
      }
      
      if (isEmployee()) {
        items.push({
          key: 'employee',
          icon: <ClockCircleOutlined />,
          label: <Link href="/employee">Employee Portal</Link>,
        });
      }
    }

    return items;
  };

  if (isMobile) {
    return (
      <>
        <Header 
          style={{ 
            position: 'fixed', 
            zIndex: 1000, 
            width: '100%', 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#1890ff',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              <ClockCircleOutlined style={{ fontSize: '20px' }} />
              Lief
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user && (
              <Avatar 
                size="small" 
                icon={<UserOutlined />}
                style={{ background: '#1890ff' }}
              />
            )}
            <Button 
              type="text" 
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuVisible(true)}
            />
          </div>
        </Header>

        <Drawer
          title="Menu"
          placement="right"
          onClose={() => setMobileMenuVisible(false)}
          open={mobileMenuVisible}
          width={280}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {user ? (
              <>
                <div style={{ 
                  padding: '16px', 
                  background: 'rgba(24, 144, 255, 0.1)', 
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <Space direction="vertical" size="small">
                    <Text strong>{user.name || user.email}</Text>
                    {isManager() && (
                      <Badge 
                        count="Manager" 
                        style={{ backgroundColor: '#52c41a' }} 
                      />
                    )}
                  </Space>
                </div>
                
                <Menu
                  mode="vertical"
                  items={getMenuItems()}
                  style={{ border: 'none' }}
                  onClick={() => setMobileMenuVisible(false)}
                />
                
                <Button 
                  type="primary" 
                  danger 
                  icon={<LogoutOutlined />}
                  onClick={() => {
                    fullLogout();
                    setMobileMenuVisible(false);
                  }}
                  style={{ marginTop: '16px' }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/api/auth/login">
                <Button 
                  type="primary" 
                  icon={<LoginOutlined />}
                  block
                  onClick={() => setMobileMenuVisible(false)}
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </Drawer>
        <div style={{ height: '64px' }} />
      </>
    );
  }

  return (
    <>
      {/* Debug element */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        background: 'red', 
        color: 'white', 
        padding: '10px',
        zIndex: 9999 
      }}>
        NAVBAR DEBUG - User: {user ? 'Logged In' : 'Not Logged In'}
      </div>
      
      <Header 
        style={{ 
          position: 'fixed', 
          zIndex: 1000, 
          width: '100%', 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              color: '#1890ff',
              fontWeight: 'bold',
              fontSize: '20px'
            }}>
              <ClockCircleOutlined style={{ fontSize: '24px' }} />
              Lief Clock-In
            </div>
          </Link>
          
          <Menu
            mode="horizontal"
            items={getMenuItems()}
            style={{ 
              border: 'none', 
              background: 'transparent',
              minWidth: '300px'
            }}
            selectedKeys={[]}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {loading ? (
            <Button loading size="small">Loading...</Button>
          ) : user ? (
            <Dropdown 
              menu={{ items: userMenuItems }} 
              placement="bottomRight"
              trigger={['click']}
            >
              <Space style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', background: 'rgba(24, 144, 255, 0.1)' }}>
                <Avatar 
                  size="small" 
                  icon={<UserOutlined />}
                  style={{ background: '#1890ff' }}
                />
                <Text strong style={{ color: '#1890ff' }}>
                  {user.name || user.email}
                </Text>
                {isManager() && (
                  <Badge 
                    count="Manager" 
                    style={{ 
                      backgroundColor: '#52c41a',
                      fontSize: '10px',
                      height: '18px',
                      lineHeight: '18px',
                      borderRadius: '9px'
                    }} 
                  />
                )}
              </Space>
            </Dropdown>
          ) : (
            <Space>
              <Link href="/api/auth/login">
                <Button type="primary" icon={<LoginOutlined />}>
                  Sign In
                </Button>
              </Link>
            </Space>
          )}
        </div>
      </Header>
      <div style={{ height: '64px' }} />
      <Modal
        open={showVerifyModal}
        closable={false}
        maskClosable={false}
        title="Verify Your Email"
        footer={[
          <Button key="logout" danger onClick={() => fullLogout()}>
            Logout & Switch User
          </Button>,
          <Button key="continue" type="primary" onClick={() => setShowVerifyModal(false)}>
            Continue
          </Button>
        ]}
      >
        <p>Your email address is not verified. Please verify it via the link sent to you. After verification, log out and log back in to refresh your status.</p>
      </Modal>
    </>
  );
}