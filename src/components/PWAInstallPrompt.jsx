'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Typography, Space, Modal } from 'antd';
import { DownloadOutlined, CloseOutlined, MobileOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      
      // Show install prompt after a delay (don't be too aggressive)
      setTimeout(() => {
        if (!localStorage.getItem('pwa-install-dismissed')) {
          setShowInstallPrompt(true);
        }
      }, 10000); // Show after 10 seconds
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Remember that user dismissed the prompt
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Modal
      open={showInstallPrompt}
      onCancel={handleDismiss}
      footer={null}
      closable={false}
      centered
      width={400}
      style={{ borderRadius: '16px' }}
    >
      <Card 
        bordered={false}
        style={{ 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '16px'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <MobileOutlined style={{ fontSize: '48px', color: 'white', marginBottom: '16px' }} />
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              Install Lief Clock-In App
            </Title>
          </div>
          
          <div>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
              Get the full app experience with:
            </Text>
            <ul style={{ 
              textAlign: 'left', 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '14px',
              marginTop: '12px',
              paddingLeft: '20px'
            }}>
              <li>Offline access to your data</li>
              <li>Faster loading times</li>
              <li>Home screen shortcut</li>
              <li>Native app experience</li>
              <li>Push notifications (coming soon)</li>
            </ul>
          </div>

          <Space size="middle">
            <Button
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleInstallClick}
              style={{
                background: 'white',
                borderColor: 'white',
                color: '#1890ff',
                fontWeight: 'bold',
                borderRadius: '24px',
                height: '48px',
                paddingLeft: '24px',
                paddingRight: '24px'
              }}
            >
              Install App
            </Button>
            
            <Button
              size="large"
              icon={<CloseOutlined />}
              onClick={handleDismiss}
              style={{
                background: 'transparent',
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                borderRadius: '24px',
                height: '48px',
                paddingLeft: '24px',
                paddingRight: '24px'
              }}
            >
              Maybe Later
            </Button>
          </Space>
        </Space>
      </Card>
    </Modal>
  );
}
