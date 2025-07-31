// Konfigurasi OANDA API untuk Platform Trading Indonesia
export const OANDA_CONFIG = {
  // Environment URLs
  PRACTICE_URL: 'https://api-fxpractice.oanda.com',
  LIVE_URL: 'https://api-fxtrade.oanda.com',
  STREAM_PRACTICE_URL: 'https://stream-fxpractice.oanda.com',
  STREAM_LIVE_URL: 'https://stream-fxtrade.oanda.com',
  
  // Default settings
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  
  // Supported instruments (pasangan mata uang utama)
  INSTRUMENTS: [
    'EUR_USD', 'GBP_USD', 'USD_JPY', 'USD_CHF', 'USD_CAD',
    'AUD_USD', 'NZD_USD', 'EUR_GBP', 'EUR_JPY', 'GBP_JPY',
    'CHF_JPY', 'CAD_JPY', 'AUD_JPY', 'NZD_JPY', 'EUR_CHF',
    'GBP_CHF', 'AUD_CHF', 'NZD_CHF', 'EUR_CAD', 'GBP_CAD',
    'AUD_CAD', 'NZD_CAD', 'EUR_AUD', 'GBP_AUD', 'EUR_NZD',
    'GBP_NZD', 'AUD_NZD'
  ]
};
