import { restClient } from '@polygon.io/client-js';
import { POLYGON_CONFIG } from './config.js';

/**
 * Polygon API Client untuk Platform Trading Indonesia
 * Menyediakan akses lengkap ke Polygon REST API untuk data forex real-time
 */
class PolygonClient {
  constructor(apiKey) {
    if (!apiKey || apiKey.includes('demo')) {
      throw new Error('API Key Polygon yang valid diperlukan');
    }
    
    this.apiKey = apiKey;
    
    // Setup Polygon.io client dengan validasi
    try {
      this.client = restClient(apiKey);
    } catch (error) {
      throw new Error(`Gagal menginisialisasi Polygon client: ${error.message}`);
    }
  }

  /**
   * Validasi koneksi ke Polygon API
   */
  async validateConnection() {
    try {
      const testSymbol = 'C:EUR/USD';
      const response = await this.client.forex.snapshot(testSymbol);
      return response && response.results;
    } catch (error) {
      return false;
    }
  }

  /**
   * Mendapatkan harga real-time untuk forex pair dengan validasi data
   */
  async getRealTimePrice(symbol) {
    try {
      // Validasi symbol
      if (!this.isValidForexSymbol(symbol)) {
        return {
          success: false,
          error: `Symbol tidak valid: ${symbol}`
        };
      }

      const response = await this.client.forex.snapshot(symbol);
      
      if (!response.results) {
        return {
          success: false,
          error: 'Data real-time tidak tersedia'
        };
      }
      
      const data = response.results;
      
      // Validasi data quality
      if (!data.session || !data.session.bid || !data.session.ask) {
        return {
          success: false,
          error: 'Data harga tidak lengkap'
        };
      }

      const bid = parseFloat(data.session.bid);
      const ask = parseFloat(data.session.ask);
      const spread = ask - bid;
      const spreadPips = (spread * 10000).toFixed(1);

      // Validasi spread yang masuk akal
      if (spread <= 0 || spread > POLYGON_CONFIG.TRADING.MAX_SPREAD) {
        return {
          success: false,
          error: `Spread tidak valid: ${spreadPips} pips`
        };
      }

      return {
        success: true,
        data: {
          symbol: data.ticker,
          bid,
          ask,
          spread,
          spreadPips,
          time: new Date(data.session.timestamp).toISOString(),
          tradeable: data.session.tradeable || true,
          status: 'active',
          liquidity: {
            bid: parseFloat(data.session.bidSize || 0),
            ask: parseFloat(data.session.askSize || 0)
          },
          lastUpdate: new Date().toISOString()
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
   * Mendapatkan data historis (candlestick) untuk forex dengan validasi ketat
   */
  async getHistoricalData(symbol, multiplier = 1, timespan = 'hour', from, to) {
    try {
      // Validasi input
      if (!this.isValidForexSymbol(symbol)) {
        return {
          success: false,
          error: `Symbol tidak valid: ${symbol}`
        };
      }

      if (!Object.values(POLYGON_CONFIG.TIMEFRAMES).includes(timespan)) {
        return {
          success: false,
          error: `Timeframe tidak valid: ${timespan}`
        };
      }

      const validMultipliers = POLYGON_CONFIG.MULTIPLIERS[timespan.toUpperCase()] || [1];
      if (!validMultipliers.includes(multiplier)) {
        return {
          success: false,
          error: `Multiplier tidak valid untuk timeframe ${timespan}: ${multiplier}`
        };
      }

      const params = {
        multiplier,
        timespan
      };

      if (from) params.from = from;
      if (to) params.to = to;

      console.log(`Mengambil data historis untuk ${symbol} dengan parameter:`, params);

      const response = await this.client.forex.aggregates(symbol, multiplier, timespan, params);

      if (!response.results || response.results.length === 0) {
        return {
          success: false,
          error: 'Data historis tidak tersedia atau kosong'
        };
      }

      // Validasi dan transformasi data
      const candles = [];
      let invalidBars = 0;

      for (const candle of response.results) {
        // Validasi data bar
        if (!candle.t || !candle.o || !candle.h || !candle.l || !candle.c) {
          invalidBars++;
          continue;
        }

        // Validasi konsistensi data
        if (candle.h < candle.l || candle.o < 0 || candle.c < 0) {
          invalidBars++;
          continue;
        }

        candles.push({
          time: candle.t,
          open: parseFloat(candle.o),
          high: parseFloat(candle.h),
          low: parseFloat(candle.l),
          close: parseFloat(candle.c),
          volume: parseFloat(candle.v || 0),
          vwap: parseFloat(candle.vw || 0),
          transactions: parseInt(candle.n || 0)
        });
      }

      // Cek kualitas data
      if (invalidBars > response.results.length * 0.1) { // Lebih dari 10% data invalid
        return {
          success: false,
          error: `Data historis memiliki terlalu banyak bar yang tidak valid: ${invalidBars}/${response.results.length}`
        };
      }

      if (candles.length < POLYGON_CONFIG.BACKTESTING.MIN_DATA_POINTS) {
        return {
          success: false,
          error: `Data tidak mencukupi untuk analisis. Minimal ${POLYGON_CONFIG.BACKTESTING.MIN_DATA_POINTS} bars, tersedia: ${candles.length}`
        };
      }

      console.log(`Berhasil mengambil ${candles.length} bars data historis untuk ${symbol}`);
      console.log(`Data quality: ${invalidBars} invalid bars dari ${response.results.length} total bars`);

      return {
        success: true,
        data: candles,
        metadata: {
          symbol,
          multiplier,
          timespan,
          from,
          to,
          totalBars: response.results.length,
          validBars: candles.length,
          invalidBars,
          dataQuality: invalidBars / response.results.length < 0.05 ? 'good' : 'poor'
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
   * Mendapatkan tick data untuk analisis detail
   */
  async getTicks(symbol, date, timestamp = null) {
    try {
      if (!this.isValidForexSymbol(symbol)) {
        return {
          success: false,
          error: `Symbol tidak valid: ${symbol}`
        };
      }

      const params = { date };
      if (timestamp) params.timestamp = timestamp;

      const response = await this.client.forex.trades(symbol, params);

      if (!response.results) {
        return {
          success: false,
          error: 'Tick data tidak tersedia'
        };
      }

      const ticks = response.results.map(tick => ({
        price: parseFloat(tick.p),
        size: parseFloat(tick.s),
        timestamp: tick.t,
        exchange: tick.x,
        conditions: tick.c
      }));

      return {
        success: true,
        data: ticks
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
      const response = await this.client.reference.tickers({
        type: 'CS',
        market: 'fx'
      });

      if (!response.results) {
        return {
          success: false,
          error: 'Data forex pairs tidak tersedia'
        };
      }

      const pairs = response.results
        .filter(ticker => ticker.ticker.startsWith('C:'))
        .map(ticker => ({
          symbol: ticker.ticker,
          name: ticker.name,
          market: ticker.market,
          locale: ticker.locale,
          primaryExch: ticker.primaryExch,
          type: ticker.type,
          active: ticker.active,
          currencyName: ticker.currencyName
        }));

      return {
        success: true,
        data: pairs
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
      if (!this.isValidForexSymbol(symbol)) {
        return {
          success: false,
          error: `Symbol tidak valid: ${symbol}`
        };
      }

      const response = await this.client.reference.tickerDetails(symbol);

      if (!response.results) {
        return {
          success: false,
          error: 'Data fundamental tidak tersedia'
        };
      }

      return {
        success: true,
        data: response.results
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Mendapatkan news untuk forex
   */
  async getForexNews(symbol = null, publishedUtc = null) {
    try {
      const params = {
        topic: 'forex'
      };

      if (symbol) params.ticker = symbol;
      if (publishedUtc) params.publishedUtc = publishedUtc;

      const response = await this.client.reference.tickerNews(params);

      if (!response.results) {
        return {
          success: false,
          error: 'Data news tidak tersedia'
        };
      }

      const news = response.results.map(article => ({
        id: article.id,
        title: article.title,
        description: article.description,
        author: article.author,
        publishedUtc: article.publishedUtc,
        articleUrl: article.articleUrl,
        tickers: article.tickers,
        imageUrl: article.imageUrl,
        keywords: article.keywords
      }));

      return {
        success: true,
        data: news
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Mendapatkan market sentiment untuk forex pair
   */
  async getMarketSentiment(symbol) {
    try {
      if (!this.isValidForexSymbol(symbol)) {
        return {
          success: false,
          error: `Symbol tidak valid: ${symbol}`
        };
      }

      // Get recent price data untuk sentiment analysis
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];

      const priceData = await this.getHistoricalData(symbol, 1, 'day', from, to);

      if (!priceData.success) {
        return {
          success: false,
          error: 'Gagal mendapatkan data harga untuk sentiment analysis'
        };
      }

      const sentiment = this.calculateSentiment(priceData.data);

      return {
        success: true,
        data: {
          symbol,
          sentiment,
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
   * Menghitung sentiment berdasarkan data harga
   */
  calculateSentiment(data) {
    if (!data || data.length < 10) {
      return {
        score: 0,
        trend: 'neutral',
        confidence: 0,
        indicators: {}
      };
    }

    const prices = data.map(d => d.close);
    const volumes = data.map(d => d.volume);

    // Calculate technical indicators
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const rsi = this.calculateRSI(prices, 14);
    const volatility = this.calculateVolatility(prices);

    // Calculate sentiment score
    let score = 0;
    let confidence = 0;
    const indicators = {};

    // Trend analysis
    if (sma20 > sma50) {
      score += 0.3;
      indicators.trend = 'bullish';
    } else {
      score -= 0.3;
      indicators.trend = 'bearish';
    }

    // RSI analysis
    if (rsi < 30) {
      score += 0.2;
      indicators.rsi = 'oversold';
    } else if (rsi > 70) {
      score -= 0.2;
      indicators.rsi = 'overbought';
    } else {
      indicators.rsi = 'neutral';
    }

    // Volatility analysis
    if (volatility > 0.02) {
      score += 0.1;
      indicators.volatility = 'high';
    } else {
      indicators.volatility = 'low';
    }

    // Volume analysis
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const currentVolume = volumes[volumes.length - 1];
    if (currentVolume > avgVolume * 1.5) {
      score += 0.1;
      indicators.volume = 'high';
    } else if (currentVolume < avgVolume * 0.5) {
      score -= 0.1;
      indicators.volume = 'low';
    } else {
      indicators.volume = 'normal';
    }

    // Normalize score to -1 to 1
    score = Math.max(-1, Math.min(1, score));

    // Calculate confidence based on data quality
    confidence = Math.min(1, data.length / 100);

    let trend;
    if (score > 0.3) trend = 'bullish';
    else if (score < -0.3) trend = 'bearish';
    else trend = 'neutral';

    return {
      score: parseFloat(score.toFixed(3)),
      trend,
      confidence: parseFloat(confidence.toFixed(3)),
      indicators,
      technicalIndicators: {
        sma20: sma20[sma20.length - 1],
        sma50: sma50[sma50.length - 1],
        rsi: rsi[rsi.length - 1],
        volatility: parseFloat(volatility.toFixed(4))
      }
    };
  }

  /**
   * Calculate Simple Moving Average
   */
  calculateSMA(data, period) {
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  /**
   * Calculate RSI
   */
  calculateRSI(data, period) {
    const rsi = [];
    const gains = [];
    const losses = [];

    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    for (let i = period; i < gains.length; i++) {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      
      const rs = avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      rsi.push(rsiValue);
    }

    return rsi;
  }

  /**
   * Calculate Volatility
   */
  calculateVolatility(data) {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i] - data[i - 1]) / data[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  /**
   * Validasi symbol forex
   */
  isValidForexSymbol(symbol) {
    return POLYGON_CONFIG.FOREX_SYMBOLS.includes(symbol);
  }

  /**
   * Format symbol forex
   */
  formatForexSymbol(symbol) {
    if (symbol.startsWith('C:')) {
      return symbol;
    }
    
    // Convert common formats to Polygon format
    const formatted = symbol.replace('/', '').toUpperCase();
    return `C:${formatted}`;
  }

  /**
   * Handle error dengan detail yang lebih baik
   */
  handleError(error) {
    console.error('Polygon API Error:', error);

    if (error.status === 401) {
      return 'API key tidak valid atau expired';
    } else if (error.status === 403) {
      return 'Akses ditolak. Periksa permissions API key';
    } else if (error.status === 429) {
      return 'Rate limit terlampaui. Coba lagi nanti';
    } else if (error.status === 500) {
      return 'Server error dari Polygon API';
    } else if (error.code === 'ENOTFOUND') {
      return 'Gagal terhubung ke Polygon API. Periksa koneksi internet';
    } else if (error.code === 'ECONNRESET') {
      return 'Koneksi terputus. Coba lagi';
    } else {
      return error.message || 'Error tidak diketahui';
    }
  }
}

export default PolygonClient;