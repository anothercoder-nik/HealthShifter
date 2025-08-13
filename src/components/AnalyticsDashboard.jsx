'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Alert, Table } from 'antd';
import { ClockCircleOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

const { Title: AntTitle } = Typography;

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

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
      setError('Failed to load analytics');
    }
    setLoading(false);
  };

  if (loading) return <Spin size="large" />;
  if (error) return <Alert message="Error loading analytics" type="error" />;
  if (!metrics) return null;

  const dailyData = {
    labels: metrics.peoplePerDay.map(item => item.day.split('-')[2]),
    datasets: [{
      label: 'Daily Check-ins',
      data: metrics.peoplePerDay.map(item => item.count),
      backgroundColor: '#1890ff',
    }],
  };

  const staffData = {
    labels: metrics.totalHoursPerStaff.slice(0, 5).map(staff => staff.userName.split(' ')[0]),
    datasets: [{
      data: metrics.totalHoursPerStaff.slice(0, 5).map(staff => staff.hours),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
    }],
  };

  const chartOptions = { responsive: true };

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
