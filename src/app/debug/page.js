"use client";
import { useEffect, useState } from "react";
import { Card, Typography, Button, Space, Tag, Alert, Descriptions, Radio } from "antd";
import { UserOutlined, SettingOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function RoleDebugPage() {
  const [user, setUser] = useState(null);
  const [roleInfo, setRoleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setRoleInfo(data.roleInfo);
      }
    } catch (error) {
      console.error("Failed to load user info:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (newRole) => {
    try {
      setUpdating(true);
      const response = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        await loadUserInfo();
        // Refresh the page to update all components
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setUpdating(false);
    }
  };

  const clearSession = async () => {
    try {
      await fetch('/api/clear-session', { method: 'POST' });
      alert('Session cleared! Please refresh the page and login again.');
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Title level={2}>Loading...</Title>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Not Authenticated"
          description="You need to be logged in to view this page."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 24, 
      maxWidth: 1200, 
      margin: "0 auto",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      minHeight: "100vh"
    }}>
      <Title level={1} style={{ textAlign: "center", marginBottom: 40 }}>
        🔧 Role Assignment Debug
      </Title>

      {/* Current User Info */}
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        <Title level={3}>
          <UserOutlined /> Current User Information
        </Title>
        <Descriptions bordered>
          <Descriptions.Item label="Name" span={2}>
            {user.name || "Not provided"}
          </Descriptions.Item>
          <Descriptions.Item label="Email" span={1}>
            {user.email}
          </Descriptions.Item>
          <Descriptions.Item label="User ID" span={3}>
            {user.sub}
          </Descriptions.Item>
          <Descriptions.Item label="Current Roles" span={3}>
            <Space>
              {roleInfo?.assignedRoles?.map(role => (
                <Tag 
                  key={role} 
                  color={role === "manager" ? "blue" : "green"}
                  style={{ fontWeight: "bold" }}
                >
                  {role.toUpperCase()}
                </Tag>
              ))}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Role Assignment Logic */}
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        <Title level={3}>
          <SettingOutlined /> Role Assignment Logic
        </Title>
        <Alert
          message="How roles are assigned:"
          description={
            <div>
              <Paragraph>
                <strong>Manager Role:</strong> Emails containing "manager", "admin", or ending with "@hospital.com"
              </Paragraph>
              <Paragraph>
                <strong>Employee Role:</strong> Emails containing "employee", "nurse", "doctor", or default fallback
              </Paragraph>
              <Paragraph>
                <strong>Your assignment reason:</strong> {roleInfo?.assignmentReason}
              </Paragraph>
            </div>
          }
          type="info"
          showIcon
        />
      </Card>

      {/* Role Testing */}
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        <Title level={3}>
          <CheckCircleOutlined /> Test Role Assignment
        </Title>
        <Paragraph>
          You can temporarily change your role to test the application. 
          This will refresh the page to update all components.
        </Paragraph>
        
        <Space direction="vertical" style={{ width: "100%" }}>
          <Radio.Group
            value={roleInfo?.assignedRoles?.[0]}
            buttonStyle="solid"
            size="large"
          >
            <Radio.Button 
              value="employee"
              onClick={() => updateRole("employee")}
              disabled={updating}
            >
              👨‍⚕️ Employee Role
            </Radio.Button>
            <Radio.Button 
              value="manager"
              onClick={() => updateRole("manager")}
              disabled={updating}
            >
              👔 Manager Role
            </Radio.Button>
          </Radio.Group>
          
          {updating && (
            <Alert message="Updating role..." type="info" showIcon />
          )}
        </Space>
      </Card>

      {/* Session Troubleshooting */}
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        <Title level={3}>🔧 Troubleshooting</Title>
        <Alert
          message="Having login issues?"
          description="If you're experiencing 'state parameter is invalid' errors or other login issues, try clearing your session and logging in again."
          type="warning"
          showIcon
          action={
            <Button 
              size="small" 
              danger 
              onClick={clearSession}
            >
              Clear Session & Restart
            </Button>
          }
        />
      </Card>

      {/* Email Examples */}
      <Card style={{ borderRadius: 16 }}>
        <Title level={3}>Email Pattern Examples</Title>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Tag color="blue">Manager Examples:</Tag>
            <Paragraph>
              • john.manager@clinic.com<br/>
              • admin.user@hospital.com<br/>
              • sarah@hospital.com<br/>
              • manager.smith@anywhere.com
            </Paragraph>
          </div>
          <div>
            <Tag color="green">Employee Examples:</Tag>
            <Paragraph>
              • nurse.jane@clinic.com<br/>
              • doctor.brown@medical.com<br/>
              • employee.user@company.com<br/>
              • regular.user@gmail.com (default)
            </Paragraph>
          </div>
        </Space>
      </Card>
    </div>
  );
}
