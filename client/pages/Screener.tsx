import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  Eye,
  Star,
  ExternalLink,
} from "lucide-react";
import { marketDataService } from "@/services/marketData";
import { useMarketData } from "@/services/realTimeDataService";

interface ScreenerFilters {
  min_price?: number;
  max_price?: number;
  min_volume?: number;
  max_volume?: number;
  min_market_cap?: number;
  max_market_cap?: number;
  min_pe_ratio?: number;
  max_pe_ratio?: number;
  sectors?: string[];
  exchanges?: string[];
  price_change_min?: number;
  price_change_max?: number;
}

interface ScreenedStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap?: number;
  pe_ratio?: number;
  sector?: string;
  exchange: string;
}

interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  industry?: string;
}

const SECTORS = [
  "Technology", "Financial Services", "Healthcare", "Energy", "Consumer Cyclical",
  "Industrials", "Consumer Defensive", "Real Estate", "Basic Materials", 
  "Communication Services", "Utilities"
];

const EXCHANGES = ["NSE", "BSE"];

export default function Screener() {
  const [activeTab, setActiveTab] = useState("screener");
  const [filters, setFilters] = useState<ScreenerFilters>({});
  const [screenedStocks, setScreenedStocks] = useState<ScreenedStock[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [stockDetails, setStockDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const { data: marketData } = useMarketData();

  // Load watchlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('screener_watchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  // Save watchlist to localStorage
  const saveWatchlist = (newWatchlist: string[]) => {
    setWatchlist(newWatchlist);
    localStorage.setItem('screener_watchlist', JSON.stringify(newWatchlist));
  };

  // Run screening based on filters
  const runScreener = async () => {
    setLoading(true);
    try {
      const response = await marketDataService.screenStocks(filters);
      setScreenedStocks(response.stocks);
    } catch (error) {
      console.error("Screener failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search stocks
  const searchStocks = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await marketDataService.searchStocks(query);
      setSearchResults(response.stocks);
    } catch (error) {
      console.error("Stock search failed:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Get stock details
  const getStockDetails = async (symbol: string) => {
    setSelectedStock(symbol);
    try {
      const details = await marketDataService.getStockDetails(symbol);
      setStockDetails(details);
    } catch (error) {
      console.error("Failed to get stock details:", error);
      setStockDetails(null);
    }
  };

  // Toggle watchlist
  const toggleWatchlist = (symbol: string) => {
    const newWatchlist = watchlist.includes(symbol)
      ? watchlist.filter(s => s !== symbol)
      : [...watchlist, symbol];
    saveWatchlist(newWatchlist);
  };

  // Filter input handlers
  const updateFilter = (key: keyof ScreenerFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Format volume
  const formatVolume = (volume: number) => {
    if (volume >= 10000000) return `${(volume / 10000000).toFixed(1)}Cr`;
    if (volume >= 100000) return `${(volume / 100000).toFixed(1)}L`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  // Format market cap
  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 100000) return `₹${(marketCap / 100000).toFixed(1)}L Cr`;
    if (marketCap >= 1000) return `₹${(marketCap / 1000).toFixed(1)}K Cr`;
    return `₹${marketCap.toFixed(0)} Cr`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Screener</h1>
          <p className="text-muted-foreground">
            Filter and analyze stocks based on various criteria
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="screener">Screener</TabsTrigger>
          <TabsTrigger value="search">Stock Search</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
        </TabsList>

        <TabsContent value="screener" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Price Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.min_price || ""}
                      onChange={(e) => updateFilter("min_price", parseFloat(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.max_price || ""}
                      onChange={(e) => updateFilter("max_price", parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                {/* Volume Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Volume Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.min_volume || ""}
                      onChange={(e) => updateFilter("min_volume", parseInt(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.max_volume || ""}
                      onChange={(e) => updateFilter("max_volume", parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {/* Market Cap Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Market Cap (Cr)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.min_market_cap || ""}
                      onChange={(e) => updateFilter("min_market_cap", parseFloat(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.max_market_cap || ""}
                      onChange={(e) => updateFilter("max_market_cap", parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                {/* P/E Ratio Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">P/E Ratio</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.min_pe_ratio || ""}
                      onChange={(e) => updateFilter("min_pe_ratio", parseFloat(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.max_pe_ratio || ""}
                      onChange={(e) => updateFilter("max_pe_ratio", parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                {/* Price Change Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Price Change %</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.price_change_min || ""}
                      onChange={(e) => updateFilter("price_change_min", parseFloat(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.price_change_max || ""}
                      onChange={(e) => updateFilter("price_change_max", parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                {/* Exchange Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Exchange</Label>
                  <Select onValueChange={(value) => updateFilter("exchanges", value === "all" ? undefined : [value])}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Exchanges" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Exchanges</SelectItem>
                      {EXCHANGES.map(exchange => (
                        <SelectItem key={exchange} value={exchange}>{exchange}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button onClick={runScreener} disabled={loading} className="w-full">
                    {loading ? "Screening..." : "Run Screener"}
                  </Button>
                  <Button onClick={clearFilters} variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <div className="lg:col-span-3 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Screened Stocks ({screenedStocks.length})</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Live Data
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Change</TableHead>
                          <TableHead>Volume</TableHead>
                          <TableHead>Market Cap</TableHead>
                          <TableHead>P/E</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {screenedStocks.map((stock) => (
                          <TableRow key={stock.symbol}>
                            <TableCell className="font-medium">{stock.symbol}</TableCell>
                            <TableCell className="max-w-48 truncate">{stock.name}</TableCell>
                            <TableCell>{formatCurrency(stock.price)}</TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-1 ${
                                stock.change >= 0 ? 'text-trading-bull' : 'text-trading-bear'
                              }`}>
                                {stock.change >= 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {stock.change_percent.toFixed(2)}%
                              </div>
                            </TableCell>
                            <TableCell>{formatVolume(stock.volume)}</TableCell>
                            <TableCell>
                              {stock.market_cap ? formatMarketCap(stock.market_cap) : "-"}
                            </TableCell>
                            <TableCell>{stock.pe_ratio?.toFixed(2) || "-"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => getStockDetails(stock.symbol)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleWatchlist(stock.symbol)}
                                >
                                  <Star 
                                    className={`h-3 w-3 ${
                                      watchlist.includes(stock.symbol) 
                                        ? 'fill-current text-yellow-500' 
                                        : ''
                                    }`} 
                                  />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {screenedStocks.length === 0 && !loading && (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No stocks found matching your criteria</p>
                      <p className="text-sm">Try adjusting your filters and run the screener again</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Stock Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search stocks by name or symbol..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchStocks(e.target.value);
                  }}
                  className="flex-1"
                />
              </div>

              {searchLoading && (
                <div className="text-center py-4 text-muted-foreground">
                  Searching...
                </div>
              )}

              <div className="grid gap-3">
                {searchResults.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => getStockDetails(stock.symbol)}
                  >
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-sm text-muted-foreground">{stock.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {stock.exchange} {stock.sector && `• ${stock.sector}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(stock.symbol);
                        }}
                      >
                        <Star 
                          className={`h-4 w-4 ${
                            watchlist.includes(stock.symbol) 
                              ? 'fill-current text-yellow-500' 
                              : ''
                          }`} 
                        />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {searchResults.length === 0 && searchQuery && !searchLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No stocks found for "{searchQuery}"</p>
                  <p className="text-sm">Try searching with different keywords</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock Details Panel */}
          {stockDetails && selectedStock && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{stockDetails.name} ({selectedStock})</span>
                  <Badge variant={stockDetails.has_options ? "default" : "secondary"}>
                    {stockDetails.has_options ? "Options Available" : "Equity Only"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Last Price</Label>
                    <div className="text-lg font-semibold">
                      {formatCurrency(stockDetails.market_data?.ltp || 0)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Change</Label>
                    <div className={`text-lg font-semibold ${
                      (stockDetails.market_data?.change || 0) >= 0 ? 'text-trading-bull' : 'text-trading-bear'
                    }`}>
                      {(stockDetails.market_data?.change_percent || 0).toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Volume</Label>
                    <div className="text-lg font-semibold">
                      {formatVolume(stockDetails.market_data?.volume || 0)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Market Cap</Label>
                    <div className="text-lg font-semibold">
                      {stockDetails.fundamentals?.market_cap 
                        ? formatMarketCap(stockDetails.fundamentals.market_cap)
                        : "-"
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Watchlist ({watchlist.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {watchlist.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your watchlist is empty</p>
                  <p className="text-sm">Add stocks from the screener or search to track them here</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {watchlist.map((symbol) => {
                    const data = marketData?.[symbol];
                    return (
                      <div
                        key={symbol}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{symbol}</div>
                          {data && (
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(data.ltp)} • {data.change_percent.toFixed(2)}%
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => getStockDetails(symbol)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleWatchlist(symbol)}
                          >
                            <Star className="h-4 w-4 fill-current text-yellow-500" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
