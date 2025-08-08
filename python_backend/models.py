from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

class AuthMode(str, Enum):
    FYERS = "fyers"
    MOCK = "mock"

class StrategyType(str, Enum):
    TECHNICAL = "technical"
    AI_BASED = "ai_based"
    OPTION_STRATEGY = "option_strategy"
    MOMENTUM = "momentum"
    MEAN_REVERSION = "mean_reversion"
    CUSTOM = "custom"

class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    STOP_LIMIT = "stop_limit"

class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"

# Authentication Models
class LoginRequest(BaseModel):
    auth_mode: AuthMode = Field(..., description="Authentication mode")
    access_token: str = Field(..., description="Access token for Fyers API")
    user_id: Optional[str] = Field(None, description="User ID")

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    success: bool
    message: Optional[str] = None

# Account Models
class AccountInfo(BaseModel):
    balance: float = Field(..., description="Account balance")
    available_margin: float = Field(..., description="Available margin")
    used_margin: float = Field(..., description="Used margin")
    total_balance: float = Field(..., description="Total balance")
    last_updated: Optional[datetime] = None

# Market Data Models
class MarketDataRequest(BaseModel):
    symbols: List[str] = Field(..., description="List of symbols to fetch data for")
    fields: Optional[List[str]] = Field(None, description="Specific fields to fetch")

class MarketDataResponse(BaseModel):
    symbol: str
    ltp: float = Field(..., description="Last traded price")
    change: float = Field(..., description="Price change")
    change_percent: float = Field(..., description="Percentage change")
    volume: int = Field(..., description="Trading volume")
    open_interest: Optional[int] = Field(None, description="Open interest")
    high: Optional[float] = Field(None, description="Day high")
    low: Optional[float] = Field(None, description="Day low")
    open: Optional[float] = Field(None, description="Day open")
    close: Optional[float] = Field(None, description="Previous close")
    timestamp: datetime

class HistoricalDataRequest(BaseModel):
    symbol: str = Field(..., description="Symbol to fetch historical data")
    timeframe: str = Field("D", description="Timeframe (1, 5, 15, 30, 60, D, W, M)")
    from_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    to_date: str = Field(..., description="End date in YYYY-MM-DD format")

class CandleData(BaseModel):
    timestamp: int
    open: float
    high: float
    low: float
    close: float
    volume: int

class HistoricalDataResponse(BaseModel):
    symbol: str
    timeframe: str
    candles: List[CandleData]
    status: str

# Option Chain Models
class OptionChainRequest(BaseModel):
    symbol: str = Field(..., description="Underlying symbol")
    expiry: Optional[str] = Field(None, description="Expiry date in YYYY-MM-DD format")

class OptionData(BaseModel):
    strike: float
    call_ltp: Optional[float] = None
    put_ltp: Optional[float] = None
    call_oi: Optional[int] = None
    put_oi: Optional[int] = None
    call_volume: Optional[int] = None
    put_volume: Optional[int] = None
    call_iv: Optional[float] = None
    put_iv: Optional[float] = None
    call_delta: Optional[float] = None
    put_delta: Optional[float] = None
    call_gamma: Optional[float] = None
    put_gamma: Optional[float] = None
    call_theta: Optional[float] = None
    put_theta: Optional[float] = None
    call_vega: Optional[float] = None
    put_vega: Optional[float] = None

class OptionChainResponse(BaseModel):
    symbol: str
    expiry: str
    spot_price: float
    options: List[OptionData]
    timestamp: datetime

# Straddle Models
class StraddleData(BaseModel):
    strike: float
    call_price: float
    put_price: float
    straddle_premium: float
    distance_from_spot: float

class StraddleDataRequest(BaseModel):
    symbol: str = Field(..., description="Index symbol (e.g., NSE:NIFTY50-INDEX)")
    expiry: Optional[str] = Field(None, description="Expiry date")

class StraddleDataResponse(BaseModel):
    symbol: str
    spot_price: float
    expiry: str
    straddles: List[StraddleData]
    timestamp: str

# Stock Models
class StockSearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    exchange: Optional[str] = Field(None, description="Exchange filter")
    limit: Optional[int] = Field(20, description="Maximum results")

class StockInfo(BaseModel):
    symbol: str
    name: str
    exchange: str
    sector: Optional[str] = None
    industry: Optional[str] = None

class StockDetails(BaseModel):
    symbol: str
    name: str
    exchange: str
    market_data: MarketDataResponse
    has_options: bool
    fundamentals: Optional[Dict[str, Any]] = None
    technicals: Optional[Dict[str, Any]] = None

