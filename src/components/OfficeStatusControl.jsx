'use client';

import { useState, useEffect } from 'react';
import { Switch, Card, Typography, Button, message, Space, Tag } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function OfficeStatusControl() {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activatedBy, setActivatedBy] = useState(null);

  const fetchOfficeStatus = async () => {
    try {
      const response = await fetch('/api/office-status');
      if (response.ok) {
        const data = await response.json();
        setIsActive(data.isActive);
        setLastUpdated(data.updatedAt);
        setActivatedBy(data.activatedBy);
      }
    } catch (error) {
      console.error('Error fetching office status:', error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchOfficeStatus();
  }, []);

  const toggleOfficeStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/office-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsActive(data.isActive);
        setLastUpdated(data.updatedAt);
        setActivatedBy(data.activatedBy);
        message.success(data.message);
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to update office status');
      }
    } catch (error) {
      console.error('Error updating office status:', error);
      message.error('Failed to update office status');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Card loading={true}>
        <Title level={4}>Office Status</Title>
      </Card>
    );
  }

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Card
      style={{
        background: isActive ? '#f6ffed' : '#fff2f0',
        border: `2px solid ${isActive ? '#52c41a' : '#ff4d4f'}`,
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            {isActive ? (
              <BulbFilled style={{ fontSize: '24px', color: '#52c41a' }} />
            ) : (
              <BulbOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
            )}
            <Title level={4} style={{ margin: 0 }}>
              Office Status
            </Title>
          </Space>
          
          <Tag color={isActive ? 'success' : 'error'} style={{ fontSize: '14px', padding: '4px 12px' }}>
            {isActive ? 'OPEN' : 'CLOSED'}
          </Tag>
        </div>

        <div>
          <Text strong>
            {isActive ? '🟢 Office is OPEN' : '🔴 Office is CLOSED'}
          </Text>
          <br />
          <Text type="secondary">
            {isActive 
              ? 'Employees can clock in and out' 
              : 'Employees cannot clock in or out'
            }
          </Text>
        </div>

        <Button
          type={isActive ? 'default' : 'primary'}
          danger={isActive}
          size="large"
          loading={loading}
          onClick={toggleOfficeStatus}
          icon={isActive ? <BulbOutlined /> : <BulbFilled />}
          style={{ width: '100%' }}
        >
          {isActive ? 'Close Office' : 'Open Office'}
        </Button>

        <div style={{ fontSize: '12px', color: '#666' }}>
          <Text type="secondary">
            Last updated: {formatLastUpdated(lastUpdated)}
          </Text>
        </div>
      </Space>
    </Card>
  );
}
