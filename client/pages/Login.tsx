import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  Eye,
  EyeOff,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [credentials, setCredentials] = useState({
    appId: "POEXISKB7W-100",
    secretId: "",
    pin: "",
  });
  const [showSecret, setShowSecret] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthUrl, setOauthUrl] = useState("");
  const [showManualAuth, setShowManualAuth] = useState(false);
  const [manualAuthCode, setManualAuthCode] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get("token");
    const status = searchParams.get("status");
    const mode = searchParams.get("mode");
    const errorMessage = searchParams.get("message");

    if (status === "success" && token) {
      // Clear any existing errors
      setError("");
      // Store authentication data
      localStorage.setItem("fyers_token", token);
      localStorage.setItem("auth_mode", mode || "live");
      // Navigate to dashboard
      navigate("/dashboard", { replace: true });
    } else if (status === "error" && errorMessage) {
      setError(decodeURIComponent(errorMessage));
      // Clear the URL parameters to prevent loops
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Try Fyers API v3 authentication
      const result = await authService.directLogin(credentials);

      if (result.mode === "oauth_required" && result.auth_url) {
        // OAuth flow required
        setOauthUrl(result.auth_url);
        setError(
          "OAuth authentication required. Click the OAuth button below.",
        );
      } else if (result.token) {
        // Direct authentication successful
        navigate("/dashboard");
      } else {
        throw new Error(result.message || "Authentication failed");
      }
    } catch (err) {
      // Fallback to mock data mode
      console.warn("Fyers API unavailable, using mock data mode:", err);
      const mockResult = authService.mockLogin();
      setError("Using demo mode with mock data (Fyers API v3 unavailable)");

      // Navigate after showing the warning briefly
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = () => {
    setLoading(true);
    // Direct mock mode login
    const mockResult = authService.mockLogin();

    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1000);
  };

  const handleFyersOAuth = async () => {
    if (!credentials.appId || !credentials.secretId) {
      setError("Please enter App ID and Secret ID before initiating OAuth");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await authService.initiateOAuth({
        appId: credentials.appId,
        secretId: credentials.secretId,
        pin: credentials.pin,
      });

      if (result.success && result.auth_url) {
        // Show manual auth code option and open OAuth in new tab
        setOauthUrl(result.auth_url);
        setShowManualAuth(true);
        setError(
          "OAuth URL generated. You can either click 'Open OAuth' or manually enter the auth code below after completing authentication.",
        );
      } else {
        setError(result.message || "Failed to initiate OAuth");
      }
    } catch (err) {
      console.error("OAuth error:", err);
      setError("OAuth initiation failed. Using fallback authentication.");

      // Fallback to mock mode
      const mockResult = authService.mockLogin();

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAuthCode = async () => {
    if (!manualAuthCode.trim()) {
      setError("Please enter the authorization code");
      return;
    }

    if (!credentials.appId || !credentials.secretId) {
      setError("Please enter App ID and Secret ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await authService.processManualAuthCode({
        authCode: manualAuthCode.trim(),
        appId: credentials.appId,
        secretId: credentials.secretId,
        pin: credentials.pin,
      });

      if (result.success && result.token) {
        navigate("/dashboard");
      } else {
        setError(result.message || "Manual authentication failed");
      }
    } catch (err) {
      console.error("Manual auth error:", err);
      setError("Manual authentication failed. Please check your auth code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your Indian Market Predictors account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fyers v3 Authentication</CardTitle>
            <CardDescription>
              Connect your Fyers account using the latest v3 API to access
              market data and trading features
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
                  onChange={(e) =>
                    setCredentials((prev) => ({
                      ...prev,
                      appId: e.target.value,
                    }))
                  }
                  placeholder="Enter your Fyers App ID"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your Fyers App ID from the developer portal
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretId">Secret Key</Label>
                <div className="relative">
                  <Input
                    id="secretId"
                    type={showSecret ? "text" : "password"}
                    value={credentials.secretId}
                    onChange={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        secretId: e.target.value,
                      }))
                    }
                    placeholder="Enter your Fyers Secret Key"
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
                <p className="text-xs text-muted-foreground">
                  Your Fyers Secret Key (keep this secure)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">Trading PIN (Optional)</Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    value={credentials.pin}
                    onChange={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        pin: e.target.value,
                      }))
                    }
                    placeholder="Enter your trading PIN (optional)"
                    maxLength={6}
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
                <p className="text-xs text-muted-foreground">
                  Required only for trading operations
                </p>
              </div>

              {error && (
                <Alert
                  variant={
                    error.includes("demo mode") ? "default" : "destructive"
                  }
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleFyersOAuth}
                  disabled={loading}
                >
                  {loading ? (
                    "Initiating OAuth..."
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Authenticate with Fyers v3 OAuth
                    </>
                  )}
                </Button>

                {showManualAuth && oauthUrl && (
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(oauthUrl, "_blank")}
                        disabled={loading}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open OAuth
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowManualAuth(false);
                          setManualAuthCode("");
                          setOauthUrl("");
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="authCode">Authorization Code</Label>
                      <Input
                        id="authCode"
                        type="text"
                        value={manualAuthCode}
                        onChange={(e) => setManualAuthCode(e.target.value)}
                        placeholder="Paste the authorization code here"
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        After completing OAuth authentication, copy the
                        authorization code from the callback URL and paste it
                        here.
                      </p>
                    </div>

                    <Button
                      type="button"
                      className="w-full"
                      onClick={handleManualAuthCode}
                      disabled={loading || !manualAuthCode.trim()}
                    >
                      {loading ? "Processing..." : "Authenticate with Code"}
                    </Button>
                  </div>
                )}

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
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Direct Login (Fallback)"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={handleMockLogin}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Demo Mode (Mock Data)"}
                </Button>
              </div>
            </form>

            {oauthUrl && !showManualAuth && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  OAuth URL generated. Click the button above to authenticate
                  with Fyers.
                </p>
                <p className="text-xs text-muted-foreground break-all">
                  {oauthUrl}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="px-8 text-center text-sm text-muted-foreground">
          <p>
            By continuing, you agree to our{" "}
            <a href="#" className="underline hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-primary">
              Privacy Policy
            </a>
            .
          </p>
          <p className="mt-2 text-xs">
            This app uses Fyers v3 API for enhanced security and performance.
          </p>
        </div>
      </div>
    </div>
  );
}
