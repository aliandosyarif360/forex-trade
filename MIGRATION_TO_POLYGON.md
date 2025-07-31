# Migrasi dari OANDA ke Polygon API

Dokumen ini menjelaskan perubahan yang telah dilakukan untuk mengganti OANDA dengan Polygon API dan implementasi backtesting engine yang realistis.

## 🔄 Perubahan Utama

### 1. Market Data Provider
- **Sebelum**: OANDA API
- **Sesudah**: Polygon API
- **Alasan**: Polygon menyediakan data forex yang lebih akurat dan komprehensif

### 2. Backtesting Engine
- **Sebelum**: Engine sederhana tanpa simulasi kondisi market yang realistis
- **Sesudah**: RealisticForexBacktestingEngine dengan simulasi lengkap
- **Fitur Baru**: Market hours, spread, slippage, commission, risk management

### 3. Trading Strategy
- **Sebelum**: Strategi dasar
- **Sesudah**: RealisticForexStrategy dengan analisis teknikal yang proper

## 📁 File Baru

### Polygon API Client
```
lib/polygon/
├── client.js          # Polygon API client
└── config.js          # Konfigurasi Polygon
```

### Realistic Backtesting Engine
```
lib/backtesting/
└── realistic-engine.js # Engine backtesting yang realistis
```

### Trading Strategy
```
lib/trading/strategies/
└── realistic-forex-strategy.js # Strategi forex yang realistis
```

### API Routes
```
app/api/polygon/
├── prices/route.js        # Real-time prices
├── historical/route.js    # Historical data
└── sentiment/route.js     # Market sentiment
```

### Backtesting API
```
app/api/backtesting/
└── realistic/route.js     # Realistic backtesting endpoint
```

## 🔧 Konfigurasi Baru

### Environment Variables
```env
# Ganti OANDA dengan Polygon
POLYGON_API_KEY=your_polygon_api_key

# Hapus OANDA variables
# OANDA_API_KEY=your_oanda_key
# OANDA_ACCOUNT_ID=your_account_id
```

### Package.json Dependencies
```json
{
  "dependencies": {
    "polygon-api-client": "^1.12.2",
    // Hapus: "oanda-api-v20": "^3.0.25"
  }
}
```

## 🚀 Fitur Baru

### 1. Realistic Market Simulation
- **Market Hours**: Simulasi jam trading forex 24/5
- **Spread Simulation**: Spread yang realistis berdasarkan volatility
- **Slippage**: Simulasi slippage yang akurat
- **Commission**: Simulasi commission trading
- **Volume Analysis**: Analisis volume untuk validasi signal

### 2. Advanced Risk Management
- **Maximum Drawdown**: Batas drawdown 20%
- **Daily Loss Limit**: Batas loss harian 5%
- **Position Sizing**: Ukuran posisi maksimal 10% dari account
- **Risk:Reward Ratio**: Minimum 1.5:1
- **Consecutive Losses**: Stop trading setelah 3 loss berturut-turut

### 3. Technical Analysis
- **RSI**: Relative Strength Index dengan oversold/overbought
- **SMA/EMA**: Simple dan Exponential Moving Averages
- **ATR**: Average True Range untuk volatility
- **ADX**: Average Directional Index untuk trend strength
- **Volume Confirmation**: Konfirmasi signal dengan volume

## 📊 Perbandingan Performance

### OANDA vs Polygon

| Aspek | OANDA | Polygon |
|-------|-------|---------|
| Data Accuracy | Baik | Sangat Baik |
| Historical Data | Terbatas | Lengkap |
| Real-time Data | Ya | Ya |
| Market Sentiment | Tidak | Ya |
| Rate Limits | Terbatas | Lebih Tinggi |
| Documentation | Baik | Sangat Baik |

### Backtesting Engine Comparison

| Fitur | Engine Lama | Realistic Engine |
|-------|-------------|------------------|
| Market Hours | Tidak | Ya |
| Spread Simulation | Tidak | Ya |
| Slippage | Tidak | Ya |
| Commission | Tidak | Ya |
| Risk Management | Dasar | Advanced |
| Volume Analysis | Tidak | Ya |
| Technical Indicators | Terbatas | Lengkap |

## 🔄 Migration Steps

### 1. Update Dependencies
```bash
npm uninstall oanda-api-v20
npm install polygon-api-client
```

### 2. Update Environment Variables
```bash
# Hapus OANDA variables
# OANDA_API_KEY=xxx
# OANDA_ACCOUNT_ID=xxx

# Tambah Polygon variable
POLYGON_API_KEY=your_polygon_api_key
```

