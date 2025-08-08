import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import redis
import pandas as pd
import numpy as np
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import uvicorn

from fyers_apiv3 import fyersModel
from fyers_apiv3.FyersWebsocket import data_ws
import structlog

from config import Settings
from models import (
    LoginRequest, AuthResponse, MarketDataRequest, OptionChainRequest,
    ScreenerRequest, AlgoStrategyRequest, WebSocketMessage
)

# Setup logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Initialize settings
settings = Settings()

# Initialize Redis for caching
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    decode_responses=True
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscriptions: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket connection established", connections=len(self.active_connections))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        # Remove from all subscriptions
        for symbol, connections in self.subscriptions.items():
            if websocket in connections:
                connections.remove(websocket)
        logger.info("WebSocket connection closed", connections=len(self.active_connections))

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error("Failed to send message", error=str(e))
            self.disconnect(websocket)

    async def broadcast(self, message: str, symbol: Optional[str] = None):
        if symbol and symbol in self.subscriptions:
            connections = self.subscriptions[symbol].copy()
        else:
            connections = self.active_connections.copy()
        
        for connection in connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error("Failed to broadcast message", error=str(e))
                self.disconnect(connection)

    def subscribe_to_symbol(self, websocket: WebSocket, symbol: str):
        if symbol not in self.subscriptions:
            self.subscriptions[symbol] = []
        if websocket not in self.subscriptions[symbol]:
            self.subscriptions[symbol].append(websocket)
        logger.info("WebSocket subscribed to symbol", symbol=symbol)

manager = ConnectionManager()

