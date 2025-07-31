import axios from 'axios';

/**
 * Alpha Vantage API Client - GRATIS 500 calls/hari
 * API Key gratis dari: https://www.alphavantage.co/support/#api-key
 */
class AlphaVantageClient {
  constructor(apiKey) {
    this.apiKey = apiKey || 'demo'; // Demo key untuk testing
    this.baseUrl = 'https://www.alphavantage.co/query';
    
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000
    });
  }

  /**
   * Dapatkan harga real-time
   */
  async getCurrentPrice(symbol) {
    try {
      const response = await this.api.get('', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.apiKey
        }
      });

      const quote = response.data['Global Quote'];
      if (!quote) {
        throw new Error('Data tidak ditemukan');
      }

      return {
        success: true,
        data: {
          symbol: quote['01. symbol'],
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: quote['10. change percent'],
          volume: parseInt(quote['06. volume']),
          high: parseFloat(quote['03. high']),
          low: parseFloat(quote['04. low']),
          open: parseFloat(quote['02. open']),
          previousClose: parseFloat(quote['08. previous close']),
          timestamp: quote['07. latest trading day']
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
   * Dapatkan data historis untuk backtesting
   */
  async getHistoricalData(symbol, interval = 'daily', outputsize = 'compact') {
    try {
      const functionMap = {
        '1min': 'TIME_SERIES_INTRADAY',
        '5min': 'TIME_SERIES_INTRADAY', 
        '15min': 'TIME_SERIES_INTRADAY',
        '30min': 'TIME_SERIES_INTRADAY',
        '60min': 'TIME_SERIES_INTRADAY',
        'daily': 'TIME_SERIES_DAILY',
        'weekly': 'TIME_SERIES_WEEKLY',
        'monthly': 'TIME_SERIES_MONTHLY'
      };

      const params = {
        function: functionMap[interval] || 'TIME_SERIES_DAILY',
        symbol: symbol,
        apikey: this.apiKey,
        outputsize: outputsize
      };

      if (interval.includes('min')) {
        params.interval = interval;
      }

      const response = await this.api.get('', { params });
      
      const timeSeriesKey = Object.keys(response.data).find(key => 
        key.includes('Time Series')
      );
      
      if (!timeSeriesKey) {
        throw new Error('Data time series tidak ditemukan');
      }

      const timeSeries = response.data[timeSeriesKey];
      const data = Object.entries(timeSeries).map(([date, values]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'])
      })).reverse(); // Urutkan dari lama ke baru

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
   * Dapatkan indikator teknis (RSI, MACD, SMA)
   */
  async getTechnicalIndicator(symbol, indicator, interval = 'daily', params = {}) {
    try {
      const indicatorMap = {
        'RSI': 'RSI',
        'MACD': 'MACD', 
        'SMA': 'SMA',
        'EMA': 'EMA',
        'BBANDS': 'BBANDS',
        'STOCH': 'STOCH'
      };

      const queryParams = {
        function: indicatorMap[indicator],
        symbol: symbol,
        interval: interval,
        apikey: this.apiKey,
        ...params
      };

      // Set default parameters untuk setiap indikator
      if (indicator === 'RSI' && !params.time_period) {
        queryParams.time_period = 14;
      }
      if (indicator === 'SMA' && !params.time_period) {
        queryParams.time_period = 20;
      }
      if (indicator === 'EMA' && !params.time_period) {
        queryParams.time_period = 20;
      }

      const response = await this.api.get('', { params: queryParams });
      
      const dataKey = Object.keys(response.data).find(key => 
        key.includes('Technical Analysis')
      );
      
      if (!dataKey) {
        throw new Error('Data indikator teknis tidak ditemukan');
      }

      const technicalData = response.data[dataKey];
      const data = Object.entries(technicalData).map(([date, values]) => ({
        date,
        ...Object.fromEntries(
          Object.entries(values).map(([key, value]) => [
            key.replace(/^\d+\.\s*/, ''), // Remove numbering
            parseFloat(value) || value
          ])
        )
      })).reverse();

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
   * Search symbol/company
   */
  async searchSymbol(keywords) {
    try {
      const response = await this.api.get('', {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords: keywords,
          apikey: this.apiKey
        }
      });

      const matches = response.data.bestMatches || [];
      
      return {
        success: true,
        data: matches.map(match => ({
          symbol: match['1. symbol'],
          name: match['2. name'],
          type: match['3. type'],
          region: match['4. region'],
          marketOpen: match['5. marketOpen'],
          marketClose: match['6. marketClose'],
          timezone: match['7. timezone'],
          currency: match['8. currency'],
          matchScore: match['9. matchScore']
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
   * Handle error
   */
  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data?.['Error Message'] || 'Server error',
        code: error.response.status,
        details: error.response.data
      };
    } else if (error.request) {
      return {
        message: 'Tidak dapat terhubung ke Alpha Vantage',
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

export default AlphaVantageClient;