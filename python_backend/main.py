#!/usr/bin/env python3
"""
Indian Market Predictors - Python Backend
Main FastAPI application with Fyers API integration
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
import os
from datetime import datetime, timedelta
import logging
import asyncio
from typing import Dict, List, Optional
import json

# Local imports
from config import settings
from models import *
from fyers_client import FyersClient
from technical_analysis import TechnicalAnalyzer
from pattern_detector import PatternDetector
from alert_manager import AlertManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Indian Market Predictors API",
    description="Advanced trading platform backend with Fyers integration",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Global instances
fyers_client = None
technical_analyzer = TechnicalAnalyzer()
pattern_detector = PatternDetector()
alert_manager = AlertManager()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Indian Market Predictors Backend...")
    
    # Initialize Fyers client
    global fyers_client
    try:
        fyers_client = FyersClient(
            app_id=settings.FYERS_APP_ID,
            secret_key=settings.FYERS_SECRET_KEY,
            redirect_uri=settings.FYERS_REDIRECT_URI
        )
        logger.info("Fyers client initialized successfully")
    except Exception as e:
        logger.warning(f"Fyers client initialization failed: {e}")
        logger.info("Running in mock mode")
    
    # Start background tasks
    asyncio.create_task(background_market_monitor())
    logger.info("Background market monitoring started")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Indian Market Predictors Backend...")

# Authentication Routes
@app.post("/api/auth/fyers-login", response_model=AuthResponse)
async def fyers_login(auth_request: FyersAuthRequest):
    """Authenticate with Fyers API"""
    try:
        if fyers_client:
            # Real Fyers authentication
            token = await fyers_client.authenticate(
                auth_request.app_id,
                auth_request.secret_id,
                auth_request.pin
            )
            
            return AuthResponse(
                success=True,
                token=token,
                message="Authentication successful",
                mode="live"
            )
        else:
            # Mock authentication fallback
            mock_token = f"mock_token_{auth_request.app_id}_{datetime.now().timestamp()}"
            return AuthResponse(
                success=True,
                token=mock_token,
                message="Mock authentication successful",
                mode="mock"
            )
            
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        # Return mock token as fallback
        mock_token = f"fallback_token_{datetime.now().timestamp()}"
        return AuthResponse(
            success=True,
            token=mock_token,
            message="Fallback authentication"
        )

# Market Data Routes
@app.get("/api/market/data", response_model=MarketDataResponse)
async def get_market_data(
    symbol: str = "NIFTY50",
    interval: str = "1D",
    token: str = Depends(security)
):
    """Get market data (OHLCV) for specified symbol"""
    try:
        if fyers_client and fyers_client.is_authenticated():
            # Get real data from Fyers
            data = await fyers_client.get_historical_data(symbol, interval)
        else:
            # Generate mock data
            data = generate_mock_candle_data(symbol, interval)
        
        return MarketDataResponse(
            success=True,
            data={
                "symbol": symbol,
                "interval": interval,
                "candles": data
            }
        )
        
    except Exception as e:
        logger.error(f"Market data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/option-chain", response_model=OptionChainResponse)
async def get_option_chain(
    symbol: str = "NIFTY",
    expiry: Optional[str] = None,
    token: str = Depends(security)
):
    """Get option chain data with Greeks"""
    try:
        if fyers_client and fyers_client.is_authenticated():
            # Get real option chain from Fyers
            option_data = await fyers_client.get_option_chain(symbol, expiry)
        else:
            # Generate mock option chain
            spot_price = get_spot_price(symbol)
            option_data = generate_mock_option_chain(spot_price)
        
        return OptionChainResponse(
            success=True,
            data={
                "symbol": symbol,
                "expiry": expiry,
                "strikes": option_data
            }
        )
        
    except Exception as e:
        logger.error(f"Option chain error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/patterns", response_model=PatternResponse)
async def detect_patterns(
    symbol: str = "NIFTY50",
    token: str = Depends(security)
):
    """Detect candlestick patterns"""
    try:
        # Get recent market data
        if fyers_client and fyers_client.is_authenticated():
            candles = await fyers_client.get_historical_data(symbol, "5m", count=100)
        else:
            candles = generate_mock_candle_data(symbol, "5m", count=100)
        
        # Detect patterns
        patterns = pattern_detector.detect_patterns(candles)
        
        return PatternResponse(
            success=True,
            data={
                "symbol": symbol,
                "detected_patterns": patterns,
                "total_patterns": len(patterns)
            }
        )
        
    except Exception as e:
        logger.error(f"Pattern detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Position and Portfolio Routes
@app.get("/api/positions", response_model=PositionsResponse)
async def get_positions(token: str = Depends(security)):
    """Get current positions"""
    try:
        if fyers_client and fyers_client.is_authenticated():
            positions = await fyers_client.get_positions()
        else:
            positions = generate_mock_positions()
        
        return PositionsResponse(
            success=True,
            data={
                "positions": positions,
                "total_pnl": sum(p.pnl for p in positions),
                "total_invested": sum(p.avg_price * p.quantity for p in positions)
            }
        )
        
    except Exception as e:
        logger.error(f"Positions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Technical Analysis Routes
@app.get("/api/analysis/technical", response_model=TechnicalAnalysisResponse)
async def get_technical_analysis(
    symbol: str = "NIFTY",
    token: str = Depends(security)
):
    """Get comprehensive technical analysis"""
    try:
        # Get market data
        if fyers_client and fyers_client.is_authenticated():
            candles = await fyers_client.get_historical_data(symbol, "1D", count=100)
        else:
            candles = generate_mock_candle_data(symbol, "1D", count=100)
        
        # Perform technical analysis
        analysis = technical_analyzer.analyze(candles)
        
        return TechnicalAnalysisResponse(
            success=True,
            data=analysis
        )
        
    except Exception as e:
        logger.error(f"Technical analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Alert Routes
@app.post("/api/alerts/price", response_model=AlertResponse)
async def create_price_alert(
    alert: PriceAlertRequest,
    token: str = Depends(security)
):
    """Create a price alert"""
    try:
        alert_id = alert_manager.add_price_alert(alert)
        return AlertResponse(
            success=True,
            message="Price alert created successfully",
            alert_id=alert_id
        )
    except Exception as e:
        logger.error(f"Price alert error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/alerts", response_model=AlertsResponse)
async def get_alerts(token: str = Depends(security)):
    """Get all active alerts"""
    try:
        alerts = alert_manager.get_alerts()
        return AlertsResponse(
            success=True,
            data=alerts
        )
    except Exception as e:
        logger.error(f"Get alerts error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Background Tasks
async def background_market_monitor():
    """Background task to monitor market and trigger alerts"""
    while True:
        try:
            # Check alerts every 5 seconds
            await alert_manager.check_alerts()
            await asyncio.sleep(5)
        except Exception as e:
            logger.error(f"Background monitor error: {e}")
            await asyncio.sleep(10)

# Utility Functions
def get_spot_price(symbol: str) -> float:
    """Get current spot price for symbol"""
    price_map = {
        "NIFTY": 19850.50,
        "BANKNIFTY": 44250.75,
        "SENSEX": 65875.25
    }
    return price_map.get(symbol, 19850.50)

def generate_mock_candle_data(symbol: str, interval: str, count: int = 50) -> List[Dict]:
    """Generate mock candlestick data"""
    base_price = get_spot_price(symbol)
    candles = []
    
    for i in range(count):
        timestamp = datetime.now() - timedelta(minutes=i * 5)
        open_price = base_price + (random.uniform(-1, 1) * 100)
        high = open_price + random.uniform(0, 50)
        low = open_price - random.uniform(0, 50)
        close = low + random.uniform(0, high - low)
        volume = random.randint(100000, 1000000)
        
        candles.append({
            "timestamp": timestamp.isoformat(),
            "open": round(open_price, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "close": round(close, 2),
            "volume": volume
        })
    
    return candles

def generate_mock_option_chain(spot_price: float) -> List[Dict]:
    """Generate mock option chain data"""
    # Implementation similar to frontend mock data
    # ... (implement based on frontend logic)
    return []

def generate_mock_positions() -> List[Position]:
    """Generate mock positions"""
    # Implementation similar to frontend mock data
    # ... (implement based on frontend logic)
    return []

# Health Check
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "fyers_connected": fyers_client is not None and fyers_client.is_authenticated(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
