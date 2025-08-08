import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Line,
  ReferenceLine,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { marketDataService } from "@/services/marketData";
import {
  useMarketData,
  useSubscription,
  HistoricalCandle,
} from "@/services/realTimeDataService";
import { Pause, Play, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";

interface CandleData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingChartProps {
  symbol?: string;
  interval?: string;
  height?: number;
  showVolume?: boolean;
  showPatterns?: boolean;
  autoUpdate?: boolean;
}

interface TechnicalIndicator {
  name: string;
  enabled: boolean;
  color: string;
  data: Array<{ time: string; value: number }>;
}

// Custom candlestick component with improved rendering
const CandlestickBar = (props: any) => {
  const { payload, x, y, width, height } = props;
  if (!payload) return null;

  const { open, high, low, close } = payload;
  const isGreen = close >= open;
  const color = isGreen ? "#16a34a" : "#dc2626";
  const wickColor = isGreen ? "#16a34a" : "#dc2626";

  // Calculate dimensions
  const range = high - low;
  if (range === 0) return null;

  const bodyHeight = Math.abs(close - open);
  const bodyTop = Math.min(open, close);
  const bodyY = y + height - ((bodyTop + bodyHeight - low) / range) * height;
  const actualBodyHeight = (bodyHeight / range) * height;

  const wickX = x + width / 2;
  const highY = y + height - ((high - low) / range) * height;
  const lowY = y + height;

  return (
    <g>
      {/* High-Low wick */}
      <line
        x1={wickX}
        y1={highY}
        x2={wickX}
        y2={lowY}
        stroke={wickColor}
        strokeWidth={Math.max(1, width * 0.1)}
        opacity={0.8}
      />
      {/* Open-Close body */}
      <rect
        x={x + width * 0.2}
        y={bodyY}
        width={width * 0.6}
        height={Math.max(actualBodyHeight, 1)}
        fill={isGreen ? color : "transparent"}
        stroke={color}
        strokeWidth={1}
        opacity={0.9}
      />
    </g>
  );
};

// Technical indicator calculations
const calculateSMA = (
  data: CandleData[],
  period: number,
): TechnicalIndicator => {
  const smaData = data.map((item, index) => {
    if (index < period - 1) {
      return { time: item.time, value: 0 };
    }

    const sum = data
      .slice(index - period + 1, index + 1)
      .reduce((acc, curr) => acc + curr.close, 0);

    return { time: item.time, value: sum / period };
  });

  return {
    name: `SMA ${period}`,
    enabled: true,
    color: "#3b82f6",
    data: smaData,
  };
};

const calculateEMA = (
  data: CandleData[],
  period: number,
): TechnicalIndicator => {
  const multiplier = 2 / (period + 1);
  const emaData: Array<{ time: string; value: number }> = [];

  data.forEach((item, index) => {
    if (index === 0) {
      emaData.push({ time: item.time, value: item.close });
    } else {
      const prevEMA = emaData[index - 1].value;
      const ema = (item.close - prevEMA) * multiplier + prevEMA;
      emaData.push({ time: item.time, value: ema });
    }
  });

  return {
    name: `EMA ${period}`,
    enabled: true,
    color: "#f59e0b",
    data: emaData,
  };
};

const detectPatterns = (
  data: CandleData[],
): Array<{
  name: string;
  signal: string;
  index: number;
  confidence: number;
}> => {
  const patterns = [];

  for (let i = 2; i < data.length; i++) {
    const current = data[i];
    const prev = data[i - 1];
    const prev2 = data[i - 2];

    // Enhanced pattern detection with confidence scores
    const bodySize = Math.abs(current.close - current.open);
    const totalRange = current.high - current.low;
    const lowerShadow =
      current.open < current.close
        ? current.open - current.low
        : current.close - current.low;
    const upperShadow = current.high - Math.max(current.open, current.close);

    // Hammer pattern with confidence
    if (
      lowerShadow > bodySize * 2 &&
      upperShadow < bodySize * 0.5 &&
      totalRange > 0
    ) {
      const confidence = Math.min(0.95, (lowerShadow / bodySize) * 0.3);
      patterns.push({
        name: "Hammer",
        signal: "Bullish",
        index: i,
        confidence,
      });
    }

    // Doji pattern with confidence
    if (bodySize < totalRange * 0.1 && totalRange > 0) {
      const confidence = Math.min(0.9, (totalRange - bodySize) / totalRange);
      patterns.push({
        name: "Doji",
        signal: "Neutral",
        index: i,
        confidence,
      });
    }

    // Engulfing patterns with confidence
    const prevBodySize = Math.abs(prev.close - prev.open);
    if (bodySize > prevBodySize * 1.3) {
      if (
        prev.close < prev.open &&
        current.close > current.open &&
        current.close > prev.open
      ) {
        const confidence = Math.min(0.95, (bodySize / prevBodySize) * 0.5);
        patterns.push({
          name: "Bullish Engulfing",
          signal: "Bullish",
          index: i,
          confidence,
        });
      } else if (
        prev.close > prev.open &&
        current.close < current.open &&
        current.close < prev.open
      ) {
        const confidence = Math.min(0.95, (bodySize / prevBodySize) * 0.5);
        patterns.push({
          name: "Bearish Engulfing",
          signal: "Bearish",
          index: i,
          confidence,
        });
      }
    }

    // Three White Soldiers / Three Black Crows
    if (i >= 2) {
      const candle1 = data[i - 2];
      const candle2 = prev;
      const candle3 = current;

      const allBullish =
        candle1.close > candle1.open &&
        candle2.close > candle2.open &&
        candle3.close > candle3.open;
      const ascending =
        candle2.close > candle1.close && candle3.close > candle2.close;

      if (allBullish && ascending) {
        patterns.push({
          name: "Three White Soldiers",
          signal: "Bullish",
          index: i,
          confidence: 0.85,
        });
      }

      const allBearish =
        candle1.close < candle1.open &&
        candle2.close < candle2.open &&
        candle3.close < candle3.open;
      const descending =
        candle2.close < candle1.close && candle3.close < candle2.close;

      if (allBearish && descending) {
        patterns.push({
          name: "Three Black Crows",
          signal: "Bearish",
          index: i,
          confidence: 0.85,
        });
      }
    }
  }

  return patterns.slice(-8).filter((p) => p.confidence > 0.6); // Return high-confidence patterns
};

export function TradingChart({
  symbol = "NSE:NIFTY50-INDEX",
  interval = "1D",
  height = 400,
  showVolume = true,
  showPatterns = true,
  autoUpdate = true,
}: TradingChartProps) {
  const [data, setData] = useState<CandleData[]>([]);
  const [patterns, setPatterns] = useState<
    Array<{ name: string; signal: string; index: number; confidence: number }>
  >([]);
  const [indicators, setIndicators] = useState<TechnicalIndicator[]>([]);
  const [selectedInterval, setSelectedInterval] = useState(interval);
  const [loading, setLoading] = useState(false);
  const [liveMode, setLiveMode] = useState(autoUpdate);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { data: marketData } = useMarketData(symbol);
  const { subscribe, unsubscribe } = useSubscription(symbol, liveMode);

  const intervals = [
    { value: "1m", label: "1M", seconds: 60 },
    { value: "5m", label: "5M", seconds: 300 },
    { value: "15m", label: "15M", seconds: 900 },
    { value: "1h", label: "1H", seconds: 3600 },
    { value: "1D", label: "1D", seconds: 86400 },
  ];

  // Load initial chart data
  const loadChartData = useCallback(async () => {
    setLoading(true);
    try {
      const fromDate = new Date();
      fromDate.setDate(
        fromDate.getDate() - (selectedInterval === "1D" ? 30 : 100),
      );

      const historicalData = await marketDataService.getHistoricalData(
        symbol,
        selectedInterval,
        fromDate.toISOString().split("T")[0],
        new Date().toISOString().split("T")[0],
      );

      const formattedData: CandleData[] = historicalData.map((candle) => ({
        time: new Date(candle.timestamp * 1000).toLocaleDateString("en-IN", {
          month: "short",
          day: "2-digit",
        }),
        timestamp: candle.timestamp,
        open: Math.round(candle.open * 100) / 100,
        high: Math.round(candle.high * 100) / 100,
        low: Math.round(candle.low * 100) / 100,
        close: Math.round(candle.close * 100) / 100,
        volume: candle.volume,
      }));

      setData(formattedData);

      if (showPatterns) {
        setPatterns(detectPatterns(formattedData));
      }

      // Calculate technical indicators
      if (formattedData.length > 20) {
        const sma20 = calculateSMA(formattedData, 20);
        const ema12 = calculateEMA(formattedData, 12);
        setIndicators([sma20, ema12]);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error loading chart data:", error);
    } finally {
      setLoading(false);
    }
  }, [symbol, selectedInterval, showPatterns]);

  // Update live data
  const updateLiveData = useCallback(() => {
    if (!liveMode || !marketData) return;

    setData((prevData) => {
      if (prevData.length === 0) return prevData;

      const newData = [...prevData];
      const lastCandle = newData[newData.length - 1];
      const currentTime = new Date();

      // Determine if we should create a new candle or update the existing one
      const intervalSeconds =
        intervals.find((i) => i.value === selectedInterval)?.seconds || 86400;
      const timeDiff =
        Math.floor(currentTime.getTime() / 1000) - lastCandle.timestamp;

      if (timeDiff >= intervalSeconds) {
        // Create new candle
        const newCandle: CandleData = {
          time: currentTime.toLocaleDateString("en-IN", {
            month: "short",
            day: "2-digit",
          }),
          timestamp: Math.floor(currentTime.getTime() / 1000),
          open: marketData.ltp,
          high: marketData.ltp,
          low: marketData.ltp,
          close: marketData.ltp,
          volume: marketData.volume || 0,
        };
        newData.push(newCandle);
      } else {
        // Update current candle
        const updatedCandle = { ...lastCandle };
        updatedCandle.close = marketData.ltp;
        updatedCandle.high = Math.max(updatedCandle.high, marketData.ltp);
        updatedCandle.low = Math.min(updatedCandle.low, marketData.ltp);
        updatedCandle.volume = marketData.volume || updatedCandle.volume;
        newData[newData.length - 1] = updatedCandle;
      }

      return newData;
    });

    setLastUpdate(new Date());
  }, [liveMode, marketData, selectedInterval, intervals]);

  // Setup live data updates
  useEffect(() => {
    if (liveMode) {
      subscribe();
      intervalRef.current = setInterval(updateLiveData, 1000);
    } else {
      unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [liveMode, subscribe, unsubscribe, updateLiveData]);

  // Load data when symbol or interval changes
  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  // Update patterns when data changes
  useEffect(() => {
    if (showPatterns && data.length > 3) {
      setPatterns(detectPatterns(data));
    }
  }, [data, showPatterns]);

  const currentPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const prevPrice =
    data.length > 1 ? data[data.length - 2].close : currentPrice;
  const change = currentPrice - prevPrice;
  const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;

  const toggleLiveMode = () => {
    setLiveMode(!liveMode);
  };

  const refreshData = () => {
    loadChartData();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {symbol} Live Chart
              <div className="flex items-center gap-2">
                {liveMode && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-normal text-muted-foreground">
                      Live
                    </span>
                  </div>
                )}
                {lastUpdate && (
                  <span className="text-xs text-muted-foreground">
                    Updated {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Real-time candlestick chart with pattern detection and technical
              indicators
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Mode Toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor="live-mode" className="text-sm">
                Live
              </Label>
              <Switch
                id="live-mode"
                checked={liveMode}
                onCheckedChange={toggleLiveMode}
              />
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={loading}
            >
              <RotateCcw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>

            {/* Interval Buttons */}
            {intervals.map((int) => (
              <Button
                key={int.value}
                variant={selectedInterval === int.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedInterval(int.value)}
                disabled={loading}
              >
                {int.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Price Display */}
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold">
            ₹{currentPrice.toLocaleString()}
          </div>
          <div
            className={cn(
              "flex items-center gap-2 text-lg font-medium",
              change >= 0 ? "text-trading-bull" : "text-trading-bear",
            )}
          >
            {change >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)}
            </span>
            <span>
              ({changePercent >= 0 ? "+" : ""}
              {changePercent.toFixed(2)}%)
            </span>
          </div>
          {marketData?.volume && (
            <div className="text-sm text-muted-foreground">
              Vol: {marketData.volume.toLocaleString()}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className={`h-${height} flex items-center justify-center`}>
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
            <div className={`h-96 mb-6`}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--trading-grid))"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                    type="category"
                    allowDuplicatedCategory={false}
                  />
                  <YAxis
                    domain={["dataMin - 10", "dataMax + 10"]}
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${value.toFixed(0)}`}
                    type="number"
                    allowDecimals={true}
                  />

                  {/* Support and Resistance Lines */}
                  {data.length > 0 && (
                    <>
                      <ReferenceLine
                        y={Math.max(...data.map((d) => d.high))}
                        stroke="#dc2626"
                        strokeDasharray="5 5"
                        strokeOpacity={0.7}
                        label={{
                          value: "Resistance",
                          position: "insideTopRight",
                        }}
                      />
                      <ReferenceLine
                        y={Math.min(...data.map((d) => d.low))}
                        stroke="#16a34a"
                        strokeDasharray="5 5"
                        strokeOpacity={0.7}
                        label={{
                          value: "Support",
                          position: "insideBottomRight",
                        }}
                      />
                    </>
                  )}

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
                                <span className="font-mono">
                                  ₹{data.open.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span>High:</span>
                                <span className="font-mono text-trading-bull">
                                  ₹{data.high.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span>Low:</span>
                                <span className="font-mono text-trading-bear">
                                  ₹{data.low.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span>Close:</span>
                                <span className="font-mono">
                                  ₹{data.close.toFixed(2)}
                                </span>
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

                  {/* Candlesticks */}
                  <Bar
                    dataKey={(entry) => [entry.low, entry.high]}
                    shape={(props) => <CandlestickBar {...props} />}
                  />

                  {/* Technical Indicators */}
                  {indicators.map(
                    (indicator, index) =>
                      indicator.enabled && (
                        <Line
                          key={indicator.name}
                          type="monotone"
                          dataKey={`indicator_${index}`}
                          stroke={indicator.color}
                          strokeWidth={1.5}
                          dot={false}
                          connectNulls={false}
                          strokeOpacity={0.8}
                          data={data.map((item, i) => ({
                            ...item,
                            [`indicator_${index}`]:
                              indicator.data[i]?.value || null,
                          }))}
                        />
                      ),
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Technical Indicators Legend */}
            {indicators.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Technical Indicators</h4>
                <div className="flex flex-wrap gap-2">
                  {indicators.map((indicator, index) => (
                    <Badge
                      key={indicator.name}
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: indicator.color,
                        color: indicator.color,
                      }}
                    >
                      {indicator.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Detected Patterns */}
            {showPatterns && patterns.length > 0 && (
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
                      {pattern.name} - {pattern.signal} (
                      {(pattern.confidence * 100).toFixed(0)}%)
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
