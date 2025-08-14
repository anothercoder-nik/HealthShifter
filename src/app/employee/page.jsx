'use client';

import { useState, useEffect } from 'react';
import { Layout, Card, Button, Table, message, Space, Typography, Row, Col, Statistic, Tag, Input, Alert, Modal } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, CheckCircleOutlined, ExclamationCircleOutlined, LogoutOutlined, HomeOutlined, HistoryOutlined, StopOutlined } from '@ant-design/icons';
import OfficeStatusDisplay from '../../components/OfficeStatusDisplay';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function EmployeePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [perimeter, setPerimeter] = useState(null);
  const [clockInNote, setClockInNote] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // PWA Location Monitoring States
  const [isPWA, setIsPWA] = useState(false);
  const [locationPermission, setLocationPermission] = useState('default');
  const [isInsideOffice, setIsInsideOffice] = useState(false);
  const [locationWatcher, setLocationWatcher] = useState(null);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);

  // Helper function to check if user has employee role
  const hasRole = (userData, role) => {
    return userData?.roles?.includes(role) || userData?.[`https://shifter.dev/role`] === role;
  };

  // Get current user
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          if (userData.email_verified === false) setShowVerifyModal(true);
          
          // Check if user has employee role
          if (!hasRole(userData, 'employee')) {
            window.location.href = '/';
            return;
          }
        } else {
          window.location.href = '/api/auth/login';
          return;
        }
      } catch (error) {
        window.location.href = '/api/auth/login';
        return;
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  // Check if running as PWA
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSPWA = window.navigator.standalone === true;
      setIsPWA(isStandalone || isIOSPWA);
    };
    checkPWA();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const permission = await navigator.permissions.query({name: 'geolocation'});
      setLocationPermission(permission.state);

      if (permission.state === 'granted') {
        startLocationMonitoring();
      } else if (permission.state === 'prompt') {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationPermission('granted');
            startLocationMonitoring();
          },
          () => setLocationPermission('denied')
        );
      }
    } catch (error) {
      console.log('Permission error:', error);
    }
  };

  // start watching location
  const startLocationMonitoring = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }

    // Start watching position
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        // Check if we have office perimeter data
        if (perimeter && perimeter.latitude && perimeter.longitude) {
          const distance = calculateDistance(
            userLat, userLon,
            perimeter.latitude, perimeter.longitude
          );

          // Check if user is inside office perimeter
          const isCurrentlyInside = distance <= perimeter.radius;

          // Check if status changed (entered or left office)
          if (isCurrentlyInside !== isInsideOffice) {
            setIsInsideOffice(isCurrentlyInside);
            showLocationNotification(isCurrentlyInside);
          }
        }
      },
      (error) => {
        console.log('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000 // 30 seconds
      }
    );

    setLocationWatcher(watchId);
  };

  // show notification for location changes
  const showLocationNotification = (isInside) => {
    // dont spam notifications
    const now = Date.now();
    if (now - lastNotificationTime < 300000) { // 5 min cooldown
      return;
    }

    // Request notification permission if needed
    if (Notification.permission === 'default') {
      Notification.requestPermission();
      return;
    }

    if (Notification.permission === 'granted') {
      const title = isInside ? 'You entered the office area' : 'You left the office area';
      const body = isInside ? 'Ready to clock in?' : 'Don\'t forget to clock out!';

      new Notification(title, {
        body: body,
        icon: '/icons/android-launchericon-192-192.png',
        badge: '/icons/android-launchericon-192-192.png',
        tag: 'location-alert'
      });

      setLastNotificationTime(now);
    }
  };

  // stop watching location
  const stopLocationMonitoring = () => {
    if (locationWatcher) {
      navigator.geolocation.clearWatch(locationWatcher);
      setLocationWatcher(null);
    }
  };

  // Clean up location watcher when component unmounts
  useEffect(() => {
    return () => {
      stopLocationMonitoring();
    };
  }, [locationWatcher]);

  // Get user location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLocationLoading(false);
          setLocationError(null);
        },
        (error) => {
          setLocationError(`Location error: ${error.message}`);
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
      setLocationLoading(false);
    }
  };

  // Fetch user shifts
  const fetchShifts = async () => {
    try {
      const response = await fetch('/api/shifts');
      if (response.ok) {
        const data = await response.json();
        setShifts(data);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  // Fetch perimeter data
  const fetchPerimeter = async () => {
    try {
      const response = await fetch('/api/perimeter');
      if (response.ok) {
        const data = await response.json();
        setPerimeter(data);
      }
    } catch (error) {
      console.error('Error fetching perimeter:', error);
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Check if user is within perimeter
  const isWithinPerimeter = () => {
    if (!location || !perimeter) return false;
    
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      perimeter.latitude ?? perimeter.centerLat,
      perimeter.longitude ?? perimeter.centerLng
    );
    const allowedRadius = perimeter.radius ?? perimeter.radiusMeters;
    return distance <= allowedRadius;
  };

  // Load data when user is available
  useEffect(() => {
    if (user) {
      fetchShifts();
      fetchPerimeter();
      getCurrentLocation();
    }
  }, [user]);

  // Check for active shift
  const activeShift = shifts.find(shift => !shift.clockOutAt);
  const isCurrentlyClockedIn = !!activeShift;

  // Clock in function
  const handleClockIn = async () => {
    if (!location) {
      message.error('Please enable location access first');
      return;
    }

    if (!isWithinPerimeter()) {
      message.error('You are not within the allowed work area');
      return;
    }

    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clockIn',
          latitude: location.latitude,
          longitude: location.longitude,
          note: clockInNote
        }),
      });

      if (response.ok) {
        message.success('Successfully clocked in!');
        setClockInNote("");
        fetchShifts();
      } else {
        message.error('Failed to clock in');
      }
    } catch (error) {
      message.error('Error clocking in');
    }
  };

  // Clock out function
  const handleClockOut = async () => {
    if (!location) {
      message.error('Please enable location access first');
      return;
    }

    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clockOut',
          latitude: location.latitude,
          longitude: location.longitude,
          shiftId: activeShift.id
        }),
      });

      if (response.ok) {
        message.success('Successfully clocked out!');
        fetchShifts();
      } else {
        message.error('Failed to clock out');
      }
    } catch (error) {
      message.error('Error clocking out');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <Title level={3}>Loading...</Title>
      </div>
    );
  }

  if (!loading && user && user.email_verified === false) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Card style={{ maxWidth: 500, textAlign: 'center', padding: 40, borderRadius: 16 }}>
          <Title level={3}>Email Verification Required</Title>
          <Text>Please verify your email before accessing the employee portal.</Text>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button type='primary' onClick={() => window.location.href = '/verify-email'}>
              How to Verify
            </Button>
            <Button danger onClick={() => window.location.href = '/api/auth/logout?sso=1'}>
              Logout
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Navigation Bar */}
      <div
        style={{
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
          padding: '0 12px',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '16px',
            color: '#1890ff',
            flex: '0 1 auto',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Healthcare Shift Manager
        </div>
        <div
          style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            flex: '0 0 auto',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: window.innerWidth > 480 ? 'inline' : 'none',
            }}
          >
            {user?.name || user?.email}
          </span>
          <Button
            size="small"
            icon={<HomeOutlined />}
            onClick={() => (window.location.href = '/')}
          />
          <Button
            size="small"
            danger
            icon={<LogoutOutlined />}
            onClick={() =>
              (window.location.href = '/api/auth/logout?sso=1')
            }
          />
        </div>
      </div>


      <Content style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "0",
        paddingTop: "64px"
      }}>
        <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
          {/* Header Section */}
          <div style={{ 
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "32px",
            marginBottom: "32px",
            border: "1px solid rgba(255,255,255,0.2)",
            textAlign: "center"
          }}>
            <Title level={1} style={{ color: "white", marginBottom: 8 }}>
              Employee Portal
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.1rem" }}>
              Welcome, {user?.name || user?.email}
            </Text>
          </div>

          {/* Office Status */}
          <OfficeStatusDisplay />

          {/* PWA Location Monitoring - Only show if PWA is installed */}
          {isPWA && (
            <Card
              title={
                <span>
                  <EnvironmentOutlined /> Automatic Location Monitoring
                </span>
              }
              style={{ borderRadius: 16, marginBottom: 24 }}
              extra={
                locationPermission === 'granted' && locationWatcher ? (
                  <Button
                    danger
                    size="small"
                    onClick={stopLocationMonitoring}
                  >
                    Stop Monitoring
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="small"
                    onClick={requestLocationPermission}
                    disabled={locationPermission === 'denied'}
                  >
                    Start Monitoring
                  </Button>
                )
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>Location Permission:</Text>
                  <Tag color={
                    locationPermission === 'granted' ? 'green' :
                    locationPermission === 'denied' ? 'red' : 'orange'
                  }>
                    {locationPermission.toUpperCase()}
                  </Tag>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>Monitoring Status:</Text>
                  <Tag color={locationWatcher ? 'green' : 'default'}>
                    {locationWatcher ? 'ACTIVE' : 'INACTIVE'}
                  </Tag>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>Office Area Status:</Text>
                  <Tag color={isInsideOffice ? 'green' : 'blue'}>
                    {isInsideOffice ? 'INSIDE OFFICE' : 'OUTSIDE OFFICE'}
                  </Tag>
                </div>

                <Alert
                  message="PWA Location Feature"
                  description="This automatic location monitoring only works when the app is installed as a PWA. It will notify you when you enter or leave the office area."
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              </Space>
            </Card>
          )}

          {/* Show install message if not PWA */}
          {!isPWA && (
            <Card
              title={
                <span>
                  <EnvironmentOutlined /> Location Monitoring Unavailable
                </span>
              }
              style={{ borderRadius: 16, marginBottom: 24 }}
            >
              <Alert
                message="Install App Required"
                description="Automatic location monitoring is only available when you install this app as a PWA. Please install the app to enable this feature."
                type="warning"
                showIcon
                action={
                  <Button size="small" type="primary">
                    Install App
                  </Button>
                }
              />
            </Card>
          )}

          {/* Status Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card style={{ borderRadius: 16, textAlign: 'center' }}>
                <Statistic
                  title="Clock Status"
                  value={isCurrentlyClockedIn ? "Clocked In" : "Clocked Out"}
                  valueStyle={{
                    color: isCurrentlyClockedIn ? '#3f8600' : '#cf1322',
                  }}
                  prefix={isCurrentlyClockedIn ? 
                    <CheckCircleOutlined style={{ color: "#52c41a" }} /> : 
                    <StopOutlined style={{ color: "#ff4d4f" }} />
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={{ borderRadius: 16, textAlign: 'center' }}>
                <Statistic
                  title="Location Status"
                  value={location ? "Available" : "Unavailable"}
                  valueStyle={{
                    color: location ? '#3f8600' : '#cf1322',
                  }}
                  prefix={<EnvironmentOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={{ borderRadius: 16, textAlign: 'center' }}>
                <Statistic
                  title="Total Shifts"
                  value={shifts.length}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Location Alert */}
          {locationError && (
            <Alert
              message="Location Error"
              description={locationError}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              action={
                <Button size="small" onClick={getCurrentLocation}>
                  Retry
                </Button>
              }
            />
          )}

          {/* Clock In/Out Card */}
          <Card
            title={
              <span>
                <ClockCircleOutlined /> Time Clock
              </span>
            }
            style={{ marginBottom: 24, borderRadius: 16 }}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text strong>Clock In Note (Optional)</Text>
                  <TextArea
                    rows={3}
                    value={clockInNote}
                    onChange={(e) => setClockInNote(e.target.value)}
                    placeholder="Add a note for this shift..."
                    disabled={isCurrentlyClockedIn}
                    style={{ borderRadius: 8 }}
                  />
                </Space>
              </Col>
              <Col xs={24} md={12}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div>
                    <Text strong>Current Status: </Text>
                    <Tag color={isCurrentlyClockedIn ? 'green' : 'red'}>
                      {isCurrentlyClockedIn ? 'Clocked In' : 'Clocked Out'}
                    </Tag>
                  </div>

                  {location && perimeter && (
                    <div>
                      <Text strong>Location Status: </Text>
                      <Tag color={isWithinPerimeter() ? 'green' : 'red'}>
                        {isWithinPerimeter() ? 'Within Work Area' : 'Outside Work Area'}
                      </Tag>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {!isCurrentlyClockedIn ? (
                      <Button
                        type="primary"
                        size="large"
                        icon={<CheckCircleOutlined />}
                        onClick={handleClockIn}
                        disabled={!location || !isWithinPerimeter()}
                        style={{ 
                          borderRadius: 8,
                          background: "#52c41a",
                          borderColor: "#52c41a"
                        }}
                      >
                        Clock In
                      </Button>
                    ) : (
                      <Button
                        danger
                        size="large"
                        icon={<ExclamationCircleOutlined />}
                        onClick={handleClockOut}
                        disabled={!location}
                        style={{ borderRadius: 8 }}
                      >
                        Clock Out
                      </Button>
                    )}

                    <Button
                      loading={locationLoading}
                      icon={<EnvironmentOutlined />}
                      onClick={getCurrentLocation}
                      style={{ borderRadius: 8 }}
                    >
                      {location ? 'Refresh Location' : 'Get Location'}
                    </Button>
                  </div>
                </Space>
              </Col>
            </Row>

            {/* Location Info */}
            {location && (
              <div style={{ 
                marginTop: 24, 
                padding: 16, 
                background: "#f0f2ff", 
                borderRadius: 8 
              }}>
                <Text strong style={{ color: "#1890ff" }}>Current Location:</Text>
                <br />
                <Text code>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</Text>
                {perimeter && (
                  <>
                    <br />
                    <Text strong style={{ color: "#1890ff" }}>Distance from work: </Text>
                    <Text>
                      {calculateDistance(
                        location.latitude,
                        location.longitude,
                        perimeter.latitude ?? perimeter.centerLat,
                        perimeter.longitude ?? perimeter.centerLng
                      ).toFixed(0)}m
                    </Text>
                  </>
                )}
              </div>
            )}
          </Card>

          {/* Shift History */}
          <Card
            title={
              <span>
                <HistoryOutlined /> Shift History
              </span>
            }
            style={{ borderRadius: 16 }}
          >
            <Table
              dataSource={shifts}
              rowKey="id"
              columns={[
                {
                  title: 'Date',
                  dataIndex: 'clockInAt',
                  render: (date) => new Date(date).toLocaleDateString(),
                  sorter: (a, b) => new Date(a.clockInAt) - new Date(b.clockInAt),
                  defaultSortOrder: 'descend',
                },
                {
                  title: 'Clock In',
                  dataIndex: 'clockInAt',
                  render: (date) => new Date(date).toLocaleTimeString()
                },
                {
                  title: 'Clock Out',
                  dataIndex: 'clockOutAt',
                  render: (date) => date ? new Date(date).toLocaleTimeString() : 
                    <Tag color="processing">Active</Tag>
                },
                {
                  title: 'Duration',
                  render: (_, record) => {
                    if (!record.clockOutAt) {
                      const duration = Date.now() - new Date(record.clockInAt);
                      const hours = Math.floor(duration / (1000 * 60 * 60));
                      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
                      return `${hours}h ${minutes}m (In Progress)`;
                    }
                    const duration = new Date(record.clockOutAt) - new Date(record.clockInAt);
                    const hours = Math.floor(duration / (1000 * 60 * 60));
                    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
                    return `${hours}h ${minutes}m`;
                  }
                },
                {
                  title: 'Note',
                  dataIndex: 'clockInNote',
                  ellipsis: true,
                  render: (note) => note || '-',
                },
                {
                  title: 'Status',
                  render: (_, record) => (
                    <Tag color={record.clockOutAt ? 'blue' : 'green'}>
                      {record.clockOutAt ? 'Completed' : 'Active'}
                    </Tag>
                  )
                }
              ]}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
              scroll={{ x: 800 }}
              style={{ borderRadius: 8 }}
            />
          </Card>
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
          <Button key="dismiss" onClick={() => setShowVerifyModal(false)}>Dismiss</Button>
        ]}
      >
        <p>Your email is not verified. Please check your inbox for a verification link. After verifying, log out and back in to update status.</p>
      </Modal>
    </>
  );
}
