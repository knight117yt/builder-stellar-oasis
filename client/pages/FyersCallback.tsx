import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import { Copy, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

export default function FyersCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [authCode, setAuthCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Extract auth code from URL parameters
    const code = searchParams.get("auth_code") || searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (errorParam) {
      setError(
        errorDescription
          ? `Authentication failed: ${errorDescription}`
          : `Authentication failed: ${errorParam}`,
      );
    } else if (code) {
      setAuthCode(code);
    } else {
      setError(
        "No authorization code found in the URL. Please restart the authentication process.",
      );
    }
  }, [searchParams]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(authCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = authCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoBack = () => {
    navigate("/login");
  };

  const handleOpenLogin = () => {
    // Open login page in a new tab with a flag to show manual auth
    window.open("/login?show_manual_auth=true", "_blank");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Fyers Authentication
          </h1>
          <p className="text-sm text-muted-foreground">
            {authCode
              ? "Authentication code received"
              : "Processing authentication"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {authCode ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Authorization Code
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Authentication Error
                </>
              )}
            </CardTitle>
            <CardDescription>
              {authCode
                ? "Copy this code and paste it in the login form to complete authentication."
                : "There was an issue with the authentication process."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {authCode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="authCode">Authorization Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="authCode"
                      value={authCode}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="icon"
                      disabled={copied}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-600">
                      Code copied to clipboard!
                    </p>
                  )}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Next Steps:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                      <li>Copy the authorization code above</li>
                      <li>Go back to the login page</li>
                      <li>Paste the code in the "Authorization Code" field</li>
                      <li>Click "Authenticate with Code"</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>

              {authCode && (
                <Button onClick={handleOpenLogin} className="flex-1">
                  Open Login in New Tab
                </Button>
              )}
            </div>

            {authCode && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2">
                  Alternative Method:
                </h4>
                <p className="text-xs text-muted-foreground">
                  You can also manually copy this URL and extract the code
                  yourself:
                </p>
                <code className="text-xs break-all bg-background p-2 rounded mt-2 block">
                  {window.location.href}
                </code>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            This page was opened automatically after Fyers authentication.
            <br />
            Keep this window open while you complete the login process.
          </p>
        </div>
      </div>
    </div>
  );
}
