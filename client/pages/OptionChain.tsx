import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, TrendingUp, TrendingDown, Target } from "lucide-react";
import { OptionChainTable } from "@/components/OptionChainTable";
import { useState } from "react";

export default function OptionChain() {
  const [selectedSymbol, setSelectedSymbol] = useState("NIFTY");
  const [spotPrice, setSpotPrice] = useState(19850.5);

  const symbols = [
    { value: "NIFTY", label: "NIFTY 50", price: 19850.5 },
    { value: "BANKNIFTY", label: "BANK NIFTY", price: 44250.75 },
    { value: "FINNIFTY", label: "FINNIFTY", price: 21120.25 },
  ];

  const handleSymbolChange = (symbol: string) => {
    const selectedSymbolData = symbols.find((s) => s.value === symbol);
    if (selectedSymbolData) {
      setSelectedSymbol(symbol);
      setSpotPrice(selectedSymbolData.price);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Option Chain</h1>
          <p className="text-muted-foreground">
            Real-time option chain with Greeks, straddle analysis, and trading
            insights
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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Spot Price</div>
                <div className="text-lg font-bold">
                  ₹{spotPrice.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-trading-bull" />
              <div>
                <div className="text-sm text-muted-foreground">PCR</div>
                <div className="text-lg font-bold">0.87</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-trading-neutral" />
              <div>
                <div className="text-sm text-muted-foreground">Avg IV</div>
                <div className="text-lg font-bold">18.5%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Days to Expiry
                </div>
                <div className="text-lg font-bold">5</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Option Chain */}
      <OptionChainTable symbol={selectedSymbol} spotPrice={spotPrice} />
    </div>
  );
}
