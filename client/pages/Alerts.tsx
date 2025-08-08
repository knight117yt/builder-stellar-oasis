import React, { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Plus,
  Trash2,
  Bell,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap,
  CheckCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlerts, PriceAlert, LogicAlert } from "@/contexts/AlertContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Alerts() {
  const {
    priceAlerts,
    logicAlerts,
    addPriceAlert,
    addLogicAlert,
    toggleAlert,
    removeAlert,
    triggeredAlerts,
  } = useAlerts();

  const [priceAlertForm, setPriceAlertForm] = useState({
    symbol: "NIFTY",
    type: "above" as "above" | "below",
    targetPrice: "",
    currentPrice: 19850,
    isActive: true,
    message: "",
  });

  const [logicAlertForm, setLogicAlertForm] = useState({
    name: "",
    symbol: "NIFTY",
    condition: "rsi_oversold",
    description: "",
    isActive: true,
    params: {},
  });

  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showLogicDialog, setShowLogicDialog] = useState(false);

  const symbols = ["NIFTY", "BANKNIFTY", "SENSEX"];
  const logicConditions = [
    { value: "rsi_oversold", label: "RSI Oversold (< 30)" },
    { value: "rsi_overbought", label: "RSI Overbought (> 70)" },
    { value: "volume_spike", label: "Volume Spike (> 2x avg)" },
    { value: "macd_crossover", label: "MACD Bullish Crossover" },
    { value: "support_break", label: "Support Level Break" },
    { value: "resistance_break", label: "Resistance Level Break" },
  ];

  const handleCreatePriceAlert = () => {
    if (!priceAlertForm.targetPrice) return;

    addPriceAlert({
      symbol: priceAlertForm.symbol,
      type: priceAlertForm.type,
      targetPrice: parseFloat(priceAlertForm.targetPrice),
      currentPrice: priceAlertForm.currentPrice,
      isActive: priceAlertForm.isActive,
      message: priceAlertForm.message,
    });

    setPriceAlertForm({
      symbol: "NIFTY",
      type: "above",
      targetPrice: "",
      currentPrice: 19850,
      isActive: true,
      message: "",
    });
    setShowPriceDialog(false);
  };

  const handleCreateLogicAlert = () => {
    if (!logicAlertForm.name) return;

    addLogicAlert({
      name: logicAlertForm.name,
      symbol: logicAlertForm.symbol,
      condition: logicAlertForm.condition,
      description: logicAlertForm.description,
      isActive: logicAlertForm.isActive,
      params: logicAlertForm.params,
    });

    setLogicAlertForm({
      name: "",
      symbol: "NIFTY",
      condition: "rsi_oversold",
      description: "",
      isActive: true,
      params: {},
    });
    setShowLogicDialog(false);
  };

  const formatAlertTime = (date: Date) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">
            Manage price alerts and technical analysis triggers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Price Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Price Alert</DialogTitle>
                <DialogDescription>
                  Get notified when a symbol reaches your target price
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Select
                      value={priceAlertForm.symbol}
                      onValueChange={(value) =>
                        setPriceAlertForm((prev) => ({
                          ...prev,
                          symbol: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {symbols.map((symbol) => (
                          <SelectItem key={symbol} value={symbol}>
                            {symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Alert Type</Label>
                    <Select
                      value={priceAlertForm.type}
                      onValueChange={(value: "above" | "below") =>
                        setPriceAlertForm((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above</SelectItem>
                        <SelectItem value="below">Below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target Price</Label>
                  <Input
                    type="number"
                    placeholder="Enter target price"
                    value={priceAlertForm.targetPrice}
                    onChange={(e) =>
                      setPriceAlertForm((prev) => ({
                        ...prev,
                        targetPrice: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message (Optional)</Label>
                  <Input
                    placeholder="Custom alert message"
                    value={priceAlertForm.message}
                    onChange={(e) =>
                      setPriceAlertForm((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowPriceDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreatePriceAlert}>Create Alert</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showLogicDialog} onOpenChange={setShowLogicDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Logic Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Logic Alert</DialogTitle>
                <DialogDescription>
                  Set up technical analysis based triggers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Alert Name</Label>
                  <Input
                    placeholder="e.g., NIFTY RSI Oversold"
                    value={logicAlertForm.name}
                    onChange={(e) =>
                      setLogicAlertForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Select
                      value={logicAlertForm.symbol}
                      onValueChange={(value) =>
                        setLogicAlertForm((prev) => ({
                          ...prev,
                          symbol: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {symbols.map((symbol) => (
                          <SelectItem key={symbol} value={symbol}>
                            {symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select
                      value={logicAlertForm.condition}
                      onValueChange={(value) =>
                        setLogicAlertForm((prev) => ({
                          ...prev,
                          condition: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {logicConditions.map((condition) => (
                          <SelectItem
                            key={condition.value}
                            value={condition.value}
                          >
                            {condition.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Brief description of the alert"
                    value={logicAlertForm.description}
                    onChange={(e) =>
                      setLogicAlertForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowLogicDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateLogicAlert}>Create Alert</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Active Price Alerts
                </div>
                <div className="text-lg font-bold">
                  {
                    priceAlerts.filter((a) => a.isActive && !a.isTriggered)
                      .length
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-trading-bull" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Logic Alerts
                </div>
                <div className="text-lg font-bold text-trading-bull">
                  {
                    logicAlerts.filter((a) => a.isActive && !a.isTriggered)
                      .length
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Triggered Today
                </div>
                <div className="text-lg font-bold text-yellow-600">
                  {triggeredAlerts.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-trading-neutral" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Total Alerts
                </div>
                <div className="text-lg font-bold">
                  {priceAlerts.length + logicAlerts.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Tabs */}
      <Tabs defaultValue="price" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="price">Price Alerts</TabsTrigger>
          <TabsTrigger value="logic">Logic Alerts</TabsTrigger>
          <TabsTrigger value="triggered">Triggered</TabsTrigger>
        </TabsList>

        <TabsContent value="price" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price Alerts</CardTitle>
              <CardDescription>
                Alerts triggered when symbols reach specific price levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priceAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No price alerts created yet. Click "Price Alert" to create
                    one.
                  </div>
                ) : (
                  priceAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            alert.isTriggered
                              ? "bg-green-500"
                              : alert.isActive
                                ? "bg-blue-500"
                                : "bg-gray-400",
                          )}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{alert.symbol}</span>
                            <Badge
                              variant={
                                alert.type === "above"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {alert.type === "above" ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {alert.type} ₹{alert.targetPrice}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Current: ₹{alert.currentPrice} • Created{" "}
                            {formatAlertTime(alert.createdAt)}
                          </div>
                          {alert.message && (
                            <div className="text-sm text-muted-foreground italic">
                              "{alert.message}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={alert.isActive}
                          onCheckedChange={() => toggleAlert(alert.id, "price")}
                          disabled={alert.isTriggered}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAlert(alert.id, "price")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logic Alerts</CardTitle>
              <CardDescription>
                Technical analysis and condition-based alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logicAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No logic alerts created yet. Click "Logic Alert" to create
                    one.
                  </div>
                ) : (
                  logicAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            alert.isTriggered
                              ? "bg-green-500"
                              : alert.isActive
                                ? "bg-blue-500"
                                : "bg-gray-400",
                          )}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{alert.name}</span>
                            <Badge variant="outline">{alert.symbol}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {
                              logicConditions.find(
                                (c) => c.value === alert.condition,
                              )?.label
                            }
                          </div>
                          {alert.description && (
                            <div className="text-sm text-muted-foreground">
                              {alert.description}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Created {formatAlertTime(alert.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={alert.isActive}
                          onCheckedChange={() => toggleAlert(alert.id, "logic")}
                          disabled={alert.isTriggered}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAlert(alert.id, "logic")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggered" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Triggered Alerts</CardTitle>
              <CardDescription>
                Recently triggered alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {triggeredAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No alerts have been triggered yet.
                  </div>
                ) : (
                  triggeredAlerts
                    .slice(-10)
                    .reverse()
                    .map((alert, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20"
                      >
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {"symbol" in alert ? alert.symbol : alert.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                            >
                              Triggered
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {"targetPrice" in alert
                              ? `Price ${alert.type} ₹${alert.targetPrice} (reached ₹${alert.currentPrice})`
                              : logicConditions.find(
                                  (c) => c.value === alert.condition,
                                )?.label}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {alert.triggeredAt &&
                              formatAlertTime(alert.triggeredAt)}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