### 3. Update API Calls
```javascript
// Sebelum (OANDA)
import OandaClient from '@/lib/oanda/client';
const client = new OandaClient(apiKey, accountId, isLive);

// Sesudah (Polygon)
import PolygonClient from '@/lib/polygon/client';
const client = new PolygonClient(apiKey);
```

### 4. Update Backtesting
```javascript
// Sebelum
import BacktestingEngine from '@/lib/backtesting/engine';

// Sesudah
import RealisticForexBacktestingEngine from '@/lib/backtesting/realistic-engine';
```

## 📈 Benefits

### 1. Data Quality
- **Akurasi**: Data Polygon lebih akurat untuk forex
- **Completeness**: Data historis yang lebih lengkap
- **Real-time**: Update harga real-time yang lebih cepat

### 2. Backtesting Accuracy
- **Realistic Simulation**: Simulasi kondisi market yang sebenarnya
- **Better Results**: Hasil backtesting yang lebih akurat
- **Risk Management**: Sistem risk management yang proper

### 3. Trading Performance
- **Better Signals**: Signal trading yang lebih akurat
- **Risk Control**: Kontrol risiko yang lebih baik
- **Market Awareness**: Kesadaran kondisi market yang lebih baik

## 🧪 Testing

### 1. Test Polygon API
```javascript
import PolygonClient from '@/lib/polygon/client';

const client = new PolygonClient(process.env.POLYGON_API_KEY);

// Test real-time price
const price = await client.getRealTimePrice('C:EUR/USD');
console.log(price);

// Test historical data
const historical = await client.getHistoricalData('C:EUR/USD', 1, 'hour');
console.log(historical);
```

### 2. Test Realistic Backtesting
```javascript
import RealisticForexBacktestingEngine from '@/lib/backtesting/realistic-engine';
import RealisticForexStrategy from '@/lib/trading/strategies/realistic-forex-strategy';

const engine = new RealisticForexBacktestingEngine({
  initialBalance: 10000,
  leverage: 50
});

const strategy = new RealisticForexStrategy({
  rsiPeriod: 14,
  stopLossPips: 50,
  takeProfitPips: 100
});

const results = await engine.runBacktest(historicalData, strategy);
console.log(results);
```

## 🚨 Breaking Changes

### 1. API Endpoints
- **Hapus**: `/api/oanda/*`
- **Tambah**: `/api/polygon/*`

### 2. Client Classes
- **Hapus**: `OandaClient`
- **Tambah**: `PolygonClient`

### 3. Configuration
- **Hapus**: `OANDA_CONFIG`
- **Tambah**: `POLYGON_CONFIG`

### 4. Strategy Parameters
- **Perubahan**: Parameter strategy sekarang lebih kompleks
- **Tambahan**: Risk management parameters

## 📚 Documentation

### API Reference
- [Polygon API Documentation](https://polygon.io/docs/)
- [Forex Symbols](https://polygon.io/docs/forex/getting-started)

### Examples
- `examples/realistic-backtest-example.js` - Contoh penggunaan lengkap
- `lib/polygon/client.js` - Dokumentasi client
- `lib/backtesting/realistic-engine.js` - Dokumentasi engine

## 🆘 Troubleshooting

### Common Issues

1. **API Key Invalid**
   ```bash
   Error: API Key Polygon diperlukan
   ```
   **Solution**: Pastikan `POLYGON_API_KEY` sudah diset dengan benar

2. **Rate Limit Exceeded**
   ```bash
   Error: Rate limit terlampaui
   ```
   **Solution**: Upgrade ke plan yang lebih tinggi atau kurangi request

3. **Symbol Not Found**
   ```bash
   Error: Symbol forex tidak valid
   ```
   **Solution**: Gunakan format symbol yang benar (e.g., 'C:EUR/USD')

4. **Insufficient Data**
   ```bash
   Error: Data tidak mencukupi untuk backtesting
   ```
   **Solution**: Pastikan periode data cukup (minimal 1000 data points)

## 🎯 Next Steps

1. **Testing**: Jalankan test untuk memastikan semua fitur berfungsi
2. **Documentation**: Update dokumentasi user
3. **Training**: Training tim untuk menggunakan fitur baru
4. **Monitoring**: Monitor performance dan error logs
5. **Optimization**: Optimasi berdasarkan hasil testing

## 📞 Support

- **Documentation**: Lihat file README.md yang diperbarui
- **Examples**: Lihat folder `examples/`
- **Issues**: Buat issue di repository jika ada masalah
- **Questions**: Hubungi tim development untuk pertanyaan teknis