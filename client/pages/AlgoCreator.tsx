import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bot,
  Plus,
  Play,
  Pause,
  Trash2,
  Settings,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Brain,
  Target,
  Shield,
  AlertTriangle,
  Copy,
  Edit,
} from "lucide-react";
import { marketDataService } from "@/services/marketData";

interface StrategyParameter {
  name: string;
  value: any;
  description?: string;
}

interface AlgoStrategy {
  id: string;
  name: string;
  symbol: string;
  strategy_type: string;
  parameters: StrategyParameter[];
  status: string;
  created_at: string;
  updated_at?: string;
  performance?: {
    total_trades: number;
    profitable_trades: number;
    total_pnl: number;
    win_rate: number;
    max_drawdown: number;
  };
}

interface StrategyForm {
  name: string;
  symbol: string;
  strategy_type: string;
  parameters: StrategyParameter[];
  risk_management: {
    max_position_size: number;
    stop_loss_percent: number;
    take_profit_percent: number;
    trailing_stop: boolean;
    daily_loss_limit: number;
  };
  position_sizing: {
    method: string;
    base_amount: number;
    risk_per_trade: number;
  };
}

const STRATEGY_TYPES = [
  {
    value: "technical",
    label: "Technical Indicators",
    description:
      "Strategies based on technical analysis indicators like RSI, MACD, Moving Averages",
  },
  {
    value: "ai_based",
    label: "AI Based",
    description:
      "Machine learning powered strategies using AI pattern recognition",
  },
  {
    value: "option_strategy",
    label: "Option Strategies",
    description: "Complex option spreads with IV and volatility-based triggers",
  },
  {
    value: "momentum",
    label: "Momentum",
    description: "Strategies that follow price momentum and trend continuation",
  },
  {
    value: "mean_reversion",
    label: "Mean Reversion",
    description:
      "Strategies that profit from price returning to average levels",
  },
  {
    value: "custom",
    label: "Custom Strategy",
    description:
      "Write your own Python strategy code with full control over logic and execution",
  },
];

const TECHNICAL_INDICATORS = [
  "RSI",
  "MACD",
  "SMA",
  "EMA",
  "Bollinger Bands",
  "Stochastic",
  "Williams %R",
  "CCI",
  "ADX",
  "Ichimoku Cloud",
];

const POSITION_SIZING_METHODS = [
  { value: "fixed", label: "Fixed Amount" },
  { value: "percent_equity", label: "Percentage of Equity" },
  { value: "kelly", label: "Kelly Criterion" },
  { value: "risk_parity", label: "Risk Parity" },
];

