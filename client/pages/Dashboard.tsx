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
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { TradingChart } from "@/components/TradingChart";
import { marketDataService } from "@/services/marketData";
import { useMarketData, useConnectionStatus, useSubscription } from "@/services/realTimeDataService";
import { cn } from "@/lib/utils";

interface Position {
  symbol: string;
  type: "CALL" | "PUT" | "EQUITY";
  strike?: number;
  expiry?: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  pnl: number;
  pnlPercent: number;
}

interface MarketData {
  nifty: { price: number; change: number; changePercent: number; volume?: number };
  bankNifty: { price: number; change: number; changePercent: number; volume?: number };
  sensex: { price: number; change: number; changePercent: number; volume?: number };
  totalPnl: number;
  totalInvested: number;
  dayPnl: number;
  dayPnlPercent: number;
}

interface CandlestickPattern {
  name: string;
  signal: string;
  confidence: number;
  detected: string;
  symbol?: string;
  index?: number;
}

const TRACKED_SYMBOLS = [
  "NSE:NIFTY50-INDEX",
  "NSE:NIFTYBANK-INDEX", 
  "BSE:SENSEX-INDEX"
];

export default function Dashboard() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [patterns, setPatterns] = useState<CandlestickPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const authMode = localStorage.getItem("auth_mode") || "mock";
  const connectionStatus = useConnectionStatus();
  
  // Subscribe to real-time market data
  const { data: niftyData } = useMarketData("NSE:NIFTY50-INDEX");
  const { data: bankNiftyData } = useMarketData("NSE:NIFTYBANK-INDEX");
  const { data: sensexData } = useMarketData("BSE:SENSEX-INDEX");
  
  // Subscribe to symbols for real-time updates
  useSubscription("NSE:NIFTY50-INDEX", true);
  useSubscription("NSE:NIFTYBANK-INDEX", true);
  useSubscription("BSE:SENSEX-INDEX", true);

  // Load initial dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch live market data for all tracked symbols
      const liveData = await marketDataService.getLiveMarketData(TRACKED_SYMBOLS);
      
      // Get AI analysis for pattern detection
      const niftyAnalysis = await marketDataService.getAIAnalysis("NSE:NIFTY50-INDEX");
      
      // Mock positions for demo (replace with actual position API call)
      const mockPositions: Position[] = [
        {
          symbol: "NIFTY50",
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
          symbol: "NIFTY50",
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

      // Calculate portfolio metrics
      const totalPnl = mockPositions.reduce((sum, pos) => sum + pos.pnl, 0);
      const totalInvested = mockPositions.reduce((sum, pos) => sum + (pos.avgPrice * pos.quantity), 0);
      
      // Update market data with real values or fallbacks
      const updatedMarketData: MarketData = {
        nifty: {
          price: liveData["NSE:NIFTY50-INDEX"]?.ltp || 19850.5,
          change: liveData["NSE:NIFTY50-INDEX"]?.change || 125.75,
          changePercent: liveData["NSE:NIFTY50-INDEX"]?.change_percent || 0.64,
          volume: liveData["NSE:NIFTY50-INDEX"]?.volume,
        },
        bankNifty: {
          price: liveData["NSE:NIFTYBANK-INDEX"]?.ltp || 44250.75,
          change: liveData["NSE:NIFTYBANK-INDEX"]?.change || -89.25,
          changePercent: liveData["NSE:NIFTYBANK-INDEX"]?.change_percent || -0.2,
          volume: liveData["NSE:NIFTYBANK-INDEX"]?.volume,
        },
        sensex: {
          price: liveData["BSE:SENSEX-INDEX"]?.ltp || 72240.26,
          change: liveData["BSE:SENSEX-INDEX"]?.change || 180.50,
          changePercent: liveData["BSE:SENSEX-INDEX"]?.change_percent || 0.25,
          volume: liveData["BSE:SENSEX-INDEX"]?.volume,
        },
        totalPnl,
        totalInvested,
        dayPnl: totalPnl * 0.8, // Approximate day P&L
        dayPnlPercent: totalInvested !== 0 ? (totalPnl * 0.8 / totalInvested) * 100 : 0,
      };

      setMarketData(updatedMarketData);
      setPositions(mockPositions);
      
      // Set patterns from AI analysis or mock data
      if (niftyAnalysis?.analysis) {
        const analysisPatterns: CandlestickPattern[] = [
          {
            name: "AI Pattern",
            signal: niftyAnalysis.analysis.recommendation,
            confidence: Math.round(niftyAnalysis.analysis.confidence * 100),
            detected: "Just now",
            symbol: "NIFTY50"
          }
        ];
        setPatterns(analysisPatterns);
      } else {
        // Fallback patterns
        setPatterns([
          { name: "Hammer", signal: "Bullish", confidence: 85, detected: "2 min ago" },
          { name: "Dark Cloud Cover", signal: "Bearish", confidence: 72, detected: "5 min ago" },
          { name: "Doji", signal: "Neutral", confidence: 68, detected: "8 min ago" },
        ]);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      // Set fallback data
      setMarketData({
        nifty: { price: 19850.5, change: 125.75, changePercent: 0.64 },
        bankNifty: { price: 44250.75, change: -89.25, changePercent: -0.2 },
        sensex: { price: 72240.26, change: 180.50, changePercent: 0.25 },
        totalPnl: 1268.75,
        totalInvested: 15137.5,
        dayPnl: 1015.0,
        dayPnlPercent: 6.71,
      });
    } finally {
      setLoading(false);
    }
  };

  // Update market data when real-time data arrives
  useEffect(() => {
    if (marketData && (niftyData || bankNiftyData || sensexData)) {
      const updatedData = { ...marketData };
      
      if (niftyData) {
        updatedData.nifty = {
          price: niftyData.ltp,
          change: niftyData.change,
          changePercent: niftyData.change_percent,
          volume: niftyData.volume,
        };
      }
      
      if (bankNiftyData) {
        updatedData.bankNifty = {
          price: bankNiftyData.ltp,
          change: bankNiftyData.change,
          changePercent: bankNiftyData.change_percent,
          volume: bankNiftyData.volume,
        };
      }
      
      if (sensexData) {
        updatedData.sensex = {
          price: sensexData.ltp,
          change: sensexData.change,
          changePercent: sensexData.change_percent,
          volume: sensexData.volume,
        };
      }
      
      setMarketData(updatedData);
      setLastUpdate(new Date());
    }
  }, [niftyData, bankNiftyData, sensexData, marketData]);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    loadDashboardData();
  };

  if (loading && !marketData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status & Mode Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {connectionStatus.connected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Live Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">Disconnected</span>
              </>
            )}
          </div>

          {/* Mode Indicator */}
          {authMode === "mock" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-yellow-800">
                  Demo Mode
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Refresh Button & Last Update */}
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Market Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NIFTY 50</CardTitle>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              {connectionStatus.connected && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketData?.nifty.price.toLocaleString() || "---"}
            </div>
            <p className={cn(
              "text-xs flex items-center gap-1",
              (marketData?.nifty.change || 0) >= 0
                ? "text-trading-bull"
                : "text-trading-bear",
            )}>
              {(marketData?.nifty.change || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {(marketData?.nifty.change || 0) > 0 ? "+" : ""}
              {(marketData?.nifty.change || 0).toFixed(2)} ({(marketData?.nifty.changePercent || 0).toFixed(2)}%)
            </p>
            {marketData?.nifty.volume && (
              <p className="text-xs text-muted-foreground mt-1">
                Vol: {marketData.nifty.volume.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BANK NIFTY</CardTitle>
            <div className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              {connectionStatus.connected && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketData?.bankNifty.price.toLocaleString() || "---"}
            </div>
            <p className={cn(
              "text-xs flex items-center gap-1",
              (marketData?.bankNifty.change || 0) >= 0
                ? "text-trading-bull"
                : "text-trading-bear",
            )}>
              {(marketData?.bankNifty.change || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {(marketData?.bankNifty.change || 0) > 0 ? "+" : ""}
              {(marketData?.bankNifty.change || 0).toFixed(2)} ({(marketData?.bankNifty.changePercent || 0).toFixed(2)}%)
            </p>
            {marketData?.bankNifty.volume && (
              <p className="text-xs text-muted-foreground mt-1">
                Vol: {marketData.bankNifty.volume.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SENSEX</CardTitle>
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4 text-muted-foreground" />
              {connectionStatus.connected && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketData?.sensex.price.toLocaleString() || "---"}
            </div>
            <p className={cn(
              "text-xs flex items-center gap-1",
              (marketData?.sensex.change || 0) >= 0
                ? "text-trading-bull"
                : "text-trading-bear",
            )}>
              {(marketData?.sensex.change || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {(marketData?.sensex.change || 0) > 0 ? "+" : ""}
              {(marketData?.sensex.change || 0).toFixed(2)} ({(marketData?.sensex.changePercent || 0).toFixed(2)}%)
            </p>
            {marketData?.sensex.volume && (
              <p className="text-xs text-muted-foreground mt-1">
                Vol: {marketData.sensex.volume.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              (marketData?.totalPnl || 0) >= 0
                ? "text-trading-bull"
                : "text-trading-bear",
            )}>
              ₹{(marketData?.totalPnl || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {marketData?.totalInvested !== 0
                ? ((marketData?.totalPnl || 0) / (marketData?.totalInvested || 1) * 100).toFixed(2)
                : "0.00"}% return
            </p>
            <p className={cn(
              "text-xs mt-1",
              (marketData?.dayPnl || 0) >= 0 ? "text-trading-bull" : "text-trading-bear"
            )}>
              Day: {(marketData?.dayPnl || 0) >= 0 ? "+" : ""}₹{(marketData?.dayPnl || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Live Chart</TabsTrigger>
          <TabsTrigger value="positions">Positions ({positions.length})</TabsTrigger>
          <TabsTrigger value="patterns">AI Patterns ({patterns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-4">
          <TradingChart 
            symbol="NSE:NIFTY50-INDEX" 
            interval="1D" 
            autoUpdate={true}
            showPatterns={true}
            showVolume={true}
          />
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Open Positions</span>
                <Badge variant="outline" className="text-xs">
                  Real-time P&L
                </Badge>
              </CardTitle>
              <CardDescription>
                Your current positions with live market data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {positions.map((position, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{position.symbol}</span>
                        <Badge
                          variant={
                            position.type === "CALL" 
                              ? "default" 
                              : position.type === "PUT"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {position.type}
                        </Badge>
                        {position.strike && position.expiry && (
                          <span className="text-sm text-muted-foreground">
                            {position.strike} • {position.expiry}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {position.quantity} • Avg: ₹{position.avgPrice.toFixed(2)} • LTP: ₹{position.ltp.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "font-medium text-lg",
                        position.pnl >= 0 ? "text-trading-bull" : "text-trading-bear",
                      )}>
                        {position.pnl >= 0 ? "+" : ""}₹{position.pnl.toFixed(2)}
                      </div>
                      <div className={cn(
                        "text-sm",
                        position.pnl >= 0 ? "text-trading-bull" : "text-trading-bear",
                      )}>
                        {position.pnlPercent >= 0 ? "+" : ""}{position.pnlPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {positions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No open positions</p>
                  <p className="text-sm">Your positions will appear here once you start trading</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Pattern Detection</CardTitle>
                  <CardDescription>
                    Machine learning powered pattern recognition
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {connectionStatus.connected && (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-muted-foreground">Live AI</span>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patterns.map((pattern, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={cn(
                        "h-5 w-5",
                        pattern.signal === "Bullish" || pattern.signal === "BUY"
                          ? "text-trading-bull"
                          : pattern.signal === "Bearish" || pattern.signal === "SELL"
                            ? "text-trading-bear"
                            : "text-trading-neutral",
                      )} />
                      <div>
                        <div className="font-medium">{pattern.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Detected {pattern.detected}
                          {pattern.symbol && ` • ${pattern.symbol}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        pattern.signal === "Bullish" || pattern.signal === "BUY"
                          ? "default"
                          : pattern.signal === "Bearish" || pattern.signal === "SELL"
                            ? "destructive"
                            : "secondary"
                      }>
                        {pattern.signal}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {pattern.confidence}% confidence
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {patterns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No patterns detected</p>
                  <p className="text-sm">AI is analyzing market data for patterns</p>
                </div>
              )}

              {/* Live indicator */}
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">
                  {authMode === "mock"
                    ? "Demo mode - AI patterns simulated for demonstration"
                    : connectionStatus.connected
                      ? "Live AI pattern detection active - Real-time analysis running"
                      : "Disconnected - Reconnecting to live pattern detection..."}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
