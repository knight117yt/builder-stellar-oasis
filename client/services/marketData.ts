import {
  MarketData,
  HistoricalCandle,
  OptionData,
} from "./realTimeDataService";

const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:8000"
  : `http://${window.location.hostname}:8000`;

// Authentication token management
function getAuthToken(): string | null {
  return (
    localStorage.getItem("fyers_token") || localStorage.getItem("mock_token")
  );
}

function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// API response interfaces
interface APIResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

interface HistoricalDataResponse {
  s: string;
  candles: number[][];
  symbol?: string;
  timeframe?: string;
}

interface OptionChainResponse {
  s: string;
  data: OptionData[];
  symbol?: string;
  expiry?: string;
  spot_price?: number;
}

interface StockSearchResponse {
  stocks: Array<{
    symbol: string;
    name: string;
    exchange: string;
    sector?: string;
    industry?: string;
  }>;
}

interface StockDetailsResponse {
  symbol: string;
  name: string;
  exchange: string;
  market_data: MarketData;
  has_options: boolean;
  fundamentals?: Record<string, any>;
  technicals?: Record<string, any>;
}

interface ScreenerResponse {
  stocks: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    change_percent: number;
    volume: number;
    market_cap?: number;
    pe_ratio?: number;
    sector?: string;
    exchange: string;
  }>;
  total: number;
}

interface AIAnalysisResponse {
  symbol: string;
  analysis: {
    trend: string;
    strength: number;
    support_levels: number[];
    resistance_levels: number[];
    recommendation: string;
    confidence: number;
    price_target?: number;
    stop_loss?: number;
    technical_indicators?: Record<string, any>;
    sentiment_score?: number;
  };
  timestamp: string;
}

interface AlgoStrategyResponse {
  strategy_id: string;
  status: string;
  strategy: {
    id: string;
    name: string;
    symbol: string;
    strategy_type: string;
    parameters: Array<{
      name: string;
      value: any;
      description?: string;
    }>;
    created_at: string;
    status: string;
  };
}

class MarketDataService {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();

