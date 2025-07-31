import axios from 'axios';

/**
 * Yahoo Finance API Client - 100% GRATIS tanpa API key
 * Backup untuk Alpha Vantage
 */
class YahooFinanceClient {
  constructor() {
    this.baseUrl = 'https://query1.finance.yahoo.com';
    
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
  }

  /**
   * Dapatkan harga real-time
   */
  async getCurrentPrice(symbol) {
    try {
      const response = await this.api.get(`/v8/finance/chart/${symbol}`);
      
      const result = response.data.chart.result[0];
      if (!result) {
        throw new Error('Data tidak ditemukan');
      }

      const meta = result.meta;
      const quote = result.indicators.quote[0];
      const timestamps = result.timestamp;
      const lastIndex = timestamps.length - 1;

      return {
        success: true,
        data: {
          symbol: meta.symbol,
          price: meta.regularMarketPrice || quote.close[lastIndex],
          change: meta.regularMarketPrice - meta.previousClose,
          changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100).toFixed(2) + '%',
          volume: meta.regularMarketVolume,
          high: meta.regularMarketDayHigh,
          low: meta.regularMarketDayLow,
          open: quote.open[lastIndex],
          previousClose: meta.previousClose,
          timestamp: new Date(timestamps[lastIndex] * 1000).toISOString()
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
   * Dapatkan data historis
   */
  async getHistoricalData(symbol, period1, period2, interval = '1d') {
    try {
      // Convert dates to timestamps
      const startTime = Math.floor(new Date(period1).getTime() / 1000);
      const endTime = Math.floor(new Date(period2).getTime() / 1000);

      const response = await this.api.get(`/v8/finance/chart/${symbol}`, {
        params: {
          period1: startTime,
          period2: endTime,
          interval: interval,
          includePrePost: false,
          events: 'div,splits'
        }
      });

      const result = response.data.chart.result[0];
      if (!result) {
        throw new Error('Data tidak ditemukan');
      }

      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];
      
      const data = timestamps.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: quote.open[index],
        high: quote.high[index],
        low: quote.low[index],
        close: quote.close[index],
        volume: quote.volume[index]
      })).filter(item => 
        item.open !== null && item.high !== null && 
        item.low !== null && item.close !== null
      );

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Dapatkan multiple quotes sekaligus
   */
  async getMultipleQuotes(symbols) {
    try {
      const symbolsStr = Array.isArray(symbols) ? symbols.join(',') : symbols;
      
      const response = await this.api.get('/v7/finance/quote', {
        params: {
          symbols: symbolsStr
        }
      });

      const quotes = response.data.quoteResponse.result;
      
      const data = quotes.map(quote => ({
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent?.toFixed(2) + '%',
        volume: quote.regularMarketVolume,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
        open: quote.regularMarketOpen,
        previousClose: quote.regularMarketPreviousClose,
        marketCap: quote.marketCap,
        shortName: quote.shortName,
        longName: quote.longName
      }));

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Search symbol
   */
  async searchSymbol(query) {
    try {
      const response = await this.api.get('/v1/finance/search', {
        params: {
          q: query,
          quotesCount: 10,
          newsCount: 0
        }
      });

      const quotes = response.data.quotes || [];
      
      return {
        success: true,
        data: quotes.map(quote => ({
          symbol: quote.symbol,
          name: quote.longname || quote.shortname,
          type: quote.quoteType,
          exchange: quote.exchange,
          sector: quote.sector,
          industry: quote.industry
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Dapatkan company info
   */
  async getCompanyInfo(symbol) {
    try {
      const response = await this.api.get(`/v10/finance/quoteSummary/${symbol}`, {
        params: {
          modules: 'summaryProfile,financialData,defaultKeyStatistics'
        }
      });

      const result = response.data.quoteSummary.result[0];
      
      return {
        success: true,
        data: {
          symbol: symbol,
          profile: result.summaryProfile,
          financialData: result.financialData,
          keyStats: result.defaultKeyStatistics
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
   * Handle error
   */
  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data?.chart?.error?.description || 'Server error',
        code: error.response.status,
        details: error.response.data
      };
    } else if (error.request) {
      return {
        message: 'Tidak dapat terhubung ke Yahoo Finance',
        code: 'NETWORK_ERROR',
        details: error.message
      };
    } else {
      return {
        message: error.message || 'Unknown error',
        code: 'UNKNOWN_ERROR',
        details: error
      };
    }
  }
}

export default YahooFinanceClient;