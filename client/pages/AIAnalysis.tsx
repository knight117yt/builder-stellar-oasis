import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Bot, Zap, TrendingUp } from 'lucide-react';
import { AIAnalysisDashboard } from '@/components/AIAnalysisDashboard';
import { useState } from 'react';

export default function AIAnalysis() {
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [currentPrice, setCurrentPrice] = useState(19850.50);

  const symbols = [
    { value: 'NIFTY', label: 'NIFTY 50', price: 19850.50 },
    { value: 'BANKNIFTY', label: 'BANK NIFTY', price: 44250.75 },
    { value: 'FINNIFTY', label: 'FINNIFTY', price: 21120.25 }
  ];

  const handleSymbolChange = (symbol: string) => {
    const selectedSymbolData = symbols.find(s => s.value === symbol);
    if (selectedSymbolData) {
      setSelectedSymbol(symbol);
      setCurrentPrice(selectedSymbolData.price);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Analysis</h1>
          <p className="text-muted-foreground">
            Advanced AI-powered market predictions, sentiment analysis, and smart trading insights
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

      {/* AI Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">AI Models Active</div>
                <div className="text-lg font-bold">4</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-trading-bull" />
              <div>
                <div className="text-sm text-muted-foreground">Prediction Accuracy</div>
                <div className="text-lg font-bold text-trading-bull">78%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-sm text-muted-foreground">Active Alerts</div>
                <div className="text-lg font-bold text-yellow-600">3</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-trading-neutral" />
              <div>
                <div className="text-sm text-muted-foreground">Confidence Level</div>
                <div className="text-lg font-bold">High</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Dashboard */}
      <AIAnalysisDashboard symbol={selectedSymbol} currentPrice={currentPrice} />
    </div>
  );
}
