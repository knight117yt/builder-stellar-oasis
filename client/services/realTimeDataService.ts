import React from 'react';
import create from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types for real-time data
export interface MarketData {
  symbol: string;
  ltp: number;
  change: number;
  change_percent: number;
  volume: number;
  open_interest?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
  timestamp: string;
}

export interface HistoricalCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OptionData {
  strike: number;
  call_ltp?: number;
  put_ltp?: number;
  call_oi?: number;
  put_oi?: number;
  call_volume?: number;
  put_volume?: number;
  call_iv?: number;
  put_iv?: number;
}

export interface WebSocketMessage {
  type: string;
  symbol?: string;
  data?: any;
  timestamp?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
}

interface RealTimeDataStore {
  // Connection state
  connectionStatus: ConnectionStatus;
  websocket: WebSocket | null;
  
  // Data state
  marketData: Record<string, MarketData>;
  historicalData: Record<string, HistoricalCandle[]>;
  optionChains: Record<string, OptionData[]>;
  subscriptions: Set<string>;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  subscribe: (symbol: string) => void;
  unsubscribe: (symbol: string) => void;
  sendMessage: (message: WebSocketMessage) => void;
  
  // Internal actions
  setConnectionStatus: (status: Partial<ConnectionStatus>) => void;
  updateMarketData: (symbol: string, data: MarketData) => void;
  updateHistoricalData: (symbol: string, data: HistoricalCandle[]) => void;
  updateOptionChain: (symbol: string, data: OptionData[]) => void;
}

const WEBSOCKET_URL = import.meta.env.DEV 
  ? 'ws://localhost:8000/ws' 
  : `ws://${window.location.hostname}:8000/ws`;

const RECONNECT_INTERVAL = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 10;

export const useRealTimeDataStore = create<RealTimeDataStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    connectionStatus: {
      connected: false,
      reconnecting: false,
      reconnectAttempts: 0,
    },
    websocket: null,
    marketData: {},
    historicalData: {},
    optionChains: {},
    subscriptions: new Set(),

    // Connection management
    connect: () => {
      const state = get();
      
      if (state.websocket?.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
      }

      console.log('Connecting to WebSocket:', WEBSOCKET_URL);
      
      try {
        const ws = new WebSocket(WEBSOCKET_URL);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          set({
            websocket: ws,
            connectionStatus: {
              connected: true,
              reconnecting: false,
              lastConnected: new Date(),
              reconnectAttempts: 0,
            },
          });

          // Resubscribe to existing subscriptions
          const currentState = get();
          currentState.subscriptions.forEach(symbol => {
            ws.send(JSON.stringify({
              type: 'subscribe',
              symbol: symbol,
            }));
          });
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            handleWebSocketMessage(message, set, get);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          set({
            websocket: null,
            connectionStatus: {
              connected: false,
              reconnecting: false,
              reconnectAttempts: 0,
            },
          });

          // Auto-reconnect if not intentionally closed
          if (event.code !== 1000) {
            scheduleReconnect(set, get);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          set({
            connectionStatus: {
              ...get().connectionStatus,
              connected: false,
            },
          });
        };

        set({ websocket: ws });
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        scheduleReconnect(set, get);
      }
    },

    disconnect: () => {
      const { websocket } = get();
      if (websocket) {
        websocket.close(1000, 'User disconnected');
        set({
          websocket: null,
          connectionStatus: {
            connected: false,
            reconnecting: false,
            reconnectAttempts: 0,
          },
        });
      }
    },

    subscribe: (symbol: string) => {
      const { websocket, subscriptions } = get();
      
      if (!subscriptions.has(symbol)) {
        const newSubscriptions = new Set(subscriptions);
        newSubscriptions.add(symbol);
        set({ subscriptions: newSubscriptions });

        if (websocket?.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify({
            type: 'subscribe',
            symbol: symbol,
          }));
        }
      }
    },

    unsubscribe: (symbol: string) => {
      const { websocket, subscriptions } = get();
      
      if (subscriptions.has(symbol)) {
        const newSubscriptions = new Set(subscriptions);
        newSubscriptions.delete(symbol);
        set({ subscriptions: newSubscriptions });

        if (websocket?.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify({
            type: 'unsubscribe',
            symbol: symbol,
          }));
        }
      }
    },

    sendMessage: (message: WebSocketMessage) => {
      const { websocket } = get();
      if (websocket?.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(message));
      } else {
        console.warn('WebSocket not connected, cannot send message');
      }
    },

    // Internal state updates
    setConnectionStatus: (status: Partial<ConnectionStatus>) => {
      set({
        connectionStatus: {
          ...get().connectionStatus,
          ...status,
        },
      });
    },

    updateMarketData: (symbol: string, data: MarketData) => {
      set({
        marketData: {
          ...get().marketData,
          [symbol]: data,
        },
      });
    },

    updateHistoricalData: (symbol: string, data: HistoricalCandle[]) => {
      set({
        historicalData: {
          ...get().historicalData,
          [symbol]: data,
        },
      });
    },

    updateOptionChain: (symbol: string, data: OptionData[]) => {
      set({
        optionChains: {
          ...get().optionChains,
          [symbol]: data,
        },
      });
    },
  }))
);

