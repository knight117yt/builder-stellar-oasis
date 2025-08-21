import { z } from "zod";

// Enhanced data schemas for Fyers v3 API
const marketDataSchema = z.object({
  symbol: z.string(),
  ltp: z.number(),
  open: z.number().optional(),
  high: z.number().optional(),
  low: z.number().optional(),
  close: z.number().optional(),
  ch: z.number().optional(),
  chp: z.number().optional(),
  volume: z.number().optional(),
  oi: z.number().optional(),
  bid: z.number().optional(),
  ask: z.number().optional(),
  timestamp: z.string().optional(),
});

const fyersQuoteSchema = z.object({
  s: z.string(), // status
  d: z.array(
    z.object({
      n: z.string(), // symbol name
      s: z.string(), // symbol
      v: z.object({
        lp: z.number(), // last price
        o: z.number(), // open
        h: z.number(), // high
        l: z.number(), // low
        ch: z.number(), // change
        chp: z.number(), // change percentage
        vol: z.number().optional(), // volume
        oi: z.number().optional(), // open interest
        bid: z.number().optional(), // bid price
        ask: z.number().optional(), // ask price
        ltt: z.string().optional(), // last trade time
      }),
    }),
  ),
});

const optionChainSchema = z.object({
  strikes: z.array(
    z.object({
      strike: z.number(),
      call: z.object({
        symbol: z.string(),
        ltp: z.number(),
        iv: z.number().optional(),
        delta: z.number().optional(),
        gamma: z.number().optional(),
        theta: z.number().optional(),
        vega: z.number().optional(),
      }),
      put: z.object({
        symbol: z.string(),
        ltp: z.number(),
        iv: z.number().optional(),
        delta: z.number().optional(),
        gamma: z.number().optional(),
        theta: z.number().optional(),
        vega: z.number().optional(),
      }),
    }),
  ),
});

export type MarketData = z.infer<typeof marketDataSchema>;
export type FyersQuote = z.infer<typeof fyersQuoteSchema>;
export type OptionChain = z.infer<typeof optionChainSchema>;

// Utility function to get stored token
function getAuthToken(): string | null {
  return (
    localStorage.getItem("fyers_token") || localStorage.getItem("mock_token")
  );
}

// Check if we're in mock mode
function isMockMode(): boolean {
  return (
    localStorage.getItem("auth_mode") === "mock" ||
    getAuthToken()?.includes("mock") ||
    false
  );
}

