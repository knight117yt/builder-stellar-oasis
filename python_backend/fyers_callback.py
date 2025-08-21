#!/usr/bin/env python3
"""
Simple Flask server to handle Fyers OAuth callback and redirect to React app
This runs on port 5000 to match the Fyers callback URL: http://127.0.0.1:5000/fyers/callback
"""

from flask import Flask, request, redirect, render_template_string
import urllib.parse
import sys
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# HTML template for the callback page
CALLBACK_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fyers Authentication - Redirecting...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #f8fafc;
            margin: 0;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 500px;
        }
        .success {
            color: #10b981;
            font-size: 48px;
            margin-bottom: 20px;
        }
        .error {
            color: #ef4444;
            font-size: 48px;
            margin-bottom: 20px;
        }
        h1 {
            color: #1f2937;
            margin-bottom: 10px;
        }
        p {
            color: #6b7280;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .code-box {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 12px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 14px;
            word-break: break-all;
            margin: 20px 0;
        }
        .button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
            font-size: 14px;
        }
        .button:hover {
            background: #2563eb;
        }
        .button-secondary {
            background: #6b7280;
        }
        .button-secondary:hover {
            background: #4b5563;
        }
        .spinner {
            border: 2px solid #f3f3f3;
            border-top: 2px solid #3b82f6;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        {% if auth_code %}
            <div class="success">✅</div>
            <h1>Authentication Successful!</h1>
            <p>Your Fyers authorization code has been received:</p>
            <div class="code-box">{{ auth_code }}</div>
            <p>
                You will be automatically redirected to the login page in <span id="countdown">5</span> seconds,
                or you can click the button below to continue immediately.
            </p>
            <a href="{{ redirect_url }}" class="button">Continue to Login</a>
            <button onclick="copyCode()" class="button button-secondary">Copy Code</button>
        {% else %}
            <div class="error">❌</div>
            <h1>Authentication Error</h1>
            <p>{{ error_message }}</p>
            <p>Please try again or contact support if the issue persists.</p>
            <a href="http://localhost:8080/login" class="button">Back to Login</a>
        {% endif %}
    </div>

    <script>
        {% if auth_code %}
        // Auto-redirect countdown
        let countdown = 5;
        const countdownElement = document.getElementById('countdown');
        
        const timer = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(timer);
                window.location.href = '{{ redirect_url }}';
            }
        }, 1000);
        
        // Copy code function
        function copyCode() {
            const code = '{{ auth_code }}';
            navigator.clipboard.writeText(code).then(() => {
                alert('Authorization code copied to clipboard!');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = code;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Authorization code copied to clipboard!');
            });
        }
        {% endif %}
    </script>
</body>
</html>
"""

@app.route('/fyers/callback')
def fyers_callback():
    """Handle Fyers OAuth callback and redirect to React app with auth code"""
    try:
        # Get parameters from the callback URL
        auth_code = request.args.get('auth_code') or request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        error_description = request.args.get('error_description')
        
        logger.info(f"Fyers callback received - Code: {'***' if auth_code else 'None'}, Error: {error}")
        
        if error:
            error_message = error_description or f"Authentication failed: {error}"
            logger.error(f"OAuth error: {error_message}")
            return render_template_string(CALLBACK_HTML, 
                                        auth_code=None, 
                                        error_message=error_message)
        
        if auth_code:
            # Prepare redirect URL to React app with auth code
            react_app_url = "http://localhost:8080/fyers/callback"
            params = {
                'auth_code': auth_code,
                'state': state if state else ''
            }
            redirect_url = f"{react_app_url}?{urllib.parse.urlencode(params)}"
            
            logger.info(f"Successful OAuth callback, redirecting to: {react_app_url}")
            
            return render_template_string(CALLBACK_HTML, 
                                        auth_code=auth_code,
                                        error_message=None,
                                        redirect_url=redirect_url)
        else:
            error_message = "No authorization code received from Fyers"
            logger.error(error_message)
            return render_template_string(CALLBACK_HTML, 
                                        auth_code=None, 
                                        error_message=error_message)
            
    except Exception as e:
        error_message = f"Callback processing error: {str(e)}"
        logger.error(error_message)
        return render_template_string(CALLBACK_HTML, 
                                    auth_code=None, 
                                    error_message=error_message)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Fyers callback server is running"}

@app.route('/')
def index():
    """Root endpoint with information"""
    return {
        "service": "Fyers OAuth Callback Server",
        "callback_url": "http://127.0.0.1:5000/fyers/callback",
        "status": "running",
        "instructions": "This server handles Fyers OAuth callbacks and redirects to the React app"
    }

if __name__ == '__main__':
    print("Starting Fyers OAuth Callback Server...")
    print("Callback URL: http://127.0.0.1:5000/fyers/callback")
    print("This server will handle Fyers OAuth redirects and forward to the React app")
    print("Make sure your React app is running on http://localhost:8080")
    print("-" * 50)
    
    try:
        app.run(host='127.0.0.1', port=5000, debug=True)
    except KeyboardInterrupt:
        print("\nShutting down Fyers callback server...")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)
