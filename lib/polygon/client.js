import { restClient } from '@polygon.io/client-js';

/**
 * Polygon API Client untuk Platform Trading Indonesia
 * Menyediakan akses lengkap ke Polygon REST API untuk data forex real-time
 */
class PolygonClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    
    // Setup Polygon.io client
    this.client = restClient(apiKey);
  }

  /**
   * Mendapatkan harga real-time untuk forex pair
   */
  async getRealTimePrice(symbol) {
    try {
      const response = await this.client.forex.snapshot(symbol);
      
      if (!response.results) {
        return {
          success: false,
          error: 'Data tidak tersedia'
        };
      }
      
      const data = response.results;
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
        multiplier,
        timespan
      };

      if (from) params.from = from;
      if (to) params.to = to;

      const response = await this.client.forex.aggregates(symbol, multiplier, timespan, params);

      if (!response.results) {
        return {
          success: false,
          error: 'Data historis tidak tersedia'
        };
      }

      const candles = response.results.map(candle => ({
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
      const params = {};

      if (timestamp) params.timestamp = timestamp;

      const response = await this.client.forex.ticks(symbol, date, params);

      return {
        success: true,
        data: response.results || []
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
      const response = await this.client.forex.locales();
      
      return {
        success: true,
        data: response.results || []
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Mendapatkan fundamental data untuk forex
   */
  async getForexFundamentals(symbol) {
    try {
      const response = await this.client.forex.fundamentals(symbol);
      
      return {
        success: true,
        data: response.results || {}
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Mendapatkan berita forex
   */
  async getForexNews(symbol = null, publishedUtc = null) {
    try {
      const params = {};
      
      if (symbol) params.ticker = symbol;
      if (publishedUtc) params.publishedUtc = publishedUtc;

      const response = await this.client.reference.tickerNews(params);
      
      return {
        success: true,
        data: response.results || []
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Mendapatkan market sentiment
   */
  async getMarketSentiment(symbol) {
    try {
      // Get recent news for sentiment analysis
      const newsResponse = await this.getForexNews(symbol);
      
      if (!newsResponse.success) {
        return {
          success: false,
          error: 'Tidak dapat mengambil data sentiment'
        };
      }

      const sentiment = this.calculateSentiment(newsResponse.data);
      
      return {
        success: true,
        data: {
          symbol,
          sentiment: sentiment.overall,
          confidence: sentiment.confidence,
          factors: sentiment.factors,
          timestamp: new Date().toISOString()
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
   * Menghitung sentiment dari data berita
   */
  calculateSentiment(data) {
    if (!data || data.length === 0) {
      return {
        overall: 'neutral',
        confidence: 0.5,
        factors: []
      };
    }

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    const factors = [];

    data.forEach(item => {
      const title = item.title?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      const text = `${title} ${description}`;

      // Simple keyword-based sentiment analysis
      const positiveKeywords = ['bullish', 'positive', 'gain', 'rise', 'up', 'strong', 'growth'];
      const negativeKeywords = ['bearish', 'negative', 'loss', 'fall', 'down', 'weak', 'decline'];

      let score = 0;
      positiveKeywords.forEach(keyword => {
        if (text.includes(keyword)) score += 1;
      });
      negativeKeywords.forEach(keyword => {
        if (text.includes(keyword)) score -= 1;
      });

      if (score > 0) {
        positiveCount++;
        factors.push({ type: 'positive', text: item.title });
      } else if (score < 0) {
        negativeCount++;
        factors.push({ type: 'negative', text: item.title });
      } else {
        neutralCount++;
      }
    });

    const total = data.length;
    const positiveRatio = positiveCount / total;
    const negativeRatio = negativeCount / total;
    const neutralRatio = neutralCount / total;

    let overall = 'neutral';
    let confidence = neutralRatio;

    if (positiveRatio > negativeRatio && positiveRatio > neutralRatio) {
      overall = 'positive';
      confidence = positiveRatio;
    } else if (negativeRatio > positiveRatio && negativeRatio > neutralRatio) {
      overall = 'negative';
      confidence = negativeRatio;
    }

    return {
      overall,
      confidence,
      factors: factors.slice(0, 5) // Limit to top 5 factors
    };
  }

  /**
   * Validasi symbol forex
   */
  isValidForexSymbol(symbol) {
    if (!symbol) return false;
    
    // Format: C:XXX/YYY (e.g., C:EUR/USD)
    const forexPattern = /^C:[A-Z]{3}\/[A-Z]{3}$/;
    return forexPattern.test(symbol);
  }

  /**
   * Format symbol forex
   */
  formatForexSymbol(symbol) {
    if (!symbol) return null;
    
    // Remove spaces and convert to uppercase
    let formatted = symbol.replace(/\s+/g, '').toUpperCase();
    
    // If it's not already in C:XXX/YYY format, try to format it
    if (!formatted.startsWith('C:')) {
      // Check if it's a valid forex pair
      const pairMatch = formatted.match(/^([A-Z]{3})\/([A-Z]{3})$/);
      if (pairMatch) {
        formatted = `C:${pairMatch[1]}/${pairMatch[2]}`;
      }
    }
    
    return this.isValidForexSymbol(formatted) ? formatted : null;
  }

  /**
   * Handle error responses
   */
  handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error || error.message;
      
      switch (status) {
        case 401:
          return 'API key tidak valid atau tidak ada';
        case 403:
          return 'Akses ditolak. Periksa API key Anda';
        case 429:
          return 'Rate limit terlampaui. Coba lagi nanti';
        case 500:
          return 'Server error. Coba lagi nanti';
        default:
          return `Error ${status}: ${message}`;
      }
    }
    
    if (error.code === 'ECONNABORTED') {
      return 'Timeout. Periksa koneksi internet Anda';
    }
    
    return error.message || 'Error tidak diketahui';
  }
}

export default PolygonClient;