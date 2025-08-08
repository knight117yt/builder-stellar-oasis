import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Eye,
  AlertTriangle,
  Target,
  BarChart3,
} from "lucide-react";
import { TradingChart } from "@/components/TradingChart";
import { marketDataService, useLiveData } from "@/services/marketData";
import { cn } from "@/lib/utils";

interface Position {
  symbol: string;
  type: "CALL" | "PUT";
  strike: number;
  expiry: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  pnl: number;
  pnlPercent: number;
}

interface MarketData {
  nifty: { price: number; change: number; changePercent: number };
  bankNifty: { price: number; change: number; changePercent: number };
  totalPnl: number;
  totalInvested: number;
}

const mockPositions: Position[] = [
  {
    symbol: "NIFTY",
    type: "CALL",
    strike: 19800,
    expiry: "2024-01-25",
    quantity: 50,
    avgPrice: 125.5,
    ltp: 142.25,
    pnl: 837.5,
    pnlPercent: 13.35,
  },
  {
    symbol: "BANKNIFTY",
    type: "PUT",
    strike: 44000,
    expiry: "2024-01-25",
    quantity: 25,
    avgPrice: 98.75,
    ltp: 87.5,
    pnl: -281.25,
    pnlPercent: -11.39,
  },
  {
    symbol: "NIFTY",
    type: "PUT",
    strike: 19700,
    expiry: "2024-01-25",
    quantity: 50,
    avgPrice: 78.25,
    ltp: 92.5,
    pnl: 712.5,
    pnlPercent: 18.15,
  },
];

const mockMarketData: MarketData = {
  nifty: { price: 19850.5, change: 125.75, changePercent: 0.64 },
  bankNifty: { price: 44250.75, change: -89.25, changePercent: -0.2 },
  totalPnl: 1268.75,
  totalInvested: 15137.5,
};

const candlestickPatterns = [
  { name: "Hammer", signal: "Bullish", confidence: 85, detected: "2 min ago" },
  {
    name: "Dark Cloud Cover",
    signal: "Bearish",
    confidence: 72,
    detected: "5 min ago",
  },
  { name: "Doji", signal: "Neutral", confidence: 68, detected: "8 min ago" },
];

export default function Dashboard() {
  const [marketData, setMarketData] = useState<MarketData>(mockMarketData);
  const authMode = localStorage.getItem("auth_mode") || "mock";

  // Use live data hooks
  const { data: livePositions, loading: positionsLoading } = useLiveData(
    () => marketDataService.getPositions(),
    [],
    5000, // Update every 5 seconds
  );

  const { data: livePatterns } = useLiveData(
    () => marketDataService.getCandlestickPatterns("NIFTY50"),
    [],
    10000, // Update every 10 seconds
  );

  const positions = livePositions || mockPositions;
  const candlestickPatterns = livePatterns || [
    {
      name: "Hammer",
      signal: "Bullish",
      confidence: 85,
      detected: "2 min ago",
    },
    {
      name: "Dark Cloud Cover",
      signal: "Bearish",
      confidence: 72,
      detected: "5 min ago",
    },
    { name: "Doji", signal: "Neutral", confidence: 68, detected: "8 min ago" },
  ];

  return (
    <div className="space-y-6">
      {/* Mode Indicator */}
      {authMode === "mock" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-yellow-800">
              Demo Mode - Using mock data for demonstration
            </span>
          </div>
        </div>
      )}

      {/* Market Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NIFTY 50</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketData.nifty.price.toLocaleString()}
            </div>
            <p
              className={cn(
                "text-xs flex items-center gap-1",
                marketData.nifty.change >= 0
                  ? "text-trading-bull"
                  : "text-trading-bear",
              )}
            >
              {marketData.nifty.change >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {marketData.nifty.change > 0 ? "+" : ""}
              {marketData.nifty.change} ({marketData.nifty.changePercent}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BANK NIFTY</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketData.bankNifty.price.toLocaleString()}
            </div>
            <p
              className={cn(
                "text-xs flex items-center gap-1",
                marketData.bankNifty.change >= 0
                  ? "text-trading-bull"
                  : "text-trading-bear",
              )}
            >
              {marketData.bankNifty.change >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {marketData.bankNifty.change > 0 ? "+" : ""}
              {marketData.bankNifty.change} (
              {marketData.bankNifty.changePercent}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                marketData.totalPnl >= 0
                  ? "text-trading-bull"
                  : "text-trading-bear",
              )}
            >
              ₹{marketData.totalPnl.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {marketData.totalInvested !== 0 ?
                ((marketData.totalPnl / marketData.totalInvested) * 100).toFixed(2) :
                '0.00'
              }% return
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invested</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{marketData.totalInvested.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {positions.length} active positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Chart Analysis</TabsTrigger>
          <TabsTrigger value="positions">Open Positions</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-4">
          <TradingChart symbol="NIFTY50" interval="1D" />
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open Positions</CardTitle>
              <CardDescription>
                Your current option positions and P&L
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {positions.map((position, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{position.symbol}</span>
                        <Badge
                          variant={
                            position.type === "CALL" ? "default" : "secondary"
                          }
                        >
                          {position.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {position.strike} • {position.expiry}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {position.quantity || 0} • Avg: ₹{(position.avgPrice || 0).toFixed(2)} •
                        LTP: ₹{(position.ltp || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={cn(
                          "font-medium",
                          (position.pnl || 0) >= 0
                            ? "text-trading-bull"
                            : "text-trading-bear",
                        )}
                      >
                        {(position.pnl || 0) >= 0 ? "+" : ""}₹{(position.pnl || 0).toFixed(2)}
                      </div>
                      <div
                        className={cn(
                          "text-sm",
                          (position.pnl || 0) >= 0
                            ? "text-trading-bull"
                            : "text-trading-bear",
                        )}
                      >
                        {(position.pnlPercent || 0) >= 0 ? "+" : ""}
                        {(position.pnlPercent || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Candlestick Pattern Detection</CardTitle>
                  <CardDescription>
                    Recently detected patterns in the market
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {candlestickPatterns.map((pattern, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        className={cn(
                          "h-5 w-5",
                          pattern.signal === "Bullish"
                            ? "text-trading-bull"
                            : pattern.signal === "Bearish"
                              ? "text-trading-bear"
                              : "text-trading-neutral",
                        )}
                      />
                      <div>
                        <div className="font-medium">{pattern.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {pattern.detected || pattern.timestamp
                            ? `Detected ${pattern.detected || "recently"}`
                            : "Pattern active"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          pattern.signal === "Bullish"
                            ? "default"
                            : pattern.signal === "Bearish"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {pattern.signal}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {pattern.confidence || 0}% confidence
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live indicator */}
              <div className="mt-4 p-2 bg-muted/50 rounded text-center">
                <div className="text-xs text-muted-foreground">
                  {authMode === "mock"
                    ? "Demo mode - Patterns updated with simulated data"
                    : "Live pattern detection active - Updates every 10 seconds"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
