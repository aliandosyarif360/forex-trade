/**
 * Konfigurasi Polygon API untuk Platform Trading Indonesia
 */

export const POLYGON_CONFIG = {
  // API Configuration
  BASE_URL: 'https://api.polygon.io',
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  
  // Rate Limits
  RATE_LIMIT_PER_MINUTE: 5,
  RATE_LIMIT_PER_SECOND: 1,
  
  // Forex Symbols yang didukung
  FOREX_SYMBOLS: [
    'C:EUR/USD', 'C:GBP/USD', 'C:USD/JPY', 'C:USD/CHF',
    'C:AUD/USD', 'C:USD/CAD', 'C:NZD/USD', 'C:EUR/GBP',
    'C:EUR/JPY', 'C:GBP/JPY', 'C:CHF/JPY', 'C:EUR/CHF',
    'C:GBP/CHF', 'C:AUD/JPY', 'C:NZD/JPY', 'C:CAD/JPY',
    'C:EUR/AUD', 'C:GBP/AUD', 'C:EUR/NZD', 'C:GBP/NZD',
    'C:AUD/NZD', 'C:CAD/CHF', 'C:AUD/CHF', 'C:NZD/CHF'
  ],
  
  // Timeframes yang didukung
  TIMEFRAMES: {
    MINUTE: 'minute',
    HOUR: 'hour',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    QUARTER: 'quarter',
    YEAR: 'year'
  },
  
  // Multipliers untuk timeframes
  MULTIPLIERS: {
    MINUTE: [1, 5, 15, 30],
    HOUR: [1, 2, 4, 6, 8, 12],
    DAY: [1, 2, 3, 5, 7],
    WEEK: [1, 2, 3, 4],
    MONTH: [1, 2, 3, 6],
    QUARTER: [1, 2, 3, 4],
    YEAR: [1, 2, 3, 5, 10]
  },
  
  // Market Hours (UTC)
  MARKET_HOURS: {
    FOREX: {
      OPEN: '22:00', // Sunday 10 PM UTC
      CLOSE: '22:00', // Friday 10 PM UTC
      TIMEZONE: 'UTC'
    }
  },
  
  // Trading Parameters
  TRADING: {
    DEFAULT_SPREAD: 0.0001, // 1 pip
    MAX_SPREAD: 0.0010, // 10 pips
    MIN_VOLUME: 1000000, // Minimum volume untuk validasi
    MAX_SLIPPAGE: 0.0002, // 2 pips
    DEFAULT_LEVERAGE: 50,
    MAX_LEVERAGE: 500,
    MIN_LOT_SIZE: 0.01,
    MAX_LOT_SIZE: 100,
    DEFAULT_RISK_PERCENT: 2, // 2% per trade
    MAX_RISK_PERCENT: 5, // 5% per trade
    DEFAULT_STOP_LOSS_PIPS: 50,
    DEFAULT_TAKE_PROFIT_PIPS: 100
  },
  
  // Risk Management
  RISK_MANAGEMENT: {
    MAX_DRAWDOWN: 20, // 20% maximum drawdown
    MAX_DAILY_LOSS: 5, // 5% daily loss limit
    MAX_POSITION_SIZE: 10, // 10% of account per position
    CORRELATION_LIMIT: 0.7, // Maximum correlation between positions
    MAX_OPEN_POSITIONS: 5, // Maximum open positions
    MIN_RISK_REWARD_RATIO: 1.5 // Minimum risk:reward ratio
  },
  
  // Technical Analysis
  TECHNICAL_ANALYSIS: {
    DEFAULT_PERIODS: {
      SMA: [20, 50, 200],
      EMA: [12, 26, 50],
      RSI: 14,
      MACD: { fast: 12, slow: 26, signal: 9 },
      BOLLINGER_BANDS: { period: 20, stdDev: 2 },
      STOCHASTIC: { kPeriod: 14, dPeriod: 3 },
      ATR: 14,
      ADX: 14
    },
    
    SIGNAL_THRESHOLDS: {
      RSI_OVERSOLD: 30,
      RSI_OVERBOUGHT: 70,
      STOCHASTIC_OVERSOLD: 20,
      STOCHASTIC_OVERBOUGHT: 80,
      ADX_TREND: 25,
      VOLUME_THRESHOLD: 1.5 // 1.5x average volume
    }
  },
  
  // Backtesting Configuration
  BACKTESTING: {
    DEFAULT_INITIAL_BALANCE: 10000,
    DEFAULT_COMMISSION: 0.0001, // 1 pip per trade
    DEFAULT_SLIPPAGE: 0.0001, // 1 pip slippage
    MIN_DATA_POINTS: 1000, // Minimum data points for backtesting
    MAX_DATA_POINTS: 50000, // Maximum data points for backtesting
    DEFAULT_TIMEFRAME: 'hour',
    DEFAULT_MULTIPLIER: 1
  },
  
  // Notification Settings
  NOTIFICATIONS: {
    TRADE_EXECUTION: true,
    PROFIT_LOSS_ALERTS: true,
    DRAWDOWN_ALERTS: true,
    SYSTEM_STATUS: true,
    ERROR_ALERTS: true,
    PERFORMANCE_REPORTS: true
  },
  
  // Performance Metrics
  PERFORMANCE_METRICS: {
    SHARPE_RATIO_TARGET: 1.0,
    MAX_DRAWDOWN_TARGET: 10, // 10%
    PROFIT_FACTOR_TARGET: 1.5,
    WIN_RATE_TARGET: 60, // 60%
    RECOVERY_FACTOR_TARGET: 2.0,
    CALMAR_RATIO_TARGET: 1.0
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    INVALID_SYMBOL: 'Symbol forex tidak valid',
    INSUFFICIENT_DATA: 'Data tidak mencukupi untuk analisis',
    RATE_LIMIT_EXCEEDED: 'Rate limit terlampaui, coba lagi nanti',
    NETWORK_ERROR: 'Kesalahan jaringan, periksa koneksi internet',
    API_ERROR: 'Kesalahan API Polygon',
    INVALID_TIMEFRAME: 'Timeframe tidak valid',
    INSUFFICIENT_BALANCE: 'Saldo tidak mencukupi untuk trading',
    MAX_POSITIONS_REACHED: 'Jumlah posisi maksimum telah tercapai',
    RISK_LIMIT_EXCEEDED: 'Batas risiko telah terlampaui'
  },
  
  // Success Messages
  SUCCESS_MESSAGES: {
    TRADE_EXECUTED: 'Trade berhasil dieksekusi',
    POSITION_CLOSED: 'Posisi berhasil ditutup',
    ORDER_PLACED: 'Order berhasil ditempatkan',
    ORDER_CANCELLED: 'Order berhasil dibatalkan',
    DATA_RETRIEVED: 'Data berhasil diambil',
    BACKTEST_COMPLETED: 'Backtesting selesai',
    STRATEGY_SAVED: 'Strategi berhasil disimpan',
    SETTINGS_UPDATED: 'Pengaturan berhasil diperbarui'
  }
};

export default POLYGON_CONFIG;