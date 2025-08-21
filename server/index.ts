import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import { handleDemo } from "./routes/demo";
import {
  handleFyersLogin,
  handleFyersCallback,
  handleFyersOAuth,
  handleManualAuthCode,
} from "./routes/fyers-auth";
import {
  handleMarketData,
  handleOptionChain,
  handleCandlestickPatterns,
} from "./routes/market-data";
import { handlePNLDownload, handlePositions } from "./routes/reports";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session middleware for OAuth flow
  app.use(
    session({
      secret:
        process.env.SESSION_SECRET ||
        "fallback-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    }),
  );

  // Health check
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "pong";
    res.json({ message: ping });
  });

  // Status endpoint to check mock/live mode
  app.get("/api/status", (_req, res) => {
    res.json({
      status: "running",
      mode: "mock_fallback_ready",
      message:
        "Indian Market Predictors API is running with mock data fallback",
      timestamp: new Date().toISOString(),
    });
  });

  // Demo route (keep for reference)
  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/fyers-login", handleFyersLogin);
  app.post("/api/auth/fyers-oauth", handleFyersOAuth);
  app.post("/api/auth/fyers-manual", handleManualAuthCode);
  app.get("/api/auth/fyers/callback", handleFyersCallback);

  // Debug endpoint to check Fyers API v3 installation
  app.get("/api/auth/debug", async (req, res) => {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      const pythonScript = `
import sys
import json

def check_fyers_installation():
    try:
        import fyers_apiv3
        from fyers_apiv3 import fyersModel

        version = getattr(fyers_apiv3, '__version__', 'unknown')

        return {
            "success": True,
            "installed": True,
            "version": version,
            "python_version": sys.version,
            "message": "Fyers API v3 is properly installed"
        }
    except ImportError as e:
        return {
            "success": False,
            "installed": False,
            "error": str(e),
            "python_version": sys.version,
            "message": "Fyers API v3 is not installed"
        }
    except Exception as e:
        return {
            "success": False,
            "installed": False,
            "error": str(e),
            "python_version": sys.version,
            "message": f"Error checking Fyers API v3: {str(e)}"
        }

if __name__ == "__main__":
    result = check_fyers_installation()
    print(json.dumps(result))
`;

      const { stdout, stderr } = await execAsync(
        `python3 -c "${pythonScript.replace(/"/g, '\\"')}"`,
      );

      if (stderr) {
        console.warn("Debug check stderr:", stderr);
      }

      const result = JSON.parse(stdout.trim());
      res.json(result);
    } catch (error) {
      console.error("Debug check error:", error);
      res.json({
        success: false,
        installed: false,
        error: error.message,
        message: "Failed to check Fyers API v3 installation"
      });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  // Market data routes
  app.get("/api/market/data", handleMarketData);
  app.get("/api/market/option-chain", handleOptionChain);
  app.get("/api/market/patterns", handleCandlestickPatterns);

  // Position and reporting routes
  app.get("/api/positions", handlePositions);
  app.get("/api/reports/pnl-download", handlePNLDownload);

  // Account endpoints
  app.get("/api/account/info", (_req, res) => {
    res.json({
      data: {
        balance: 100000,
        available_margin: 80000,
        used_margin: 20000,
        total_balance: 100000,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Additional market data endpoints
  app.get("/api/market/live-data", (req, res) => {
    const symbols = req.query.symbols as string;
    const symbolList = symbols ? symbols.split(",") : ["NSE:NIFTY50-INDEX"];

    const data: Record<string, any> = {};
    symbolList.forEach((symbol) => {
      const basePrice = symbol.includes("NIFTY") ? 19850 : 44250;
      const change = (Math.random() - 0.5) * 100;
      data[symbol] = {
        ltp: basePrice + change,
        ch: change,
        chp: (change / basePrice) * 100,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        oi: Math.floor(Math.random() * 5000000) + 1000000,
      };
    });

    res.json({
      data,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/market/historical", (_req, res) => {
    const candles = [];
    const basePrice = 19850;

    for (let i = 0; i < 100; i++) {
      const timestamp = Date.now() - i * 24 * 60 * 60 * 1000;
      const open = basePrice + (Math.random() - 0.5) * 200;
      const high = open + Math.random() * 50;
      const low = open - Math.random() * 50;
      const close = low + Math.random() * (high - low);
      const volume = Math.floor(Math.random() * 1000000) + 100000;

      candles.unshift([timestamp, open, high, low, close, volume]);
    }

    res.json({
      s: "ok",
      candles,
      timestamp: new Date().toISOString(),
    });
  });

  // Algorithm endpoints
  app.get("/api/algo/strategies", (_req, res) => {
    res.json({
      strategies: [
        {
          id: "mock_strategy_1",
          name: "Moving Average Crossover",
          symbol: "NSE:NIFTY50-INDEX",
          strategy_type: "technical",
          status: "inactive",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          performance: {
            total_trades: 15,
            profitable_trades: 9,
            total_pnl: 5800,
            win_rate: 60,
            max_drawdown: 12.3,
          },
        },
      ],
    });
  });

  return app;
}
