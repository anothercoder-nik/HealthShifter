'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Statistic, Typography, Alert, Table } from 'antd';
import { ClockCircleOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';

const { Title: AntTitle } = Typography;

// load charts dynamically with better error handling
const Bar = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Bar })).catch(() => ({ default: () => <div>Chart loading failed</div> })), {
  loading: () => <div style={{ height: 200, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>,
  ssr: false
});

const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Doughnut })).catch(() => ({ default: () => <div>Chart loading failed</div> })), {
  loading: () => <div style={{ height: 200, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>,
  ssr: false
});

// chart.js setup with error handling
if (typeof window !== 'undefined') {
  import('chart.js').then(({ Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement }) => {
    try {
      Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
    } catch (error) {
      console.warn('Chart.js registration failed:', error);
    }
  }).catch(error => {
    console.warn('Chart.js import failed:', error);
  });
}

export default function AnalyticsDashboard() {
  // need to add auth check later, graphql handles it for now
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  // had to move these up here because of some react hooks error i was getting
  const dailyData = useMemo(() => {
    if (!metrics || !metrics.peoplePerDay) return { labels: [], datasets: [{ label: 'Daily Check-ins', data: [], backgroundColor: '#1890ff' }] };
    return {
      labels: metrics.peoplePerDay.map(item => item.day.split('-')[2]), // just show day
      datasets: [{
        label: 'Daily Check-ins',
        data: metrics.peoplePerDay.map(item => item.count),
        backgroundColor: '#1890ff',
      }],
    };
  }, [metrics]);

  const staffData = useMemo(() => {
    if (!metrics || !metrics.totalHoursPerStaff) return { labels: [], datasets: [{ data: [], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }] };
    const topStaff = metrics.totalHoursPerStaff.slice(0, 5);
    return {
      labels: topStaff.map(staff => staff.userName.split(' ')[0]), // first name
      datasets: [{
        data: topStaff.map(staff => staff.hours),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'], // copied from stackoverflow
      }],
    };
  }, [metrics]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // graphql query - took me a while to figure this out
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
      setError('Failed to load analytics'); // just basic error message
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



  const chartOptions = { responsive: true }; // basic options

  const staffColumns = [
    { title: 'Staff', dataIndex: 'userName', key: 'name' },
    { title: 'Hours', dataIndex: 'hours', key: 'hours', render: (h) => `${h.toFixed(1)}h` },
  ];

  return (
    <div>
      <AntTitle level={3}>Analytics</AntTitle>

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
