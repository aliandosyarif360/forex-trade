import axios from 'axios';
import { POLYGON_CONFIG } from './config';

/**
 * Polygon.io API Client untuk Platform Trading Indonesia
 * Menyediakan akses lengkap ke Polygon.io REST API dan WebSocket API
 */
class PolygonClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = POLYGON_CONFIG.BASE_URL;
    this.websocketUrl = POLYGON_CONFIG.WEBSOCKET_URL;
    
    // Setup axios instance
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: POLYGON_CONFIG.DEFAULT_TIMEOUT,
      params: {
        apikey: apiKey
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

        if (config.retry < POLYGON_CONFIG.MAX_RETRIES && 
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
   * Mendapatkan informasi ticker
   */
  async getTickerDetails(symbol) {
    try {
      const response = await this.api.get(`/v3/reference/tickers/${symbol}`);
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
   * Mendapatkan daftar ticker yang tersedia
   */
  async getTickers(market = 'stocks', active = true, limit = 1000) {
    try {
      const response = await this.api.get('/v3/reference/tickers', {
        params: {
          market,
          active,
          limit
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
   * Mendapatkan harga terkini untuk ticker
   */
  async getCurrentPrice(symbol) {
    try {
      const response = await this.api.get(`/v2/aggs/ticker/${symbol}/prev`);
      return {
        success: true,
        data: response.data.results[0]
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Mendapatkan snapshot harga untuk multiple tickers
   */
  async getCurrentPrices(symbols) {
    try {
      const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
      const response = await this.api.get(`/v2/snapshot/locale/us/markets/stocks/tickers`, {
        params: {
          tickers: symbolsParam
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
   * Mendapatkan data historis (aggregates/candlestick)
   */
  async getHistoricalData(symbol, multiplier = 1, timespan = 'minute', from, to, limit = 5000) {
    try {
      const response = await this.api.get(`/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}`, {
        params: {
          adjusted: true,
          sort: 'asc',
          limit
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
   * Mendapatkan trades terbaru untuk ticker
   */
  async getLatestTrades(symbol, limit = 1000) {
    try {
      const response = await this.api.get(`/v3/trades/${symbol}`, {
        params: {
          limit
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
   * Mendapatkan quotes terbaru untuk ticker
   */
  async getLatestQuotes(symbol, limit = 1000) {
    try {
      const response = await this.api.get(`/v3/quotes/${symbol}`, {
        params: {
          limit
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
   * Mendapatkan berita terkait ticker
   */
  async getTickerNews(symbol = '', limit = 1000, order = 'desc') {
    try {
      const params = {
        limit,
        order,
        sort: 'published_utc'
      };

      if (symbol) {
        params['ticker'] = symbol;
      }

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
   * Mendapatkan financials untuk ticker
   */
  async getFinancials(symbol, limit = 50) {
    try {
      const response = await this.api.get('/vX/reference/financials', {
        params: {
          ticker: symbol,
          limit
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
   * Mendapatkan dividends untuk ticker
   */
  async getDividends(symbol, limit = 1000) {
    try {
      const response = await this.api.get('/v3/reference/dividends', {
        params: {
          ticker: symbol,
          limit
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
   * Mendapatkan stock splits untuk ticker
   */
  async getStockSplits(symbol, limit = 1000) {
    try {
      const response = await this.api.get('/v3/reference/splits', {
        params: {
          ticker: symbol,
          limit
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
   * Mendapatkan market status
   */
  async getMarketStatus() {
    try {
      const response = await this.api.get('/v1/marketstatus/now');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Mendapatkan market holidays
   */
  async getMarketHolidays() {
    try {
      const response = await this.api.get('/v1/marketstatus/upcoming');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Create WebSocket connection for real-time data
   */
  createWebSocketConnection(onMessage, onError) {
    if (typeof WebSocket === 'undefined') {
      // For Node.js environment
      const WebSocket = require('ws');
    }

    const ws = new WebSocket(`${this.websocketUrl}/stocks`);
    
    ws.onopen = () => {
      // Authenticate
      ws.send(JSON.stringify({
        action: 'auth',
        params: this.apiKey
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage && onMessage(data);
      } catch (error) {
        onError && onError(error);
      }
    };

    ws.onerror = (error) => {
      onError && onError(error);
    };

    return ws;
  }

  /**
   * Subscribe to real-time trades
   */
  subscribeToTrades(symbols, websocket) {
    const symbolsArray = Array.isArray(symbols) ? symbols : [symbols];
    websocket.send(JSON.stringify({
      action: 'subscribe',
      params: symbolsArray.map(symbol => `T.${symbol}`)
    }));
  }

  /**
   * Subscribe to real-time quotes
   */
  subscribeToQuotes(symbols, websocket) {
    const symbolsArray = Array.isArray(symbols) ? symbols : [symbols];
    websocket.send(JSON.stringify({
      action: 'subscribe',
      params: symbolsArray.map(symbol => `Q.${symbol}`)
    }));
  }

  /**
   * Subscribe to real-time aggregates (minute bars)
   */
  subscribeToAggregates(symbols, websocket) {
    const symbolsArray = Array.isArray(symbols) ? symbols : [symbols];
    websocket.send(JSON.stringify({
      action: 'subscribe',
      params: symbolsArray.map(symbol => `AM.${symbol}`)
    }));
  }

  /**
   * Validasi ticker trading
   */
  isValidInstrument(symbol) {
    return POLYGON_CONFIG.INSTRUMENTS.includes(symbol);
  }

  /**
   * Handle error dengan format yang konsisten
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.error || 'Kesalahan server',
        code: error.response.status,
        details: error.response.data
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Tidak dapat terhubung ke server Polygon',
        code: 'NETWORK_ERROR',
        details: error.message
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'Terjadi kesalahan tidak diketahui',
        code: 'UNKNOWN_ERROR',
        details: error
      };
    }
  }
}

export default PolygonClient;