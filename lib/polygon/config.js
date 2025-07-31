// Konfigurasi Polygon.io API untuk Platform Trading Indonesia
export const POLYGON_CONFIG = {
  // Environment URLs
  BASE_URL: 'https://api.polygon.io',
  WEBSOCKET_URL: 'wss://socket.polygon.io',
  
  // Default settings
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  
  // Supported instruments (saham utama US)
  INSTRUMENTS: [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
    'BABA', 'V', 'JPM', 'JNJ', 'WMT', 'PG', 'UNH', 'MA', 'HD', 'BAC',
    'DIS', 'ADBE', 'CRM', 'NFLX', 'PYPL', 'INTC', 'CMCSA', 'PFE',
    'VZ', 'T', 'KO', 'PEP', 'ABT', 'TMO', 'COST', 'AVGO', 'TXN',
    'QCOM', 'HON', 'IBM', 'ORCL', 'ACN', 'MDT', 'LLY', 'NKE',
    'MRK', 'ABBV', 'CVX', 'XOM', 'WFC', 'BMY', 'LIN', 'AMGN'
  ],
  
  // Timeframes yang didukung (Polygon format)
  TIMEFRAMES: {
    '1/minute': '1 menit',
    '5/minute': '5 menit',
    '10/minute': '10 menit',
    '15/minute': '15 menit',
    '30/minute': '30 menit',
    '1/hour': '1 jam',
    '2/hour': '2 jam',
    '4/hour': '4 jam',
    '1/day': '1 hari',
    '1/week': '1 minggu',
    '1/month': '1 bulan',
    '1/quarter': '1 kuartal',
    '1/year': '1 tahun'
  },
  
  // Market types
  MARKET_TYPES: {
    STOCKS: 'stocks',
    OPTIONS: 'options',
    FOREX: 'fx',
    CRYPTO: 'crypto'
  },
  
  // Risk management defaults
  RISK_MANAGEMENT: {
    MAX_POSITION_SIZE: 10000, // USD
    MIN_TRADE_SIZE: 1, // shares
    MAX_TRADE_SIZE: 1000, // shares
    DEFAULT_STOP_LOSS: 2, // percent
    DEFAULT_TAKE_PROFIT: 4, // percent
    MAX_DAILY_LOSS: 500 // USD
  },

  // Instrument labels dalam bahasa Indonesia
  INSTRUMENT_LABELS: {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'NFLX': 'Netflix Inc.',
    'BABA': 'Alibaba Group',
    'V': 'Visa Inc.',
    'JPM': 'JPMorgan Chase & Co.',
    'JNJ': 'Johnson & Johnson',
    'WMT': 'Walmart Inc.',
    'PG': 'Procter & Gamble',
    'UNH': 'UnitedHealth Group'
  },

  // WebSocket channels
  WEBSOCKET_CHANNELS: {
    TRADES: 'T',
    QUOTES: 'Q',
    AGGREGATE_MINUTE: 'AM',
    AGGREGATE_SECOND: 'A'
  }
};

// Fungsi untuk mendapatkan URL berdasarkan endpoint
export const getPolygonUrl = (endpoint = '') => {
  return `${POLYGON_CONFIG.BASE_URL}${endpoint}`;
};

// Fungsi untuk mendapatkan WebSocket URL
export const getPolygonWebSocketUrl = () => {
  return POLYGON_CONFIG.WEBSOCKET_URL;
};

// Validasi instrument
export const isValidInstrument = (instrument) => {
  return POLYGON_CONFIG.INSTRUMENTS.includes(instrument);
};

// Validasi timeframe
export const isValidTimeframe = (timeframe) => {
  return Object.keys(POLYGON_CONFIG.TIMEFRAMES).includes(timeframe);
};

// Mendapatkan label instrumen dalam bahasa Indonesia
export const getInstrumentLabel = (instrument) => {
  return POLYGON_CONFIG.INSTRUMENT_LABELS[instrument] || instrument;
};

// Format timeframe untuk Polygon API
export const formatTimeframe = (timeframe) => {
  const mapping = {
    '1m': '1/minute',
    '5m': '5/minute',
    '15m': '15/minute',
    '30m': '30/minute',
    '1h': '1/hour',
    '4h': '4/hour',
    '1d': '1/day',
    '1w': '1/week',
    '1M': '1/month'
  };
  return mapping[timeframe] || timeframe;
};