'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Statistic, Typography, Alert, Table } from 'antd';
import { ClockCircleOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';

const { Title: AntTitle } = Typography;

// Lazy load charts to improve initial load time
const Bar = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Bar })), {
  loading: () => <div style={{ height: 200, background: '#f5f5f5', borderRadius: 4 }} />,
  ssr: false
});

const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Doughnut })), {
  loading: () => <div style={{ height: 200, background: '#f5f5f5', borderRadius: 4 }} />,
  ssr: false
});

// Register Chart.js components only when needed
if (typeof window !== 'undefined') {
  import('chart.js').then(({ Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement }) => {
    Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
  });
}

export default function AnalyticsDashboard() {
  // TODO: Add user auth check here (currently handled by GraphQL)
  // Using dynamic imports for better performance - charts load when needed
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Basic GraphQL query - learned from documentation
  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { metrics { avgHoursPerDay peoplePerDay { day count } totalHoursPerStaff { userId userName hours } } }`
        })
      });
      const result = await response.json();
      if (result.errors) {
        setError(result.errors[0].message);
        return;
      }
      setMetrics(result.data.metrics);
    } catch (err) {
      setError('Failed to load analytics'); // Generic error for now
    }
    setLoading(false);
  };

  if (loading) {
    // Simple loading skeleton - better than just spinner
    return (
      <div>
        <AntTitle level={3}>Analytics</AntTitle>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}><Card loading /></Col>
          <Col span={8}><Card loading /></Col>
          <Col span={8}><Card loading /></Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}><Card loading style={{ height: 250 }} /></Col>
          <Col span={12}><Card loading style={{ height: 250 }} /></Col>
        </Row>
      </div>
    );
  }

  if (error) return <Alert message="Error loading analytics" type="error" />;
  if (!metrics) return null;

  // Memoize chart data to avoid recalculating on every render
  const dailyData = useMemo(() => ({
    labels: metrics.peoplePerDay.map(item => item.day.split('-')[2]), // Just show day number
    datasets: [{
      label: 'Daily Check-ins',
      data: metrics.peoplePerDay.map(item => item.count),
      backgroundColor: '#1890ff', // Single color for now
    }],
  }), [metrics.peoplePerDay]);

  const staffData = useMemo(() => ({
    labels: metrics.totalHoursPerStaff.slice(0, 5).map(staff => staff.userName.split(' ')[0]), // First name only
    datasets: [{
      data: metrics.totalHoursPerStaff.slice(0, 5).map(staff => staff.hours),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'], // Found these colors online
    }],
  }), [metrics.totalHoursPerStaff]);

  // Basic Chart.js setup - keeping it simple
  const chartOptions = { responsive: true }; // TODO: Add more sophisticated options later

  // Basic table columns - might add sorting later
  const staffColumns = [
    { title: 'Staff', dataIndex: 'userName', key: 'name' },
    { title: 'Hours', dataIndex: 'hours', key: 'hours', render: (h) => `${h.toFixed(1)}h` },
  ];

  return (
    <div>
      <AntTitle level={3}>Analytics</AntTitle>

      {/* Basic metrics cards - keeping it simple for now */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Statistic title="Avg Hours/Day" value={metrics.avgHoursPerDay} precision={1} />
        </Col>
        <Col span={8}>
          <Statistic title="Active Staff" value={metrics.totalHoursPerStaff.length} />
        </Col>
        <Col span={8}>
          <Statistic title="Peak Day" value={Math.max(...metrics.peoplePerDay.map(d => d.count), 0)} />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Daily Check-ins">
            <Bar data={dailyData} options={chartOptions} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Top Staff Hours">
            <Doughnut data={staffData} options={chartOptions} />
          </Card>
        </Col>
      </Row>

      <Card title="Staff Hours" style={{ marginTop: 16 }}>
        <Table
          dataSource={metrics.totalHoursPerStaff}
          columns={staffColumns}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
