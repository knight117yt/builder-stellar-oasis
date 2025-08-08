"""
Data models for Indian Market Predictors backend
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class AlertType(str, Enum):
    PRICE = "price"
    PATTERN = "pattern"
    TECHNICAL = "technical"

class OrderType(str, Enum):
    BUY = "buy"
    SELL = "sell"

class OptionType(str, Enum):
    CALL = "call"
    PUT = "put"

class SignalType(str, Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"

# Authentication Models
class FyersAuthRequest(BaseModel):
    app_id: str
    secret_id: str
    pin: str

class AuthResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    message: str
    mode: Optional[str] = None

# Market Data Models
class CandleData(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: int

class MarketDataResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

# Option Models
class OptionGreeks(BaseModel):
    delta: float
    gamma: float
    theta: float
    vega: float
    iv: float

class OptionData(BaseModel):
    ltp: float
    bid: float
    ask: float
    volume: int
    oi: int
    iv: float
    delta: float
    gamma: float
    theta: float
    vega: float

class OptionStrike(BaseModel):
    strike: float
    call: OptionData
    put: OptionData

class OptionChainResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

# Position Models
class Position(BaseModel):
    symbol: str
    type: OptionType
    strike: float
    expiry: str
    quantity: int
    avg_price: float
    ltp: float
    pnl: float
    pnl_percent: float

class PositionsResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

# Pattern Models
class DetectedPattern(BaseModel):
    pattern_id: str
    pattern_name: str
    signal: SignalType
    confidence: float
    timestamp: datetime
    description: str

class PatternResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

# Technical Analysis Models
class SupportResistance(BaseModel):
    level: float
    type: str  # 'support' or 'resistance'
    strength: float
    distance: float

class TechnicalIndicator(BaseModel):
    name: str
    value: float
    signal: SignalType
    description: str

class CPRLevels(BaseModel):
    pivot: float
    bc: float
    tc: float
    r1: float
    r2: float
    s1: float
    s2: float

class TechnicalAnalysis(BaseModel):
    support_resistance: List[SupportResistance]
    cpr_levels: CPRLevels
    indicators: List[TechnicalIndicator]
    trend: SignalType
    volatility: str
    momentum: SignalType

class TechnicalAnalysisResponse(BaseModel):
    success: bool
    data: Optional[TechnicalAnalysis] = None
    message: Optional[str] = None

# Alert Models
class PriceAlertRequest(BaseModel):
    symbol: str
    type: str  # 'above' or 'below'
    target_price: float
    message: Optional[str] = None

class LogicAlertRequest(BaseModel):
    name: str
    symbol: str
    condition: str
    description: Optional[str] = None
    params: Dict[str, Any] = {}

class Alert(BaseModel):
    id: str
    type: AlertType
    symbol: str
    is_active: bool
    is_triggered: bool
    created_at: datetime
    triggered_at: Optional[datetime] = None

class PriceAlert(Alert):
    target_price: float
    current_price: float
    alert_type: str  # 'above' or 'below'
    message: Optional[str] = None

class LogicAlert(Alert):
    name: str
    condition: str
    description: Optional[str] = None
    params: Dict[str, Any] = {}

class AlertResponse(BaseModel):
    success: bool
    message: str
    alert_id: Optional[str] = None

class AlertsResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

# AI Analysis Models
class MarketSentiment(BaseModel):
    overall: float
    news: float
    social: float
    technical: float
    options: float

class PredictionModel(BaseModel):
    name: str
    accuracy: float
    prediction: SignalType
    confidence: float
    timeframe: str
    target: Optional[float] = None
    reasoning: List[str]

class AIAnalysis(BaseModel):
    sentiment: MarketSentiment
    predictions: List[PredictionModel]
    pattern_probabilities: List[Dict[str, Any]]
    smart_alerts: List[Dict[str, Any]]

class AIAnalysisResponse(BaseModel):
    success: bool
    data: Optional[AIAnalysis] = None
    message: Optional[str] = None

# WebSocket Models
class WSMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)

class WSSubscription(BaseModel):
    symbol: str
    data_type: str  # 'market_data', 'option_chain', 'alerts'
    interval: Optional[str] = None

# Error Models
class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None

# Health Check Model
class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    fyers_connected: bool
    version: str
    uptime: Optional[float] = None
