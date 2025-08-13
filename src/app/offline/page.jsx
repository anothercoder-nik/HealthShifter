'use client';

import { useState, useEffect } from 'react';
import { Layout, Card, Button, Typography, Space, Result } from 'antd';
import { WifiOutlined, ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Check initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.href = '/';
    } else {
      window.location.reload();
    }
  };

  return (
    <Content style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <Card style={{ 
        maxWidth: 500, 
        textAlign: 'center', 
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <Result
          icon={<WifiOutlined style={{ color: isOnline ? '#52c41a' : '#ff4d4f' }} />}
          title={
            <Title level={3} style={{ color: isOnline ? '#52c41a' : '#ff4d4f' }}>
              {isOnline ? 'Back Online!' : 'You\'re Offline'}
            </Title>
          }
          subTitle={
            <Paragraph style={{ fontSize: '16px', marginBottom: 24 }}>
              {isOnline 
                ? 'Your internet connection has been restored. You can now access all features.'
                : 'No internet connection detected. Some features may be limited while offline.'
              }
            </Paragraph>
          }
          extra={
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ 
                background: 'rgba(24, 144, 255, 0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                  Lief Clock-In App
                </Title>
                <Paragraph style={{ margin: 0, color: '#666' }}>
                  Healthcare Shift Management
                </Paragraph>
              </div>
              
              <Button 
                type="primary" 
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleRetry}
                style={{ 
                  height: '48px',
                  fontSize: '16px',
                  borderRadius: '24px',
                  minWidth: '200px'
                }}
              >
                {isOnline ? 'Go to App' : 'Try Again'}
              </Button>
              
              {!isOnline && (
                <div style={{ marginTop: '16px' }}>
                  <Paragraph style={{ fontSize: '14px', color: '#666' }}>
                    <strong>Offline Features Available:</strong>
                  </Paragraph>
                  <ul style={{ textAlign: 'left', color: '#666', fontSize: '14px' }}>
                    <li>View cached shift data</li>
                    <li>Access previously loaded pages</li>
                    <li>Basic app navigation</li>
                  </ul>
                  <Paragraph style={{ fontSize: '12px', color: '#999', marginTop: '16px' }}>
                    Data will sync automatically when connection is restored.
                  </Paragraph>
                </div>
              )}
            </Space>
          }
        />
      </Card>
    </Content>
  );
}