export default function AlgoCreator() {
  const [activeTab, setActiveTab] = useState("strategies");
  const [strategies, setStrategies] = useState<AlgoStrategy[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [customCode, setCustomCode] = useState("");

  const [strategyForm, setStrategyForm] = useState<StrategyForm>({
    name: "",
    symbol: "",
    strategy_type: "",
    parameters: [],
    risk_management: {
      max_position_size: 100000,
      stop_loss_percent: 2,
      take_profit_percent: 5,
      trailing_stop: false,
      daily_loss_limit: 10000,
    },
    position_sizing: {
      method: "fixed",
      base_amount: 10000,
      risk_per_trade: 1,
    },
  });

  // Load account information
  const loadAccountInfo = async () => {
    try {
      const accountData = await marketDataService.getAccountInfo();
      setAccountInfo(accountData);
    } catch (error) {
      console.error("Failed to load account info:", error);
      // Fallback to mock account info
      setAccountInfo({
        balance: 100000,
        available_margin: 80000,
        used_margin: 20000,
        total_balance: 100000,
      });
    }
  };

  // Load strategies and account info on component mount
  useEffect(() => {
    loadStrategies();
    loadAccountInfo();
  }, []);

  const loadStrategies = async () => {
    try {
      const response = await marketDataService.getStrategies();
      setStrategies(response?.strategies || []);
    } catch (error) {
      console.error("Failed to load strategies:", error);
      setStrategies([]);
    }
  };

  const createStrategy = async () => {
    setLoading(true);
    try {
      // If it's a custom strategy, create it via the custom strategy endpoint
      if (strategyForm.strategy_type === "custom" && customCode) {
        const result = await marketDataService.createCustomStrategy({
          name: strategyForm.name,
          description: `Custom strategy for ${strategyForm.symbol}`,
          code: customCode,
        });

        if (result) {
          console.log("Custom strategy created:", result);
        }
      }

      // Create the strategy record
      const response = await marketDataService.createStrategy({
        name: strategyForm.name,
        symbol: strategyForm.symbol,
        strategy_type: strategyForm.strategy_type,
        parameters: strategyForm.parameters,
        custom_code:
          strategyForm.strategy_type === "custom" ? customCode : undefined,
        risk_management: strategyForm.risk_management,
        position_sizing: strategyForm.position_sizing,
      });

      if (response) {
        await loadStrategies();
        setShowCreateDialog(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create strategy:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStrategy = async (strategyId: string) => {
    try {
      const response = await marketDataService.toggleStrategy(strategyId);
      if (response) {
        await loadStrategies();
      }
    } catch (error) {
      console.error("Failed to toggle strategy:", error);
    }
  };

  const resetForm = () => {
    setStrategyForm({
      name: "",
      symbol: "",
      strategy_type: "",
      parameters: [],
      risk_management: {
        max_position_size: accountInfo ? accountInfo.balance * 0.05 : 100000, // Default to 5% of account
        stop_loss_percent: 2,
        take_profit_percent: 5,
        trailing_stop: false,
        daily_loss_limit: accountInfo ? accountInfo.balance * 0.02 : 10000, // Default to 2% of account
      },
      position_sizing: {
        method: "fixed",
        base_amount: 10000,
        risk_per_trade: 1,
      },
    });
    setCustomCode("");
  };

  const addParameter = () => {
    setStrategyForm((prev) => ({
      ...prev,
      parameters: [
        ...prev.parameters,
        { name: "", value: "", description: "" },
      ],
    }));
  };

  const updateParameter = (
    index: number,
    field: keyof StrategyParameter,
    value: any,
  ) => {
    setStrategyForm((prev) => ({
      ...prev,
      parameters: prev.parameters.map((param, i) =>
        i === index ? { ...param, [field]: value } : param,
      ),
    }));
  };

  const removeParameter = (index: number) => {
    setStrategyForm((prev) => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index),
    }));
  };

  const generateParametersForStrategy = (strategyType: string) => {
    const baseParameters: StrategyParameter[] = [];

    switch (strategyType) {
      case "technical":
        baseParameters.push(
          {
            name: "indicator",
            value: "RSI",
            description: "Primary technical indicator",
          },
          { name: "period", value: 14, description: "Indicator period" },
          {
            name: "oversold_level",
            value: 30,
            description: "Oversold threshold",
          },
          {
            name: "overbought_level",
            value: 70,
            description: "Overbought threshold",
          },
        );
        break;
      case "ai_based":
        baseParameters.push(
          { name: "model_type", value: "lstm", description: "AI model type" },
          {
            name: "lookback_period",
            value: 50,
            description: "Historical data lookback",
          },
          {
            name: "confidence_threshold",
            value: 0.8,
            description: "Minimum prediction confidence",
          },
          {
            name: "prediction_horizon",
            value: 1,
            description: "Prediction horizon in days",
          },
        );
        break;
      case "option_strategy":
        baseParameters.push(
          {
            name: "strategy_name",
            value: "iron_condor",
            description: "Option strategy type",
          },
          {
            name: "iv_threshold",
            value: 25,
            description: "Implied volatility threshold",
          },
          { name: "dte_min", value: 15, description: "Minimum days to expiry" },
          { name: "dte_max", value: 45, description: "Maximum days to expiry" },
          {
            name: "profit_target",
            value: 50,
            description: "Profit target percentage",
          },
        );
        break;
      case "momentum":
        baseParameters.push(
          {
            name: "momentum_period",
            value: 20,
            description: "Momentum calculation period",
          },
          {
            name: "momentum_threshold",
            value: 5,
            description: "Momentum threshold percentage",
          },
          {
            name: "confirmation_period",
            value: 3,
            description: "Confirmation candles",
          },
          {
            name: "volume_filter",
            value: true,
            description: "Use volume confirmation",
          },
        );
        break;
      case "mean_reversion":
        baseParameters.push(
          {
            name: "deviation_threshold",
            value: 2,
            description: "Standard deviations from mean",
          },
          {
            name: "lookback_period",
            value: 20,
            description: "Mean calculation period",
          },
          {
            name: "reversion_target",
            value: 1,
            description: "Reversion target (std devs)",
          },
          {
            name: "max_hold_period",
            value: 5,
            description: "Maximum holding period",
          },
        );
        break;
    }

    setStrategyForm((prev) => ({
      ...prev,
      parameters: baseParameters,
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStrategyTypeIcon = (type: string) => {
    switch (type) {
      case "technical":
        return <BarChart3 className="h-4 w-4" />;
      case "ai_based":
        return <Brain className="h-4 w-4" />;
      case "option_strategy":
        return <Target className="h-4 w-4" />;
      case "momentum":
        return <TrendingUp className="h-4 w-4" />;
      case "mean_reversion":
        return <Activity className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Algo Creator</h1>
          <p className="text-muted-foreground">
            Create and manage automated trading strategies
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Strategy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Trading Strategy</DialogTitle>
              <DialogDescription>
                Configure your automated trading strategy with custom parameters
                and risk management rules.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="strategy-name">Strategy Name</Label>
                  <Input
                    id="strategy-name"
                    placeholder="My Trading Strategy"
                    value={strategyForm.name}
                    onChange={(e) =>
                      setStrategyForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strategy-symbol">Trading Symbol</Label>
                  <Input
                    id="strategy-symbol"
                    placeholder="NSE:NIFTY50-INDEX"
                    value={strategyForm.symbol}
                    onChange={(e) =>
                      setStrategyForm((prev) => ({
                        ...prev,
                        symbol: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Strategy Type */}
              <div className="space-y-2">
                <Label>Strategy Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STRATEGY_TYPES.map((type) => (
                    <Card
                      key={type.value}
                      className={`cursor-pointer transition-colors ${
                        strategyForm.strategy_type === type.value
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/50"
                      }`}
                      onClick={() => {
                        setStrategyForm((prev) => ({
                          ...prev,
                          strategy_type: type.value,
                        }));
                        generateParametersForStrategy(type.value);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {getStrategyTypeIcon(type.value)}
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Strategy Parameters */}
              {strategyForm.strategy_type && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Strategy Parameters</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addParameter}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Parameter
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {strategyForm.parameters.map((param, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 items-end"
                      >
                        <div className="col-span-3">
                          <Input
                            placeholder="Parameter name"
                            value={param.name}
                            onChange={(e) =>
                              updateParameter(index, "name", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="Value"
                            value={param.value}
                            onChange={(e) =>
                              updateParameter(index, "value", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-5">
                          <Input
                            placeholder="Description (optional)"
                            value={param.description || ""}
                            onChange={(e) =>
                              updateParameter(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParameter(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Strategy Code */}
              {strategyForm.strategy_type === "custom" && (
                <div className="space-y-4">
                  <div>
                    <Label>Custom Strategy Code</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Write your Python strategy code. The function must be
                      named 'execute' and take market_data as parameter.
                    </p>
                  </div>

                  <Textarea
                    placeholder={`def execute(market_data):
    # Your strategy logic here
    # Return a dictionary with signal, quantity, price, etc.

    symbol = list(market_data.keys())[0]
    current_price = market_data[symbol]['ltp']

    # Example: Simple moving average crossover
    if current_price > 20000:  # Simple condition
        return {
            'signal': 'BUY',
            'symbol': symbol,
            'quantity': 1,
            'price': current_price,
            'order_type': 'MARKET'
        }

    return {'signal': 'HOLD'}`}
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="min-h-64 font-mono text-sm"
                  />

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-1">
                      Available Variables:
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • <code>market_data</code> - Dictionary containing
                        real-time market data
                      </li>
                      <li>
                        • Return <code>{"signal': 'BUY'|'SELL'|'HOLD"}</code>{" "}
                        with optional quantity, price
                      </li>
                      <li>
                        • Access current price:{" "}
                        <code>market_data[symbol]['ltp']</code>
                      </li>
                      <li>
                        • Access volume: <code>market_data[symbol]['v']</code>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Risk Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Risk Management
                  </CardTitle>
                  {accountInfo && (
                    <CardDescription>
                      Account Balance: ₹{accountInfo.balance.toLocaleString()} |
                      Available: ₹
                      {accountInfo.available_margin.toLocaleString()}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Account-based Risk Suggestions */}
                  {accountInfo && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-800 mb-2">
                        Suggested Risk Limits
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-blue-600">Conservative (2%)</div>
                          <div className="font-mono">
                            ₹{(accountInfo.balance * 0.02).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-blue-600">Moderate (5%)</div>
                          <div className="font-mono">
                            ₹{(accountInfo.balance * 0.05).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-blue-600">Aggressive (10%)</div>
                          <div className="font-mono">
                            ₹{(accountInfo.balance * 0.1).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Position Size (₹)</Label>
                      <Input
                        type="number"
                        value={strategyForm.risk_management.max_position_size}
                        onChange={(e) =>
                          setStrategyForm((prev) => ({
                            ...prev,
                            risk_management: {
                              ...prev.risk_management,
                              max_position_size: parseFloat(e.target.value),
                            },
                          }))
                        }
                        max={accountInfo?.available_margin}
                      />
                      {accountInfo &&
                        strategyForm.risk_management.max_position_size >
                          accountInfo.available_margin && (
                          <p className="text-sm text-red-600">
                            Exceeds available margin
                          </p>
                        )}
                    </div>
                    <div className="space-y-2">
                      <Label>Daily Loss Limit (₹)</Label>
                      <Input
                        type="number"
                        value={strategyForm.risk_management.daily_loss_limit}
                        onChange={(e) =>
                          setStrategyForm((prev) => ({
                            ...prev,
                            risk_management: {
                              ...prev.risk_management,
                              daily_loss_limit: parseFloat(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stop Loss (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={strategyForm.risk_management.stop_loss_percent}
                        onChange={(e) =>
                          setStrategyForm((prev) => ({
                            ...prev,
                            risk_management: {
                              ...prev.risk_management,
                              stop_loss_percent: parseFloat(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Take Profit (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={strategyForm.risk_management.take_profit_percent}
                        onChange={(e) =>
                          setStrategyForm((prev) => ({
                            ...prev,
                            risk_management: {
                              ...prev.risk_management,
                              take_profit_percent: parseFloat(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="trailing-stop"
                      checked={strategyForm.risk_management.trailing_stop}
                      onCheckedChange={(checked) =>
                        setStrategyForm((prev) => ({
                          ...prev,
                          risk_management: {
                            ...prev.risk_management,
                            trailing_stop: checked,
                          },
                        }))
                      }
                    />
                    <Label htmlFor="trailing-stop">
                      Enable Trailing Stop Loss
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Position Sizing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Position Sizing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Sizing Method</Label>
                      <Select
                        value={strategyForm.position_sizing.method}
                        onValueChange={(value) =>
                          setStrategyForm((prev) => ({
                            ...prev,
                            position_sizing: {
                              ...prev.position_sizing,
                              method: value,
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITION_SIZING_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Base Amount (₹)</Label>
                      <Input
                        type="number"
                        value={strategyForm.position_sizing.base_amount}
                        onChange={(e) =>
                          setStrategyForm((prev) => ({
                            ...prev,
                            position_sizing: {
                              ...prev.position_sizing,
                              base_amount: parseFloat(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Risk Per Trade (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={strategyForm.position_sizing.risk_per_trade}
                        onChange={(e) =>
                          setStrategyForm((prev) => ({
                            ...prev,
                            position_sizing: {
                              ...prev.position_sizing,
                              risk_per_trade: parseFloat(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={createStrategy}
                disabled={
                  loading ||
                  !strategyForm.name ||
                  !strategyForm.symbol ||
                  !strategyForm.strategy_type
                }
              >
                {loading ? "Creating..." : "Create Strategy"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="strategies">Active Strategies</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="backtesting">Backtesting</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Trading Strategies ({strategies?.length || 0})</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {strategies?.filter((s) => s.status === "active").length || 0}{" "}
                    Active
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {strategies?.filter((s) => s.status === "inactive").length || 0}{" "}
                    Inactive
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategies.map((strategy) => (
                      <TableRow key={strategy.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{strategy.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {strategy.parameters.length} parameters
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStrategyTypeIcon(strategy.strategy_type)}
                            <span className="capitalize">
                              {strategy.strategy_type.replace("_", " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {strategy.symbol}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusBadgeVariant(strategy.status)}
                          >
                            {strategy.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {strategy.performance ? (
                            <div className="text-sm">
                              <div
                                className={`font-medium ${
                                  strategy.performance.total_pnl >= 0
                                    ? "text-trading-bull"
                                    : "text-trading-bear"
                                }`}
                              >
                                {formatCurrency(strategy.performance.total_pnl)}
                              </div>
                              <div className="text-muted-foreground">
                                {strategy.performance.win_rate.toFixed(1)}% Win
                                Rate
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              No data
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(strategy.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleStrategy(strategy.id)}
                            >
                              {strategy.status === "active" ? (
                                <Pause className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {(!strategies || strategies.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No strategies created yet</p>
                  <p className="text-sm">
                    Create your first automated trading strategy to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Strategies
                </CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{strategies?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {strategies?.filter((s) => s.status === "active").length || 0}{" "}
                  active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-trading-bull">
                  {formatCurrency(
                    strategies.reduce(
                      (sum, s) => sum + (s.performance?.total_pnl || 0),
                      0,
                    ),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  All strategies combined
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Win Rate
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {strategies && strategies.length > 0
                    ? (
                        strategies.reduce(
                          (sum, s) => sum + (s.performance?.win_rate || 0),
                          0,
                        ) / strategies.length
                      ).toFixed(1)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all strategies
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Trades
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {strategies.reduce(
                    (sum, s) => sum + (s.performance?.total_trades || 0),
                    0,
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Executed by all strategies
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Strategy Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strategies
                  .filter((s) => s.performance)
                  .map((strategy) => (
                    <div
                      key={strategy.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{strategy.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {strategy.symbol}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-semibold ${
                            (strategy.performance?.total_pnl || 0) >= 0
                              ? "text-trading-bull"
                              : "text-trading-bear"
                          }`}
                        >
                          {formatCurrency(strategy.performance?.total_pnl || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {strategy.performance?.total_trades || 0} trades •{" "}
                          {strategy.performance?.win_rate?.toFixed(1) || 0}% win
                          rate
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backtesting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Strategy Backtesting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Backtesting functionality is coming soon</p>
                <p className="text-sm">
                  Test your strategies against historical data before going live
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
