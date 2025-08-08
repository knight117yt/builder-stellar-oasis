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

  // HTTP request helper
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
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
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

      const response = await this.makeRequest<HistoricalDataResponse>(
        `/market/historical?${params}`,
      );

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
      }

      throw new Error("Invalid historical data response");
    } catch (error) {
      console.error("Failed to fetch historical data:", error);
      return this.getMockHistoricalData(symbol);
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
      const response = await this.makeRequest<any>('/account/info');
      return response.data;
    } catch (error) {
      console.error('Failed to get account info:', error);
      return {
        balance: 100000,
        available_margin: 80000,
        used_margin: 20000,
        total_balance: 100000
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

  private getMockHistoricalData(symbol: string): HistoricalCandle[] {
    const candles: HistoricalCandle[] = [];
    const basePrice = symbol.includes("NIFTY") ? 19850 : 44250;
    const now = Date.now();

    for (let i = 30; i >= 0; i--) {
      const timestamp = now - i * 24 * 60 * 60 * 1000;
      const open = basePrice + (Math.random() - 0.5) * 100;
      const close = open + (Math.random() - 0.5) * 50;
      const high = Math.max(open, close) + Math.random() * 20;
      const low = Math.min(open, close) - Math.random() * 20;

      candles.push({
        timestamp: Math.floor(timestamp / 1000),
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 100000) + 10000,
      });
    }

    return candles;
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
