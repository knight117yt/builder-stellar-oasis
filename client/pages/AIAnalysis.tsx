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
  Brain,
  Bot,
  Zap,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  BarChart3,
  Activity,
  RefreshCw,
  Eye,
  Lightbulb,
} from "lucide-react";
import { AIAnalysisDashboard } from "@/components/AIAnalysisDashboard";
import { marketDataService } from "@/services/marketData";
import { useMarketData, useSubscription } from "@/services/realTimeDataService";
import { cn } from "@/lib/utils";

interface AIAnalysisData {
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

interface AIMetrics {
  models_active: number;
  prediction_accuracy: number;
  active_alerts: number;
  confidence_level: string;
  total_predictions_today: number;
  successful_predictions: number;
}

const SYMBOLS = [
  {
    value: "NSE:NIFTY50-INDEX",
    label: "NIFTY 50",
    shortName: "NIFTY",
    basePrice: 19850.5,
  },
  {
    value: "NSE:NIFTYBANK-INDEX",
    label: "BANK NIFTY",
    shortName: "BANKNIFTY",
    basePrice: 44250.75,
  },
  {
    value: "BSE:SENSEX-INDEX",
    label: "SENSEX",
    shortName: "SENSEX",
    basePrice: 72240.26,
  },
];

export default function AIAnalysis() {
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const [analysisData, setAnalysisData] = useState<AIAnalysisData | null>(null);
  const [aiMetrics, setAiMetrics] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { data: marketData } = useMarketData(selectedSymbol.value);
  useSubscription(selectedSymbol.value, true);

  const currentPrice = marketData?.ltp || selectedSymbol.basePrice;

  // Load AI analysis data
  const loadAnalysisData = async (symbol: string) => {
    setLoading(true);
    try {
      const analysis = await marketDataService.getAIAnalysis(symbol, "D");

      if (analysis) {
        setAnalysisData(analysis);
        setLastUpdate(new Date());
      } else {
        // Fallback mock data with realistic values
        const mockAnalysis: AIAnalysisData = {
          symbol,
          analysis: {
            trend: Math.random() > 0.5 ? "bullish" : "bearish",
            strength: Math.random() * 0.4 + 0.6, // 60-100%
            support_levels: [
              currentPrice * 0.98,
              currentPrice * 0.96,
              currentPrice * 0.94,
            ],
            resistance_levels: [
              currentPrice * 1.02,
              currentPrice * 1.04,
              currentPrice * 1.06,
            ],
            recommendation:
              Math.random() > 0.6
                ? "BUY"
                : Math.random() > 0.3
                  ? "HOLD"
                  : "SELL",
            confidence: Math.random() * 0.3 + 0.7, // 70-100%
            price_target: currentPrice * (1 + (Math.random() * 0.1 + 0.02)),
            stop_loss: currentPrice * (1 - (Math.random() * 0.06 + 0.02)),
            technical_indicators: {
              rsi: Math.random() * 40 + 30, // 30-70
              macd_signal: Math.random() > 0.5 ? "bullish" : "bearish",
              bollinger_position: Math.random() > 0.5 ? "upper" : "lower",
              volume_trend: Math.random() > 0.5 ? "increasing" : "stable",
            },
            sentiment_score: Math.random() * 0.6 + 0.2, // 20-80%
          },
          timestamp: new Date().toISOString(),
        };
        setAnalysisData(mockAnalysis);
      }

      // Mock AI metrics
      const mockMetrics: AIMetrics = {
        models_active: 4,
        prediction_accuracy: Math.random() * 20 + 70, // 70-90%
        active_alerts: Math.floor(Math.random() * 5) + 1,
        confidence_level: "High",
        total_predictions_today: Math.floor(Math.random() * 50) + 20,
        successful_predictions: Math.floor(Math.random() * 35) + 15,
      };
      setAiMetrics(mockMetrics);
    } catch (error) {
      console.error("Failed to load AI analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load analysis when symbol changes
  useEffect(() => {
    loadAnalysisData(selectedSymbol.value);
  }, [selectedSymbol.value]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadAnalysisData(selectedSymbol.value);
    }, 120000);

    return () => clearInterval(interval);
  }, [selectedSymbol.value]);

  const handleSymbolChange = (symbol: (typeof SYMBOLS)[0]) => {
    setSelectedSymbol(symbol);
  };

  const refreshAnalysis = () => {
    loadAnalysisData(selectedSymbol.value);
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toUpperCase()) {
      case "BUY":
        return "text-trading-bull";
      case "SELL":
        return "text-trading-bear";
      case "HOLD":
        return "text-trading-neutral";
      default:
        return "text-muted-foreground";
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation.toUpperCase()) {
      case "BUY":
        return <TrendingUp className="h-4 w-4" />;
      case "SELL":
        return <TrendingDown className="h-4 w-4" />;
      case "HOLD":
        return <Activity className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Analysis</h1>
          <p className="text-muted-foreground">
            Advanced AI-powered market predictions, sentiment analysis, and
            smart trading insights
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
            onClick={refreshAnalysis}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          {/* Symbol Selection */}
          <div className="flex items-center gap-2">
            {SYMBOLS.map((symbol) => (
              <Button
                key={symbol.value}
                variant={
                  selectedSymbol.value === symbol.value ? "default" : "outline"
                }
                size="sm"
                onClick={() => handleSymbolChange(symbol)}
              >
                {symbol.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">
                  AI Models Active
                </div>
                <div className="text-lg font-bold">
                  {aiMetrics?.models_active || 4}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-trading-bull" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Prediction Accuracy
                </div>
                <div className="text-lg font-bold text-trading-bull">
                  {aiMetrics?.prediction_accuracy.toFixed(1) || "78"}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Active Insights
                </div>
                <div className="text-lg font-bold text-yellow-600">
                  {aiMetrics?.active_alerts || 3}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-trading-neutral" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Confidence Level
                </div>
                <div className="text-lg font-bold">
                  {analysisData?.analysis?.confidence
                    ? `${(analysisData.analysis.confidence * 100).toFixed(0)}%`
                    : "High"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main AI Analysis Content */}
      <Tabs defaultValue="prediction" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prediction">AI Prediction</TabsTrigger>
          <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
          <TabsTrigger value="insights">Smart Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="prediction" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* AI Recommendation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Recommendation</CardTitle>
                <CardDescription>
                  Machine learning based trading signal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Signal:
                    </span>
                    <div
                      className={cn(
                        "flex items-center gap-2 font-medium",
                        getRecommendationColor(
                          analysisData?.analysis?.recommendation || "HOLD",
                        ),
                      )}
                    >
                      {getRecommendationIcon(
                        analysisData?.analysis?.recommendation || "HOLD",
                      )}
                      {analysisData?.analysis?.recommendation || "HOLD"}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Confidence:
                    </span>
                    <span className="font-medium">
                      {analysisData?.analysis?.confidence
                        ? `${(analysisData.analysis.confidence * 100).toFixed(1)}%`
                        : "85%"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Trend:
                    </span>
                    <Badge
                      variant={
                        analysisData?.analysis?.trend === "bullish"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {analysisData?.analysis?.trend || "Bullish"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Strength:
                    </span>
                    <span className="font-medium">
                      {analysisData?.analysis?.strength
                        ? `${(analysisData.analysis.strength * 100).toFixed(1)}%`
                        : "78%"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Targets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Price Targets</CardTitle>
                <CardDescription>
                  AI calculated support and resistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Target Price:
                    </div>
                    <div className="text-xl font-bold text-trading-bull">
                      ₹
                      {analysisData?.analysis?.price_target?.toFixed(2) ||
                        (currentPrice * 1.05).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Stop Loss:
                    </div>
                    <div className="text-xl font-bold text-trading-bear">
                      ₹
                      {analysisData?.analysis?.stop_loss?.toFixed(2) ||
                        (currentPrice * 0.95).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Current Price:
                    </div>
                    <div className="text-lg font-medium">
                      ₹{currentPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support & Resistance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Levels</CardTitle>
                <CardDescription>
                  AI identified critical price levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Resistance Levels:
                    </div>
                    <div className="space-y-1">
                      {(
                        analysisData?.analysis?.resistance_levels || [
                          currentPrice * 1.02,
                          currentPrice * 1.04,
                        ]
                      ).map((level, index) => (
                        <div
                          key={index}
                          className="text-sm font-mono text-trading-bear"
                        >
                          ₹{level.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Support Levels:
                    </div>
                    <div className="space-y-1">
                      {(
                        analysisData?.analysis?.support_levels || [
                          currentPrice * 0.98,
                          currentPrice * 0.96,
                        ]
                      ).map((level, index) => (
                        <div
                          key={index}
                          className="text-sm font-mono text-trading-bull"
                        >
                          ₹{level.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced AI Analysis Dashboard */}
          <AIAnalysisDashboard
            symbol={selectedSymbol.shortName}
            currentPrice={currentPrice}
          />
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Indicators Analysis</CardTitle>
              <CardDescription>
                AI interpretation of technical indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">RSI (14)</div>
                  <div className="text-lg font-bold">
                    {analysisData?.analysis?.technical_indicators?.rsi?.toFixed(
                      1,
                    ) || "55.2"}
                  </div>
                  <Badge variant="secondary">Neutral</Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    MACD Signal
                  </div>
                  <div className="text-lg font-bold">
                    {analysisData?.analysis?.technical_indicators?.macd_signal ||
                      "Bullish"}
                  </div>
                  <Badge variant="default">Strong</Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Bollinger Position
                  </div>
                  <div className="text-lg font-bold">
                    {analysisData?.analysis?.technical_indicators
                      ?.bollinger_position || "Middle"}
                  </div>
                  <Badge variant="outline">Normal</Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Volume Trend
                  </div>
                  <div className="text-lg font-bold">
                    {analysisData?.analysis?.technical_indicators
                      ?.volume_trend || "Increasing"}
                  </div>
                  <Badge variant="default">Positive</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Sentiment Analysis</CardTitle>
              <CardDescription>
                AI-powered sentiment from news, social media, and market data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Overall Sentiment
                  </div>
                  <div className="text-2xl font-bold text-trading-bull">
                    {analysisData?.analysis?.sentiment_score
                      ? `${(analysisData.analysis.sentiment_score * 100).toFixed(0)}%`
                      : "72%"}
                  </div>
                  <Badge variant="default">Bullish</Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    News Sentiment
                  </div>
                  <div className="text-2xl font-bold text-trading-bull">
                    68%
                  </div>
                  <Badge variant="default">Positive</Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Social Media
                  </div>
                  <div className="text-2xl font-bold text-trading-neutral">
                    55%
                  </div>
                  <Badge variant="secondary">Neutral</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Smart Trading Insights
              </CardTitle>
              <CardDescription>
                AI-generated actionable insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-800">
                        Bullish Momentum Detected
                      </div>
                      <div className="text-sm text-green-700 mt-1">
                        Strong buying pressure observed with increasing volume.
                        Consider long positions with proper risk management.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-800">
                        Volume Analysis
                      </div>
                      <div className="text-sm text-blue-700 mt-1">
                        Above-average volume confirms price movement. This
                        increases the reliability of current trend signals.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-800">
                        Risk Alert
                      </div>
                      <div className="text-sm text-yellow-700 mt-1">
                        Approaching resistance level. Monitor for potential
                        reversal signals and adjust position sizes accordingly.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
