import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleFyersLogin, handleFyersCallback } from "./routes/fyers-auth";
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
  app.get("/fyers/callback", handleFyersCallback);

  // Market data routes
  app.get("/api/market/data", handleMarketData);
  app.get("/api/market/option-chain", handleOptionChain);
  app.get("/api/market/patterns", handleCandlestickPatterns);

  // Position and reporting routes
  app.get("/api/positions", handlePositions);
  app.get("/api/reports/pnl-download", handlePNLDownload);

  return app;
}