# Screener Models
class ScreenerRequest(BaseModel):
    min_price: Optional[float] = Field(None, description="Minimum price filter")
    max_price: Optional[float] = Field(None, description="Maximum price filter")
    min_volume: Optional[int] = Field(None, description="Minimum volume filter")
    max_volume: Optional[int] = Field(None, description="Maximum volume filter")
    min_market_cap: Optional[float] = Field(None, description="Minimum market cap filter")
    max_market_cap: Optional[float] = Field(None, description="Maximum market cap filter")
    min_pe_ratio: Optional[float] = Field(None, description="Minimum P/E ratio")
    max_pe_ratio: Optional[float] = Field(None, description="Maximum P/E ratio")
    sectors: Optional[List[str]] = Field(None, description="Sector filters")
    exchanges: Optional[List[str]] = Field(None, description="Exchange filters")
    price_change_min: Optional[float] = Field(None, description="Minimum price change %")
    price_change_max: Optional[float] = Field(None, description="Maximum price change %")

class ScreenerResult(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    sector: Optional[str] = None
    exchange: str

class ScreenerResponse(BaseModel):
    stocks: List[ScreenerResult]
    total: int
    filters_applied: ScreenerRequest

# AI Analysis Models
class AIAnalysisRequest(BaseModel):
    symbol: str = Field(..., description="Symbol to analyze")
    timeframe: str = Field("D", description="Analysis timeframe")
    analysis_type: Optional[str] = Field("comprehensive", description="Type of analysis")

class AIAnalysisResponse(BaseModel):
    symbol: str
    timeframe: str
    trend: str = Field(..., description="Overall trend (bullish/bearish/neutral)")
    strength: float = Field(..., description="Trend strength (0-1)")
    support_levels: List[float]
    resistance_levels: List[float]
    recommendation: str = Field(..., description="Buy/Sell/Hold recommendation")
    confidence: float = Field(..., description="Confidence level (0-1)")
    price_target: Optional[float] = None
    stop_loss: Optional[float] = None
    technical_indicators: Optional[Dict[str, Any]] = None
    sentiment_score: Optional[float] = None
    timestamp: datetime

# Risk Management Models
class RiskManagementConfig(BaseModel):
    max_position_size: float = Field(..., description="Maximum position size in currency")
    max_risk_per_trade: float = Field(..., description="Maximum risk per trade as percentage")
    daily_loss_limit: float = Field(..., description="Daily loss limit in currency")
    stop_loss_percent: float = Field(..., description="Default stop loss percentage")
    take_profit_percent: float = Field(..., description="Default take profit percentage")
    trailing_stop: bool = Field(False, description="Enable trailing stop loss")

class PositionSizing(BaseModel):
    method: str = Field(..., description="Position sizing method")
    base_amount: float = Field(..., description="Base amount for position sizing")
    risk_per_trade: float = Field(..., description="Risk percentage per trade")

# Algorithm Trading Models
class StrategyParameter(BaseModel):
    name: str
    value: Union[int, float, str, bool]
    description: Optional[str] = None

class AlgoStrategyRequest(BaseModel):
    name: str = Field(..., description="Strategy name")
    symbol: str = Field(..., description="Trading symbol")
    strategy_type: StrategyType = Field(..., description="Type of strategy")
    parameters: List[StrategyParameter] = Field(..., description="Strategy parameters")
    risk_management: Optional[RiskManagementConfig] = Field(None, description="Risk management rules")
    position_sizing: Optional[PositionSizing] = Field(None, description="Position sizing rules")
    custom_code: Optional[str] = Field(None, description="Custom strategy code")
    active: bool = Field(False, description="Whether strategy is active")

class AlgoStrategy(BaseModel):
    id: str
    name: str
    symbol: str
    strategy_type: StrategyType
    parameters: List[StrategyParameter]
    risk_management: Optional[RiskManagementConfig] = None
    position_sizing: Optional[PositionSizing] = None
    custom_code: Optional[str] = None
    status: str = Field(..., description="active/inactive/error")
    created_at: datetime
    updated_at: Optional[datetime] = None
    performance: Optional[Dict[str, Any]] = None

# Custom Strategy Models
class CustomStrategyRequest(BaseModel):
    name: str = Field(..., description="Strategy name")
    description: str = Field("", description="Strategy description")
    code: str = Field(..., description="Python strategy code")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Strategy parameters")

class CustomStrategy(BaseModel):
    id: str
    name: str
    description: str
    code: str
    parameters: Optional[Dict[str, Any]] = None
    created_at: datetime
    is_active: bool = False

# Order Models
class OrderRequest(BaseModel):
    strategy_id: Optional[str] = None
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: int
    price: Optional[float] = None
    stop_price: Optional[float] = None
    time_in_force: Optional[str] = Field("DAY", description="Order validity")

class OrderResponse(BaseModel):
    order_id: Optional[str]
    strategy_id: Optional[str] = None
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: int
    price: Optional[float] = None
    status: str
    filled_quantity: int = 0
    avg_price: Optional[float] = None
    timestamp: datetime
    message: Optional[str] = None

# WebSocket Models
class WebSocketMessage(BaseModel):
    type: str = Field(..., description="Message type")
    symbol: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None

class WebSocketSubscription(BaseModel):
    type: str = "subscribe"
    symbols: List[str] = Field(..., description="Symbols to subscribe to")
    data_types: Optional[List[str]] = Field(None, description="Data types to receive")

# Portfolio Models
class Position(BaseModel):
    symbol: str
    quantity: int
    avg_price: float
    market_price: float
    pnl: float
    pnl_percent: float
    day_pnl: float
    day_pnl_percent: float

class Portfolio(BaseModel):
    total_value: float
    total_pnl: float
    total_pnl_percent: float
    day_pnl: float
    day_pnl_percent: float
    available_margin: float
    used_margin: float
    positions: List[Position]
    timestamp: datetime

# Alert Models
class AlertCondition(BaseModel):
    field: str = Field(..., description="Field to check (price, volume, etc.)")
    operator: str = Field(..., description="Comparison operator (>, <, ==, etc.)")
    value: Union[int, float, str] = Field(..., description="Target value")

class AlertRequest(BaseModel):
    name: str = Field(..., description="Alert name")
    symbol: str = Field(..., description="Symbol to monitor")
    conditions: List[AlertCondition] = Field(..., description="Alert conditions")
    message: Optional[str] = Field(None, description="Custom alert message")
    active: bool = Field(True, description="Whether alert is active")

class Alert(BaseModel):
    id: str
    name: str
    symbol: str
    conditions: List[AlertCondition]
    message: Optional[str] = None
    active: bool = True
    triggered: bool = False
    created_at: datetime
    triggered_at: Optional[datetime] = None
    trigger_count: int = 0

# System Models
class SystemHealth(BaseModel):
    status: str
    timestamp: datetime
    version: str
    uptime: float
    redis_connected: bool
    fyers_initialized: bool
    database_connected: bool
    active_websockets: int
    memory_usage: Optional[Dict[str, Any]] = None
    cpu_usage: Optional[float] = None

class LogEntry(BaseModel):
    timestamp: datetime
    level: str
    message: str
    context: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    request_id: Optional[str] = None

# Position Size Calculation Models
class PositionSizeRequest(BaseModel):
    risk_percent: float = Field(..., description="Risk percentage per trade")
    stop_loss_percent: float = Field(..., description="Stop loss percentage")
    entry_price: float = Field(..., description="Entry price")

class PositionSizeResponse(BaseModel):
    position_size: int
    risk_amount: float
    account_balance: float
    stop_loss_amount: float

# Backtesting Models
class BacktestRequest(BaseModel):
    strategy_id: str = Field(..., description="Strategy ID to backtest")
    symbol: str = Field(..., description="Symbol to backtest")
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    initial_capital: float = Field(100000, description="Initial capital for backtesting")
    commission: float = Field(0.003, description="Commission percentage per trade")
    slippage: float = Field(0.001, description="Slippage percentage per trade")

class BacktestTrade(BaseModel):
    timestamp: datetime
    symbol: str
    side: str
    quantity: int
    price: float
    commission: float
    pnl: float = 0.0
    cumulative_pnl: float = 0.0

class BacktestResult(BaseModel):
    strategy_id: str
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float
    final_capital: float
    total_return: float
    annual_return: float
    sharpe_ratio: float
    max_drawdown: float
    max_drawdown_percent: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    profit_factor: float
    avg_win: float
    avg_loss: float
    largest_win: float
    largest_loss: float
    trades: List[BacktestTrade]
    equity_curve: List[Dict[str, Any]]
    performance_metrics: Dict[str, Any]

# Enhanced Straddle Models
class StraddleHistoryRequest(BaseModel):
    symbol: str = Field(..., description="Index symbol")
    expiry: str = Field(..., description="Expiry date")
    from_date: str = Field(..., description="From date in YYYY-MM-DD format")
    to_date: Optional[str] = Field(None, description="To date in YYYY-MM-DD format (defaults to today)")

class StraddleHistoricalPoint(BaseModel):
    date: str
    spot_price: float
    atm_strike: float
    straddle_premium: float
    call_price: float
    put_price: float
    implied_volatility: Optional[float] = None
    time_to_expiry: float

class StraddleHistoryData(BaseModel):
    symbol: str
    expiry: str
    from_date: str
    to_date: str
    historical_data: List[StraddleHistoricalPoint]
    initial_premium: float
    current_premium: float
    premium_change: float
    premium_change_percent: float
    max_premium: float
    min_premium: float
    max_premium_date: str
    min_premium_date: str
    volatility_analysis: Dict[str, Any]

class StraddlePerformanceMetrics(BaseModel):
    symbol: str
    expiry: str
    days_tracked: int
    premium_performance: float
    premium_performance_percent: float
    volatility_change: float
    time_decay_impact: float
    directional_movement_impact: float
    best_entry_date: str
    worst_entry_date: str
