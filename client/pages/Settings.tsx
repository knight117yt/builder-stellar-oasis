import { useState } from 'react';
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
  FileText
} from 'lucide-react';

export default function Settings() {
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    patternDetection: true,
    pnlUpdates: false,
    marketNews: true
  });

  const [apiSettings, setApiSettings] = useState({
    fyersAppId: 'POEXISKB7W-100',
    autoRefresh: true,
    refreshInterval: 5
  });

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
                <Input id="name" placeholder="Enter your full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="Enter your phone number" />
            </div>
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
                onChange={(e) => setApiSettings(prev => ({...prev, fyersAppId: e.target.value}))}
                disabled
                className="bg-muted"
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
                onCheckedChange={(checked) => setApiSettings(prev => ({...prev, autoRefresh: checked}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
              <Input 
                id="refresh-interval" 
                type="number"
                value={apiSettings.refreshInterval}
                onChange={(e) => setApiSettings(prev => ({...prev, refreshInterval: parseInt(e.target.value)}))}
                min={1}
                max={60}
              />
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
                onCheckedChange={(checked) => setNotifications(prev => ({...prev, priceAlerts: checked}))}
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
                onCheckedChange={(checked) => setNotifications(prev => ({...prev, patternDetection: checked}))}
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
                onCheckedChange={(checked) => setNotifications(prev => ({...prev, pnlUpdates: checked}))}
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
                onCheckedChange={(checked) => setNotifications(prev => ({...prev, marketNews: checked}))}
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