// Handle incoming WebSocket messages
function handleWebSocketMessage(
  message: WebSocketMessage,
  set: any,
  get: () => RealTimeDataStore
) {
  switch (message.type) {
    case 'market_data':
      if (message.symbol && message.data) {
        get().updateMarketData(message.symbol, message.data);
      }
      break;

    case 'historical_data':
      if (message.symbol && message.data) {
        get().updateHistoricalData(message.symbol, message.data);
      }
      break;

    case 'option_chain':
      if (message.symbol && message.data) {
        get().updateOptionChain(message.symbol, message.data);
      }
      break;

    case 'error':
      console.error('WebSocket error message:', message.data);
      break;

    case 'ping':
      // Respond to ping with pong
      get().sendMessage({ type: 'pong' });
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
}

// Schedule reconnection with exponential backoff
function scheduleReconnect(set: any, get: () => RealTimeDataStore) {
  const { connectionStatus } = get();
  
  if (connectionStatus.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnection attempts reached');
    return;
  }

  if (connectionStatus.reconnecting) {
    return; // Already reconnecting
  }

  set({
    connectionStatus: {
      ...connectionStatus,
      reconnecting: true,
      reconnectAttempts: connectionStatus.reconnectAttempts + 1,
    },
  });

  const delay = Math.min(RECONNECT_INTERVAL * Math.pow(2, connectionStatus.reconnectAttempts), 30000);
  
  setTimeout(() => {
    console.log(`Attempting to reconnect (attempt ${connectionStatus.reconnectAttempts + 1})`);
    get().connect();
  }, delay);
}

// React hook for convenient access to market data
export function useMarketData(symbol?: string) {
  const marketData = useRealTimeDataStore(state => 
    symbol ? state.marketData[symbol] : state.marketData
  );
  const subscribe = useRealTimeDataStore(state => state.subscribe);
  const unsubscribe = useRealTimeDataStore(state => state.unsubscribe);
  
  return {
    data: marketData,
    subscribe,
    unsubscribe,
  };
}

// React hook for connection status
export function useConnectionStatus() {
  return useRealTimeDataStore(state => state.connectionStatus);
}

// React hook for managing subscriptions
export function useSubscription(symbol: string, autoSubscribe = true) {
  const subscribe = useRealTimeDataStore(state => state.subscribe);
  const unsubscribe = useRealTimeDataStore(state => state.unsubscribe);
  const isSubscribed = useRealTimeDataStore(state => state.subscriptions.has(symbol));
  
  React.useEffect(() => {
    if (autoSubscribe && symbol) {
      subscribe(symbol);
      return () => unsubscribe(symbol);
    }
  }, [symbol, autoSubscribe, subscribe, unsubscribe]);
  
  return {
    isSubscribed,
    subscribe: () => subscribe(symbol),
    unsubscribe: () => unsubscribe(symbol),
  };
}

// Note: Auto-connection should be handled in components using useEffect

export default useRealTimeDataStore;
