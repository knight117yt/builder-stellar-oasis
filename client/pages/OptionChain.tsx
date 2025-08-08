import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, TrendingUp, TrendingDown } from 'lucide-react';

export default function OptionChain() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Option Chain</h1>
          <p className="text-muted-foreground">
            View option chain, Greeks, and straddle analysis
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Greeks Analysis
            </CardTitle>
            <CardDescription>
              Option Greeks calculation and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Option Greeks data will be displayed here with real-time calculations from Fyers API.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Straddle Analysis
            </CardTitle>
            <CardDescription>
              ATM straddle prices and charts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Straddle pricing and analysis charts will be integrated here.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Option Chain Table
            </CardTitle>
            <CardDescription>
              Complete option chain with live data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Real-time option chain table will be displayed here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Option Chain</CardTitle>
          <CardDescription>Real-time option chain data with Greeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-trading-chart-bg rounded-lg border-2 border-dashed border-trading-grid flex items-center justify-center">
            <div className="text-center space-y-2">
              <PieChart className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Option chain table will be integrated here
              </p>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
