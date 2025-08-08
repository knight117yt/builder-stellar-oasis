import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface OptionData {
  strike: number;
  call: {
    ltp: number;
    bid: number;
    ask: number;
    volume: number;
    oi: number;
    iv: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
  put: {
    ltp: number;
    bid: number;
    ask: number;
    volume: number;
    oi: number;
    iv: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
}

interface OptionChainTableProps {
  symbol?: string;
  spotPrice?: number;
}

const generateOptionChain = (spotPrice: number): OptionData[] => {
  const strikes: OptionData[] = [];
  const atmStrike = Math.round(spotPrice / 50) * 50;
  
  for (let i = -15; i <= 15; i++) {
    const strike = atmStrike + (i * 50);
    const moneyness = strike / spotPrice;
    
    // Calculate theoretical option prices and Greeks
    const timeToExpiry = 7 / 365; // 7 days to expiry
    const riskFreeRate = 0.06;
    const baseIV = 0.20 + Math.abs(moneyness - 1) * 0.15; // IV smile
    
    // Simplified Black-Scholes approximation for demo
    const callIntrinsic = Math.max(spotPrice - strike, 0);
    const putIntrinsic = Math.max(strike - spotPrice, 0);
    
    const callTimeValue = Math.random() * 30 + 5;
    const putTimeValue = Math.random() * 30 + 5;
    
    const callPrice = callIntrinsic + callTimeValue;
    const putPrice = putIntrinsic + putTimeValue;
    
    // Greeks calculation (simplified)
    const callDelta = moneyness < 1 ? 0.1 + Math.random() * 0.4 : 0.5 + Math.random() * 0.4;
    const putDelta = -Math.abs(callDelta - 1);
    
    const gamma = 0.001 + Math.random() * 0.01;
    const callTheta = -(Math.random() * 3 + 1);
    const putTheta = -(Math.random() * 3 + 1);
    const vega = 5 + Math.random() * 15;
    
    strikes.push({
      strike,
      call: {
        ltp: Math.round(callPrice * 100) / 100,
        bid: Math.round((callPrice - 1) * 100) / 100,
        ask: Math.round((callPrice + 1) * 100) / 100,
        volume: Math.round(Math.random() * 10000),
        oi: Math.round(Math.random() * 50000),
        iv: Math.round(baseIV * 100 * 100) / 100,
        delta: Math.round(callDelta * 10000) / 10000,
        gamma: Math.round(gamma * 10000) / 10000,
        theta: Math.round(callTheta * 100) / 100,
        vega: Math.round(vega * 100) / 100
      },
      put: {
        ltp: Math.round(putPrice * 100) / 100,
        bid: Math.round((putPrice - 1) * 100) / 100,
        ask: Math.round((putPrice + 1) * 100) / 100,
        volume: Math.round(Math.random() * 10000),
        oi: Math.round(Math.random() * 50000),
        iv: Math.round(baseIV * 100 * 100) / 100,
        delta: Math.round(putDelta * 10000) / 10000,
        gamma: Math.round(gamma * 10000) / 10000,
        theta: Math.round(putTheta * 100) / 100,
        vega: Math.round(vega * 100) / 100
      }
    });
  }
  
  return strikes;
};

const calculateStraddle = (option: OptionData): number => {
  return option.call.ltp + option.put.ltp;
};

export function OptionChainTable({ symbol = 'NIFTY', spotPrice = 19850 }: OptionChainTableProps) {
  const [optionChain, setOptionChain] = useState<OptionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState('2024-01-25');
  const [showGreeks, setShowGreeks] = useState(false);
  
  useEffect(() => {
    loadOptionChain();
  }, [spotPrice, selectedExpiry]);

  const loadOptionChain = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const chain = generateOptionChain(spotPrice);
      setOptionChain(chain);
    } catch (error) {
      console.error('Error loading option chain:', error);
    } finally {
      setLoading(false);
    }
  };

  const atmStrike = Math.round(spotPrice / 50) * 50;
  const atmOption = optionChain.find(opt => opt.strike === atmStrike);
  const atmStraddle = atmOption ? calculateStraddle(atmOption) : 0;

  const expiries = [
    '2024-01-25',
    '2024-02-01', 
    '2024-02-08',
    '2024-02-15',
    '2024-02-29'
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading option chain...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{symbol} Option Chain</CardTitle>
              <CardDescription>
                Live option chain with Greeks • Spot: ₹{spotPrice.toLocaleString()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={selectedExpiry}
                onChange={(e) => setSelectedExpiry(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                {expiries.map(expiry => (
                  <option key={expiry} value={expiry}>{expiry}</option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGreeks(!showGreeks)}
              >
                {showGreeks ? 'Hide Greeks' : 'Show Greeks'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ATM Straddle Info */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">ATM Strike</div>
              <div className="text-lg font-bold">{atmStrike}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ATM Straddle</div>
              <div className="text-lg font-bold text-primary">₹{atmStraddle.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Max Pain</div>
              <div className="text-lg font-bold text-trading-neutral">
                {optionChain.length > 0 ? optionChain[Math.floor(optionChain.length / 2)].strike : '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Option Chain Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th colSpan={showGreeks ? 6 : 4} className="p-3 text-center bg-trading-bull-light text-trading-bull font-medium">
                    CALLS
                  </th>
                  <th className="p-3 text-center bg-muted font-medium">STRIKE</th>
                  <th colSpan={showGreeks ? 6 : 4} className="p-3 text-center bg-trading-bear-light text-trading-bear font-medium">
                    PUTS
                  </th>
                </tr>
                <tr className="border-b border-border bg-muted/50">
                  {/* Call Headers */}
                  <th className="p-2 text-left">LTP</th>
                  <th className="p-2 text-left">Bid/Ask</th>
                  <th className="p-2 text-left">Vol</th>
                  <th className="p-2 text-left">OI</th>
                  {showGreeks && (
                    <>
                      <th className="p-2 text-left">IV</th>
                      <th className="p-2 text-left">Delta</th>
                    </>
                  )}
                  
                  {/* Strike */}
                  <th className="p-2 text-center bg-background">Price</th>
                  
                  {/* Put Headers */}
                  <th className="p-2 text-left">LTP</th>
                  <th className="p-2 text-left">Bid/Ask</th>
                  <th className="p-2 text-left">Vol</th>
                  <th className="p-2 text-left">OI</th>
                  {showGreeks && (
                    <>
                      <th className="p-2 text-left">IV</th>
                      <th className="p-2 text-left">Delta</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {optionChain.map((option, index) => {
                  const isATM = option.strike === atmStrike;
                  const isITM_Call = spotPrice > option.strike;
                  const isITM_Put = spotPrice < option.strike;
                  
                  return (
                    <tr 
                      key={option.strike}
                      className={cn(
                        "border-b border-border hover:bg-muted/30 transition-colors",
                        isATM && "bg-yellow-50 dark:bg-yellow-950/20"
                      )}
                    >
                      {/* Call Options */}
                      <td className={cn("p-2", isITM_Call ? "bg-trading-bull-light" : "")}>
                        <span className="font-mono text-sm">{option.call.ltp}</span>
                      </td>
                      <td className="p-2">
                        <span className="text-xs text-muted-foreground">
                          {option.call.bid}/{option.call.ask}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="text-xs">{option.call.volume.toLocaleString()}</span>
                      </td>
                      <td className="p-2">
                        <span className="text-xs font-medium">{option.call.oi.toLocaleString()}</span>
                      </td>
                      {showGreeks && (
                        <>
                          <td className="p-2">
                            <span className="text-xs">{option.call.iv}%</span>
                          </td>
                          <td className="p-2">
                            <span className="text-xs text-trading-bull">{option.call.delta}</span>
                          </td>
                        </>
                      )}
                      
                      {/* Strike Price */}
                      <td className={cn(
                        "p-2 text-center font-bold bg-background",
                        isATM && "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400"
                      )}>
                        {option.strike}
                        {isATM && <Badge variant="outline" className="ml-1 text-xs">ATM</Badge>}
                      </td>
                      
                      {/* Put Options */}
                      <td className={cn("p-2", isITM_Put ? "bg-trading-bear-light" : "")}>
                        <span className="font-mono text-sm">{option.put.ltp}</span>
                      </td>
                      <td className="p-2">
                        <span className="text-xs text-muted-foreground">
                          {option.put.bid}/{option.put.ask}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="text-xs">{option.put.volume.toLocaleString()}</span>
                      </td>
                      <td className="p-2">
                        <span className="text-xs font-medium">{option.put.oi.toLocaleString()}</span>
                      </td>
                      {showGreeks && (
                        <>
                          <td className="p-2">
                            <span className="text-xs">{option.put.iv}%</span>
                          </td>
                          <td className="p-2">
                            <span className="text-xs text-trading-bear">{option.put.delta}</span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Greeks Summary for ATM */}
      {showGreeks && atmOption && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ATM Greeks Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Delta</div>
                <div className="font-mono">
                  <span className="text-trading-bull">C: {atmOption.call.delta}</span>
                  <span className="mx-2">|</span>
                  <span className="text-trading-bear">P: {atmOption.put.delta}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Gamma</div>
                <div className="font-mono">{atmOption.call.gamma}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Theta</div>
                <div className="font-mono text-trading-bear">
                  {Math.min(atmOption.call.theta, atmOption.put.theta)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Vega</div>
                <div className="font-mono">{atmOption.call.vega}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
