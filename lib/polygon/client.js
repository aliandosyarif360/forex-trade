import axios from 'axios';

/**
 * Polygon API Client untuk Platform Trading Indonesia
 * Menyediakan akses lengkap ke Polygon REST API untuk data forex real-time
 */
class PolygonClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.polygon.io';
    
    // Setup axios instance
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Setup retry logic
    this.setupRetryLogic();
  }

  setupRetryLogic() {
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        
        if (!config || !config.retry) {
          config.retry = 0;
        }

        if (config.retry < 3 && 
            (error.response?.status >= 500 || error.code === 'ECONNABORTED')) {
          config.retry++;
          
          // Exponential backoff
          const delay = Math.pow(2, config.retry) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.api(config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Mendapatkan harga real-time untuk forex pair
   */
  async getRealTimePrice(symbol) {
    try {
      const response = await this.api.get(`/v2/snapshot/locale/global/markets/forex/tickers/${symbol}/snapshot`, {
        params: { apikey: this.apiKey }
      });
      
      const data = response.data.results;
      return {
        success: true,
        data: {
          symbol: data.ticker,
          bid: parseFloat(data.session?.bid || 0),
          ask: parseFloat(data.session?.ask || 0),
          spread: parseFloat(data.session?.ask || 0) - parseFloat(data.session?.bid || 0),
          spreadPips: ((parseFloat(data.session?.ask || 0) - parseFloat(data.session?.bid || 0)) * 10000).toFixed(1),
          time: new Date(data.session?.timestamp).toISOString(),
          tradeable: true,
          status: 'active',
          liquidity: {
            bid: parseFloat(data.session?.bidSize || 0),
            ask: parseFloat(data.session?.askSize || 0)
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Mendapatkan data historis (candlestick) untuk forex
   */
  async getHistoricalData(symbol, multiplier = 1, timespan = 'hour', from, to) {
    try {
      const params = {
        apikey: this.apiKey,
        multiplier,
        timespan
      };

      if (from) params.from = from;
      if (to) params.to = to;

      const response = await this.api.get(`/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}`, {
        params
      });

      const candles = response.data.results.map(candle => ({
        time: candle.t,
        open: candle.o,
        high: candle.h,
        low: candle.l,
        close: candle.c,
        volume: candle.v,
        vwap: candle.vw,
        transactions: candle.n
      }));

      return {
        success: true,
        data: candles
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Mendapatkan data tick untuk analisis mikro
   */
  async getTicks(symbol, date, timestamp = null) {
    try {
      const params = {
        apikey: this.apiKey
      };

      if (timestamp) params.timestamp = timestamp;

      const response = await this.api.get(`/v2/ticks/stocks/trades/${symbol}/${date}`, {
        params
      });

      return {
        success: true,
        data: response.data.results
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Mendapatkan daftar forex pairs yang tersedia
   */
  async getForexPairs() {
    try {
      const response = await this.api.get('/v3/reference/tickers', {
        params: {
          apikey: this.apiKey,
          market: 'fx',
          active: true,
          limit: 1000
        }
      });

      return {
        success: true,
        data: response.data.results
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Mendapatkan data fundamental untuk forex
   */
  async getForexFundamentals(symbol) {
    try {
      const response = await this.api.get(`/v2/reference/tickers/${symbol}`, {
        params: { apikey: this.apiKey }
      });

      return {
        success: true,
        data: response.data.results
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Mendapatkan data news yang relevan untuk forex
   */
  async getForexNews(symbol = null, publishedUtc = null) {
    try {
      const params = {
        apikey: this.apiKey,
        topic: 'forex'
      };

      if (symbol) params.ticker = symbol;
      if (publishedUtc) params.published_utc = publishedUtc;

      const response = await this.api.get('/v2/reference/news', {
        params
      });

      return {
        success: true,
        data: response.data.results
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Mendapatkan data market sentiment
   */
  async getMarketSentiment(symbol) {
    try {
      const response = await this.api.get(`/v2/snapshot/locale/global/markets/forex/tickers/${symbol}/snapshot`, {
        params: { apikey: this.apiKey }
      });

      const data = response.data.results;
      
      // Hitung sentiment berdasarkan volume dan price action
      const sentiment = this.calculateSentiment(data);

      return {
        success: true,
        data: {
          symbol: data.ticker,
          sentiment,
          volume: data.session?.volume || 0,
          priceChange: data.session?.change || 0,
          priceChangePercent: data.session?.changePercent || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Hitung sentiment berdasarkan data market
   */
  calculateSentiment(data) {
    const change = data.session?.change || 0;
    const volume = data.session?.volume || 0;
    
    let sentiment = 'neutral';
    
    if (change > 0 && volume > 1000000) {
      sentiment = 'bullish';
    } else if (change < 0 && volume > 1000000) {
      sentiment = 'bearish';
    }
    
    return sentiment;
  }

  /**
   * Validasi symbol forex
   */
  isValidForexSymbol(symbol) {
    const validSymbols = [
      'C:EUR/USD', 'C:GBP/USD', 'C:USD/JPY', 'C:USD/CHF',
      'C:AUD/USD', 'C:USD/CAD', 'C:NZD/USD', 'C:EUR/GBP',
      'C:EUR/JPY', 'C:GBP/JPY', 'C:CHF/JPY', 'C:EUR/CHF',
      'C:GBP/CHF', 'C:AUD/JPY', 'C:NZD/JPY', 'C:CAD/JPY'
    ];
    
    return validSymbols.includes(symbol);
  }

  /**
   * Konversi symbol forex ke format yang sesuai
   */
  formatForexSymbol(symbol) {
    // Konversi dari format EUR_USD ke C:EUR/USD
    if (symbol.includes('_')) {
      const parts = symbol.split('_');
      return `C:${parts[0]}/${parts[1]}`;
    }
    
    // Jika sudah dalam format yang benar
    if (symbol.startsWith('C:')) {
      return symbol;
    }
    
    // Default conversion
    return `C:${symbol}`;
  }

  /**
   * Handle error dengan format yang konsisten
   */
  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data?.error || 'Kesalahan server Polygon',
        code: error.response.status,
        details: error.response.data
      };
    } else if (error.request) {
      return {
        message: 'Tidak dapat terhubung ke server Polygon',
        code: 'NETWORK_ERROR',
        details: error.message
      };
    } else {
      return {
        message: error.message || 'Terjadi kesalahan tidak diketahui',
        code: 'UNKNOWN_ERROR',
        details: error
      };
    }
  }
}

export default PolygonClient;