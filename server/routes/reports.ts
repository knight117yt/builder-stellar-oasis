import { RequestHandler } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

export const handlePNLDownload: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
    }

    // Check if pre-made PNL report exists in directory
    const reportsDir = path.join(process.cwd(), "reports");
    const pnlReportPath = path.join(reportsDir, "pnl-report.pdf");

    // Create reports directory if it doesn't exist
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Check if pre-made report exists
    if (fs.existsSync(pnlReportPath)) {
      // Serve the existing report
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="pnl-report-${new Date().toISOString().split("T")[0]}.pdf"`,
      );

      const fileStream = fs.createReadStream(pnlReportPath);
      fileStream.pipe(res);
      return;
    }

    // Generate report using Python if no pre-made report exists
    const pythonScript = `
import sys
import json
from datetime import datetime, timedelta
import random

def generate_pnl_report(token):
    try:
        # Generate mock P&L data
        trades = []
        total_pnl = 0
        
        for i in range(20):  # Generate 20 mock trades
            trade_date = datetime.now() - timedelta(days=random.randint(1, 30))
            symbol = random.choice(['NIFTY', 'BANKNIFTY'])
            option_type = random.choice(['CALL', 'PUT'])
            strike = random.choice([19800, 19850, 19900, 44000, 44250, 44500])
            
            entry_price = random.uniform(50, 200)
            exit_price = entry_price + random.uniform(-50, 100)
            quantity = random.choice([25, 50, 75, 100])
            
            pnl = (exit_price - entry_price) * quantity
            total_pnl += pnl
            
            trades.append({
                "date": trade_date.strftime("%Y-%m-%d"),
                "symbol": f"{symbol}-{trade_date.strftime('%d%b%y')}-{strike}-{option_type}",
                "entry_price": round(entry_price, 2),
                "exit_price": round(exit_price, 2),
                "quantity": quantity,
                "pnl": round(pnl, 2)
            })
        
        # Sort by date
        trades.sort(key=lambda x: x['date'])
        
        # Generate simple HTML report
        html_content = f"""
        <html>
        <head>
            <title>P&L Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1 {{ color: #333; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                .profit {{ color: green; }}
                .loss {{ color: red; }}
                .summary {{ background-color: #f9f9f9; padding: 15px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <h1>Indian Market Predictors - P&L Report</h1>
            <div class="summary">
                <h2>Summary</h2>
                <p><strong>Total P&L:</strong> <span class="{'profit' if total_pnl >= 0 else 'loss'}">₹{total_pnl:,.2f}</span></p>
                <p><strong>Total Trades:</strong> {len(trades)}</p>
                <p><strong>Report Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <h2>Trade Details</h2>
            <table>
                <tr>
                    <th>Date</th>
                    <th>Symbol</th>
                    <th>Entry Price</th>
                    <th>Exit Price</th>
                    <th>Quantity</th>
                    <th>P&L</th>
                </tr>
        """
        
        for trade in trades:
            pnl_class = "profit" if trade['pnl'] >= 0 else "loss"
            html_content += f"""
                <tr>
                    <td>{trade['date']}</td>
                    <td>{trade['symbol']}</td>
                    <td>₹{trade['entry_price']}</td>
                    <td>₹{trade['exit_price']}</td>
                    <td>{trade['quantity']}</td>
                    <td class="{pnl_class}">₹{trade['pnl']:,.2f}</td>
                </tr>
            """
        
        html_content += """
            </table>
        </body>
        </html>
        """
        
        return {
            "success": True,
            "html_content": html_content,
            "total_pnl": total_pnl
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

if __name__ == "__main__":
    token = sys.argv[1]
    
    result = generate_pnl_report(token)
    print(json.dumps(result))
`;

    const { stdout, stderr } = await execAsync(
      `python3 -c "${pythonScript.replace(/"/g, '\\"')}" "${token}"`,
    );

    if (stderr) {
      console.error("PNL report script error:", stderr);
      return res.status(500).json({
        success: false,
        message: "Report generation service error",
      });
    }

    const result = JSON.parse(stdout.trim());

    if (result.success) {
      // Return HTML content as downloadable file
      res.setHeader("Content-Type", "text/html");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="pnl-report-${new Date().toISOString().split("T")[0]}.html"`,
      );
      res.send(result.html_content);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error("PNL report generation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handlePositions: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
    }

    const pythonScript = `
import sys
import json
import random
from datetime import datetime, timedelta

def get_positions(token):
    try:
        positions = []
        
        # Generate mock positions
        symbols = ['NIFTY', 'BANKNIFTY']
        strikes = [19750, 19800, 19850, 19900, 44000, 44250, 44500]
        
        for i in range(random.randint(2, 6)):
            symbol = random.choice(symbols)
            option_type = random.choice(['CALL', 'PUT'])
            strike = random.choice(strikes)
            
            avg_price = random.uniform(50, 200)
            ltp = avg_price + random.uniform(-50, 100)
            quantity = random.choice([25, 50, 75, 100])
            
            pnl = (ltp - avg_price) * quantity
            pnl_percent = (pnl / (avg_price * quantity)) * 100
            
            expiry_date = datetime.now() + timedelta(days=random.randint(1, 30))
            
            positions.append({
                "symbol": symbol,
                "type": option_type,
                "strike": strike,
                "expiry": expiry_date.strftime("%Y-%m-%d"),
                "quantity": quantity,
                "avg_price": round(avg_price, 2),
                "ltp": round(ltp, 2),
                "pnl": round(pnl, 2),
                "pnl_percent": round(pnl_percent, 2)
            })
        
        total_pnl = sum(pos['pnl'] for pos in positions)
        total_invested = sum(pos['avg_price'] * pos['quantity'] for pos in positions)
        
        return {
            "success": True,
            "data": {
                "positions": positions,
                "total_pnl": round(total_pnl, 2),
                "total_invested": round(total_invested, 2),
                "total_positions": len(positions)
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

if __name__ == "__main__":
    token = sys.argv[1]
    
    result = get_positions(token)
    print(json.dumps(result))
`;

    const { stdout, stderr } = await execAsync(
      `python3 -c "${pythonScript.replace(/"/g, '\\"')}" "${token}"`,
    );

    if (stderr) {
      console.error("Positions script error:", stderr);
      return res.status(500).json({
        success: false,
        message: "Positions service error",
      });
    }

    const result = JSON.parse(stdout.trim());
    res.json(result);
  } catch (error) {
    console.error("Positions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
