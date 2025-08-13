'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Row, Col, Layout, Modal } from 'antd';
import { ClockCircleOutlined, TeamOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Content } = Layout;

function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Simple hook to get user info
  useEffect(() => {
    async function fetchUser() {
      try {
  const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          if (userData && userData.email_verified === false) {
            setShowVerifyModal(true);
          }
        }
      } catch (error) {
        console.log('Not logged in');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  // Helper function to check user role
  const hasRole = (role) => {
    if (!user) return false;
  return user.roles?.includes(role);
  };

  return (
    <>
      {/* Navigation Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: 'white',
        borderBottom: '1px solid #d9d9d9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1890ff' }}>
          Healthcare Shift Manager
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {loading && <span>Loading...</span>}
          {!loading && !user && (
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => window.location.href = '/api/auth/login'}
            >
              Login
            </Button>
          )}
          {user && (
            <>
              <span>Welcome, {user.name || user.email}</span>
              {hasRole('employee') && (
                <Button
                  type="primary"
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  onClick={() => window.location.href = '/employee'}
                >
                  Employee Portal
                </Button>
              )}
              {hasRole('manager') && (
                <Button
                  type="primary"
                  onClick={() => window.location.href = '/manager'}
                >
                  Manager Portal
                </Button>
              )}
              <Button
                danger
                icon={<LogoutOutlined />}
                onClick={() => window.location.href = '/api/auth/logout?sso=1'}
              >
                Logout
              </Button>
            </>
          )}
        </div>
      </div>

      <Content style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "0",
        paddingTop: "64px"
      }}>
        <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
          {/* Hero Section */}
          <div style={{ 
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "60px 40px",
            marginBottom: "40px",
            border: "1px solid rgba(255,255,255,0.2)",
            textAlign: "center"
          }}>
            <Title level={1} style={{ color: "white", marginBottom: 16, fontSize: "3rem" }}>
              Healthcare Shift Manager
            </Title>
            <Paragraph style={{ color: "rgba(255,255,255,0.9)", fontSize: "1.3rem", marginBottom: 32 }}>
              Professional shift management and time tracking for healthcare professionals
            </Paragraph>
            
            {!user && !loading && (
              <Button
                type="primary"
                size="large"
                icon={<LoginOutlined />}
                onClick={() => window.location.href = '/api/auth/login'}
                style={{ 
                  height: "50px", 
                  fontSize: "18px", 
                  borderRadius: "25px",
                  background: "#1890ff",
                  borderColor: "#1890ff"
                }}
              >
                Get Started - Login
              </Button>
            )}
            
            {user && (
              <Space size="large">
                {hasRole('employee') && (
                  <Button
                    type="primary"
                    size="large"
                    style={{ 
                      height: "50px", 
                      fontSize: "18px", 
                      borderRadius: "25px",
                      background: "#52c41a", 
                      borderColor: "#52c41a"
                    }}
                    onClick={() => window.location.href = '/employee'}
                  >
                    Access Employee Portal
                  </Button>
                )}
                {hasRole('manager') && (
                  <Button
                    type="primary"
                    size="large"
                    style={{ 
                      height: "50px", 
                      fontSize: "18px", 
                      borderRadius: "25px"
                    }}
                    onClick={() => window.location.href = '/manager'}
                  >
                    Access Manager Portal
                  </Button>
                )}
              </Space>
            )}
          </div>

          {/* Features Section */}
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card style={{ 
                textAlign: 'center', 
                background: 'rgba(255,255,255,0.95)',
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
              }}>
                <ClockCircleOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                <Title level={4}>Time Tracking</Title>
                <Paragraph>
                  Accurate clock in/out with GPS verification and shift management
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ 
                textAlign: 'center', 
                background: 'rgba(255,255,255,0.95)',
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
              }}>
                <TeamOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                <Title level={4}>Team Management</Title>
                <Paragraph>
                  Manage staff schedules and track attendance across your healthcare facility
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ 
                textAlign: 'center', 
                background: 'rgba(255,255,255,0.95)',
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
              }}>
                <ClockCircleOutlined style={{ fontSize: 48, color: '#722ed1', marginBottom: 16 }} />
                <Title level={4}>Real-time Analytics</Title>
                <Paragraph>
                  Monitor performance and generate detailed reports for compliance
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
      <Modal
        open={showVerifyModal}
        title="Verify Your Email"
        closable={false}
        maskClosable={false}
        footer={[
          <Button key="relogin" type="primary" onClick={() => { window.location.href = '/api/auth/logout?sso=1'; }}>
            Logout & Login Again
          </Button>,
          <Button key="continue" onClick={() => setShowVerifyModal(false)}>
            Dismiss
          </Button>
        ]}
      >
        <p>Your email address is not verified. Please verify it via the link Auth0 sent you, then log out and log back in to refresh your status.</p>
      </Modal>
    </>
  );
}

export default HomePage;