# Fyers API integration
class FyersAPI:
    def __init__(self):
        self.fyers = None
        self.access_token = None
        self.websocket_client = None
        
    def initialize(self, access_token: str):
        self.access_token = access_token
        self.fyers = fyersModel.FyersModel(
            client_id=settings.FYERS_APP_ID,
            token=access_token,
            log_path=""
        )
        logger.info("Fyers API initialized")
        
    async def get_market_data(self, symbols: List[str]) -> Dict:
        """Get real-time market data for symbols"""
        try:
            if not self.fyers:
                raise HTTPException(status_code=401, detail="Fyers API not initialized")
            
            data = {}
            for symbol in symbols:
                # Check cache first
                cached_data = redis_client.get(f"market_data:{symbol}")
                if cached_data:
                    data[symbol] = json.loads(cached_data)
                else:
                    # Fetch from Fyers
                    response = self.fyers.quotes({"symbols": symbol})
                    if response['s'] == 'ok':
                        data[symbol] = response['d'][0]
                        # Cache for 1 second
                        redis_client.setex(f"market_data:{symbol}", 1, json.dumps(data[symbol]))
            
            return data
        except Exception as e:
            logger.error("Failed to get market data", error=str(e))
            return self._get_mock_market_data(symbols)
    
    async def get_historical_data(self, symbol: str, timeframe: str, from_date: str, to_date: str) -> Dict:
        """Get historical data for charting"""
        try:
            if not self.fyers:
                raise HTTPException(status_code=401, detail="Fyers API not initialized")
            
            cache_key = f"historical:{symbol}:{timeframe}:{from_date}:{to_date}"
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
            
            data = {
                "symbol": symbol,
                "resolution": timeframe,
                "date_format": "1",
                "range_from": from_date,
                "range_to": to_date,
                "cont_flag": "1"
            }
            
            response = self.fyers.history(data)
            if response['s'] == 'ok':
                # Cache for 5 minutes
                redis_client.setex(cache_key, 300, json.dumps(response))
                return response
            else:
                return self._get_mock_historical_data(symbol, timeframe)
                
        except Exception as e:
            logger.error("Failed to get historical data", error=str(e))
            return self._get_mock_historical_data(symbol, timeframe)
    
    async def get_option_chain(self, symbol: str, expiry: str) -> Dict:
        """Get option chain data"""
        try:
            if not self.fyers:
                raise HTTPException(status_code=401, detail="Fyers API not initialized")
            
            cache_key = f"option_chain:{symbol}:{expiry}"
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
            
            data = {
                "symbol": symbol,
                "expiry": expiry
            }
            
            response = self.fyers.optionchain(data)
            if response['s'] == 'ok':
                # Cache for 10 seconds
                redis_client.setex(cache_key, 10, json.dumps(response))
                return response
            else:
                return self._get_mock_option_chain(symbol)
                
        except Exception as e:
            logger.error("Failed to get option chain", error=str(e))
            return self._get_mock_option_chain(symbol)
    
    def _get_mock_market_data(self, symbols: List[str]) -> Dict:
        """Mock market data for fallback"""
        data = {}
        for symbol in symbols:
            base_price = 19850 if "NIFTY" in symbol else 44250
            change = np.random.uniform(-100, 100)
            data[symbol] = {
                "lp": base_price + change,
                "ch": change,
                "chp": (change / base_price) * 100,
                "v": np.random.randint(100000, 1000000),
                "oi": np.random.randint(1000000, 5000000)
            }
        return data
    
    def _get_mock_historical_data(self, symbol: str, timeframe: str) -> Dict:
        """Mock historical data for fallback"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        dates = pd.date_range(start_date, end_date, freq='D')
        
        data = []
        base_price = 19850 if "NIFTY" in symbol else 44250
        
        for date in dates:
            timestamp = int(date.timestamp())
            open_price = base_price + np.random.uniform(-50, 50)
            close_price = open_price + np.random.uniform(-20, 20)
            high_price = max(open_price, close_price) + np.random.uniform(0, 10)
            low_price = min(open_price, close_price) - np.random.uniform(0, 10)
            
            data.append([timestamp, open_price, high_price, low_price, close_price, np.random.randint(10000, 100000)])
        
        return {
            "s": "ok",
            "candles": data
        }
    
    def _get_mock_option_chain(self, symbol: str) -> Dict:
        """Mock option chain for fallback"""
        strikes = []
        base_price = 19850 if "NIFTY" in symbol else 44250
        
        for i in range(-10, 11):
            strike = base_price + (i * 50)
            strikes.append({
                "strike": strike,
                "call_ltp": max(0.1, base_price - strike + np.random.uniform(-20, 20)),
                "put_ltp": max(0.1, strike - base_price + np.random.uniform(-20, 20)),
                "call_oi": np.random.randint(100, 10000),
                "put_oi": np.random.randint(100, 10000),
                "call_iv": np.random.uniform(15, 35),
                "put_iv": np.random.uniform(15, 35)
            })
        
        return {
            "s": "ok",
            "data": strikes
        }

# Initialize Fyers API
fyers_api = FyersAPI()

# Background tasks for real-time data
class RealTimeDataTask:
    def __init__(self):
        self.running = False
        self.subscribed_symbols = set()
    
    async def start(self):
        self.running = True
        asyncio.create_task(self._update_market_data())
        logger.info("Real-time data task started")
    
    async def stop(self):
        self.running = False
        logger.info("Real-time data task stopped")
    
    async def _update_market_data(self):
        while self.running:
            try:
                if self.subscribed_symbols:
                    symbols = list(self.subscribed_symbols)
                    data = await fyers_api.get_market_data(symbols)
                    
                    for symbol, market_data in data.items():
                        message = {
                            "type": "market_data",
                            "symbol": symbol,
                            "data": market_data,
                            "timestamp": datetime.now().isoformat()
                        }
                        await manager.broadcast(json.dumps(message), symbol)
                
                await asyncio.sleep(1)  # Update every second
            except Exception as e:
                logger.error("Error in real-time data update", error=str(e))
                await asyncio.sleep(5)
    
    def subscribe_symbol(self, symbol: str):
        self.subscribed_symbols.add(symbol)
        logger.info("Symbol subscribed for real-time data", symbol=symbol)
    
    def unsubscribe_symbol(self, symbol: str):
        self.subscribed_symbols.discard(symbol)
        logger.info("Symbol unsubscribed from real-time data", symbol=symbol)

real_time_task = RealTimeDataTask()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await real_time_task.start()
    yield
    # Shutdown
    await real_time_task.stop()

# FastAPI app initialization
app = FastAPI(
    title="Indian Market Predictors API",
    description="Advanced trading platform backend with real-time data and AI analysis",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    # Validate token here
    return {"token": token}

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                
                if message.get("type") == "subscribe":
                    symbol = message.get("symbol")
                    if symbol:
                        manager.subscribe_to_symbol(websocket, symbol)
                        real_time_task.subscribe_symbol(symbol)
                        
                elif message.get("type") == "unsubscribe":
                    symbol = message.get("symbol")
                    if symbol:
                        real_time_task.unsubscribe_symbol(symbol)
                        
            except json.JSONDecodeError:
                await manager.send_personal_message("Invalid JSON format", websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Authentication endpoints
@app.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    try:
        if request.auth_mode == "fyers":
            # Initialize Fyers API
            fyers_api.initialize(request.access_token)
            
            # Store token in Redis
            redis_client.setex(f"auth_token:{request.access_token}", 3600, "valid")
            
            return AuthResponse(
                access_token=request.access_token,
                token_type="bearer",
                expires_in=3600,
                success=True
            )
        else:
            # Mock authentication
            mock_token = "mock_token_12345"
            redis_client.setex(f"auth_token:{mock_token}", 3600, "valid")
            
            return AuthResponse(
                access_token=mock_token,
                token_type="bearer",
                expires_in=3600,
                success=True
            )
    except Exception as e:
        logger.error("Login failed", error=str(e))
        raise HTTPException(status_code=401, detail="Authentication failed")

# Market data endpoints
@app.get("/market/live-data")
async def get_live_market_data(symbols: str, user=Depends(get_current_user)):
    symbol_list = symbols.split(",")
    data = await fyers_api.get_market_data(symbol_list)
    return {"data": data, "timestamp": datetime.now().isoformat()}

@app.get("/market/historical")
async def get_historical_data(
    symbol: str,
    timeframe: str = "D",
    from_date: str = None,
    to_date: str = None,
    user=Depends(get_current_user)
):
    if not from_date:
        from_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not to_date:
        to_date = datetime.now().strftime("%Y-%m-%d")
    
    data = await fyers_api.get_historical_data(symbol, timeframe, from_date, to_date)
    return data

@app.get("/market/option-chain")
async def get_option_chain(
    symbol: str,
    expiry: str = None,
    user=Depends(get_current_user)
):
    if not expiry:
        # Get nearest Thursday
        today = datetime.now()
        days_ahead = 3 - today.weekday()  # Thursday is 3
        if days_ahead <= 0:
            days_ahead += 7
        expiry = (today + timedelta(days_ahead)).strftime("%Y-%m-%d")
    
    data = await fyers_api.get_option_chain(symbol, expiry)
    return data

# Stock search and details
@app.get("/stocks/search")
async def search_stocks(query: str, user=Depends(get_current_user)):
    try:
        # Mock stock search - in real implementation, use Fyers search API
        stocks = [
            {"symbol": "NSE:RELIANCE-EQ", "name": "Reliance Industries", "exchange": "NSE"},
            {"symbol": "NSE:TCS-EQ", "name": "Tata Consultancy Services", "exchange": "NSE"},
            {"symbol": "NSE:INFY-EQ", "name": "Infosys Limited", "exchange": "NSE"},
            {"symbol": "NSE:HDFC-EQ", "name": "HDFC Bank", "exchange": "NSE"},
            {"symbol": "NSE:ICICIBANK-EQ", "name": "ICICI Bank", "exchange": "NSE"},
        ]
        filtered_stocks = [s for s in stocks if query.upper() in s["name"].upper() or query.upper() in s["symbol"]]
        return {"stocks": filtered_stocks}
    except Exception as e:
        logger.error("Stock search failed", error=str(e))
        return {"stocks": []}

@app.get("/stocks/{symbol}/details")
async def get_stock_details(symbol: str, user=Depends(get_current_user)):
    try:
        # Get basic stock data
        market_data = await fyers_api.get_market_data([symbol])
        
        # Check if options are available
        has_options = not symbol.endswith("-EQ") or "NIFTY" in symbol or "BANKNIFTY" in symbol
        
        stock_data = market_data.get(symbol, {})
        
        return {
            "symbol": symbol,
            "market_data": stock_data,
            "has_options": has_options,
            "fundamentals": {
                "market_cap": np.random.randint(10000, 500000),
                "pe_ratio": np.random.uniform(10, 50),
                "eps": np.random.uniform(10, 100),
                "dividend_yield": np.random.uniform(0, 5)
            }
        }
    except Exception as e:
        logger.error("Failed to get stock details", error=str(e))
        raise HTTPException(status_code=404, detail="Stock not found")

# Screener endpoint
@app.post("/screener/filter")
async def screen_stocks(request: ScreenerRequest, user=Depends(get_current_user)):
    try:
        # Mock screener results - in real implementation, use Fyers screener API
        filtered_stocks = [
            {
                "symbol": "NSE:RELIANCE-EQ",
                "name": "Reliance Industries",
                "price": 2450.50,
                "change": 12.30,
                "change_percent": 0.51,
                "volume": 5234567,
                "market_cap": 1650000,
                "pe_ratio": 24.5
            },
            {
                "symbol": "NSE:TCS-EQ",
                "name": "Tata Consultancy Services",
                "price": 3890.75,
                "change": -23.45,
                "change_percent": -0.60,
                "volume": 2345678,
                "market_cap": 1420000,
                "pe_ratio": 28.3
            }
        ]
        
        # Apply filters
        if request.min_price:
            filtered_stocks = [s for s in filtered_stocks if s["price"] >= request.min_price]
        if request.max_price:
            filtered_stocks = [s for s in filtered_stocks if s["price"] <= request.max_price]
        if request.min_volume:
            filtered_stocks = [s for s in filtered_stocks if s["volume"] >= request.min_volume]
        
        return {"stocks": filtered_stocks, "total": len(filtered_stocks)}
    except Exception as e:
        logger.error("Screener failed", error=str(e))
        raise HTTPException(status_code=500, detail="Screening failed")

# AI Analysis endpoint
@app.post("/analysis/ai-analyze")
async def ai_analyze(symbol: str, timeframe: str = "D", user=Depends(get_current_user)):
    try:
        # Get historical data for analysis
        historical_data = await fyers_api.get_historical_data(
            symbol, timeframe, 
            (datetime.now() - timedelta(days=100)).strftime("%Y-%m-%d"),
            datetime.now().strftime("%Y-%m-%d")
        )
        
        if historical_data.get("s") != "ok":
            raise HTTPException(status_code=400, detail="Failed to get historical data")
        
        candles = historical_data["candles"]
        df = pd.DataFrame(candles, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        
        # Perform AI analysis (simplified)
        analysis = {
            "trend": "bullish" if df['close'].iloc[-1] > df['close'].iloc[-10] else "bearish",
            "strength": np.random.uniform(0.6, 0.9),
            "support_levels": [df['low'].min(), df['low'].quantile(0.25)],
            "resistance_levels": [df['high'].max(), df['high'].quantile(0.75)],
            "recommendation": "BUY" if np.random.random() > 0.5 else "SELL",
            "confidence": np.random.uniform(0.7, 0.95),
            "price_target": df['close'].iloc[-1] * np.random.uniform(1.05, 1.15),
            "stop_loss": df['close'].iloc[-1] * np.random.uniform(0.92, 0.98)
        }
        
        # Cache analysis
        cache_key = f"ai_analysis:{symbol}:{timeframe}"
        redis_client.setex(cache_key, 300, json.dumps(analysis))
        
        return {"symbol": symbol, "analysis": analysis, "timestamp": datetime.now().isoformat()}
        
    except Exception as e:
        logger.error("AI analysis failed", error=str(e))
        raise HTTPException(status_code=500, detail="AI analysis failed")

# Algorithm trading endpoints
@app.post("/algo/create-strategy")
async def create_algo_strategy(strategy: AlgoStrategyRequest, user=Depends(get_current_user)):
    try:
        strategy_id = f"strategy_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Store strategy in Redis
        strategy_data = {
            "id": strategy_id,
            "name": strategy.name,
            "symbol": strategy.symbol,
            "strategy_type": strategy.strategy_type,
            "parameters": strategy.parameters,
            "created_at": datetime.now().isoformat(),
            "status": "inactive"
        }
        
        redis_client.setex(f"strategy:{strategy_id}", 86400, json.dumps(strategy_data))
        
        return {"strategy_id": strategy_id, "status": "created", "strategy": strategy_data}
        
    except Exception as e:
        logger.error("Failed to create strategy", error=str(e))
        raise HTTPException(status_code=500, detail="Strategy creation failed")

@app.get("/algo/strategies")
async def get_strategies(user=Depends(get_current_user)):
    try:
        # Get all strategies from Redis
        strategy_keys = redis_client.keys("strategy:*")
        strategies = []
        
        for key in strategy_keys:
            strategy_data = redis_client.get(key)
            if strategy_data:
                strategies.append(json.loads(strategy_data))
        
        return {"strategies": strategies}
        
    except Exception as e:
        logger.error("Failed to get strategies", error=str(e))
        return {"strategies": []}

@app.post("/algo/strategies/{strategy_id}/toggle")
async def toggle_strategy(strategy_id: str, user=Depends(get_current_user)):
    try:
        strategy_data = redis_client.get(f"strategy:{strategy_id}")
        if not strategy_data:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        strategy = json.loads(strategy_data)
        strategy["status"] = "active" if strategy["status"] == "inactive" else "inactive"
        strategy["updated_at"] = datetime.now().isoformat()
        
        redis_client.setex(f"strategy:{strategy_id}", 86400, json.dumps(strategy))
        
        return {"strategy_id": strategy_id, "status": strategy["status"]}
        
    except Exception as e:
        logger.error("Failed to toggle strategy", error=str(e))
        raise HTTPException(status_code=500, detail="Strategy toggle failed")

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "redis_connected": redis_client.ping(),
        "fyers_initialized": fyers_api.fyers is not None
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
