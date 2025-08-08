import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Target, TrendingUp, BarChart3 } from "lucide-react";
import { TechnicalAnalysis } from "@/components/TechnicalAnalysis";
import { useState } from "react";

export default function Analysis() {
  const [selectedSymbol, setSelectedSymbol] = useState("NIFTY");
  const [currentPrice, setCurrentPrice] = useState(19850.5);

  const symbols = [
    { value: "NIFTY", label: "NIFTY 50", price: 19850.5 },
    { value: "BANKNIFTY", label: "BANK NIFTY", price: 44250.75 },
    { value: "FINNIFTY", label: "FINNIFTY", price: 21120.25 },
  ];

  const handleSymbolChange = (symbol: string) => {
    const selectedSymbolData = symbols.find((s) => s.value === symbol);
    if (selectedSymbolData) {
      setSelectedSymbol(symbol);
      setCurrentPrice(selectedSymbolData.price);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Technical Analysis
          </h1>
          <p className="text-muted-foreground">
            Comprehensive market analysis with support/resistance, CPR zones,
            and technical indicators
          </p>
        </div>
        <div className="flex items-center gap-2">
          {symbols.map((symbol) => (
            <Button
              key={symbol.value}
              variant={selectedSymbol === symbol.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleSymbolChange(symbol.value)}
            >
              {symbol.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Quick Market Status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Current Price
                </div>
                <div className="text-lg font-bold">
                  ₹{currentPrice.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-trading-bull" />
              <div>
                <div className="text-sm text-muted-foreground">Trend</div>
                <div className="text-lg font-bold text-trading-bull">
                  Bullish
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-trading-neutral" />
              <div>
                <div className="text-sm text-muted-foreground">Volatility</div>
                <div className="text-lg font-bold">Medium</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-sm text-muted-foreground">Momentum</div>
                <div className="text-lg font-bold text-yellow-600">Neutral</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technical Analysis Component */}
      <TechnicalAnalysis symbol={selectedSymbol} currentPrice={currentPrice} />
    </div>
  );
}
