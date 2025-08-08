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
  Brain,
  Bot,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Activity,
  Eye,
  Star,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketSentiment {
  overall: number; // -100 to +100
  news: number;
  social: number;
  technical: number;
  options: number;
}

interface PredictionModel {
  name: string;
  accuracy: number;
  prediction: "bullish" | "bearish" | "neutral";
  confidence: number;
  timeframe: string;
  target?: number;
  reasoning: string[];
}

interface PatternProbability {
  pattern: string;
  probability: number;
  signal: "bullish" | "bearish" | "neutral";
  accuracy: number;
  description: string;
}

interface SmartAlert {
  id: string;
  type: "pattern" | "sentiment" | "technical" | "options";
  severity: "high" | "medium" | "low";
  message: string;
  timestamp: string;
  action?: string;
}

interface AIAnalysisDashboardProps {
  symbol?: string;
  currentPrice?: number;
}

const generateMarketSentiment = (): MarketSentiment => {
  return {
    overall: Math.random() * 40 - 20, // -20 to +20
    news: Math.random() * 60 - 30,
    social: Math.random() * 80 - 40,
    technical: Math.random() * 50 - 25,
    options: Math.random() * 70 - 35,
  };
};

const generatePredictionModels = (currentPrice: number): PredictionModel[] => {
  return [
    {
      name: "LSTM Neural Network",
      accuracy: 78 + Math.random() * 15,
      prediction: Math.random() > 0.5 ? "bullish" : "bearish",
      confidence: 65 + Math.random() * 30,
      timeframe: "1 Day",
      target: currentPrice + (Math.random() * 200 - 100),
      reasoning: [
        "Technical momentum indicators show strength",
        "Volume pattern analysis suggests continuation",
        "Historical correlation with similar patterns",
      ],
    },
    {
      name: "Random Forest Ensemble",
      accuracy: 72 + Math.random() * 18,
      prediction: Math.random() > 0.5 ? "bullish" : "bearish",
      confidence: 60 + Math.random() * 35,
      timeframe: "3 Days",
      target: currentPrice + (Math.random() * 300 - 150),
      reasoning: [
        "Multiple timeframe confluence detected",
        "Options flow indicates institutional interest",
        "Macro factors remain supportive",
      ],
    },
    {
      name: "Support Vector Machine",
      accuracy: 69 + Math.random() * 20,
      prediction: Math.random() > 0.5 ? "bullish" : "bearish",
      confidence: 55 + Math.random() * 40,
      timeframe: "1 Week",
      target: currentPrice + (Math.random() * 500 - 250),
      reasoning: [
        "Pattern recognition shows high probability setup",
        "Risk-reward ratio favors current direction",
        "Statistical edge confirmed by backtesting",
      ],
    },
    {
      name: "Sentiment Analysis Model",
      accuracy: 64 + Math.random() * 25,
      prediction: "neutral",
      confidence: 50 + Math.random() * 30,
      timeframe: "Intraday",
      reasoning: [
        "News sentiment remains mixed",
        "Social media indicators show uncertainty",
        "Market participants await key levels",
      ],
    },
  ];
};

const generatePatternProbabilities = (): PatternProbability[] => {
  const patterns = [
    "Bullish Engulfing",
    "Bearish Engulfing",
    "Hammer",
    "Shooting Star",
    "Morning Star",
    "Evening Star",
    "Doji",
    "Harami",
  ];

  return patterns.slice(0, 5).map((pattern) => ({
    pattern,
    probability: 60 + Math.random() * 35,
    signal:
      Math.random() > 0.6
        ? "bullish"
        : Math.random() > 0.3
          ? "bearish"
          : "neutral",
    accuracy: 70 + Math.random() * 25,
    description: `AI-detected ${pattern} pattern with high confidence based on historical performance`,
  }));
};

const generateSmartAlerts = (): SmartAlert[] => {
  return [
    {
      id: "1",
      type: "pattern",
      severity: "high",
      message: "Bullish Engulfing pattern detected with 85% confidence",
      timestamp: "2 minutes ago",
      action: "Consider long positions",
    },
    {
      id: "2",
      type: "sentiment",
      severity: "medium",
      message: "Social sentiment shifted to bearish (-25 score)",
      timestamp: "15 minutes ago",
      action: "Monitor for reversal signals",
    },
    {
      id: "3",
      type: "options",
      severity: "high",
      message: "Unusual options activity detected in 19900 CE",
      timestamp: "32 minutes ago",
      action: "Investigate large call buying",
    },
    {
      id: "4",
      type: "technical",
      severity: "low",
      message: "RSI approaching oversold levels",
      timestamp: "1 hour ago",
      action: "Watch for bounce opportunities",
    },
  ];
};

