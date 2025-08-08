import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Shield,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SupportResistance {
  level: number;
  type: "support" | "resistance";
  strength: number;
  distance: number;
}

interface TechnicalIndicator {
  name: string;
  value: number;
  signal: "bullish" | "bearish" | "neutral";
  description: string;
}

interface CPRLevels {
  pivot: number;
  bc: number;
  tc: number;
  r1: number;
  r2: number;
  s1: number;
  s2: number;
}

interface TechnicalAnalysisProps {
  symbol?: string;
  currentPrice?: number;
}

const calculateSupportResistance = (
  currentPrice: number,
): SupportResistance[] => {
  const levels: SupportResistance[] = [];

  // Generate support and resistance levels based on round numbers and technical analysis
  const basePrice = Math.floor(currentPrice / 100) * 100;

  for (let i = -5; i <= 5; i++) {
    const level = basePrice + i * 50;
    if (level <= 0) continue;

    const distance = Math.abs(level - currentPrice);
    const strength = Math.random() * 100; // In real app, calculate based on historical touches

    if (level > currentPrice) {
      levels.push({
        level,
        type: "resistance",
        strength,
        distance,
      });
    } else if (level < currentPrice) {
      levels.push({
        level,
        type: "support",
        strength,
        distance,
      });
    }
  }

  return levels.sort((a, b) => a.distance - b.distance).slice(0, 6);
};

const calculateCPR = (high: number, low: number, close: number): CPRLevels => {
  const pivot = (high + low + close) / 3;
  const bc = (high + low) / 2;
  const tc = pivot - bc + pivot;

  const r1 = 2 * pivot - low;
  const r2 = pivot + (high - low);
  const s1 = 2 * pivot - high;
  const s2 = pivot - (high - low);

  return { pivot, bc, tc, r1, r2, s1, s2 };
};

const calculateTechnicalIndicators = (
  currentPrice: number,
): TechnicalIndicator[] => {
  return [
    {
      name: "RSI (14)",
      value: 45 + Math.random() * 20, // 45-65 range
      signal: Math.random() > 0.5 ? "bullish" : "bearish",
      description: "Relative Strength Index indicates momentum",
    },
    {
      name: "MACD",
      value: Math.random() * 40 - 20, // -20 to +20
      signal: Math.random() > 0.5 ? "bullish" : "bearish",
      description: "Moving Average Convergence Divergence",
    },
    {
      name: "EMA 20",
      value: currentPrice + (Math.random() * 100 - 50),
      signal: Math.random() > 0.5 ? "bullish" : "bearish",
      description: "20-period Exponential Moving Average",
    },
    {
      name: "Bollinger %B",
      value: Math.random(),
      signal: Math.random() > 0.5 ? "bullish" : "bearish",
      description: "Position within Bollinger Bands",
    },
    {
      name: "Stochastic %K",
      value: Math.random() * 100,
      signal: Math.random() > 0.5 ? "bullish" : "bearish",
      description: "Stochastic oscillator momentum",
    },
    {
      name: "ADX",
      value: 20 + Math.random() * 60,
      signal: "neutral",
      description: "Average Directional Index - trend strength",
    },
  ];
};

const calculateOIAnalysis = () => {
  return {
    totalCallOI: 2500000 + Math.random() * 1000000,
    totalPutOI: 2200000 + Math.random() * 1000000,
    pcr: 0.75 + Math.random() * 0.5,
    maxPainStrike: 19800 + (Math.random() * 200 - 100),
    callUnwinding: Math.random() > 0.5,
    putUnwinding: Math.random() > 0.5,
  };
};

