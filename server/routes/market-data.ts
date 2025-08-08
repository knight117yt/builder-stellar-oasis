import { RequestHandler } from "express";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const handleMarketData: RequestHandler = async (req, res) => {
  try {
    const { symbol = "NIFTY50", interval = "1m" } = req.query;
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required"
      });
    }

    const pythonScript = `
import sys
import json
import random
from datetime import datetime, timedelta

def get_market_data(symbol, interval, token):
    try:
        # Simulate market data - in real implementation, use Fyers API
        current_time = datetime.now()
        data_points = []
        
        # Generate mock OHLCV data
        base_price = 19850 if "NIFTY" in symbol else 44250
        
        for i in range(100):
            timestamp = current_time - timedelta(minutes=i)
            
            # Generate realistic OHLCV data
            open_price = base_price + random.uniform(-50, 50)
            high_price = open_price + random.uniform(0, 30)
            low_price = open_price - random.uniform(0, 30)
            close_price = open_price + random.uniform(-25, 25)
            volume = random.randint(1000, 10000)
            
            data_points.append({
                "timestamp": timestamp.isoformat(),
                "open": round(open_price, 2),
                "high": round(high_price, 2),
                "low": round(low_price, 2),
                "close": round(close_price, 2),
                "volume": volume
            })
        
        return {
            "success": True,
            "data": {
                "symbol": symbol,
                "interval": interval,
                "candles": data_points[::-1]  # Reverse to get chronological order
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

if __name__ == "__main__":
    symbol = sys.argv[1]
    interval = sys.argv[2]
    token = sys.argv[3]
    
    result = get_market_data(symbol, interval, token)
    print(json.dumps(result))
`;

    const { stdout, stderr } = await execAsync(
      `python3 -c "${pythonScript.replace(/"/g, '\\"')}" "${symbol}" "${interval}" "${token}"`
    );

    if (stderr) {
      console.error("Market data script error:", stderr);
      return res.status(500).json({
        success: false,
        message: "Market data service error"
      });
    }

    const result = JSON.parse(stdout.trim());
    res.json(result);

  } catch (error) {
    console.error("Market data error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const handleOptionChain: RequestHandler = async (req, res) => {
  try {
    const { symbol = "NIFTY", expiry } = req.query;
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required"
      });
    }

    const pythonScript = `
import sys
import json
import random
from datetime import datetime, timedelta

def get_option_chain(symbol, expiry, token):
    try:
        # Simulate option chain data
        spot_price = 19850 if symbol == "NIFTY" else 44250
        strikes = []
        
        # Generate strikes around ATM
        atm_strike = round(spot_price / 50) * 50
        
        for i in range(-10, 11):
            strike = atm_strike + (i * 50)
            
            # Calculate theoretical option prices (simplified)
            call_price = max(spot_price - strike, 0) + random.uniform(5, 50)
            put_price = max(strike - spot_price, 0) + random.uniform(5, 50)
            
            # Mock Greeks
            call_delta = random.uniform(0.1, 0.9) if call_price > 10 else random.uniform(0.01, 0.1)
            put_delta = -random.uniform(0.1, 0.9) if put_price > 10 else -random.uniform(0.01, 0.1)
            
            strikes.append({
                "strike": strike,
                "call": {
                    "ltp": round(call_price, 2),
                    "bid": round(call_price - 1, 2),
                    "ask": round(call_price + 1, 2),
                    "volume": random.randint(0, 1000),
                    "oi": random.randint(0, 5000),
                    "iv": round(random.uniform(15, 35), 2),
                    "delta": round(call_delta, 4),
                    "gamma": round(random.uniform(0.001, 0.01), 4),
                    "theta": round(-random.uniform(0.5, 5), 4),
                    "vega": round(random.uniform(5, 20), 4)
                },
                "put": {
                    "ltp": round(put_price, 2),
                    "bid": round(put_price - 1, 2),
                    "ask": round(put_price + 1, 2),
                    "volume": random.randint(0, 1000),
                    "oi": random.randint(0, 5000),
                    "iv": round(random.uniform(15, 35), 2),
                    "delta": round(put_delta, 4),
                    "gamma": round(random.uniform(0.001, 0.01), 4),
                    "theta": round(-random.uniform(0.5, 5), 4),
                    "vega": round(random.uniform(5, 20), 4)
                }
            })
        
        return {
            "success": True,
            "data": {
                "symbol": symbol,
                "spot_price": spot_price,
                "expiry": expiry,
                "strikes": strikes
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

if __name__ == "__main__":
    symbol = sys.argv[1]
    expiry = sys.argv[2] if len(sys.argv) > 2 else ""
    token = sys.argv[3]
    
    result = get_option_chain(symbol, expiry, token)
    print(json.dumps(result))
`;

    const { stdout, stderr } = await execAsync(
      `python3 -c "${pythonScript.replace(/"/g, '\\"')}" "${symbol}" "${expiry || ''}" "${token}"`
    );

    if (stderr) {
      console.error("Option chain script error:", stderr);
      return res.status(500).json({
        success: false,
        message: "Option chain service error"
      });
    }

    const result = JSON.parse(stdout.trim());
    res.json(result);

  } catch (error) {
    console.error("Option chain error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const handleCandlestickPatterns: RequestHandler = async (req, res) => {
  try {
    const { symbol = "NIFTY50" } = req.query;
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required"
      });
    }

    const pythonScript = `
import sys
import json
import random
from datetime import datetime

def detect_candlestick_patterns(symbol, token):
    try:
        # Predefined candlestick patterns from the user's list
        patterns = {
            'CDL2CROWS': 'Two Crows',
            'CDL3BLACKCROWS': 'Three Black Crows',
            'CDLDOJI': 'Doji',
            'CDLHAMMER': 'Hammer',
            'CDLHANGINGMAN': 'Hanging Man',
            'CDLENGULFING': 'Engulfing Pattern',
            'CDLMORNINGSTAR': 'Morning Star',
            'CDLEVENINGSTAR': 'Evening Star',
            'CDLSHOOTINGSTAR': 'Shooting Star',
            'CDLDRAGONFLYDOJI': 'Dragonfly Doji'
        }
        
        detected = []
        
        # Simulate pattern detection
        for pattern_id, pattern_name in list(patterns.items())[:5]:  # Show 5 patterns
            if random.random() > 0.3:  # 70% chance of detection
                signal = random.choice(['Bullish', 'Bearish', 'Neutral'])
                confidence = random.randint(60, 95)
                
                detected.append({
                    "pattern_id": pattern_id,
                    "pattern_name": pattern_name,
                    "signal": signal,
                    "confidence": confidence,
                    "timestamp": datetime.now().isoformat(),
                    "description": f"{pattern_name} pattern detected with {signal.lower()} signal"
                })
        
        return {
            "success": True,
            "data": {
                "symbol": symbol,
                "detected_patterns": detected,
                "total_patterns": len(detected)
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

if __name__ == "__main__":
    symbol = sys.argv[1]
    token = sys.argv[2]
    
    result = detect_candlestick_patterns(symbol, token)
    print(json.dumps(result))
`;

    const { stdout, stderr } = await execAsync(
      `python3 -c "${pythonScript.replace(/"/g, '\\"')}" "${symbol}" "${token}"`
    );

    if (stderr) {
      console.error("Pattern detection script error:", stderr);
      return res.status(500).json({
        success: false,
        message: "Pattern detection service error"
      });
    }

    const result = JSON.parse(stdout.trim());
    res.json(result);

  } catch (error) {
    console.error("Pattern detection error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
