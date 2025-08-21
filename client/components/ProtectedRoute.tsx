import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from "@/services/authService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const validateAuth = async () => {
      try {
        // First check if basic auth data exists
        const hasAuthData = authService.isAuthenticated();

        if (!hasAuthData) {
          setIsAuthenticated(false);
          setIsValidating(false);
          return;
        }

        // For mock mode, skip token validation
        if (authService.isMockMode()) {
          setIsAuthenticated(true);
          setIsValidating(false);
          return;
        }

        // Validate token with server for live mode
        const isValidToken = await authService.validateToken();

        if (!isValidToken) {
          // Token is invalid, clear auth data
          authService.clearAuthData();
          setIsAuthenticated(false);
          setError("Session expired. Please log in again.");
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth validation error:", error);
        // On validation error, allow access in mock mode but show warning
        if (authService.isMockMode()) {
          setIsAuthenticated(true);
          setError("Authentication validation failed. Running in demo mode.");
        } else {
          setIsAuthenticated(false);
          setError("Authentication validation failed. Please log in again.");
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateAuth();
  }, []);

  // Show loading during validation
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Validating authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show error alert if there's an authentication issue but user is still allowed access
  return (
    <>
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-96">
          <Alert variant="default" className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      {children}
    </>
  );
}

export default ProtectedRoute;
