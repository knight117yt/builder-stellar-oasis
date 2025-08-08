// Market Data Service for handling live data fetching and real-time updates

export interface MarketDataResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OptionData {
  strike: number;
  call: {
    ltp: number;
    bid: number;
    ask: number;
    volume: number;
    oi: number;
    iv: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
  put: {
    ltp: number;
    bid: number;
    ask: number;
    volume: number;
    oi: number;
    iv: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
}

export interface Position {
  symbol: string;
  type: 'CALL' | 'PUT';
  strike: number;
  expiry: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  pnl: number;
  pnlPercent: number;
}

class MarketDataService {
  private baseUrl = '/api';
  private token: string | null = null;
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.token = localStorage.getItem('fyers_token');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<MarketDataResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get market data for charts
  async getMarketData(symbol: string, interval: string = '1D'): Promise<CandleData[]> {
    const response = await this.makeRequest(`/market/data?symbol=${symbol}&interval=${interval}`);
    
    if (response.success && response.data?.candles) {
      return response.data.candles;
    }
    
    // Return mock data if API fails
    return this.generateMockCandles(symbol, interval);
  }

  // Get option chain data
  async getOptionChain(symbol: string, expiry?: string): Promise<OptionData[]> {
    const expiryParam = expiry ? `&expiry=${expiry}` : '';
    const response = await this.makeRequest(`/market/option-chain?symbol=${symbol}${expiryParam}`);
    
    if (response.success && response.data?.strikes) {
      return response.data.strikes;
    }
    
    // Return mock data if API fails
    return this.generateMockOptionChain(symbol === 'NIFTY' ? 19850 : 44250);
  }

  // Get current positions
  async getPositions(): Promise<Position[]> {
    const response = await this.makeRequest('/positions');
    
    if (response.success && response.data?.positions) {
      return response.data.positions;
    }
    
    // Return mock data if API fails
    return this.generateMockPositions();
  }

  // Get candlestick patterns
  async getCandlestickPatterns(symbol: string): Promise<any[]> {
    const response = await this.makeRequest(`/market/patterns?symbol=${symbol}`);
    
    if (response.success && response.data?.detected_patterns) {
      return response.data.detected_patterns;
    }
    
    // Return mock patterns if API fails
    return this.generateMockPatterns();
  }

  // Start live updates for a component
  startLiveUpdates(key: string, callback: () => void, intervalMs: number = 5000) {
    this.stopLiveUpdates(key); // Clear existing interval
    
    const interval = setInterval(callback, intervalMs);
    this.updateIntervals.set(key, interval);
  }

  // Stop live updates
  stopLiveUpdates(key: string) {
    const interval = this.updateIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(key);
    }
  }

  // Stop all live updates (cleanup)
  stopAllUpdates() {
    this.updateIntervals.forEach((interval) => clearInterval(interval));
    this.updateIntervals.clear();
  }

  // Mock data generators (fallback when API is unavailable)
  private generateMockCandles(symbol: string, interval: string, count: number = 50): CandleData[] {
    const data: CandleData[] = [];
    const basePrice = symbol.includes('BANK') ? 44250 : symbol.includes('FINN') ? 21120 : 19850;
    let currentPrice = basePrice;
    
    for (let i = count; i >= 0; i--) {
      const date = new Date();
      if (interval === '1m') {
        date.setMinutes(date.getMinutes() - i);
      } else if (interval === '5m') {
        date.setMinutes(date.getMinutes() - (i * 5));
      } else if (interval === '1h') {
        date.setHours(date.getHours() - i);
      } else {
        date.setDate(date.getDate() - i);
      }
      
      const open = currentPrice + (Math.random() - 0.5) * 50;
      const volatility = 20 + Math.random() * 30;
      const high = open + Math.random() * volatility;
      const low = open - Math.random() * volatility;
      const close = low + Math.random() * (high - low);
      const volume = 500000 + Math.random() * 2000000;
      
      data.push({
        time: interval === '1D' ? 
          date.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }) :
          date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: Math.round(volume)
      });
      
      currentPrice = close;
    }
    
