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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Target,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  DollarSign,
  Zap,
  BarChart3,
} from "lucide-react";
import { marketDataService } from "@/services/marketData";
import { useMarketData, useSubscription } from "@/services/realTimeDataService";
import { cn } from "@/lib/utils";

interface StraddleData {
  strike: number;
  call_price: number;
  put_price: number;
  straddle_premium: number;
  distance_from_spot: number;
}

interface StraddleInfo {
  symbol: string;
  spot_price: number;
  expiry: string;
  straddles: StraddleData[];
  timestamp: string;
}

const INDICES = [
  {
    value: "NSE:NIFTY50-INDEX",
    label: "NIFTY 50",
    shortName: "NIFTY",
  },
  {
    value: "NSE:NIFTYBANK-INDEX",
    label: "BANK NIFTY",
    shortName: "BANKNIFTY",
  },
  {
    value: "BSE:SENSEX-INDEX",
    label: "SENSEX",
    shortName: "SENSEX",
  },
];

const EXPIRY_OPTIONS = [
  { value: "24JAN", label: "24 JAN 2024" },
  { value: "25JAN", label: "25 JAN 2024" },
  { value: "01FEB", label: "01 FEB 2024" },
  { value: "08FEB", label: "08 FEB 2024" },
  { value: "15FEB", label: "15 FEB 2024" },
];

