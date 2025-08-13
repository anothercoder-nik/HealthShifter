'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Tag, Space } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';

const { Text } = Typography;

export default function OfficeStatusDisplay() {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOfficeStatus = async () => {
    try {
      const response = await fetch('/api/office-status');
      if (response.ok) {
        const data = await response.json();
        setIsActive(data.isActive);
      }
    } catch (error) {
      console.error('Error fetching office status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficeStatus();
    
    // Refresh office status every 30 seconds
    const interval = setInterval(fetchOfficeStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card size="small" loading={true}>
        <Text>Office Status</Text>
      </Card>
    );
  }

  return (
    <Card 
      size="small"
      style={{
        background: isActive ? '#f6ffed' : '#fff2f0',
        border: `1px solid ${isActive ? '#52c41a' : '#ff4d4f'}`,
        marginBottom: '16px'
      }}
    >
      <Space>
        {isActive ? (
          <BulbFilled style={{ color: '#52c41a' }} />
        ) : (
          <BulbOutlined style={{ color: '#ff4d4f' }} />
        )}
        <Text strong>Office Status:</Text>
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'OPEN' : 'CLOSED'}
        </Tag>
      </Space>
      
      {!isActive && (
        <div style={{ marginTop: '8px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Contact manager to open office for clock in/out
          </Text>
        </div>
      )}
    </Card>
  );
}
