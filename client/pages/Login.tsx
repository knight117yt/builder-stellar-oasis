import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    appId: 'POEXISKB7W-100',
    secretId: '',
    pin: ''
  });
  const [showSecret, setShowSecret] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Try Fyers API authentication first
      const response = await fetch('/api/auth/fyers-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('fyers_token', data.token);
        localStorage.setItem('auth_mode', 'live');
        navigate('/dashboard');
      } else {
        throw new Error('Fyers API connection failed');
      }
    } catch (err) {
      // Fallback to mock data mode
      console.warn('Fyers API unavailable, using mock data mode');
      const mockToken = `mock_token_${Date.now()}`;
      localStorage.setItem('fyers_token', mockToken);
      localStorage.setItem('auth_mode', 'mock');
      setError('Using demo mode with mock data (Fyers API unavailable)');

      // Navigate after showing the warning briefly
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = () => {
    setLoading(true);
    // Direct mock mode login
    const mockToken = `mock_token_${Date.now()}`;
    localStorage.setItem('fyers_token', mockToken);
    localStorage.setItem('auth_mode', 'mock');

    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  const handleFyersOAuth = () => {
    // Redirect to Fyers OAuth
    const redirectUrl = 'http://127.0.0.1:5000/fyers/callback';
    const fyersAuthUrl = `https://api-t2.fyers.in/vagator/v2/auth?client_id=${credentials.appId}&redirect_uri=${redirectUrl}&response_type=code&state=sample_state`;
    window.location.href = fyersAuthUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your Indian Market Predictors account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fyers Authentication</CardTitle>
            <CardDescription>
              Connect your Fyers account to access market data and trading features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appId">App ID</Label>
                <Input
                  id="appId"
                  type="text"
                  value={credentials.appId}
                  onChange={(e) => setCredentials(prev => ({ ...prev, appId: e.target.value }))}
                  placeholder="Enter your Fyers App ID"
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretId">Secret ID</Label>
                <div className="relative">
                  <Input
                    id="secretId"
                    type={showSecret ? "text" : "password"}
                    value={credentials.secretId}
                    onChange={(e) => setCredentials(prev => ({ ...prev, secretId: e.target.value }))}
                    placeholder="Enter your Fyers Secret ID"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">Trading PIN</Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    value={credentials.pin}
                    onChange={(e) => setCredentials(prev => ({ ...prev, pin: e.target.value }))}
                    placeholder="Enter your trading PIN"
                    maxLength={6}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleFyersOAuth}
                >
                  Fyers OAuth
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="px-8 text-center text-sm text-muted-foreground">
          <p>
            By continuing, you agree to our{' '}
            <a href="#" className="underline hover:text-primary">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="underline hover:text-primary">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
