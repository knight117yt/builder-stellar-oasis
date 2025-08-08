import React, { useState, useEffect } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Line,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingChartProps {
  symbol?: string;
  interval?: string;
}

// Custom candlestick component
const CandlestickBar = (props: any) => {
  const { payload, x, y, width, height } = props;
  if (!payload) return null;

  const { open, high, low, close } = payload;
  const isGreen = close >= open;
  const color = isGreen ? "#16a34a" : "#dc2626";

  const bodyHeight = Math.abs(close - open);
  const bodyY = isGreen
    ? y + height - (close - low) * (height / (high - low))
    : y + height - (open - low) * (height / (high - low));

  const wickX = x + width / 2;
  const highY = y + height - (high - low) * (height / (high - low));
  const lowY = y + height;

  return (
    <g>
      {/* High-Low wick */}
      <line
        x1={wickX}
        y1={highY}
        x2={wickX}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
      />
      {/* Open-Close body */}
      <rect
        x={x + width * 0.25}
        y={bodyY}
        width={width * 0.5}
        height={Math.max(bodyHeight * (height / (high - low)), 1)}
        fill={isGreen ? color : "transparent"}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

const generateMockData = (symbol: string, days: number = 30): CandleData[] => {
  const data: CandleData[] = [];
  const basePrice = symbol.includes("BANK") ? 44250 : 19850;
  let currentPrice = basePrice;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const open = currentPrice + (Math.random() - 0.5) * 50;
    const volatility = 30 + Math.random() * 20;
    const high = open + Math.random() * volatility;
    const low = open - Math.random() * volatility;
    const close = low + Math.random() * (high - low);
    const volume = 1000000 + Math.random() * 5000000;

    data.push({
      time: date.toLocaleDateString("en-IN", {
        month: "short",
        day: "2-digit",
      }),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(volume),
    });

    currentPrice = close;
  }

  return data;
};

const detectPatterns = (
  data: CandleData[],
): Array<{ name: string; signal: string; index: number }> => {
  const patterns = [];

  for (let i = 2; i < data.length; i++) {
    const current = data[i];
    const prev = data[i - 1];
    const prev2 = data[i - 2];

    // Hammer pattern
    const bodySize = Math.abs(current.close - current.open);
    const lowerShadow =
      current.open < current.close
        ? current.open - current.low
        : current.close - current.low;
    const upperShadow = current.high - Math.max(current.open, current.close);

    if (lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5) {
      patterns.push({ name: "Hammer", signal: "Bullish", index: i });
    }

    // Doji pattern
    if (bodySize < (current.high - current.low) * 0.1) {
      patterns.push({ name: "Doji", signal: "Neutral", index: i });
    }

    // Engulfing pattern
    const prevBodySize = Math.abs(prev.close - prev.open);
    const currentBodySize = Math.abs(current.close - current.open);

    if (currentBodySize > prevBodySize * 1.5) {
      if (
        prev.close < prev.open &&
        current.close > current.open &&
        current.close > prev.open
      ) {
        patterns.push({
          name: "Bullish Engulfing",
          signal: "Bullish",
          index: i,
        });
      } else if (
        prev.close > prev.open &&
        current.close < current.open &&
        current.close < prev.open
      ) {
        patterns.push({
          name: "Bearish Engulfing",
          signal: "Bearish",
          index: i,
        });
      }
    }
  }

  return patterns.slice(-5); // Return last 5 patterns
};

export function TradingChart({
  symbol = "NIFTY50",
  interval = "1D",
}: TradingChartProps) {
  const [data, setData] = useState<CandleData[]>([]);
  const [patterns, setPatterns] = useState<
    Array<{ name: string; signal: string; index: number }>
  >([]);
  const [selectedInterval, setSelectedInterval] = useState(interval);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChartData();
  }, [symbol, selectedInterval]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockData = generateMockData(
        symbol,
        selectedInterval === "1D" ? 30 : 100,
      );
      setData(mockData);
      setPatterns(detectPatterns(mockData));
    } catch (error) {
      console.error("Error loading chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  const intervals = [
    { value: "1m", label: "1M" },
    { value: "5m", label: "5M" },
    { value: "15m", label: "15M" },
    { value: "1h", label: "1H" },
    { value: "1D", label: "1D" },
  ];

  const currentPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const prevPrice =
    data.length > 1 ? data[data.length - 2].close : currentPrice;
  const change = currentPrice - prevPrice;
  const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {symbol} Live Chart
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-normal text-muted-foreground">
                  Live
                </span>
              </div>
            </CardTitle>
            <CardDescription>
              Real-time candlestick chart with pattern detection
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {intervals.map((int) => (
              <Button
                key={int.value}
                variant={selectedInterval === int.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedInterval(int.value)}
              >
                {int.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Price Display */}
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold">
            ₹{currentPrice.toLocaleString()}
          </div>
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              change >= 0 ? "text-trading-bull" : "text-trading-bear",
            )}
          >
            <span>
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)}
            </span>
            <span>
              ({changePercent >= 0 ? "+" : ""}
              {changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">
                Loading chart data...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="h-96 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--trading-grid))"
                  />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    domain={["dataMin - 10", "dataMax + 10"]}
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium mb-2">{label}</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between gap-4">
                                <span>Open:</span>
                                <span className="font-mono">₹{data.open}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span>High:</span>
                                <span className="font-mono text-trading-bull">
                                  ₹{data.high}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span>Low:</span>
                                <span className="font-mono text-trading-bear">
                                  ₹{data.low}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span>Close:</span>
                                <span className="font-mono">₹{data.close}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span>Volume:</span>
                                <span className="font-mono">
                                  {data.volume.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey={(entry) => [entry.low, entry.high]}
                    shape={(props) => <CandlestickBar {...props} />}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Detected Patterns */}
            {patterns.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Detected Patterns</h4>
                <div className="flex flex-wrap gap-2">
                  {patterns.map((pattern, index) => (
                    <Badge
                      key={index}
                      variant={
                        pattern.signal === "Bullish"
                          ? "default"
                          : pattern.signal === "Bearish"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {pattern.name} - {pattern.signal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
