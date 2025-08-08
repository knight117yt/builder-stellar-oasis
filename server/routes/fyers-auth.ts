import { RequestHandler } from "express";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface FyersLoginRequest {
  appId: string;
  secretId: string;
  pin: string;
}

interface FyersAuthResponse {
  success: boolean;
  token?: string;
  message: string;
}

export const handleFyersLogin: RequestHandler = async (req, res) => {
  try {
    const { appId, secretId, pin }: FyersLoginRequest = req.body;

    if (!appId || !secretId || !pin) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: appId, secretId, or pin"
      });
    }

    // Call Python script for Fyers authentication
    const pythonScript = `
import sys
import json
from fyers_api import fyersModel

def authenticate_fyers(app_id, secret_id, pin):
    try:
        # Initialize Fyers session
        fyers = fyersModel.FyersModel(client_id=app_id, token="", log_path="")
        
        # Generate access token (this would normally involve OAuth flow)
        # For now, we'll simulate the authentication
        
        # In real implementation, you would:
        # 1. Use the OAuth flow to get authorization code
        # 2. Exchange code for access token
        # 3. Store token securely
        
        response = {
            "success": True,
            "token": f"mock_token_{app_id}_{pin}",
            "message": "Authentication successful"
        }
        
        return response
        
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

if __name__ == "__main__":
    app_id = sys.argv[1]
    secret_id = sys.argv[2]
    pin = sys.argv[3]
    
    result = authenticate_fyers(app_id, secret_id, pin)
    print(json.dumps(result))
`;

    // Execute Python authentication script
    const { stdout, stderr } = await execAsync(
      `python3 -c "${pythonScript.replace(/"/g, '\\"')}" "${appId}" "${secretId}" "${pin}"`
    );

    if (stderr) {
      console.error("Python script error:", stderr);
      return res.status(500).json({
        success: false,
        message: "Authentication service error"
      });
    }

    const result: FyersAuthResponse = JSON.parse(stdout.trim());
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }

  } catch (error) {
    console.error("Fyers authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication"
    });
  }
};

export const handleFyersCallback: RequestHandler = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code not received"
      });
    }

    // Process OAuth callback with Python script
    const pythonScript = `
import sys
import json

def process_oauth_callback(auth_code, state):
    try:
        # In real implementation, exchange auth code for access token
        # This would involve calling Fyers token endpoint
        
        response = {
            "success": True,
            "token": f"access_token_{auth_code}",
            "message": "OAuth authentication successful"
        }
        
        return response
        
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

if __name__ == "__main__":
    auth_code = sys.argv[1]
    state = sys.argv[2] if len(sys.argv) > 2 else ""
    
    result = process_oauth_callback(auth_code, state)
    print(json.dumps(result))
`;

    const { stdout, stderr } = await execAsync(
      `python3 -c "${pythonScript.replace(/"/g, '\\"')}" "${code}" "${state || ''}"`
    );

    if (stderr) {
      console.error("OAuth callback error:", stderr);
      return res.status(500).json({
        success: false,
        message: "OAuth processing error"
      });
    }

    const result: FyersAuthResponse = JSON.parse(stdout.trim());
    
    // Redirect back to frontend with token
    if (result.success) {
      res.redirect(`/?token=${result.token}&status=success`);
    } else {
      res.redirect(`/?status=error&message=${encodeURIComponent(result.message)}`);
    }

  } catch (error) {
    console.error("OAuth callback error:", error);
    res.redirect(`/?status=error&message=${encodeURIComponent("Authentication failed")}`);
  }
};
