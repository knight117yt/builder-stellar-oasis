# Indian Market Predictors

A comprehensive trading platform for Indian markets with advanced pattern recognition, technical analysis, and AI-powered predictions. Built with React frontend and Express backend that bridges to Python trading algorithms.

## Features

### 🎯 **Core Functionality**

- **Fyers API Integration** - Real-time market data and authentication
- **Option Chain Analysis** - Complete option chain with Greeks calculation
- **Candlestick Pattern Detection** - 60+ pattern recognition algorithms
- **Technical Analysis** - Support/Resistance, CPR, and Pivot zones
- **AI-Powered Predictions** - Machine learning-based market analysis
- **Real-time P&L Tracking** - Live position monitoring and reporting

### 📊 **Trading Features**

- **Option Buying/Selling Zones** - Based on IV, pricing, and Greeks
- **Support & Resistance Analysis** - Technical zones with OI analysis
- **CPR and Pivot Zones** - Central Pivot Range calculations
- **Straddle Analysis** - ATM straddle pricing and charts
- **Pattern Alerts** - Real-time candlestick pattern notifications

### 🧠 **AI & Analytics**

- **Implied Volatility Analysis** - Historical and current IV trends
- **Open Interest Analysis** - OI buildup and unwinding detection
- **Probability-based Trading** - Expiry dependency analysis
- **Risk Management** - Position sizing and risk calculations

## Tech Stack

### Frontend

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **React Router 6** for navigation
- **TanStack Query** for data fetching

### Backend

- **Express.js** server (Node.js)
- **Python** integration for trading algorithms
- **Fyers API v3** for market data
- **Real-time WebSocket** connections

### Python Libraries

- **Fyers API** - Market data and trading
- **TA-Lib** - Technical analysis
- **Pandas/NumPy** - Data manipulation
- **Scikit-learn** - Machine learning
- **QuantLib** - Options pricing models

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Fyers trading account

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd indian-market-predictors
npm install
```

2. **Install Python dependencies:**

```bash
pip install -r requirements.txt
```

3. **Configure Fyers API:**

```bash
# Copy environment variables
cp .env.example .env

# Add your Fyers credentials
FYERS_APP_ID=POEXISKB7W-100
FYERS_SECRET_ID=your_secret_here
FYERS_REDIRECT_URL=http://127.0.0.1:5000/fyers/callback
```

4. **Start development server:**

```bash
npm run dev
```

## Project Structure

```
├── client/                 # React frontend
│   ├── components/         # UI components
│   │   ├── ui/            # Shadcn/ui components
│   │   └── Layout.tsx     # Main layout with navigation
│   ├── pages/             # Route components
│   │   ├── Login.tsx      # Fyers authentication
│   │   ├── Dashboard.tsx  # Main dashboard
│   │   ├── OptionChain.tsx # Option chain analysis
│   │   ├── Analysis.tsx   # Technical analysis
│   │   ├── AIAnalysis.tsx # AI predictions
│   │   └── Settings.tsx   # User settings
│   └── App.tsx            # Main app with routing
├── server/                # Express backend
│   ├── routes/            # API route handlers
│   │   ├── fyers-auth.ts  # Authentication
│   │   ├── market-data.ts # Market data & patterns
│   │   └── reports.ts     # P&L and positions
│   └── index.ts           # Server setup
├── python/                # Python trading algorithms
│   ├── patterns/          # Candlestick pattern detection
│   ├── analysis/          # Technical analysis
│   ├── options/           # Options pricing & Greeks
│   └── ai/                # Machine learning models
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Available Pages

### 🔐 **Login Page**

- Fyers API authentication
- OAuth flow integration
- Secure token management

### 📈 **Dashboard**

- Live market overview (NIFTY, BANKNIFTY)
- Real-time P&L tracking
- Open positions display
- Candlestick pattern alerts
- Interactive charts

### ⚙️ **Option Chain**

- Complete option chain display
- Greeks calculation (Delta, Gamma, Theta, Vega)
- Straddle analysis and charts
- IV analysis across strikes

### 📊 **Analysis Page**

- Support & Resistance levels
- CPR (Central Pivot Range) zones
- Open Interest analysis
- Implied Volatility trends
- Price action analysis

### 🤖 **AI Analysis**

- Machine learning predictions
- Market sentiment analysis
- Pattern probability scoring
- Risk assessment algorithms

### ⚙️ **Settings**

- Profile management
- API configuration
- Notification preferences
- P&L report downloads

## Candlestick Patterns Supported

The system recognizes 60+ candlestick patterns including:

- **Reversal Patterns**: Hammer, Hanging Man, Shooting Star, Doji
- **Continuation Patterns**: Three White Soldiers, Three Black Crows
- **Complex Patterns**: Morning Star, Evening Star, Engulfing
- **And many more...**

## API Endpoints

### Authentication

- `POST /api/auth/fyers-login` - Fyers login
- `GET /fyers/callback` - OAuth callback

### Market Data

- `GET /api/market/data` - OHLCV data
- `GET /api/market/option-chain` - Option chain with Greeks
- `GET /api/market/patterns` - Pattern detection

### Trading

- `GET /api/positions` - Current positions
- `GET /api/reports/pnl-download` - P&L report

## Development

### Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm test          # Run tests
npm run typecheck # TypeScript validation
```

### Environment Variables

```bash
FYERS_APP_ID=POEXISKB7W-100
FYERS_SECRET_ID=your_secret_key
FYERS_REDIRECT_URL=http://127.0.0.1:5000/fyers/callback
PORT=8080
```

## Deployment

The application supports multiple deployment options:

- **Netlify/Vercel** - For frontend deployment
- **Heroku/Railway** - For full-stack deployment
- **Docker** - Containerized deployment
- **Self-hosted** - VPS deployment

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This software is for educational and analysis purposes only. Trading in financial markets involves substantial risk of loss. Past performance is not indicative of future results. Always consult with a qualified financial advisor before making trading decisions.

## Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Join our community discussions

---

**Built with ❤️ for Indian traders**