export function AIAnalysisDashboard({
  symbol = "NIFTY",
  currentPrice = 19850,
}: AIAnalysisDashboardProps) {
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(null);
  const [predictions, setPredictions] = useState<PredictionModel[]>([]);
  const [patterns, setPatterns] = useState<PatternProbability[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAIAnalysis();
  }, [symbol, currentPrice]);

  const loadAIAnalysis = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSentiment(generateMarketSentiment());
      setPredictions(generatePredictionModels(currentPrice));
      setPatterns(generatePatternProbabilities());
      setAlerts(generateSmartAlerts());
    } catch (error) {
      console.error("Error loading AI analysis:", error);
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

  const getSentimentColor = (score: number) => {
    if (score > 20) return "text-trading-bull";
    if (score < -20) return "text-trading-bear";
    return "text-trading-neutral";
  };

  const getSentimentIcon = (score: number) => {
    if (score > 20) return <ThumbsUp className="h-4 w-4" />;
    if (score < -20) return <ThumbsDown className="h-4 w-4" />;
    return <Zap className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Market Sentiment */}
      {sentiment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Market Sentiment Analysis
            </CardTitle>
            <CardDescription>
              Real-time sentiment analysis from news, social media, and
              technical indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getSentimentIcon(sentiment.overall)}
                  <span className="text-sm font-medium">Overall</span>
                </div>
                <div
                  className={cn(
                    "text-2xl font-bold",
                    getSentimentColor(sentiment.overall),
                  )}
                >
                  {sentiment.overall > 0 ? "+" : ""}
                  {sentiment.overall.toFixed(0)}
                </div>
                <Progress
                  value={Math.abs(sentiment.overall) * 2}
                  className="mt-2"
                />
              </div>

              <div className="text-center">
                <div className="text-sm font-medium mb-2">News</div>
                <div
                  className={cn(
                    "text-xl font-bold",
                    getSentimentColor(sentiment.news),
                  )}
                >
                  {sentiment.news > 0 ? "+" : ""}
                  {sentiment.news.toFixed(0)}
                </div>
                <Progress
                  value={Math.abs(sentiment.news) * 1.5}
                  className="mt-2"
                />
              </div>

              <div className="text-center">
                <div className="text-sm font-medium mb-2">Social</div>
                <div
                  className={cn(
                    "text-xl font-bold",
                    getSentimentColor(sentiment.social),
                  )}
                >
                  {sentiment.social > 0 ? "+" : ""}
                  {sentiment.social.toFixed(0)}
                </div>
                <Progress value={Math.abs(sentiment.social)} className="mt-2" />
              </div>

              <div className="text-center">
                <div className="text-sm font-medium mb-2">Technical</div>
                <div
                  className={cn(
                    "text-xl font-bold",
                    getSentimentColor(sentiment.technical),
                  )}
                >
                  {sentiment.technical > 0 ? "+" : ""}
                  {sentiment.technical.toFixed(0)}
                </div>
                <Progress
                  value={Math.abs(sentiment.technical) * 2}
                  className="mt-2"
                />
              </div>

              <div className="text-center">
                <div className="text-sm font-medium mb-2">Options</div>
                <div
                  className={cn(
                    "text-xl font-bold",
                    getSentimentColor(sentiment.options),
                  )}
                >
                  {sentiment.options > 0 ? "+" : ""}
                  {sentiment.options.toFixed(0)}
                </div>
                <Progress
                  value={Math.abs(sentiment.options) * 1.2}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Prediction Models */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Prediction Models
          </CardTitle>
          <CardDescription>
            Machine learning models forecasting price movements with confidence
            levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.map((model, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="font-medium">{model.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {model.accuracy.toFixed(0)}% accuracy
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {model.timeframe}
                    </span>
                    <Badge
                      variant={
                        model.prediction === "bullish"
                          ? "default"
                          : model.prediction === "bearish"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {model.prediction.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mb-3">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Confidence
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold">
                        {model.confidence.toFixed(0)}%
                      </div>
                      <Progress value={model.confidence} className="flex-1" />
                    </div>
                  </div>
                  {model.target && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Target Price
                      </div>
                      <div className="text-lg font-mono">
                        ₹{model.target.toFixed(0)}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Expected Move
                    </div>
                    <div
                      className={cn(
                        "text-lg font-bold",
                        model.target && model.target > currentPrice
                          ? "text-trading-bull"
                          : model.target && model.target < currentPrice
                            ? "text-trading-bear"
                            : "text-trading-neutral",
                      )}
                    >
                      {model.target
                        ? `${(((model.target - currentPrice) / currentPrice) * 100).toFixed(1)}%`
                        : "N/A"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">
                    Model Reasoning:
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {model.reasoning.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pattern Probability Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Pattern Probability Analysis
          </CardTitle>
          <CardDescription>
            AI-powered candlestick pattern detection with success probabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {patterns.map((pattern, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{pattern.pattern}</span>
                  <Badge
                    variant={
                      pattern.signal === "bullish"
                        ? "default"
                        : pattern.signal === "bearish"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {pattern.signal.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Probability</span>
                    <span className="font-mono">
                      {pattern.probability.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={pattern.probability} />

                  <div className="flex justify-between text-sm">
                    <span>Historical Accuracy</span>
                    <span className="font-mono">
                      {pattern.accuracy.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  {pattern.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Smart Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Smart AI Alerts
          </CardTitle>
          <CardDescription>
            Real-time alerts generated by AI analysis of market conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-lg border-l-4",
                  alert.severity === "high"
                    ? "border-l-red-500 bg-red-50 dark:bg-red-950/20"
                    : alert.severity === "medium"
                      ? "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                      : "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle
                        className={cn(
                          "h-4 w-4",
                          alert.severity === "high"
                            ? "text-red-600"
                            : alert.severity === "medium"
                              ? "text-yellow-600"
                              : "text-blue-600",
                        )}
                      />
                      <Badge variant="outline" className="text-xs">
                        {alert.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {alert.timestamp}
                      </span>
                    </div>
                    <div className="text-sm font-medium mb-1">
                      {alert.message}
                    </div>
                    {alert.action && (
                      <div className="text-xs text-muted-foreground">
                        <strong>Suggested Action:</strong> {alert.action}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