  // Cache management
  private setCacheItem(key: string, data: any, ttlSeconds = 60) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  private getCacheItem(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // HTTP request helper with fallback to mock data
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`API request failed for ${endpoint}, falling back to mock data:`, error);
      // Fall back to mock data for common endpoints
      try {
        return this.getMockDataForEndpoint(endpoint) as T;
      } catch (mockError) {
        console.error(`Mock data fallback also failed for ${endpoint}:`, mockError);
        // Return a basic error response that won't break the calling code
        return { error: "API and mock data unavailable", endpoint } as T;
      }
    }
  }

  // Mock data fallback for when backend is not available
  private getMockDataForEndpoint(endpoint: string): any {
    if (endpoint.includes('/market/live-data')) {
      return this.getMockLiveData();
    }
    if (endpoint.includes('/analysis/ai-analyze')) {
      return this.getMockAIAnalysis();
    }
    if (endpoint.includes('/market/historical')) {
      // Extract symbol from endpoint URL
      const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
      const symbol = urlParams.get('symbol') || 'NSE:NIFTY50-INDEX';
      return this.getMockHistoricalData(symbol);
    }
    if (endpoint.includes('/account/info')) {
      return this.getMockAccountInfo();
    }
    if (endpoint.includes('/market/straddle-data')) {
      return this.getMockStraddleData();
    }
    if (endpoint.includes('/algo/strategies') || endpoint.includes('/strategies')) {
      return this.getMockStrategies();
    }
    if (endpoint.includes('/algo/create-strategy')) {
      return this.getMockCreateStrategy();
    }
    if (endpoint.includes('/strategies/custom/create')) {
      return this.getMockCustomStrategyCreation();
    }
    if (endpoint.includes('/strategies/backtest')) {
      return this.getMockBacktestResult();
    }
    if (endpoint.includes('/market/option-chain')) {
      return this.getMockOptionChain();
    }
    if (endpoint.includes('/screener/scan')) {
      return this.getMockScreenerResults();
    }
    // Return empty data structure for any other endpoint
    return { data: {}, message: "Backend unavailable, using mock data" };
  }

  private getMockLiveData() {
    return {
      data: {
        "NSE:NIFTY50-INDEX": {
          ltp: 19850.50,
          change: 125.30,
          change_percent: 0.63,
          volume: 1250000,
          high: 19890.25,
          low: 19780.10,
          open: 19820.00
        },
        "NSE:NIFTYBANK-INDEX": {
          ltp: 44250.75,
          change: -85.20,
          change_percent: -0.19,
          volume: 850000,
          high: 44380.50,
          low: 44150.25,
          open: 44200.30
        },
        "BSE:SENSEX-INDEX": {
          ltp: 72240.80,
          change: 180.45,
          change_percent: 0.25,
          volume: 2100000,
          high: 72350.20,
          low: 72120.40,
          open: 72180.60
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  private getMockAIAnalysis() {
    return {
      data: {
        symbol: "NSE:NIFTY50-INDEX",
        timeframe: "D",
        trend: "bullish",
        strength: 0.75,
        support_levels: [19750, 19650, 19550],
        resistance_levels: [19950, 20050, 20150],
        recommendation: "Buy",
        confidence: 0.82,
        price_target: 20100,
        stop_loss: 19700,
        technical_indicators: {
          rsi: 58.5,
          macd: "bullish",
          moving_averages: "bullish"
        },
        sentiment_score: 0.7
      },
      timestamp: new Date().toISOString()
    };
  }

  private getMockHistoricalData(symbol?: string) {
    const data = [];
    const now = new Date();
    const basePrice = symbol && symbol.includes("NIFTYBANK") ? 44250 :
                     symbol && symbol.includes("SENSEX") ? 72240 : 19850;

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const variation = (Math.random() - 0.5) * 200;
      const price = basePrice + variation;

      data.push({
        timestamp: Math.floor(date.getTime() / 1000),
        open: price - 20 + Math.random() * 40,
        high: price + Math.random() * 50,
        low: price - Math.random() * 50,
        close: price,
        volume: Math.floor(1000000 + Math.random() * 500000)
      });
    }

    return {
      s: "ok",
      symbol: symbol || "NSE:NIFTY50-INDEX",
      timeframe: "1D",
      candles: data.map(d => [
        d.timestamp,
        d.open,
        d.high,
        d.low,
        d.close,
        d.volume
      ]),
      timestamp: new Date().toISOString()
    };
  }

  private getMockAccountInfo() {
    return {
      data: {
        balance: 100000,
        available_margin: 80000,
        used_margin: 20000,
        total_balance: 100000
      },
      timestamp: new Date().toISOString()
    };
  }

  private getMockStraddleData() {
    const spotPrice = 19850;
    const baseStrike = Math.round(spotPrice / 50) * 50;
    const straddles = [];

    for (let i = -2; i <= 2; i++) {
      const strike = baseStrike + (i * 50);
      const callPrice = Math.max(5, spotPrice - strike + Math.random() * 40 - 20);
      const putPrice = Math.max(5, strike - spotPrice + Math.random() * 40 - 20);

      straddles.push({
        strike,
        call_price: callPrice,
        put_price: putPrice,
        straddle_premium: callPrice + putPrice,
        distance_from_spot: Math.abs(strike - spotPrice)
      });
    }

    return {
      symbol: "NSE:NIFTY50-INDEX",
      spot_price: spotPrice,
      expiry: "24JAN",
      straddles,
      timestamp: new Date().toISOString()
    };
  }

  private getMockStrategies() {
    return {
      strategies: [
        {
          id: "strategy_1",
          name: "RSI Momentum Strategy",
          symbol: "NSE:NIFTY50-INDEX",
          strategy_type: "technical",
          parameters: [
            { name: "rsi_period", value: 14, description: "RSI calculation period" },
            { name: "oversold_level", value: 30, description: "RSI oversold threshold" },
            { name: "overbought_level", value: 70, description: "RSI overbought threshold" }
          ],
          status: "active",
          created_at: new Date().toISOString(),
          performance: {
            total_trades: 25,
            profitable_trades: 18,
            total_pnl: 12500,
            win_rate: 72,
            max_drawdown: 8.5
          }
        },
        {
          id: "strategy_2",
          name: "Moving Average Crossover",
          symbol: "NSE:NIFTYBANK-INDEX",
          strategy_type: "technical",
          parameters: [
            { name: "fast_ma", value: 20, description: "Fast moving average period" },
            { name: "slow_ma", value: 50, description: "Slow moving average period" }
          ],
          status: "inactive",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          performance: {
            total_trades: 15,
            profitable_trades: 9,
            total_pnl: 5800,
            win_rate: 60,
            max_drawdown: 12.3
          }
        }
      ]
    };
  }

  private getMockOptionChain() {
    const spotPrice = 19850;
    const strikes = [];

    for (let i = -5; i <= 5; i++) {
      const strike = Math.round((spotPrice + i * 50) / 50) * 50;
      strikes.push({
        strike,
        call_ltp: Math.max(0.5, spotPrice - strike + Math.random() * 50),
        put_ltp: Math.max(0.5, strike - spotPrice + Math.random() * 50),
        call_oi: Math.floor(Math.random() * 100000),
        put_oi: Math.floor(Math.random() * 100000),
        call_volume: Math.floor(Math.random() * 10000),
        put_volume: Math.floor(Math.random() * 10000),
        call_iv: 15 + Math.random() * 20,
        put_iv: 15 + Math.random() * 20
      });
    }

    return {
      data: {
        symbol: "NSE:NIFTY50-INDEX",
        expiry: "24JAN2024",
        spot_price: spotPrice,
        options: strikes
      },
      timestamp: new Date().toISOString()
    };
  }

  private getMockScreenerResults() {
    return {
      data: {
        stocks: [
          {
            symbol: "NSE:RELIANCE-EQ",
            name: "Reliance Industries",
            price: 2450.75,
            change: 25.30,
            change_percent: 1.04,
            volume: 1250000,
            market_cap: 1650000000000,
            pe_ratio: 24.5,
            sector: "Energy",
            exchange: "NSE"
          },
          {
            symbol: "NSE:TCS-EQ",
            name: "Tata Consultancy Services",
            price: 3680.20,
            change: -15.45,
            change_percent: -0.42,
            volume: 850000,
            market_cap: 1340000000000,
            pe_ratio: 28.7,
            sector: "Information Technology",
            exchange: "NSE"
          }
        ],
        total: 2
      },
      timestamp: new Date().toISOString()
    };
  }

  private getMockCreateStrategy() {
    const strategyId = `mock_strategy_${Date.now()}`;
    return {
      strategy_id: strategyId,
      status: "created",
      strategy: {
        id: strategyId,
        name: "Mock Strategy",
        symbol: "NSE:NIFTY50-INDEX",
        strategy_type: "technical",
        parameters: [],
        created_at: new Date().toISOString(),
        status: "inactive"
      }
    };
  }

  private getMockCustomStrategyCreation() {
    return {
      strategy_id: `custom_${Date.now()}`,
      status: "created",
      message: "Custom strategy created successfully (mock)"
    };
  }

  private getMockBacktestResult() {
    return {
      strategy_id: "mock_strategy",
      total_return: 15.75,
      annual_return: 22.3,
      sharpe_ratio: 1.42,
      max_drawdown: 8.5,
      total_trades: 45,
      winning_trades: 28,
      win_rate: 62.2,
      profit_factor: 1.85,
      trades: [],
      equity_curve: [],
      performance_metrics: {
        avg_win: 850.50,
        avg_loss: 460.25,
        largest_win: 2450.00,
        largest_loss: 1250.00
      }
    };
  }

  // Authentication
  async login(
    authMode: "fyers" | "mock",
    accessToken: string,
  ): Promise<APIResponse> {
    return this.makeRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        auth_mode: authMode,
        access_token: accessToken,
      }),
    });
  }

  // Market data endpoints
  async getLiveMarketData(
    symbols: string[],
  ): Promise<Record<string, MarketData>> {
    const symbolsParam = symbols.join(",");
    const cacheKey = `live_data_${symbolsParam}`;

    // Check cache first (1 second TTL for live data)
    const cached = this.getCacheItem(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.makeRequest<
        APIResponse<Record<string, MarketData>>
      >(`/market/live-data?symbols=${encodeURIComponent(symbolsParam)}`);

      const data = response.data || {};
      this.setCacheItem(cacheKey, data, 1);
      return data;
    } catch (error) {
      console.error("Failed to fetch live market data:", error);
      return this.getMockMarketData(symbols);
    }
  }

  async getHistoricalData(
    symbol: string,
    timeframe = "D",
    fromDate?: string,
    toDate?: string,
  ): Promise<HistoricalCandle[]> {
    const cacheKey = `historical_${symbol}_${timeframe}_${fromDate}_${toDate}`;

    // Check cache first (5 minute TTL for historical data)
    const cached = this.getCacheItem(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({
        symbol,
        timeframe,
        ...(fromDate && { from_date: fromDate }),
        ...(toDate && { to_date: toDate }),
      });

      const response = await this.makeRequest<any>(
        `/market/historical?${params}`,
      );

      // Handle both API response format and mock response format
      if (response.s === "ok" && response.candles) {
        const candles = response.candles.map((candle) => ({
          timestamp: candle[0],
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: candle[5],
        }));

        this.setCacheItem(cacheKey, candles, 300);
        return candles;
      } else if (response.data && response.data.candles) {
        // Handle mock data format with nested data
        const candles = response.data.candles.map((candle: any) => ({
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        }));

        this.setCacheItem(cacheKey, candles, 300);
        return candles;
      }

      throw new Error("Invalid historical data response");
    } catch (error) {
      console.error("Failed to fetch historical data:", error);
      // The makeRequest should have already provided mock data
      // If we get here, return the mock data directly
      const mockResponse = this.getMockHistoricalData(symbol);
      if (mockResponse.s === "ok" && mockResponse.candles) {
        const candles = mockResponse.candles.map((candle: any) => ({
          timestamp: candle[0],
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: candle[5],
        }));
        return candles;
      }
      return [];
    }
  }

  async getOptionChain(symbol: string, expiry?: string): Promise<OptionData[]> {
    const cacheKey = `option_chain_${symbol}_${expiry || "default"}`;

    // Check cache first (10 second TTL for option chain)
    const cached = this.getCacheItem(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({
        symbol,
        ...(expiry && { expiry }),
      });

      const response = await this.makeRequest<OptionChainResponse>(
        `/market/option-chain?${params}`,
      );

      if (response.s === "ok" && response.data) {
        this.setCacheItem(cacheKey, response.data, 10);
        return response.data;
      }

      throw new Error("Invalid option chain response");
    } catch (error) {
      console.error("Failed to fetch option chain:", error);
      return this.getMockOptionChain(symbol);
    }
  }

  // Stock search and details
  async searchStocks(query: string): Promise<StockSearchResponse> {
    const cacheKey = `search_${query}`;

    const cached = this.getCacheItem(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.makeRequest<StockSearchResponse>(
        `/stocks/search?query=${encodeURIComponent(query)}`,
      );

      this.setCacheItem(cacheKey, response, 300);
      return response;
    } catch (error) {
      console.error("Failed to search stocks:", error);
      return { stocks: [] };
    }
  }

  async getStockDetails(symbol: string): Promise<StockDetailsResponse | null> {
    const cacheKey = `stock_details_${symbol}`;

    const cached = this.getCacheItem(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.makeRequest<StockDetailsResponse>(
        `/stocks/${encodeURIComponent(symbol)}/details`,
      );

      this.setCacheItem(cacheKey, response, 60);
      return response;
    } catch (error) {
      console.error("Failed to get stock details:", error);
      return null;
    }
  }

  // Screener
  async screenStocks(filters: {
    min_price?: number;
    max_price?: number;
    min_volume?: number;
    max_volume?: number;
    min_market_cap?: number;
    max_market_cap?: number;
    min_pe_ratio?: number;
    max_pe_ratio?: number;
    sectors?: string[];
    exchanges?: string[];
    price_change_min?: number;
    price_change_max?: number;
  }): Promise<ScreenerResponse> {
    try {
      const response = await this.makeRequest<ScreenerResponse>(
        "/screener/filter",
        {
          method: "POST",
          body: JSON.stringify(filters),
        },
      );

      return response;
    } catch (error) {
      console.error("Failed to screen stocks:", error);
      return { stocks: [], total: 0 };
    }
  }

  // Straddle Data
  async getStraddleData(symbol: string, expiry?: string): Promise<any> {
    const cacheKey = `straddle_data_${symbol}_${expiry || 'default'}`;

    // Check cache first (30 second TTL for straddle data)
    const cached = this.getCacheItem(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({
        symbol,
        ...(expiry && { expiry }),
      });

      const response = await this.makeRequest<any>(
        `/market/straddle-data?${params}`,
      );

      // Validate response and cache if valid
      if (response && (response.straddles || response.symbol)) {
        this.setCacheItem(cacheKey, response, 30);
        return response;
      } else {
        // If response is invalid, return mock data
        console.warn("Invalid straddle data response, using mock data");
        const mockData = this.getMockStraddleData();
        this.setCacheItem(cacheKey, mockData, 30);
        return mockData;
      }
    } catch (error) {
      console.warn("Straddle data API unavailable, using mock data:", error);
      const mockData = this.getMockStraddleData();
      this.setCacheItem(cacheKey, mockData, 30);
      return mockData;
    }
  }

  // AI Analysis
  async getAIAnalysis(
    symbol: string,
    timeframe = "D",
  ): Promise<AIAnalysisResponse | null> {
    const cacheKey = `ai_analysis_${symbol}_${timeframe}`;

    const cached = this.getCacheItem(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.makeRequest<AIAnalysisResponse>(
        `/analysis/ai-analyze?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`,
        { method: "POST" },
      );

      this.setCacheItem(cacheKey, response, 300);
      return response;
    } catch (error) {
      console.error("Failed to get AI analysis:", error);
      return null;
    }
  }

  // Account information
  async getAccountInfo(): Promise<any> {
    try {
      const response = await this.makeRequest<any>("/account/info");
      return response.data;
    } catch (error) {
      console.error("Failed to get account info:", error);
      return {
        balance: 100000,
        available_margin: 80000,
        used_margin: 20000,
        total_balance: 100000,
      };
    }
  }

  // Algorithm Trading
  async createStrategy(strategy: {
    name: string;
    symbol: string;
    strategy_type: string;
    parameters: Array<{
      name: string;
      value: any;
      description?: string;
    }>;
    custom_code?: string;
    risk_management?: any;
    position_sizing?: any;
  }): Promise<AlgoStrategyResponse | null> {
    try {
      const response = await this.makeRequest<AlgoStrategyResponse>(
        "/algo/create-strategy",
        {
          method: "POST",
          body: JSON.stringify(strategy),
        },
      );

      return response;
    } catch (error) {
      console.error("Failed to create strategy:", error);
      return null;
    }
  }

  async getStrategies(): Promise<{ strategies: any[] }> {
    try {
      const response = await this.makeRequest<{ strategies: any[] }>(
        "/algo/strategies",
      );
      return response;
    } catch (error) {
      console.error("Failed to get strategies:", error);
      return { strategies: [] };
    }
  }

  async toggleStrategy(
    strategyId: string,
  ): Promise<{ strategy_id: string; status: string } | null> {
    try {
      const response = await this.makeRequest<{
        strategy_id: string;
        status: string;
      }>(`/algo/strategies/${strategyId}/toggle`, { method: "POST" });

      return response;
    } catch (error) {
      console.error("Failed to toggle strategy:", error);
      return null;
    }
  }

  async createCustomStrategy(strategy: {
    name: string;
    description: string;
    code: string;
  }): Promise<any> {
    try {
      const response = await this.makeRequest<any>(
        "/strategies/custom/create",
        {
          method: "POST",
          body: JSON.stringify(strategy),
        },
      );

      return response;
    } catch (error) {
      console.error("Failed to create custom strategy:", error);
      return null;
    }
  }

  // Backtesting
  async runBacktest(config: {
    strategy_id: string;
    symbol: string;
    start_date: string;
    end_date: string;
    initial_capital: number;
    commission: number;
    slippage: number;
  }): Promise<any> {
    try {
      const response = await this.makeRequest<any>(
        "/strategies/backtest",
        {
          method: "POST",
          body: JSON.stringify(config),
        },
      );

      return response;
    } catch (error) {
      console.error("Failed to run backtest:", error);
      return this.getMockBacktestResult();
    }
  }

  async getCustomStrategies(): Promise<{ strategies: any[] }> {
    try {
      const response = await this.makeRequest<{ strategies: any[] }>(
        "/strategies/custom",
      );
      return response;
    } catch (error) {
      console.error("Failed to get custom strategies:", error);
      return { strategies: [] };
    }
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.makeRequest("/health");
      return response.status === "healthy";
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }

  // Mock data fallbacks
  private getMockMarketData(symbols: string[]): Record<string, MarketData> {
    const data: Record<string, MarketData> = {};

    symbols.forEach((symbol) => {
      const basePrice = symbol.includes("NIFTY") ? 19850 : 44250;
      const change = (Math.random() - 0.5) * 200;

      data[symbol] = {
        symbol,
        ltp: basePrice + change,
        change,
        change_percent: (change / basePrice) * 100,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        open_interest: Math.floor(Math.random() * 5000000) + 1000000,
        high: basePrice + Math.abs(change) + Math.random() * 50,
        low: basePrice - Math.abs(change) - Math.random() * 50,
        open: basePrice + (Math.random() - 0.5) * 100,
        close: basePrice,
        timestamp: new Date().toISOString(),
      };
    });

    return data;
  }


  private getMockOptionChain(symbol: string): OptionData[] {
    const options: OptionData[] = [];
    const basePrice = symbol.includes("NIFTY") ? 19850 : 44250;

    for (let i = -10; i <= 10; i++) {
      const strike = basePrice + i * 50;

      options.push({
        strike,
        call_ltp: Math.max(
          0.1,
          basePrice - strike + (Math.random() - 0.5) * 40,
        ),
        put_ltp: Math.max(0.1, strike - basePrice + (Math.random() - 0.5) * 40),
        call_oi: Math.floor(Math.random() * 10000) + 100,
        put_oi: Math.floor(Math.random() * 10000) + 100,
        call_volume: Math.floor(Math.random() * 1000) + 10,
        put_volume: Math.floor(Math.random() * 1000) + 10,
        call_iv: Math.random() * 20 + 15,
        put_iv: Math.random() * 20 + 15,
      });
    }

    return options;
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();
export default marketDataService;
