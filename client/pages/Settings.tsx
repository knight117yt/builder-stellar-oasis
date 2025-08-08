import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Settings as SettingsIcon,
  Download,
  Bell,
  Shield,
  User,
  Database,
  FileText,
  Palette
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme, ColorTheme } from '@/contexts/ThemeContext';

export default function Settings() {
  const { colorTheme, setColorTheme } = useTheme();

  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('notifications');
    return stored ? JSON.parse(stored) : {
      priceAlerts: true,
      patternDetection: true,
      pnlUpdates: false,
      marketNews: true
    };
  });

  const [apiSettings, setApiSettings] = useState(() => {
    const stored = localStorage.getItem('apiSettings');
    return stored ? JSON.parse(stored) : {
      fyersAppId: 'POEXISKB7W-100',
      autoRefresh: true,
      refreshInterval: 5
    };
  });

  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem('profile');
    return stored ? JSON.parse(stored) : {
      name: '',
      email: '',
      phone: ''
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const colorThemes: { value: ColorTheme; label: string; color: string }[] = [
    { value: 'default', label: 'Default', color: 'bg-gray-600' },
    { value: 'blue', label: 'Blue', color: 'bg-blue-600' },
    { value: 'green', label: 'Green', color: 'bg-green-600' },
    { value: 'purple', label: 'Purple', color: 'bg-purple-600' },
    { value: 'orange', label: 'Orange', color: 'bg-orange-600' },
  ];

  // Auto-save to localStorage when settings change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('apiSettings', JSON.stringify(apiSettings));
  }, [apiSettings]);

  useEffect(() => {
    localStorage.setItem('profile', JSON.stringify(profile));
  }, [profile]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleApiSettingChange = (key: string, value: any) => {
    setApiSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileChange = (key: string, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleDownloadPNL = async () => {
    try {
      const response = await fetch('/api/reports/pnl-download', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('fyers_token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `pnl-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading PNL report:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <ThemeToggle variant="settings" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Color Theme</label>
                <div className="grid grid-cols-5 gap-2">
                  {colorThemes.map((theme) => (
                    <Button
                      key={theme.value}
                      variant={colorTheme === theme.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setColorTheme(theme.value)}
                      className="flex flex-col items-center gap-1 h-auto p-2"
                    >
                      <div className={`w-4 h-4 rounded-full ${theme.color}`}></div>
                      <span className="text-xs">{theme.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Manage your profile information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={profile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="Enter your phone number"
                value={profile.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
              />
            </div>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
            {saveMessage && (
              <div className={`text-sm ${saveMessage.includes('Error') ? 'text-destructive' : 'text-green-600'}`}>
                {saveMessage}
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Configure Fyers API settings and data refresh preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fyers-app-id">Fyers App ID</Label>
              <Input
                id="fyers-app-id"
                value={apiSettings.fyersAppId}
                onChange={(e) => handleApiSettingChange('fyersAppId', e.target.value)}
                placeholder="Enter your Fyers App ID"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Refresh Data</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically refresh market data
                </p>
              </div>
              <Switch
                checked={apiSettings.autoRefresh}
                onCheckedChange={(checked) => handleApiSettingChange('autoRefresh', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
              <Input
                id="refresh-interval"
                type="number"
                value={apiSettings.refreshInterval}
                onChange={(e) => handleApiSettingChange('refreshInterval', parseInt(e.target.value) || 5)}
                min={1}
                max={60}
              />
              <p className="text-xs text-muted-foreground">
                Current interval: {apiSettings.refreshInterval} seconds
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Configure your notification settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Price Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when prices hit your target levels
                </p>
              </div>
              <Switch
                checked={notifications.priceAlerts}
                onCheckedChange={(checked) => handleNotificationChange('priceAlerts', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pattern Detection</Label>
                <p className="text-sm text-muted-foreground">
                  Get alerts when candlestick patterns are detected
                </p>
              </div>
              <Switch
                checked={notifications.patternDetection}
                onCheckedChange={(checked) => handleNotificationChange('patternDetection', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>P&L Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Real-time profit and loss notifications
                </p>
              </div>
              <Switch
                checked={notifications.pnlUpdates}
                onCheckedChange={(checked) => handleNotificationChange('pnlUpdates', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Market News</Label>
                <p className="text-sm text-muted-foreground">
                  Important market news and updates
                </p>
              </div>
              <Switch
                checked={notifications.marketNews}
                onCheckedChange={(checked) => handleNotificationChange('marketNews', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Reports & Downloads
            </CardTitle>
            <CardDescription>
              Download your trading reports and data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">P&L Report</h4>
                <p className="text-sm text-muted-foreground">
                  Download your comprehensive profit & loss report
                </p>
              </div>
              <Button onClick={handleDownloadPNL} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
              <div>
                <h4 className="font-medium">Trading History</h4>
                <p className="text-sm text-muted-foreground">
                  Complete trading history export
                </p>
              </div>
              <Button disabled variant="outline">
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">
              Change Password
            </Button>
            <Button variant="outline" className="w-full">
              Two-Factor Authentication
            </Button>
            <Button variant="destructive" className="w-full">
              Disconnect Fyers Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