export function TechnicalAnalysis({
  symbol = "NIFTY",
  currentPrice = 19850,
}: TechnicalAnalysisProps) {
  const [supportResistance, setSupportResistance] = useState<
    SupportResistance[]
  >([]);
  const [cprLevels, setCprLevels] = useState<CPRLevels | null>(null);
  const [indicators, setIndicators] = useState<TechnicalIndicator[]>([]);
  const [oiAnalysis, setOiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalysisData();
  }, [currentPrice]);

  const loadAnalysisData = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Calculate previous day's high, low, close for CPR
      const prevHigh = currentPrice + Math.random() * 50;
      const prevLow = currentPrice - Math.random() * 50;
      const prevClose = currentPrice + (Math.random() * 20 - 10);

      setSupportResistance(calculateSupportResistance(currentPrice));
      setCprLevels(calculateCPR(prevHigh, prevLow, prevClose));
      setIndicators(calculateTechnicalIndicators(currentPrice));
      setOiAnalysis(calculateOIAnalysis());
    } catch (error) {
      console.error("Error loading analysis data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const nearestSupport = supportResistance.find((sr) => sr.type === "support");
  const nearestResistance = supportResistance.find(
    (sr) => sr.type === "resistance",
  );

  return (
    <div className="space-y-6">
      {/* Support & Resistance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Support & Resistance Levels
          </CardTitle>
          <CardDescription>
            Key price levels based on technical analysis and historical data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-3 text-trading-bull">
                Support Levels
              </h4>
              <div className="space-y-2">
                {supportResistance
                  .filter((sr) => sr.type === "support")
                  .slice(0, 3)
                  .map((level, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-trading-bull-light rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-trading-bull" />
                        <span className="font-mono">₹{level.level}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={level.strength} className="w-16 h-2" />
                        <span className="text-xs text-muted-foreground">
                          {level.distance.toFixed(0)} pts
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-trading-bear">
                Resistance Levels
              </h4>
              <div className="space-y-2">
                {supportResistance
                  .filter((sr) => sr.type === "resistance")
                  .slice(0, 3)
                  .map((level, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-trading-bear-light rounded"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-trading-bear" />
                        <span className="font-mono">₹{level.level}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={level.strength} className="w-16 h-2" />
                        <span className="text-xs text-muted-foreground">
                          {level.distance.toFixed(0)} pts
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CPR Analysis */}
      {cprLevels && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Central Pivot Range (CPR)
            </CardTitle>
            <CardDescription>
              Pivot points and CPR analysis for intraday trading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">R2</div>
                <div className="font-mono text-sm text-trading-bear">
                  ₹{cprLevels.r2.toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">R1</div>
                <div className="font-mono text-sm text-trading-bear">
                  ₹{cprLevels.r1.toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">TC</div>
                <div className="font-mono text-sm font-bold">
                  ₹{cprLevels.tc.toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">PIVOT</div>
                <div className="font-mono text-sm font-bold text-primary">
                  ₹{cprLevels.pivot.toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">BC</div>
                <div className="font-mono text-sm font-bold">
                  ₹{cprLevels.bc.toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">S1</div>
                <div className="font-mono text-sm text-trading-bull">
                  ₹{cprLevels.s1.toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">S2</div>
                <div className="font-mono text-sm text-trading-bull">
                  ₹{cprLevels.s2.toFixed(0)}
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">
                CPR Width: ₹{Math.abs(cprLevels.tc - cprLevels.bc).toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.abs(cprLevels.tc - cprLevels.bc) < 50
                  ? "Narrow CPR - Trending day expected"
                  : "Wide CPR - Sideways movement likely"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Technical Indicators
          </CardTitle>
          <CardDescription>
            Key technical indicators and their current signals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {indicators.map((indicator, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{indicator.name}</span>
                  <Badge
                    variant={
                      indicator.signal === "bullish"
                        ? "default"
                        : indicator.signal === "bearish"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {indicator.signal === "bullish" && (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    )}
                    {indicator.signal === "bearish" && (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    {indicator.signal === "neutral" && (
                      <Minus className="h-3 w-3 mr-1" />
                    )}
                    {indicator.signal.toUpperCase()}
                  </Badge>
                </div>
                <div className="font-mono text-lg mb-1">
                  {indicator.name === "Bollinger %B"
                    ? indicator.value.toFixed(2)
                    : indicator.value.toFixed(0)}
                  {indicator.name === "RSI (14)" && "%"}
                  {indicator.name === "Stochastic %K" && "%"}
                  {indicator.name === "EMA 20" && "₹"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {indicator.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* OI Analysis */}
      {oiAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Open Interest Analysis
            </CardTitle>
            <CardDescription>
              Options open interest and Put-Call ratio analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Total Call OI
                </div>
                <div className="text-lg font-bold text-trading-bull">
                  {(oiAnalysis.totalCallOI / 1000000).toFixed(2)}M
                </div>
                {oiAnalysis.callUnwinding && (
                  <Badge variant="outline" className="text-xs mt-1">
                    Unwinding
                  </Badge>
                )}
              </div>

              <div className="text-center p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Total Put OI
                </div>
                <div className="text-lg font-bold text-trading-bear">
                  {(oiAnalysis.totalPutOI / 1000000).toFixed(2)}M
                </div>
                {oiAnalysis.putUnwinding && (
                  <Badge variant="outline" className="text-xs mt-1">
                    Unwinding
                  </Badge>
                )}
              </div>

              <div className="text-center p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">PCR</div>
                <div
                  className={cn(
                    "text-lg font-bold",
                    oiAnalysis.pcr > 1.2
                      ? "text-trading-bull"
                      : oiAnalysis.pcr < 0.8
                        ? "text-trading-bear"
                        : "text-trading-neutral",
                  )}
                >
                  {oiAnalysis.pcr.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {oiAnalysis.pcr > 1.2
                    ? "Bullish"
                    : oiAnalysis.pcr < 0.8
                      ? "Bearish"
                      : "Neutral"}
                </div>
              </div>

              <div className="text-center p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Max Pain</div>
                <div className="text-lg font-bold text-primary">
                  ₹{oiAnalysis.maxPainStrike.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.abs(currentPrice - oiAnalysis.maxPainStrike).toFixed(0)}{" "}
                  pts away
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
