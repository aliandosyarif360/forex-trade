# 🤖 Auto Trading Bot Platform - SIAP PAKAI

Platform trading otomatis dengan bot siap pakai menggunakan API gratis. Bot akan trading secara otomatis berdasarkan sinyal RSI dan indikator teknis lainnya.

## 🚀 Features Utama

### ✅ 100% GRATIS
- **Alpha Vantage API**: 500 calls/hari gratis
- **Yahoo Finance**: Unlimited gratis (backup)
- **Supabase**: Database gratis
- **Clerk**: Authentication gratis
- **Telegram**: Notifikasi gratis

### 🤖 Auto Trading Bot
- **RSI Strategy**: Buy oversold, sell overbought
- **Risk Management**: Stop loss & take profit otomatis
- **Position Sizing**: Kelola risiko per trade
- **Multiple Positions**: Maksimal 5 posisi bersamaan
- **Real-time Monitoring**: Pantau 24/7

### 📊 Market Data
- **Real-time Prices**: Harga saham US real-time
- **Technical Indicators**: RSI, MACD, SMA, EMA
- **Historical Data**: Untuk backtesting
- **Multiple Symbols**: AAPL, MSFT, GOOGL, dll.

## 🛠️ Setup Super Mudah

### 1. Clone Repository
```bash
git clone <repository-url>
cd platform-trading-bot
npm install
```

### 2. Setup API Keys GRATIS
```bash
# Copy environment template
cp .env.example .env

# Edit .env dan isi API keys:
# 1. Alpha Vantage: https://www.alphavantage.co/support/#api-key (GRATIS)
# 2. Supabase: https://supabase.com (GRATIS)
# 3. Clerk: https://clerk.com (GRATIS)
```

### 3. Jalankan Bot
```bash
# Jalankan auto trading bot
npm run trading-bot

# Atau jalankan web interface
npm run dev
```

## 🎯 Cara Kerja Bot

### Strategi RSI (Default)
1. **Buy Signal**: RSI < 30 (oversold) → Beli saham
2. **Sell Signal**: RSI > 70 (overbought) → Jual saham
3. **Stop Loss**: 5% dari harga beli
4. **Take Profit**: 10% dari harga beli
5. **Position Size**: 20% dari cash available

### Risk Management
- Maksimal 5 posisi bersamaan
- Stop loss otomatis di 5%
- Take profit otomatis di 10%
- Trailing stop loss
- Validasi volume & volatilitas

## 📱 Cara Menggunakan

### Via Script (Recommended)
```bash
# Start bot dengan konfigurasi default
npm run bot:start

# Bot akan:
# - Monitor AAPL, MSFT, GOOGL, AMZN, TSLA
# - Starting cash: $10,000
# - Auto trade berdasarkan RSI
# - Print status setiap 30 menit
```

### Via API Endpoint
```bash
# Start bot
curl -X POST http://localhost:3000/api/trading-bot \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "config": {"startingCash": 10000}}'

# Check status
curl http://localhost:3000/api/trading-bot

# Stop bot
curl -X POST http://localhost:3000/api/trading-bot \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

### Via Web Interface
1. Buka `http://localhost:3000`
2. Login dengan Clerk
3. Masuk ke "Trading Bot" dashboard
4. Klik "Start Bot"
5. Monitor real-time

## ⚙️ Konfigurasi Bot

Edit file `.env` untuk mengubah setting:

```env
# Bot Configuration
BOT_STARTING_CASH=10000          # Starting cash ($10,000)
BOT_MAX_POSITIONS=5              # Max 5 positions
BOT_MIN_CONFIDENCE=0.7           # Min 70% confidence
BOT_STOP_LOSS=0.05              # 5% stop loss
BOT_TAKE_PROFIT=0.10            # 10% take profit
BOT_POSITION_SIZE=0.2           # 20% position size

# Watchlist
BOT_WATCHLIST=AAPL,MSFT,GOOGL,AMZN,TSLA,META,NVDA,NFLX
```

## 📊 Monitoring & Statistics

Bot akan menampilkan:
- Portfolio value real-time
- Active positions
- Trade history
- Win rate & P&L
- Risk metrics

```bash
💼 PORTFOLIO STATUS
==================================================
💵 Cash: $8,500.00
📊 Positions (2/5):
   AAPL: 10 shares @ $150.00 = $1,500.00
   MSFT: 5 shares @ $200.00 = $1,000.00
💰 Total Portfolio Value: $11,000.00
==================================================

📈 Quick Stats: 5 trades, 80.00% win rate, $1000.00 P&L
```

## 🔔 Notifikasi (Optional)

### Telegram Bot
1. Buat bot di [@BotFather](https://t.me/BotFather)
2. Dapatkan bot token
3. Dapatkan chat ID
4. Set di `.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Discord Webhook
1. Buat webhook di Discord server
2. Set di `.env`:
```env
DISCORD_WEBHOOK_URL=your_webhook_url
```

## 🚨 DISCLAIMER

**INI ADALAH BOT SIMULASI UNTUK LEARNING**
- Bot ini menggunakan data virtual/paper trading
- Tidak terhubung ke broker real
- Untuk educational purposes only
- Trading real memiliki risiko kehilangan uang
- Selalu lakukan riset sebelum trading real

## 🛡️ Risk Management

Bot sudah dilengkapi dengan:
- ✅ Stop loss otomatis
- ✅ Take profit otomatis  
- ✅ Position sizing
- ✅ Maximum positions limit
- ✅ Confidence threshold
- ✅ Volume validation
- ✅ Volatility check

## 📈 Supported Strategies

### RSI Strategy (Default)
- Buy: RSI keluar dari oversold (<30)
- Sell: RSI masuk overbought (>70)
- Confidence: Berdasarkan level RSI

### Coming Soon
- MACD Strategy
- Moving Average Crossover
- Bollinger Bands
- Multi-timeframe analysis

## 🔧 Development

### Add New Strategy
1. Buat file di `lib/trading-bot/strategies/`
2. Implement `analyzeSignal()` method
3. Add ke AutoTrader configuration

### Custom Indicators
1. Extend Alpha Vantage client
2. Add indicator calculation
3. Use in strategy analysis

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Check logs di console
2. Verify API keys
3. Check rate limits
4. Test dengan demo data dulu

## 🎉 Quick Start Checklist

- [ ] Clone repository
- [ ] `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Daftar Alpha Vantage API key (gratis)
- [ ] Set API key di `.env`
- [ ] Run `npm run bot:start`
- [ ] Monitor console output
- [ ] Check portfolio status
- [ ] Enjoy automated trading! 🚀

**Bot siap jalan dalam 5 menit!** ⚡