// Enhanced Market Data Service with Fyers v3 API integration
class MarketDataService {
  private baseUrl: string;
  private wsConnection: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: MarketData) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.baseUrl = "/api";
  }

  // Get authentication headers for API calls
  private getAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Enhanced live data fetching with Fyers v3 API
  async getLiveData(symbols: string[]): Promise<Record<string, MarketData>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/market/live-data?symbols=${symbols.join(",")}`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // If using Fyers v3 API format, transform the data
      if (result.s === "ok" && result.d) {
        const transformedData: Record<string, MarketData> = {};
        result.d.forEach((quote: any) => {
          transformedData[quote.s] = {
            symbol: quote.s,
            ltp: quote.v.lp,
            open: quote.v.o,
            high: quote.v.h,
            low: quote.v.l,
            ch: quote.v.ch,
            chp: quote.v.chp,
            volume: quote.v.vol,
            oi: quote.v.oi,
            bid: quote.v.bid,
            ask: quote.v.ask,
            timestamp: quote.v.ltt || new Date().toISOString(),
          };
        });
        return transformedData;
      }

      // Fallback to existing format
      return result.data || this.generateMockData(symbols);
    } catch (error) {
      console.warn("Live data fetch failed, using mock data:", error);
      return this.generateMockData(symbols);
    }
  }

  // Enhanced option chain with Greeks from Fyers v3
  async getOptionChain(
    symbol: string,
    expiry?: string,
    strikeCount: number = 10,
  ): Promise<OptionChain> {
    try {
      const params = new URLSearchParams({
        symbol,
        ...(expiry && { expiry }),
        strike_count: strikeCount.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/market/option-chain?${params}`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.s === "ok" && result.data) {
        // Transform Fyers v3 option chain format
        return optionChainSchema.parse(result.data);
      }

      return result.data || this.generateMockOptionChain(symbol, strikeCount);
    } catch (error) {
      console.warn("Option chain fetch failed, using mock data:", error);
      return this.generateMockOptionChain(symbol, strikeCount);
    }
  }

  // Enhanced historical data with Fyers v3 API
  async getHistoricalData(
    symbol: string,
    resolution: string = "D",
    from: Date,
    to: Date,
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        symbol,
        resolution,
        from: Math.floor(from.getTime() / 1000).toString(),
        to: Math.floor(to.getTime() / 1000).toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/market/historical?${params}`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.s === "ok" && result.candles) {
        // Fyers v3 API format: [timestamp, open, high, low, close, volume]
        return result.candles;
      }

      return (
        result.candles || this.generateMockHistoricalData(symbol, from, to)
      );
    } catch (error) {
      console.warn("Historical data fetch failed, using mock data:", error);
      return this.generateMockHistoricalData(symbol, from, to);
    }
  }

  // Enhanced straddle data with Fyers v3 API
  async getStraddleData(symbol: string, expiry?: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        symbol,
        ...(expiry && { expiry }),
      });

      const response = await fetch(
        `${this.baseUrl}/market/straddle-data?${params}`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.warn("Straddle data fetch failed, using mock data:", error);
      return this.generateMockStraddleData(symbol);
    }
  }

  // WebSocket connection for real-time data with Fyers v3 WebSocket
  connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        this.wsConnection = new WebSocket(wsUrl);

        this.wsConnection.onopen = () => {
          console.log("WebSocket connected for real-time data");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.wsConnection.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "market_data" && data.symbol && data.data) {
              const marketData: MarketData = {
                symbol: data.symbol,
                ltp: data.data.lp || data.data.ltp,
                open: data.data.o || data.data.open,
                high: data.data.h || data.data.high,
                low: data.data.l || data.data.low,
                ch: data.data.ch,
                chp: data.data.chp,
                volume: data.data.vol || data.data.volume,
                oi: data.data.oi,
                bid: data.data.bid,
                ask: data.data.ask,
                timestamp: data.timestamp || new Date().toISOString(),
              };

              this.notifySubscribers(data.symbol, marketData);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.wsConnection.onclose = () => {
          console.log("WebSocket disconnected");
          this.attemptReconnect();
        };

        this.wsConnection.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Subscribe to real-time updates for a symbol
  subscribe(symbol: string, callback: (data: MarketData) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }

    this.subscribers.get(symbol)!.add(callback);

    // Send subscription message to WebSocket
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(
        JSON.stringify({
          type: "subscribe",
          symbol: symbol,
        }),
      );
    }

    // Return unsubscribe function
    return () => {
      const symbolSubscribers = this.subscribers.get(symbol);
      if (symbolSubscribers) {
        symbolSubscribers.delete(callback);
        if (symbolSubscribers.size === 0) {
          this.subscribers.delete(symbol);

          // Send unsubscribe message to WebSocket
          if (this.wsConnection?.readyState === WebSocket.OPEN) {
            this.wsConnection.send(
              JSON.stringify({
                type: "unsubscribe",
                symbol: symbol,
              }),
            );
          }
        }
      }
    };
  }

  // Notify all subscribers for a symbol
  private notifySubscribers(symbol: string, data: MarketData): void {
    const symbolSubscribers = this.subscribers.get(symbol);
    if (symbolSubscribers) {
      symbolSubscribers.forEach((callback) => callback(data));
    }
  }

  // Attempt to reconnect WebSocket
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );

      setTimeout(
        () => {
          this.connectWebSocket().catch((error) => {
            console.error("Reconnection failed:", error);
          });
        },
        Math.pow(2, this.reconnectAttempts) * 1000,
      ); // Exponential backoff
    }
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.subscribers.clear();
  }

  // Authentication methods
  async login(
    authMode: "fyers" | "mock",
    accessToken: string,
    credentials?: { appId: string; secretId: string; pin?: string },
  ): Promise<{ success: boolean; token: string; message: string }> {
    try {
      if (authMode === "fyers" && credentials) {
        const response = await fetch("/api/auth/fyers-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        const result = await response.json();

        if (result.success) {
          localStorage.setItem("fyers_token", result.token);
          localStorage.setItem("auth_mode", result.mode || "live");
          return result;
        } else {
          throw new Error(result.message);
        }
      } else {
        // Mock mode
        const mockToken = `mock_token_v3_${Date.now()}`;
        localStorage.setItem("fyers_token", mockToken);
        localStorage.setItem("auth_mode", "mock");

        return {
          success: true,
          token: mockToken,
          message: "Mock authentication successful",
        };
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  // Mock data generators (for fallback scenarios)
  private generateMockData(symbols: string[]): Record<string, MarketData> {
    const data: Record<string, MarketData> = {};

    symbols.forEach((symbol) => {
      const basePrice = symbol.includes("NIFTY")
        ? 19850
        : symbol.includes("BANKNIFTY")
          ? 44250
          : symbol.includes("SENSEX")
            ? 65000
            : 1000;

      const change = (Math.random() - 0.5) * 100;
      const open = basePrice + (Math.random() - 0.5) * 50;
      const high = Math.max(open, basePrice + change) + Math.random() * 25;
      const low = Math.min(open, basePrice + change) - Math.random() * 25;

      data[symbol] = {
        symbol,
        ltp: basePrice + change,
        open,
        high,
        low,
        ch: change,
        chp: (change / basePrice) * 100,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        oi: Math.floor(Math.random() * 5000000) + 1000000,
        bid: basePrice + change - 0.05,
        ask: basePrice + change + 0.05,
        timestamp: new Date().toISOString(),
      };
    });

    return data;
  }

  private generateMockOptionChain(
    symbol: string,
    strikeCount: number,
  ): OptionChain {
    const basePrice = symbol.includes("NIFTY") ? 19850 : 44250;
    const strikes: any[] = [];

    for (
      let i = -Math.floor(strikeCount / 2);
      i <= Math.floor(strikeCount / 2);
      i++
    ) {
      const strike = basePrice + i * 50;

      strikes.push({
        strike,
        call: {
          symbol: `${symbol.replace(":", "")}${strike}CE`,
          ltp: Math.max(0.05, basePrice - strike + Math.random() * 20),
          iv: 0.15 + Math.random() * 0.3,
          delta: Math.max(0, Math.min(1, 0.5 + (basePrice - strike) / 1000)),
          gamma: Math.random() * 0.001,
          theta: -Math.random() * 5,
          vega: Math.random() * 10,
        },
        put: {
          symbol: `${symbol.replace(":", "")}${strike}PE`,
          ltp: Math.max(0.05, strike - basePrice + Math.random() * 20),
          iv: 0.15 + Math.random() * 0.3,
          delta: Math.max(-1, Math.min(0, -0.5 + (basePrice - strike) / 1000)),
          gamma: Math.random() * 0.001,
          theta: -Math.random() * 5,
          vega: Math.random() * 10,
        },
      });
    }

    return { strikes };
  }

  private generateMockHistoricalData(
    symbol: string,
    from: Date,
    to: Date,
  ): any[] {
    const candles: any[] = [];
    const basePrice = symbol.includes("NIFTY") ? 19850 : 44250;
    let currentPrice = basePrice;

    const days = Math.ceil(
      (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000),
    );

    for (let i = 0; i < days; i++) {
      const timestamp = from.getTime() + i * 24 * 60 * 60 * 1000;
      const open = currentPrice + (Math.random() - 0.5) * 50;
      const high = open + Math.random() * 75;
      const low = open - Math.random() * 75;
      const close = low + Math.random() * (high - low);
      const volume = Math.floor(Math.random() * 1000000) + 100000;

      candles.push([timestamp, open, high, low, close, volume]);
      currentPrice = close;
    }

    return candles;
  }

  private generateMockStraddleData(symbol: string): any {
    const basePrice = symbol.includes("NIFTY") ? 19850 : 44250;
    const nearestStrike = Math.round(basePrice / 50) * 50;

    const straddles = [];
    for (let i = -2; i <= 2; i++) {
      const strike = nearestStrike + i * 50;
      const callPrice = Math.max(0.5, basePrice - strike + Math.random() * 20);
      const putPrice = Math.max(0.5, strike - basePrice + Math.random() * 20);

      straddles.push({
        strike,
        call_price: callPrice,
        put_price: putPrice,
        straddle_premium: callPrice + putPrice,
        distance_from_spot: Math.abs(strike - basePrice),
      });
    }

    return {
      symbol,
      spot_price: basePrice,
      expiry: "24JAN",
      straddles,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();
export default marketDataService;
