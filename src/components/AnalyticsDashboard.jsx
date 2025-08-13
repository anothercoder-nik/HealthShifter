'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Alert, Table } from 'antd';
import { 
  ClockCircleOutlined, 
  TeamOutlined, 
  BarChartOutlined,
  TrophyOutlined 
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

const { Title: AntTitle } = Typography;

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetMetrics {
              metrics {
                avgHoursPerDay
                peoplePerDay {
                  day
                  count
                }
                totalHoursPerStaff {
                  userId
                  userName
                  hours
                }
              }
            }
          `
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      setMetrics(result.data.metrics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px' }}>Loading analytics...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        message="Analytics Error"
        description={error}
        type="error"
        showIcon
        style={{ marginBottom: '24px' }}
      />
    );
  }

  if (!metrics) return null;

  // Prepare chart data
  const dailyCountsData = {
    labels: metrics.peoplePerDay.map(item => 
      new Date(item.day).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    ),
    datasets: [
      {
        label: 'People Clocking In',
        data: metrics.peoplePerDay.map(item => item.count),
        backgroundColor: 'rgba(24, 144, 255, 0.6)',
        borderColor: 'rgba(24, 144, 255, 1)',
        borderWidth: 2,
      },
    ],
  };

  const staffHoursData = {
    labels: metrics.totalHoursPerStaff.slice(0, 10).map(staff => 
      staff.userName.split(' ')[0] || staff.userName
    ),
    datasets: [
      {
        label: 'Total Hours (Last 7 Days)',
        data: metrics.totalHoursPerStaff.slice(0, 10).map(staff => staff.hours),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  // Table data for staff hours
  const staffTableData = metrics.totalHoursPerStaff.map((staff, index) => ({
    key: staff.userId,
    rank: index + 1,
    name: staff.userName,
    hours: Math.round(staff.hours * 100) / 100,
    days: Math.ceil(staff.hours / 8), // Estimate days worked
  }));

  const staffColumns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank) => (
        <span style={{ fontWeight: 'bold', color: rank <= 3 ? '#1890ff' : undefined }}>
          #{rank}
        </span>
      ),
    },
    {
      title: 'Staff Member',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Total Hours',
      dataIndex: 'hours',
      key: 'hours',
      render: (hours) => `${hours}h`,
      sorter: (a, b) => a.hours - b.hours,
    },
    {
      title: 'Est. Days',
      dataIndex: 'days',
      key: 'days',
      render: (days) => `~${days} days`,
    },
  ];

  return (
    <div>
      <AntTitle level={3} style={{ marginBottom: '24px' }}>
        📊 Analytics Dashboard
      </AntTitle>

      {/* Key Metrics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Average Hours Per Day"
              value={metrics.avgHoursPerDay}
              precision={1}
              suffix="hours"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Active Staff"
              value={metrics.totalHoursPerStaff.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Peak Daily Count"
              value={Math.max(...metrics.peoplePerDay.map(d => d.count), 0)}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={14}>
          <Card title="📈 Daily Clock-In Counts (Last 7 Days)" size="small">
            <Bar data={dailyCountsData} options={chartOptions} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="🏆 Top Staff Hours Distribution" size="small">
            <Doughnut 
              data={staffHoursData} 
              options={doughnutOptions}
              style={{ maxHeight: '300px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Staff Hours Table */}
      <Card title="📋 Staff Hours Leaderboard (Last 7 Days)" size="small">
        <Table
          dataSource={staffTableData}
          columns={staffColumns}
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ x: 400 }}
        />
      </Card>
    </div>
  );
}
