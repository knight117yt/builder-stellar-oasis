import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # Application Settings
    APP_NAME: str = Field(default="Indian Market Predictors API", description="Application name")
    APP_VERSION: str = Field(default="2.0.0", description="Application version")
    DEBUG: bool = Field(default=True, description="Debug mode")
    
    # API Settings
    API_HOST: str = Field(default="0.0.0.0", description="API host")
    API_PORT: int = Field(default=8000, description="API port")
    API_WORKERS: int = Field(default=1, description="Number of worker processes")
    
    # Fyers API Configuration
    FYERS_APP_ID: str = Field(default="", description="Fyers App ID")
    FYERS_SECRET_KEY: str = Field(default="", description="Fyers Secret Key")
    FYERS_REDIRECT_URL: str = Field(default="http://localhost:3000/auth/callback", description="Fyers redirect URL")
    FYERS_API_URL: str = Field(default="https://api-t1.fyers.in/api/v3", description="Fyers API base URL")
    FYERS_WEBSOCKET_URL: str = Field(default="wss://api-t1.fyers.in/socket/v3", description="Fyers WebSocket URL")
    
    # Database Settings
    DATABASE_URL: str = Field(default="sqlite:///./market_data.db", description="Database URL")
    DATABASE_ECHO: bool = Field(default=False, description="Echo SQL queries")
    
    # Redis Settings
    REDIS_HOST: str = Field(default="localhost", description="Redis host")
    REDIS_PORT: int = Field(default=6379, description="Redis port")
    REDIS_PASSWORD: Optional[str] = Field(default=None, description="Redis password")
    REDIS_DB: int = Field(default=0, description="Redis database number")
    REDIS_EXPIRE_TIME: int = Field(default=3600, description="Default Redis expiration time in seconds")
    
    # Cache Settings
    CACHE_MARKET_DATA_TTL: int = Field(default=1, description="Market data cache TTL in seconds")
    CACHE_HISTORICAL_DATA_TTL: int = Field(default=300, description="Historical data cache TTL in seconds")
    CACHE_OPTION_CHAIN_TTL: int = Field(default=10, description="Option chain cache TTL in seconds")
    CACHE_AI_ANALYSIS_TTL: int = Field(default=300, description="AI analysis cache TTL in seconds")
    
    # Security Settings
    SECRET_KEY: str = Field(default="your-secret-key-change-in-production", description="Secret key for JWT")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, description="Access token expiration time in minutes")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    
    # CORS Settings
    ALLOWED_ORIGINS: list = Field(default=["http://localhost:3000", "http://localhost:5173", "*"], description="Allowed CORS origins")
    ALLOWED_METHODS: list = Field(default=["GET", "POST", "PUT", "DELETE", "OPTIONS"], description="Allowed HTTP methods")
    ALLOWED_HEADERS: list = Field(default=["*"], description="Allowed headers")
    
    # WebSocket Settings
    WEBSOCKET_PING_INTERVAL: int = Field(default=20, description="WebSocket ping interval in seconds")
    WEBSOCKET_PING_TIMEOUT: int = Field(default=10, description="WebSocket ping timeout in seconds")
    MAX_WEBSOCKET_CONNECTIONS: int = Field(default=100, description="Maximum WebSocket connections")
    
    # Real-time Data Settings
    MARKET_DATA_UPDATE_INTERVAL: int = Field(default=1, description="Market data update interval in seconds")
    HISTORICAL_DATA_UPDATE_INTERVAL: int = Field(default=60, description="Historical data update interval in seconds")
    OPTION_CHAIN_UPDATE_INTERVAL: int = Field(default=5, description="Option chain update interval in seconds")
    
    # Logging Settings
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(default="%(asctime)s - %(name)s - %(levelname)s - %(message)s", description="Log format")
    LOG_FILE: Optional[str] = Field(default=None, description="Log file path")
    LOG_MAX_SIZE: int = Field(default=10485760, description="Maximum log file size in bytes (10MB)")
    LOG_BACKUP_COUNT: int = Field(default=5, description="Number of log backup files")
    
    # AI/ML Settings
    AI_MODEL_PATH: str = Field(default="./models", description="Path to AI model files")
    AI_ANALYSIS_BATCH_SIZE: int = Field(default=100, description="Batch size for AI analysis")
    AI_PREDICTION_CONFIDENCE_THRESHOLD: float = Field(default=0.7, description="Minimum confidence for AI predictions")
    
    # Algorithm Trading Settings
    MAX_ACTIVE_STRATEGIES: int = Field(default=10, description="Maximum number of active strategies per user")
    ORDER_TIMEOUT: int = Field(default=30, description="Order timeout in seconds")
    POSITION_SIZE_LIMIT: float = Field(default=100000, description="Maximum position size limit")
    DAILY_LOSS_LIMIT: float = Field(default=10000, description="Daily loss limit")
    
    # Market Data Provider Settings
    PRIMARY_DATA_SOURCE: str = Field(default="fyers", description="Primary data source (fyers, mock)")
    FALLBACK_DATA_SOURCE: str = Field(default="mock", description="Fallback data source")
    DATA_QUALITY_CHECK: bool = Field(default=True, description="Enable data quality checks")
    
    # Performance Settings
    MAX_CONCURRENT_REQUESTS: int = Field(default=100, description="Maximum concurrent requests")
    REQUEST_TIMEOUT: int = Field(default=30, description="Request timeout in seconds")
    CONNECTION_POOL_SIZE: int = Field(default=20, description="Connection pool size")
    
    # Storage Settings
    DATA_STORAGE_PATH: str = Field(default="./data", description="Path for data storage")
    BACKUP_STORAGE_PATH: str = Field(default="./backups", description="Path for backup storage")
    MAX_STORAGE_SIZE_GB: int = Field(default=10, description="Maximum storage size in GB")
    AUTO_CLEANUP_DAYS: int = Field(default=30, description="Auto cleanup data older than X days")
    
    # Monitoring Settings
    ENABLE_METRICS: bool = Field(default=True, description="Enable metrics collection")
    METRICS_EXPORT_INTERVAL: int = Field(default=60, description="Metrics export interval in seconds")
    HEALTH_CHECK_INTERVAL: int = Field(default=30, description="Health check interval in seconds")
    
    # Feature Flags
    ENABLE_AI_ANALYSIS: bool = Field(default=True, description="Enable AI analysis features")
    ENABLE_ALGO_TRADING: bool = Field(default=True, description="Enable algorithmic trading")
    ENABLE_OPTION_STRATEGIES: bool = Field(default=True, description="Enable option strategies")
    ENABLE_SCREENER: bool = Field(default=True, description="Enable stock screener")
    ENABLE_REAL_TIME_ALERTS: bool = Field(default=True, description="Enable real-time alerts")
    
    # Testing Settings
    MOCK_DATA_ENABLED: bool = Field(default=True, description="Enable mock data for testing")
    MOCK_LATENCY_MS: int = Field(default=100, description="Mock API latency in milliseconds")
    ENABLE_API_RATE_LIMITING: bool = Field(default=False, description="Enable API rate limiting")
    
    # Environment specific settings
    ENVIRONMENT: str = Field(default="development", description="Environment (development, staging, production)")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        
    def is_development(self) -> bool:
        return self.ENVIRONMENT.lower() == "development"
    
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"
    
    def is_testing(self) -> bool:
        return self.ENVIRONMENT.lower() == "testing"

# Create global settings instance
settings = Settings()

# Environment-specific configurations
if settings.is_production():
    # Production settings
    settings.DEBUG = False
    settings.LOG_LEVEL = "WARNING"
    settings.MOCK_DATA_ENABLED = False
    settings.REDIS_EXPIRE_TIME = 7200  # 2 hours
    
elif settings.is_development():
    # Development settings
    settings.DEBUG = True
    settings.LOG_LEVEL = "DEBUG"
    settings.MOCK_DATA_ENABLED = True
    
# Validate critical settings
def validate_settings():
    """Validate critical settings on startup"""
    if settings.is_production():
        if not settings.FYERS_APP_ID:
            raise ValueError("FYERS_APP_ID is required in production")
        if not settings.FYERS_SECRET_KEY:
            raise ValueError("FYERS_SECRET_KEY is required in production")
        if settings.SECRET_KEY == "your-secret-key-change-in-production":
            raise ValueError("SECRET_KEY must be changed in production")

# Export commonly used settings
__all__ = ["settings", "validate_settings"]
