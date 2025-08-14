"use client";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { useApp } from "../../hooks/useApp";
import { useEffect, useState } from "react";
import { Button, Card, Form, InputNumber, Space, Table, Typography, message, Row, Col, Statistic, Progress, Tag, Badge } from "antd";
import { 
  SettingOutlined, 
  TeamOutlined, 
  BarChartOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ReloadOutlined 
} from "@ant-design/icons";
import GlobalNavBar from "../../components/GlobalNavBar";
import OfficeStatusControl from "../../components/OfficeStatusControl";
import AnalyticsDashboard from "../../components/AnalyticsDashboard";

const { Title, Text } = Typography;

export default function ManagerPage() {
  const { user, isManager } = useAuth();
  const { shifts, perimeter, fetchShifts, fetchPerimeter, getCurrentLocation } = useApp();
  const [localPerimeter, setLocalPerimeter] = useState({ lat: null, lng: null, radiusMeters: 2000 });

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Update local perimeter when context perimeter changes
  useEffect(() => {
    if (perimeter) {
      setLocalPerimeter({
        lat: perimeter.latitude ?? perimeter.lat ?? perimeter.centerLat,
        lng: perimeter.longitude ?? perimeter.lng ?? perimeter.centerLng,
        radiusMeters: perimeter.radius ?? perimeter.radiusMeters
      });
    }
  }, [perimeter]);

  // Run data loads once when user is confirmed manager
  useEffect(() => {
    let cancelled = false;
    if (user && isManager()) {
      fetchShifts();
      fetchPerimeter();
    }
    return () => { cancelled = true; };
  }, [user?.sub, user?.roles]);

  // Filter for currently active shifts
  const activeShifts = shifts.filter(s => !s.clockOutAt);

  if (!user) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
      }}>
        <Card style={{ textAlign: "center", padding: 40, borderRadius: 16 }}>
          <Title level={3}>Authentication Required</Title>
          <Text>You must be signed in to access the manager portal.</Text>
          <div style={{ marginTop: 24 }}>
            <Link href="/api/auth/login">
              <Button type="primary" size="large">Login</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (user && user.email_verified === false) {
    if (typeof window !== 'undefined') {
      window.location.replace('/verify-email');
    }
    return null;
  }

  if (!isManager()) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
      }}>
        <Card style={{ textAlign: "center", padding: 40, borderRadius: 16 }}>
          <Title level={3} type="danger">Access Denied</Title>
          <Text>Your account does not have manager privileges.</Text>
        </Card>
      </div>
    );
  }

  const savePerimeter = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/perimeter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: localPerimeter.lat,
          longitude: localPerimeter.lng,
          radius: localPerimeter.radiusMeters
        })
      });
      if (!res.ok) message.error(await res.text());
      else {
        message.success("Perimeter updated successfully!");
        fetchPerimeter(); // Refresh context data
      }
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocation();
      setLocalPerimeter({
        ...localPerimeter,
        lat: location.latitude,
        lng: location.longitude
      });
      message.success("Current location set as perimeter center!");
    } catch (error) {
      message.error("Failed to get current location: " + error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const calculateDuration = (startTime) => {
    const hours = Math.floor((Date.now() - startTime) / (1000 * 60 * 60));
    const minutes = Math.floor(((Date.now() - startTime) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'userId',
      key: 'user',
      render: (userId) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          <Text strong>{userId.substring(0, 8)}...</Text>
        </div>
      ),
    },
    {
      title: 'Clock In Time',
      dataIndex: 'clockInAt',
      key: 'in',
      render: (time) => formatTime(time),
    },
    {
      title: 'Duration',
      dataIndex: 'clockInAt',
      key: 'duration',
      render: (time) => (
        <Badge 
          status="processing" 
          text={calculateDuration(time)}
        />
      ),
    },
    {
      title: 'Location',
      dataIndex: 'clockInLat',
      key: 'location',
      render: (lat, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EnvironmentOutlined style={{ marginRight: 4, color: '#52c41a' }} />
          {lat && record.clockInLng ? `${lat.toFixed(4)}, ${record.clockInLng.toFixed(4)}` : 'N/A'}
        </div>
      ),
    },
    {
      title: 'Note',
      dataIndex: 'clockInNote',
      key: 'note',
      ellipsis: true,
      render: (note) => note || '-',
    },
  ];

  const totalActiveHours = activeShifts.reduce((sum, shift) => {
    return sum + ((Date.now() - shift.clockInAt) / (1000 * 60 * 60));
  }, 0);

  return (
    <>
      <GlobalNavBar />
      <div style={{ 
        minHeight: "100vh", 
        background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
        padding: "24px"
      }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <Title level={1} style={{ color: "white", marginBottom: 8 }}>
            Manager Dashboard
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.1rem" }}>
            Welcome, {user.name || user.email}
          </Text>
        </div>

        {/* Metrics Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={6}>
            <OfficeStatusControl />
          </Col>
          <Col xs={24} sm={6}>
            <Card style={{ borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
              <Statistic
                title="Active Staff"
                value={activeShifts.length}
                prefix={<TeamOutlined style={{ color: "#1890ff" }} />}
                valueStyle={{ color: "#1890ff", fontSize: "2.5rem" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card style={{ borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
              <Statistic
                title="Total Shifts"
                value={shifts.length}
                prefix={<ClockCircleOutlined style={{ color: "#52c41a" }} />}
                valueStyle={{ color: "#52c41a", fontSize: "2.5rem" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card style={{ borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
              <Statistic
                title="Active Hours"
                value={totalActiveHours}
                suffix="hrs"
                prefix={<BarChartOutlined style={{ color: "#722ed1" }} />}
                valueStyle={{ color: "#722ed1", fontSize: "2.5rem" }}
                precision={1}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          {/* Perimeter Settings */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <SettingOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  Perimeter Settings
                </div>
              }
              style={{ 
                borderRadius: 16, 
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                height: "100%"
              }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <Text strong>Current Settings:</Text>
                  {localPerimeter.lat && localPerimeter.lng ? (
                    <div style={{ 
                      background: "#f6ffed", 
                      padding: 12, 
                      borderRadius: 8, 
                      border: "1px solid #b7eb8f",
                      marginTop: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        <Text>Active Geofence</Text>
                      </div>
                      <Text type="secondary">
                        Location: {localPerimeter.lat?.toFixed(5)}, {localPerimeter.lng?.toFixed(5)}
                        <br />
                        Radius: {localPerimeter.radiusMeters}m
                      </Text>
                    </div>
                  ) : (
                    <div style={{ 
                      background: "#fff2e8", 
                      padding: 12, 
                      borderRadius: 8, 
                      border: "1px solid #ffbb96",
                      marginTop: 8
                    }}>
                      <Text type="warning">No perimeter configured</Text>
                    </div>
                  )}
                </div>

                <InputNumber 
                  addonBefore="Latitude" 
                  value={localPerimeter.lat} 
                  onChange={(v) => setLocalPerimeter({ ...localPerimeter, lat: v })}
                  style={{ width: "100%", borderRadius: 8 }}
                />
                <InputNumber 
                  addonBefore="Longitude" 
                  value={localPerimeter.lng} 
                  onChange={(v) => setLocalPerimeter({ ...localPerimeter, lng: v })}
                  style={{ width: "100%", borderRadius: 8 }}
                />
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={useCurrentLocation}
                  loading={locationLoading}
                  block
                  style={{ marginBottom: 16 }}
                >
                  Use Current Location
                </Button>
                <InputNumber 
                  addonBefore="Radius (m)" 
                  value={localPerimeter.radiusMeters} 
                  onChange={(v) => setLocalPerimeter({ ...localPerimeter, radiusMeters: v })}
                  style={{ width: "100%", borderRadius: 8 }}
                />
                <Button 
                  type="primary" 
                  loading={loading} 
                  onClick={savePerimeter}
                  style={{ 
                    width: "100%",
                    height: 44,
                    borderRadius: 22,
                    fontWeight: "bold"
                  }}
                >
                  Update Perimeter
                </Button>
              </Space>
            </Card>
          </Col>

          {/* Active Staff */}
          <Col xs={24} lg={16}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <TeamOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                  Currently Clocked In ({activeShifts.length})
                </div>
              }
              style={{ 
                borderRadius: 16, 
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
              }}
            >
              <Table
                rowKey="id"
                columns={columns}
                dataSource={activeShifts}
                pagination={false}
                locale={{ emptyText: "No staff currently clocked in" }}
                style={{ background: "transparent" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Weekly Performance */}
        {/* analytics section */}
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card
              style={{
                borderRadius: 16,
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
              }}
            >
              <AnalyticsDashboard />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
    </>
  );
}
