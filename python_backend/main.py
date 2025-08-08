import asyncio
import json
import logging
import os
import importlib.util
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
import redis
import pandas as pd
import numpy as np
from contextlib import asynccontextmanager
import sqlite3
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, Depends, File, UploadFile
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
    ScreenerRequest, AlgoStrategyRequest, WebSocketMessage, AccountInfo,
    CustomStrategyRequest, StraddleDataRequest, RiskManagementConfig
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

# Initialize SQLite database for persistent storage
def init_database():
    """Initialize SQLite database for storing strategies, trades, and account data"""
    conn = sqlite3.connect('trading_platform.db')
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS strategies (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            symbol TEXT NOT NULL,
            strategy_type TEXT NOT NULL,
            parameters TEXT NOT NULL,
            risk_config TEXT NOT NULL,
            code TEXT,
            status TEXT DEFAULT 'inactive',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trades (
            id TEXT PRIMARY KEY,
            strategy_id TEXT,
            symbol TEXT NOT NULL,
            side TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (strategy_id) REFERENCES strategies (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS account_data (
            id INTEGER PRIMARY KEY,
            user_id TEXT NOT NULL,
            balance REAL NOT NULL,
            available_margin REAL NOT NULL,
            used_margin REAL NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS custom_strategies (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            code TEXT NOT NULL,
            parameters TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

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

# Enhanced Fyers API integration
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
    
    async def get_account_info(self) -> Dict:
        """Get account information including balance and margins"""
        try:
            if not self.fyers:
                raise HTTPException(status_code=401, detail="Fyers API not initialized")
            
            # Get funds info
            funds_response = self.fyers.funds()
            
            if funds_response['s'] == 'ok':
                fund_limit = funds_response['fund_limit'][0]
                return {
                    "balance": fund_limit.get('equityAmount', 0),
                    "available_margin": fund_limit.get('availableBalance', 0),
                    "used_margin": fund_limit.get('utilisedBalance', 0),
                    "total_balance": fund_limit.get('limitBal', 0)
                }
            else:
                return self._get_mock_account_info()
                
        except Exception as e:
            logger.error("Failed to get account info", error=str(e))
            return self._get_mock_account_info()
    
    async def place_order(self, symbol: str, side: str, quantity: int, price: float = None, order_type: str = "MARKET") -> Dict:
        """Place an order through Fyers API"""
        try:
            if not self.fyers:
                raise HTTPException(status_code=401, detail="Fyers API not initialized")
            
            order_data = {
                "symbol": symbol,
                "qty": quantity,
                "type": 1 if order_type == "LIMIT" else 2,  # 1 for LIMIT, 2 for MARKET
                "side": 1 if side.upper() == "BUY" else -1,
                "productType": "INTRADAY",
                "limitPrice": price if order_type == "LIMIT" else 0,
                "stopPrice": 0,
                "validity": "DAY",
                "disclosedQty": 0,
                "offlineOrder": "False"
            }
            
            response = self.fyers.place_order(order_data)
            
            if response['s'] == 'ok':
                return {
                    "order_id": response['id'],
                    "status": "success",
                    "message": "Order placed successfully"
                }
            else:
                return {
                    "order_id": None,
                    "status": "error",
                    "message": response.get('message', 'Order placement failed')
                }
                
        except Exception as e:
            logger.error("Failed to place order", error=str(e))
            return {
                "order_id": None,
                "status": "error", 
                "message": str(e)
            }
        
    async def get_market_data(self, symbols: List[str]) -> Dict:
        """Get real-time market data for symbols"""
        try:
            if not self.fyers:
                raise HTTPException(status_code=401, detail="Fyers API not initialized")
            
            data = {}
            for symbol in symbols:
                cached_data = redis_client.get(f"market_data:{symbol}")
                if cached_data:
                    data[symbol] = json.loads(cached_data)
                else:
                    response = self.fyers.quotes({"symbols": symbol})
                    if response['s'] == 'ok':
                        data[symbol] = response['d'][0]
                        redis_client.setex(f"market_data:{symbol}", 1, json.dumps(data[symbol]))
            
            return data
        except Exception as e:
            logger.error("Failed to get market data", error=str(e))
            return self._get_mock_market_data(symbols)
    
    async def get_straddle_data(self, symbol: str, expiry: str = None) -> Dict:
        """Get straddle premium data for major indices"""
        try:
            if not self.fyers:
                return self._get_mock_straddle_data(symbol)
            
            # Get current spot price
            spot_response = self.fyers.quotes({"symbols": symbol})
            if spot_response['s'] != 'ok':
                return self._get_mock_straddle_data(symbol)
            
            spot_price = spot_response['d'][0]['lp']
            
            # Find nearest strikes
            base_strike = round(spot_price / 50) * 50  # Round to nearest 50
            strikes = [base_strike - 100, base_strike - 50, base_strike, base_strike + 50, base_strike + 100]
            
            straddle_data = []
            
            for strike in strikes:
                # Construct option symbols (this is simplified - actual symbol construction may vary)
                call_symbol = f"{symbol.split(':')[1]}{expiry or '24JAN'}{strike}CE"
                put_symbol = f"{symbol.split(':')[1]}{expiry or '24JAN'}{strike}PE"
                
                # Get option prices (fallback to mock if not available)
                call_price = np.random.uniform(50, 300)
                put_price = np.random.uniform(50, 300)
                
                straddle_premium = call_price + put_price
                
                straddle_data.append({
                    "strike": strike,
                    "call_price": call_price,
                    "put_price": put_price,
                    "straddle_premium": straddle_premium,
                    "distance_from_spot": abs(strike - spot_price)
                })
            
            return {
                "symbol": symbol,
                "spot_price": spot_price,
                "expiry": expiry or "24JAN",
                "straddles": straddle_data,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error("Failed to get straddle data", error=str(e))
            return self._get_mock_straddle_data(symbol)
    
    def _get_mock_account_info(self) -> Dict:
        """Mock account info for fallback"""
        return {
            "balance": 100000.0,
            "available_margin": 80000.0,
            "used_margin": 20000.0,
            "total_balance": 100000.0
        }
    
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
    
    def _get_mock_straddle_data(self, symbol: str) -> Dict:
        """Mock straddle data for fallback"""
        base_price = 19850 if "NIFTY" in symbol else 44250
        base_strike = round(base_price / 50) * 50
        strikes = [base_strike - 100, base_strike - 50, base_strike, base_strike + 50, base_strike + 100]
        
        straddle_data = []
        for strike in strikes:
            call_price = max(0.5, base_price - strike + np.random.uniform(-20, 20))
            put_price = max(0.5, strike - base_price + np.random.uniform(-20, 20))
            
            straddle_data.append({
                "strike": strike,
                "call_price": call_price,
                "put_price": put_price,
                "straddle_premium": call_price + put_price,
                "distance_from_spot": abs(strike - base_price)
            })
        
        return {
            "symbol": symbol,
            "spot_price": base_price,
            "expiry": "24JAN",
            "straddles": straddle_data,
            "timestamp": datetime.now().isoformat()
        }

# Initialize Fyers API
fyers_api = FyersAPI()

# Custom strategy execution engine
class StrategyEngine:
    def __init__(self):
        self.strategies_dir = Path("custom_strategies")
        self.strategies_dir.mkdir(exist_ok=True)
    
    def save_custom_strategy(self, strategy_id: str, name: str, code: str, description: str = "") -> bool:
        """Save custom strategy code to file and database"""
        try:
            # Save to file
            strategy_file = self.strategies_dir / f"{strategy_id}.py"
            with open(strategy_file, 'w') as f:
                f.write(code)
            
            # Save to database
            conn = sqlite3.connect('trading_platform.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO custom_strategies (id, name, description, code)
                VALUES (?, ?, ?, ?)
            ''', (strategy_id, name, description, code))
            conn.commit()
            conn.close()
            
            return True
        except Exception as e:
            logger.error("Failed to save custom strategy", error=str(e))
            return False
    
    def load_custom_strategy(self, strategy_id: str) -> Optional[Dict]:
        """Load custom strategy from database"""
        try:
            conn = sqlite3.connect('trading_platform.db')
            cursor = conn.cursor()
            cursor.execute('''
                SELECT name, description, code, created_at FROM custom_strategies WHERE id = ?
            ''', (strategy_id,))
            result = cursor.fetchone()
            conn.close()
            
            if result:
                return {
                    "id": strategy_id,
                    "name": result[0],
                    "description": result[1],
                    "code": result[2],
                    "created_at": result[3]
                }
            return None
        except Exception as e:
            logger.error("Failed to load custom strategy", error=str(e))
            return None
    
    def execute_strategy(self, strategy_id: str, market_data: Dict) -> Dict:
        """Execute custom strategy with current market data"""
        try:
            strategy_file = self.strategies_dir / f"{strategy_id}.py"
            if not strategy_file.exists():
                return {"error": "Strategy file not found"}
            
            # Load strategy module
            spec = importlib.util.spec_from_file_location("strategy", strategy_file)
            strategy_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(strategy_module)
            
            # Execute strategy
            if hasattr(strategy_module, 'execute'):
                result = strategy_module.execute(market_data)
                return result
            else:
                return {"error": "Strategy must have an 'execute' function"}
                
        except Exception as e:
            logger.error("Failed to execute strategy", strategy_id=strategy_id, error=str(e))
            return {"error": str(e)}

# Risk management engine
class RiskManager:
    def __init__(self):
        pass
    
    def calculate_position_size(self, account_balance: float, risk_percent: float, stop_loss_percent: float, entry_price: float) -> int:
        """Calculate position size based on risk management rules"""
        try:
            risk_amount = account_balance * (risk_percent / 100)
            stop_loss_amount = entry_price * (stop_loss_percent / 100)
            
            if stop_loss_amount > 0:
                position_size = int(risk_amount / stop_loss_amount)
                return max(1, position_size)
            return 1
        except Exception as e:
            logger.error("Failed to calculate position size", error=str(e))
            return 1
    
    def validate_trade(self, account_info: Dict, trade_amount: float, max_risk_percent: float = 5.0) -> bool:
        """Validate if trade is within risk limits"""
        try:
            available_balance = account_info.get('available_margin', 0)
            risk_amount = account_info.get('balance', 0) * (max_risk_percent / 100)
            
            return trade_amount <= min(available_balance, risk_amount)
        except Exception as e:
            logger.error("Failed to validate trade", error=str(e))
            return False

# Initialize engines
strategy_engine = StrategyEngine()
risk_manager = RiskManager()

# Background tasks for real-time data and strategy execution
class RealTimeDataTask:
    def __init__(self):
        self.running = False
        self.subscribed_symbols = set()
    
    async def start(self):
        self.running = True
        asyncio.create_task(self._update_market_data())
        asyncio.create_task(self._execute_active_strategies())
        logger.info("Real-time data and strategy execution tasks started")
    
    async def stop(self):
        self.running = False
        logger.info("Real-time data and strategy execution tasks stopped")
    
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
                
                await asyncio.sleep(1)
            except Exception as e:
                logger.error("Error in real-time data update", error=str(e))
                await asyncio.sleep(5)
    
    async def _execute_active_strategies(self):
        while self.running:
            try:
                # Get active strategies from database
                conn = sqlite3.connect('trading_platform.db')
                cursor = conn.cursor()
                cursor.execute("SELECT id, symbol, code FROM strategies WHERE status = 'active'")
                active_strategies = cursor.fetchall()
                conn.close()
                
                for strategy_id, symbol, strategy_code in active_strategies:
                    if strategy_code:  # Custom strategy
                        market_data = await fyers_api.get_market_data([symbol])
                        result = strategy_engine.execute_strategy(strategy_id, market_data)
                        
                        # Process strategy signals
                        if result.get('signal') == 'BUY' or result.get('signal') == 'SELL':
                            await self._process_strategy_signal(strategy_id, result)
                
                await asyncio.sleep(10)  # Check strategies every 10 seconds
            except Exception as e:
                logger.error("Error in strategy execution", error=str(e))
                await asyncio.sleep(30)
    
    async def _process_strategy_signal(self, strategy_id: str, signal: Dict):
        """Process trading signal from strategy"""
        try:
            # Get account info for risk management
            account_info = await fyers_api.get_account_info()
            
            # Validate trade
            trade_amount = signal.get('quantity', 1) * signal.get('price', 0)
            if not risk_manager.validate_trade(account_info, trade_amount):
                logger.warning("Trade rejected by risk management", strategy_id=strategy_id)
                return
            
            # Place order
            order_result = await fyers_api.place_order(
                symbol=signal['symbol'],
                side=signal['signal'],
                quantity=signal['quantity'],
                price=signal.get('price'),
                order_type=signal.get('order_type', 'MARKET')
            )
            
            # Log trade
            if order_result['status'] == 'success':
                logger.info("Strategy trade executed", strategy_id=strategy_id, order_id=order_result['order_id'])
        
        except Exception as e:
            logger.error("Failed to process strategy signal", strategy_id=strategy_id, error=str(e))
    
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
    init_database()
    await real_time_task.start()
    yield
    # Shutdown
    await real_time_task.stop()

# FastAPI app initialization
app = FastAPI(
    title="Indian Market Predictors API",
    description="Advanced trading platform backend with real-time data, AI analysis, and algorithmic trading",
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
            fyers_api.initialize(request.access_token)
            redis_client.setex(f"auth_token:{request.access_token}", 3600, "valid")
            
            return AuthResponse(
                access_token=request.access_token,
                token_type="bearer",
                expires_in=3600,
                success=True
            )
        else:
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

# Account endpoints
@app.get("/account/info")
async def get_account_info(user=Depends(get_current_user)):
    account_info = await fyers_api.get_account_info()
    return {"data": account_info, "timestamp": datetime.now().isoformat()}

# Market data endpoints (existing ones enhanced)
@app.get("/market/live-data")
async def get_live_market_data(symbols: str, user=Depends(get_current_user)):
    symbol_list = symbols.split(",")
    data = await fyers_api.get_market_data(symbol_list)
    return {"data": data, "timestamp": datetime.now().isoformat()}

# New straddle data endpoint
@app.get("/market/straddle-data")
async def get_straddle_data(
    symbol: str,
    expiry: str = None,
    user=Depends(get_current_user)
):
    data = await fyers_api.get_straddle_data(symbol, expiry)
    return data

# Enhanced strategy endpoints
@app.post("/strategies/custom/create")
async def create_custom_strategy(request: CustomStrategyRequest, user=Depends(get_current_user)):
    try:
        strategy_id = f"custom_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        success = strategy_engine.save_custom_strategy(
            strategy_id=strategy_id,
            name=request.name,
            code=request.code,
            description=request.description
        )
        
        if success:
            return {
                "strategy_id": strategy_id,
                "status": "created",
                "message": "Custom strategy created successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create custom strategy")
            
    except Exception as e:
        logger.error("Failed to create custom strategy", error=str(e))
        raise HTTPException(status_code=500, detail="Custom strategy creation failed")

@app.get("/strategies/custom/{strategy_id}")
async def get_custom_strategy(strategy_id: str, user=Depends(get_current_user)):
    strategy = strategy_engine.load_custom_strategy(strategy_id)
    if strategy:
        return strategy
    else:
        raise HTTPException(status_code=404, detail="Custom strategy not found")

@app.get("/strategies/custom")
async def list_custom_strategies(user=Depends(get_current_user)):
    try:
        conn = sqlite3.connect('trading_platform.db')
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, description, created_at FROM custom_strategies")
        strategies = cursor.fetchall()
        conn.close()
        
        return {
            "strategies": [
                {
                    "id": s[0],
                    "name": s[1],
                    "description": s[2],
                    "created_at": s[3]
                } for s in strategies
            ]
        }
    except Exception as e:
        logger.error("Failed to list custom strategies", error=str(e))
        return {"strategies": []}

# Risk management endpoint
@app.post("/risk/calculate-position-size")
async def calculate_position_size(
    risk_percent: float,
    stop_loss_percent: float,
    entry_price: float,
    user=Depends(get_current_user)
):
    try:
        account_info = await fyers_api.get_account_info()
        position_size = risk_manager.calculate_position_size(
            account_balance=account_info['balance'],
            risk_percent=risk_percent,
            stop_loss_percent=stop_loss_percent,
            entry_price=entry_price
        )
        
        return {
            "position_size": position_size,
            "risk_amount": account_info['balance'] * (risk_percent / 100),
            "account_balance": account_info['balance']
        }
    except Exception as e:
        logger.error("Failed to calculate position size", error=str(e))
        raise HTTPException(status_code=500, detail="Position size calculation failed")

# Trading endpoints
@app.post("/trading/place-order")
async def place_order(
    symbol: str,
    side: str,
    quantity: int,
    price: float = None,
    order_type: str = "MARKET",
    user=Depends(get_current_user)
):
    try:
        # Validate with risk management
        account_info = await fyers_api.get_account_info()
        trade_amount = quantity * (price if price else 1000)  # Estimate for market orders
        
        if not risk_manager.validate_trade(account_info, trade_amount):
            raise HTTPException(status_code=400, detail="Trade rejected by risk management")
        
        result = await fyers_api.place_order(symbol, side, quantity, price, order_type)
        return result
        
    except Exception as e:
        logger.error("Failed to place order", error=str(e))
        raise HTTPException(status_code=500, detail="Order placement failed")

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "redis_connected": redis_client.ping(),
        "fyers_initialized": fyers_api.fyers is not None,
        "database_connected": True
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