export default function StraddleChart() {
  const [selectedIndex, setSelectedIndex] = useState(INDICES[0]);
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_OPTIONS[0].value);
  const [straddleData, setStraddleData] = useState<StraddleInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [straddleHistory, setStraddleHistory] = useState<any[]>([]);
  const [currentStraddleStrike, setCurrentStraddleStrike] = useState<number | null>(null);

  const { data: marketData } = useMarketData(selectedIndex.value);
  useSubscription(selectedIndex.value, true);

  // Load straddle data
  const loadStraddleData = async () => {
    setLoading(true);
    try {
      // Use marketData service which has proper fallbacks
      const data = await marketDataService.getStraddleData(selectedIndex.value, selectedExpiry);
      setStraddleData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to load straddle data:", error);
      // Fallback to mock data
      const mockData = generateMockStraddleData(selectedIndex.value);
      setStraddleData(mockData);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  // Generate mock straddle data
  const generateMockStraddleData = (symbol: string): StraddleInfo => {
    const basePrice = symbol.includes("NIFTY50")
      ? 19850
      : symbol.includes("NIFTYBANK")
        ? 44250
        : 72240;
    const baseStrike = Math.round(basePrice / 50) * 50;
    const strikes = [];

    for (let i = -5; i <= 5; i++) {
      const strike = baseStrike + i * 50;
      const callPrice = Math.max(
        0.5,
        basePrice - strike + Math.random() * 40 - 20,
      );
      const putPrice = Math.max(
        0.5,
        strike - basePrice + Math.random() * 40 - 20,
      );

      strikes.push({
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
      expiry: selectedExpiry,
      straddles: strikes,
      timestamp: new Date().toISOString(),
    };
  };

  // Load data when index or expiry changes
  useEffect(() => {
    loadStraddleData();
    // Reset history when changing symbol/expiry
    setStraddleHistory([]);
    setCurrentStraddleStrike(null);
  }, [selectedIndex.value, selectedExpiry]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadStraddleData, 30000);
    return () => clearInterval(interval);
  }, [selectedIndex.value, selectedExpiry]);

  // Track straddle history whenever data updates
  useEffect(() => {
    if (straddleData && currentStraddle) {
      const timestamp = new Date();
      const historyPoint = {
        timestamp: timestamp.toISOString(),
        time: timestamp.toLocaleTimeString(),
        strike: currentStraddle.strike,
        premium: currentStraddle.straddle_premium,
        callPrice: currentStraddle.call_price,
        putPrice: currentStraddle.put_price,
        spotPrice: straddleData.spot_price
      };

      setStraddleHistory(prev => {
        const updated = [...prev, historyPoint];
        // Keep only last 100 points to avoid memory issues
        return updated.slice(-100);
      });

      setCurrentStraddleStrike(currentStraddle.strike);
    }
  }, [straddleData, currentStraddle]);

  const refreshData = () => {
    loadStraddleData();
  };

  // Find lowest premium straddle (excluding 0.0 premiums)
  const validStraddles = straddleData?.straddles.filter(s =>
    s.call_price > 0 && s.put_price > 0 && s.straddle_premium > 0
  ) || [];

  const lowestPremiumStraddle = validStraddles.length > 0
    ? validStraddles.reduce((prev, current) =>
        current.straddle_premium < prev.straddle_premium ? current : prev
      )
    : null;

  // Also find ATM straddle for reference
  const atmStraddle = validStraddles.length > 0
    ? validStraddles.reduce((prev, current) =>
        Math.abs(current.strike - (straddleData?.spot_price || 0)) <
        Math.abs(prev.strike - (straddleData?.spot_price || 0))
          ? current
          : prev,
      )
    : null;

  // Use lowest premium straddle as current straddle
  const currentStraddle = lowestPremiumStraddle || atmStraddle;

  // Calculate metrics
  const totalPremium =
    straddleData?.straddles.reduce((sum, s) => sum + s.straddle_premium, 0) ||
    0;
  const avgPremium = totalPremium / (straddleData?.straddles.length || 1);
  const maxPremium = Math.max(
    ...(straddleData?.straddles.map((s) => s.straddle_premium) || [0]),
  );
  const minPremium = Math.min(
    ...(straddleData?.straddles.map((s) => s.straddle_premium) || [0]),
  );

  // Prepare chart data
  const chartData =
    straddleData?.straddles.map((s) => ({
      strike: s.strike,
      premium: s.straddle_premium,
      call: s.call_price,
      put: s.put_price,
      isATM: Math.abs(s.strike - (straddleData?.spot_price || 0)) < 25,
    })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Straddle Chart</h1>
          <p className="text-muted-foreground">
            Real-time straddle premium analysis for major indices
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Last Update */}
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          {/* Index Selection */}
          <Select
            value={selectedIndex.value}
            onValueChange={(value) =>
              setSelectedIndex(
                INDICES.find((i) => i.value === value) || INDICES[0],
              )
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INDICES.map((index) => (
                <SelectItem key={index.value} value={index.value}>
                  {index.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Expiry Selection */}
          <Select value={selectedExpiry} onValueChange={setSelectedExpiry}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPIRY_OPTIONS.map((expiry) => (
                <SelectItem key={expiry.value} value={expiry.value}>
                  {expiry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spot Price</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{straddleData?.spot_price.toFixed(2) || "---"}
            </div>
            {marketData && (
              <p
                className={cn(
                  "text-xs flex items-center gap-1",
                  marketData.change >= 0
                    ? "text-trading-bull"
                    : "text-trading-bear",
                )}
              >
                {marketData.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {marketData.change_percent.toFixed(2)}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ATM Straddle</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{atmStraddle?.straddle_premium.toFixed(2) || "---"}
            </div>
            <p className="text-xs text-muted-foreground">
              Strike: {atmStraddle?.strike}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Premium</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{avgPremium.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Range: ₹{minPremium.toFixed(2)} - ₹{maxPremium.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiry</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedExpiry}</div>
            <p className="text-xs text-muted-foreground">
              Selected expiry date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Premium Chart</TabsTrigger>
          <TabsTrigger value="table">Strike Table</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Straddle Premium Chart</CardTitle>
              <CardDescription>
                Straddle premium across different strike prices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">
                      Loading straddle data...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--trading-grid))"
                      />
                      <XAxis
                        dataKey="strike"
                        axisLine={false}
                        tickLine={false}
                        fontSize={12}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        fontSize={12}
                        tickFormatter={(value) => `₹${value.toFixed(0)}`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-medium mb-2">
                                  Strike: {label}
                                </p>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between gap-4">
                                    <span>Call Price:</span>
                                    <span className="font-mono">
                                      ₹{data.call.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span>Put Price:</span>
                                    <span className="font-mono">
                                      ₹{data.put.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-4 border-t pt-1">
                                    <span className="font-medium">
                                      Straddle:
                                    </span>
                                    <span className="font-mono font-medium">
                                      ₹{data.premium.toFixed(2)}
                                    </span>
                                  </div>
                                  {data.isATM && (
                                    <div className="text-center">
                                      <Badge
                                        variant="default"
                                        className="text-xs"
                                      >
                                        ATM
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="premium"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strike Price Table</CardTitle>
              <CardDescription>
                Detailed breakdown of call, put, and straddle prices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Strike</TableHead>
                      <TableHead>Call Price</TableHead>
                      <TableHead>Put Price</TableHead>
                      <TableHead>Straddle Premium</TableHead>
                      <TableHead>Distance from Spot</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {straddleData?.straddles.map((straddle) => {
                      const isATM =
                        Math.abs(
                          straddle.strike - (straddleData?.spot_price || 0),
                        ) < 25;
                      const isITM =
                        straddle.strike < (straddleData?.spot_price || 0);

                      return (
                        <TableRow
                          key={straddle.strike}
                          className={isATM ? "bg-accent/50" : ""}
                        >
                          <TableCell className="font-medium">
                            {straddle.strike}
                            {isATM && (
                              <Badge variant="default" className="ml-2 text-xs">
                                ATM
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono">
                            ₹{straddle.call_price.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-mono">
                            ₹{straddle.put_price.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-mono font-medium">
                            ₹{straddle.straddle_premium.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {straddle.distance_from_spot.toFixed(0)} pts
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                isATM
                                  ? "default"
                                  : isITM
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {isATM ? "ATM" : isITM ? "ITM" : "OTM"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Premium Distribution</CardTitle>
                <CardDescription>
                  Distribution of straddle premiums across strikes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--trading-grid))"
                      />
                      <XAxis
                        dataKey="strike"
                        axisLine={false}
                        tickLine={false}
                        fontSize={12}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        fontSize={12}
                        tickFormatter={(value) => `₹${value.toFixed(0)}`}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `₹${Number(value).toFixed(2)}`,
                          "Premium",
                        ]}
                        labelFormatter={(label) => `Strike: ${label}`}
                      />
                      <Bar
                        dataKey="premium"
                        fill="#3b82f6"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Insights</CardTitle>
                <CardDescription>
                  Key observations and trading opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm mb-1">
                      Highest Premium
                    </div>
                    <div className="text-lg font-bold">
                      ₹{maxPremium.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Maximum straddle premium available
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm mb-1">
                      Lowest Premium
                    </div>
                    <div className="text-lg font-bold">
                      ₹{minPremium.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Minimum straddle premium available
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm mb-1">
                      Premium Spread
                    </div>
                    <div className="text-lg font-bold">
                      ₹{(maxPremium - minPremium).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Difference between highest and lowest
                    </div>
                  </div>

                  {atmStraddle && (
                    <div className="p-3 border rounded-lg bg-accent/20">
                      <div className="font-medium text-sm mb-1">
                        ATM Breakevens
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm">
                          Upper:{" "}
                          <span className="font-mono">
                            ₹
                            {(
                              atmStraddle.strike + atmStraddle.straddle_premium
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-sm">
                          Lower:{" "}
                          <span className="font-mono">
                            ₹
                            {(
                              atmStraddle.strike - atmStraddle.straddle_premium
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
