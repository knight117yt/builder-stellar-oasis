// Authentication service for Fyers v3 integration
export class AuthService {
  private static instance: AuthService;
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    const token = this.getToken();
    const authMode = this.getAuthMode();
    return !!(token && (authMode === "live" || authMode === "mock"));
  }

  // Get stored token
  public getToken(): string | null {
    return localStorage.getItem("fyers_token");
  }

  // Get authentication mode
  public getAuthMode(): string | null {
    return localStorage.getItem("auth_mode");
  }

  // Check if in mock mode
  public isMockMode(): boolean {
    const authMode = this.getAuthMode();
    const token = this.getToken();
    return authMode === "mock" || token?.includes("mock") || false;
  }

  // Set authentication data
  public setAuthData(token: string, mode: string): void {
    localStorage.setItem("fyers_token", token);
    localStorage.setItem("auth_mode", mode);
  }

  // Clear authentication data
  public clearAuthData(): void {
    localStorage.removeItem("fyers_token");
    localStorage.removeItem("auth_mode");
  }

  // Get authorization headers for API calls
  public getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Logout function
  public async logout(): Promise<void> {
    try {
      // Call logout endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Always clear local storage
      this.clearAuthData();
    }
  }

  // OAuth login
  public async initiateOAuth(credentials: {
    appId: string;
    secretId: string;
    pin?: string;
  }): Promise<{ success: boolean; auth_url?: string; message: string }> {
    try {
      const response = await fetch("/api/auth/fyers-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("OAuth initiation failed:", error);
      throw new Error("Failed to initiate OAuth authentication");
    }
  }

  // Manual auth code processing
  public async processManualAuthCode(data: {
    authCode: string;
    appId: string;
    secretId: string;
    pin?: string;
  }): Promise<{ success: boolean; token?: string; mode?: string; message: string }> {
    try {
      const response = await fetch("/api/auth/fyers-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.token) {
        this.setAuthData(result.token, result.mode || "live");
      }

      return result;
    } catch (error) {
      console.error("Manual auth code processing failed:", error);
      throw new Error("Failed to process authorization code");
    }
  }

  // Direct login (fallback)
  public async directLogin(credentials: {
    appId: string;
    secretId: string;
    pin: string;
  }): Promise<{ success: boolean; token?: string; mode?: string; message: string }> {
    try {
      const response = await fetch("/api/auth/fyers-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.token) {
        this.setAuthData(result.token, result.mode || "live");
      }

      return result;
    } catch (error) {
      console.error("Direct login failed:", error);
      throw new Error("Failed to authenticate with Fyers API");
    }
  }

  // Mock login
  public mockLogin(): { success: boolean; token: string; mode: string; message: string } {
    const mockToken = `mock_token_v3_${Date.now()}`;
    this.setAuthData(mockToken, "mock");
    
    return {
      success: true,
      token: mockToken,
      mode: "mock",
      message: "Mock authentication successful"
    };
  }

  // Validate token by making a test API call
  public async validateToken(): Promise<boolean> {
    try {
      const response = await fetch("/api/status", {
        headers: this.getAuthHeaders(),
      });
      
      return response.ok;
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
    }
  }
}

export const authService = AuthService.getInstance();
export default authService;