    return data;
  }

  private generateMockOptionChain(spotPrice: number): OptionData[] {
    const strikes: OptionData[] = [];
    const atmStrike = Math.round(spotPrice / 50) * 50;
    
    for (let i = -10; i <= 10; i++) {
      const strike = atmStrike + (i * 50);
      const moneyness = strike / spotPrice;
      
      const timeToExpiry = 7 / 365;
      const baseIV = 0.18 + Math.abs(moneyness - 1) * 0.12;
      
      const callIntrinsic = Math.max(spotPrice - strike, 0);
      const putIntrinsic = Math.max(strike - spotPrice, 0);
      
      const callTimeValue = Math.random() * 25 + 5;
      const putTimeValue = Math.random() * 25 + 5;
      
      const callPrice = callIntrinsic + callTimeValue;
      const putPrice = putIntrinsic + putTimeValue;
      
      const callDelta = moneyness < 1 ? 0.1 + Math.random() * 0.4 : 0.5 + Math.random() * 0.4;
      const putDelta = -Math.abs(callDelta - 1);
      
      const gamma = 0.001 + Math.random() * 0.008;
      const callTheta = -(Math.random() * 2.5 + 0.5);
      const putTheta = -(Math.random() * 2.5 + 0.5);
      const vega = 8 + Math.random() * 12;
      
      strikes.push({
        strike,
        call: {
          ltp: Math.round(callPrice * 100) / 100,
          bid: Math.round((callPrice - 0.5) * 100) / 100,
          ask: Math.round((callPrice + 0.5) * 100) / 100,
          volume: Math.round(Math.random() * 8000),
          oi: Math.round(Math.random() * 40000),
          iv: Math.round(baseIV * 100 * 100) / 100,
          delta: Math.round(callDelta * 10000) / 10000,
          gamma: Math.round(gamma * 10000) / 10000,
          theta: Math.round(callTheta * 100) / 100,
          vega: Math.round(vega * 100) / 100
        },
        put: {
          ltp: Math.round(putPrice * 100) / 100,
          bid: Math.round((putPrice - 0.5) * 100) / 100,
          ask: Math.round((putPrice + 0.5) * 100) / 100,
          volume: Math.round(Math.random() * 8000),
          oi: Math.round(Math.random() * 40000),
          iv: Math.round(baseIV * 100 * 100) / 100,
          delta: Math.round(putDelta * 10000) / 10000,
          gamma: Math.round(gamma * 10000) / 10000,
          theta: Math.round(putTheta * 100) / 100,
          vega: Math.round(vega * 100) / 100
        }
      });
    }
    
    return strikes;
  }

  private generateMockPositions(): Position[] {
    return [
      {
        symbol: 'NIFTY',
        type: 'CALL',
        strike: 19800,
        expiry: '2024-01-25',
        quantity: 50,
        avgPrice: 125.50,
        ltp: 142.25 + (Math.random() * 20 - 10),
        pnl: 0,
        pnlPercent: 0
      },
      {
        symbol: 'BANKNIFTY',
        type: 'PUT',
        strike: 44000,
        expiry: '2024-01-25',
        quantity: 25,
        avgPrice: 98.75,
        ltp: 87.50 + (Math.random() * 15 - 7.5),
        pnl: 0,
        pnlPercent: 0
      }
    ].map(position => {
      const pnl = (position.ltp - position.avgPrice) * position.quantity;
      const pnlPercent = (pnl / (position.avgPrice * position.quantity)) * 100;
      return { ...position, pnl, pnlPercent };
    });
  }

  private generateMockPatterns(): any[] {
    const patterns = [
      { name: 'Hammer', signal: 'Bullish', confidence: 85 },
      { name: 'Doji', signal: 'Neutral', confidence: 72 },
      { name: 'Engulfing', signal: 'Bearish', confidence: 68 }
    ];
    
    return patterns.map(pattern => ({
      ...pattern,
      timestamp: new Date().toISOString(),
      description: `${pattern.name} pattern detected with ${pattern.confidence}% confidence`
    }));
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();

// Hook for easy use in React components
export function useMarketData() {
  return marketDataService;
}

// Real-time data hook
export function useLiveData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  intervalMs: number = 5000
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        setError(null);
        const result = await fetchFn();
        if (mounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData();

    // Set up interval for live updates
    const interval = setInterval(fetchData, intervalMs);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, dependencies);

  return { data, loading, error };
}

// React import for the hook
import React from 'react';
