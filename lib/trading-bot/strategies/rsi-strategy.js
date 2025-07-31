/**
 * RSI Trading Strategy - Siap Pakai
 * Buy ketika RSI < 30 (oversold)
 * Sell ketika RSI > 70 (overbought)
 */
class RSIStrategy {
  constructor(options = {}) {
    this.name = 'RSI Strategy';
    this.rsiPeriod = options.rsiPeriod || 14;
    this.oversoldLevel = options.oversoldLevel || 30;
    this.overboughtLevel = options.overboughtLevel || 70;
    this.stopLoss = options.stopLoss || 0.05; // 5%
    this.takeProfit = options.takeProfit || 0.10; // 10%
    this.positionSize = options.positionSize || 0.1; // 10% dari portfolio
  }

  /**
   * Analisis sinyal trading berdasarkan RSI
   */
  async analyzeSignal(marketData, technicalData) {
    try {
      const currentPrice = marketData.price;
      const currentRSI = technicalData.rsi[technicalData.rsi.length - 1]?.RSI;
      const previousRSI = technicalData.rsi[technicalData.rsi.length - 2]?.RSI;

      if (!currentRSI || !previousRSI) {
        return {
          signal: 'HOLD',
          reason: 'Data RSI tidak lengkap',
          confidence: 0
        };
      }

      // Buy Signal: RSI keluar dari oversold
      if (previousRSI <= this.oversoldLevel && currentRSI > this.oversoldLevel) {
        return {
          signal: 'BUY',
          reason: `RSI keluar dari oversold (${currentRSI.toFixed(2)})`,
          confidence: this.calculateConfidence(currentRSI, 'BUY'),
          entry: currentPrice,
          stopLoss: currentPrice * (1 - this.stopLoss),
          takeProfit: currentPrice * (1 + this.takeProfit),
          positionSize: this.positionSize
        };
      }

      // Sell Signal: RSI masuk ke overbought
      if (previousRSI <= this.overboughtLevel && currentRSI > this.overboughtLevel) {
        return {
          signal: 'SELL',
          reason: `RSI masuk overbought (${currentRSI.toFixed(2)})`,
          confidence: this.calculateConfidence(currentRSI, 'SELL'),
          entry: currentPrice,
          stopLoss: currentPrice * (1 + this.stopLoss),
          takeProfit: currentPrice * (1 - this.takeProfit),
          positionSize: this.positionSize
        };
      }

      // Hold Signal
      return {
        signal: 'HOLD',
        reason: `RSI normal (${currentRSI.toFixed(2)})`,
        confidence: 0
      };

    } catch (error) {
      console.error('Error analyzing RSI signal:', error);
      return {
        signal: 'HOLD',
        reason: 'Error dalam analisis',
        confidence: 0
      };
    }
  }

  /**
   * Hitung confidence level berdasarkan RSI
   */
  calculateConfidence(rsi, signal) {
    if (signal === 'BUY') {
      // Semakin rendah RSI, semakin tinggi confidence untuk buy
      if (rsi <= 20) return 0.9;
      if (rsi <= 25) return 0.8;
      if (rsi <= 30) return 0.7;
      return 0.5;
    }

    if (signal === 'SELL') {
      // Semakin tinggi RSI, semakin tinggi confidence untuk sell
      if (rsi >= 80) return 0.9;
      if (rsi >= 75) return 0.8;
      if (rsi >= 70) return 0.7;
      return 0.5;
    }

    return 0;
  }

  /**
   * Validasi kondisi market sebelum trade
   */
  validateMarketCondition(marketData) {
    // Cek volume minimum
    if (marketData.volume < 100000) {
      return {
        valid: false,
        reason: 'Volume terlalu rendah'
      };
    }

    // Cek volatilitas (spread antara high-low)
    const dayRange = (marketData.high - marketData.low) / marketData.low;
    if (dayRange > 0.15) { // Jika volatilitas > 15%
      return {
        valid: false,
        reason: 'Volatilitas terlalu tinggi'
      };
    }

    return {
      valid: true,
      reason: 'Kondisi market baik'
    };
  }

  /**
   * Update stop loss berdasarkan pergerakan harga
   */
  updateStopLoss(currentPrice, entryPrice, currentStopLoss, signal) {
    if (signal === 'BUY') {
      // Trailing stop loss untuk posisi buy
      const newStopLoss = currentPrice * (1 - this.stopLoss);
      return Math.max(newStopLoss, currentStopLoss);
    }

    if (signal === 'SELL') {
      // Trailing stop loss untuk posisi sell
      const newStopLoss = currentPrice * (1 + this.stopLoss);
      return Math.min(newStopLoss, currentStopLoss);
    }

    return currentStopLoss;
  }

  /**
   * Get strategy parameters
   */
  getParameters() {
    return {
      name: this.name,
      rsiPeriod: this.rsiPeriod,
      oversoldLevel: this.oversoldLevel,
      overboughtLevel: this.overboughtLevel,
      stopLoss: this.stopLoss,
      takeProfit: this.takeProfit,
      positionSize: this.positionSize
    };
  }
}

export default RSIStrategy;