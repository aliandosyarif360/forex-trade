import { POLYGON_CONFIG } from '../../polygon/config.js';

/**
 * Realistic Forex Trading Strategy
 * Menggunakan analisis teknikal yang realistis dan risk management yang proper
 */
class RealisticForexStrategy {
  constructor(options = {}) {
    this.name = options.name || 'Realistic Forex Strategy';
    this.description = options.description || 'Strategi forex yang realistis dengan analisis teknikal dan risk management';
    
    // Technical analysis parameters
    this.rsiPeriod = options.rsiPeriod || POLYGON_CONFIG.TECHNICAL_ANALYSIS.DEFAULT_PERIODS.RSI;
    this.smaPeriods = options.smaPeriods || POLYGON_CONFIG.TECHNICAL_ANALYSIS.DEFAULT_PERIODS.SMA;
    this.emaPeriods = options.emaPeriods || POLYGON_CONFIG.TECHNICAL_ANALYSIS.DEFAULT_PERIODS.EMA;
    this.atrPeriod = options.atrPeriod || POLYGON_CONFIG.TECHNICAL_ANALYSIS.DEFAULT_PERIODS.ATR;
    this.adxPeriod = options.adxPeriod || POLYGON_CONFIG.TECHNICAL_ANALYSIS.DEFAULT_PERIODS.ADX;
    
    // Signal thresholds
    this.rsiOversold = options.rsiOversold || POLYGON_CONFIG.TECHNICAL_ANALYSIS.SIGNAL_THRESHOLDS.RSI_OVERSOLD;
    this.rsiOverbought = options.rsiOverbought || POLYGON_CONFIG.TECHNICAL_ANALYSIS.SIGNAL_THRESHOLDS.RSI_OVERBOUGHT;
    this.adxTrend = options.adxTrend || POLYGON_CONFIG.TECHNICAL_ANALYSIS.SIGNAL_THRESHOLDS.ADX_TREND;
    this.volumeThreshold = options.volumeThreshold || POLYGON_CONFIG.TECHNICAL_ANALYSIS.SIGNAL_THRESHOLDS.VOLUME_THRESHOLD;
    
    // Risk management
    this.stopLossPips = options.stopLossPips || POLYGON_CONFIG.TRADING.DEFAULT_STOP_LOSS_PIPS;
    this.takeProfitPips = options.takeProfitPips || POLYGON_CONFIG.TRADING.DEFAULT_TAKE_PROFIT_PIPS;
    this.minRiskRewardRatio = options.minRiskRewardRatio || POLYGON_CONFIG.RISK_MANAGEMENT.MIN_RISK_REWARD_RATIO;
    
    // Trading rules
    this.maxOpenPositions = options.maxOpenPositions || POLYGON_CONFIG.RISK_MANAGEMENT.MAX_OPEN_POSITIONS;
    this.minVolume = options.minVolume || POLYGON_CONFIG.TRADING.MIN_VOLUME;
    this.maxSpread = options.maxSpread || POLYGON_CONFIG.TRADING.MAX_SPREAD;
    
    // State tracking
    this.lastSignal = null;
    this.consecutiveLosses = 0;
    this.consecutiveWins = 0;
  }

  /**
   * Analisis data dan generate sinyal trading
   */
  async analyze(historicalData, currentBar, context = {}) {
    try {
      const signals = [];
      
      // Validasi data
      if (historicalData.length < Math.max(...this.smaPeriods, this.rsiPeriod, this.atrPeriod)) {
        return signals;
      }
      
      // Cek market conditions
      if (!this.checkMarketConditions(currentBar, context)) {
        return signals;
      }
      
      // Hitung technical indicators
      const indicators = this.calculateIndicators(historicalData, currentBar);
      
      // Generate signals berdasarkan analisis
      const buySignal = this.generateBuySignal(indicators, currentBar, context);
      const sellSignal = this.generateSellSignal(indicators, currentBar, context);
      
      if (buySignal) {
        signals.push(buySignal);
      }
      
      if (sellSignal) {
        signals.push(sellSignal);
      }
      
      // Update state
      this.updateStrategyState(signals, context);
      
      return signals;
      
    } catch (error) {
      console.error('Error dalam analisis strategi:', error);
      return [];
    }
  }

  /**
   * Cek kondisi market
   */
  checkMarketConditions(currentBar, context) {
    // Cek volume
    if (currentBar.volume < this.minVolume) {
      return false;
    }
    
    // Cek spread (simulasi)
    const spread = this.calculateSpread(currentBar);
    if (spread > this.maxSpread) {
      return false;
    }
    
    // Cek maximum open positions
    if (context.openPositions >= this.maxOpenPositions) {
      return false;
    }
    
    // Cek daily loss limit
    if (context.dailyPnL < -(context.currentBalance * 0.05)) { // 5% daily loss
      return false;
    }
    
    return true;
  }

  /**
   * Hitung technical indicators
   */
  calculateIndicators(historicalData, currentBar) {
    const indicators = {};
    
    // SMA
    this.smaPeriods.forEach(period => {
      indicators[`sma${period}`] = this.calculateSMA(historicalData, period);
    });
    
    // EMA
    this.emaPeriods.forEach(period => {
      indicators[`ema${period}`] = this.calculateEMA(historicalData, period);
    });
    
    // RSI
    indicators.rsi = this.calculateRSI(historicalData, this.rsiPeriod);
    
    // ATR
    indicators.atr = this.calculateATR(historicalData, this.atrPeriod);
    
    // ADX
    indicators.adx = this.calculateADX(historicalData, this.adxPeriod);
    
    // Volume analysis
    indicators.volumeSMA = this.calculateVolumeSMA(historicalData, 20);
    indicators.volumeRatio = currentBar.volume / indicators.volumeSMA;
    
    // Price action
    indicators.priceChange = this.calculatePriceChange(historicalData, 5);
    indicators.volatility = this.calculateVolatility(historicalData, 20);
    
    return indicators;
  }

  /**
   * Generate buy signal
   */
  generateBuySignal(indicators, currentBar, context) {
    // Kondisi untuk buy signal
    const conditions = [];
    
    // 1. Trend analysis - SMA crossover
    if (indicators.sma20 && indicators.sma50) {
      const smaCrossover = indicators.sma20 > indicators.sma50;
      conditions.push(smaCrossover);
    }
    
    // 2. RSI oversold condition
    if (indicators.rsi) {
      const rsiOversold = indicators.rsi < this.rsiOversold;
      conditions.push(rsiOversold);
    }
    
    // 3. Volume confirmation
    const volumeConfirmation = indicators.volumeRatio > this.volumeThreshold;
    conditions.push(volumeConfirmation);
    
    // 4. ADX trend strength
    if (indicators.adx) {
      const strongTrend = indicators.adx > this.adxTrend;
      conditions.push(strongTrend);
    }
    
    // 5. Price action confirmation
    const bullishCandle = currentBar.close > currentBar.open;
    conditions.push(bullishCandle);
    
    // 6. Risk management check
    const riskCheck = this.checkRiskManagement(context, 'BUY');
    conditions.push(riskCheck);
    
    // Jika semua kondisi terpenuhi
    if (conditions.every(condition => condition)) {
      const stopLoss = this.calculateStopLoss(currentBar, 'BUY', indicators.atr);
      const takeProfit = this.calculateTakeProfit(currentBar, 'BUY', indicators.atr);
      
      // Cek risk:reward ratio
      const riskRewardRatio = this.calculateRiskRewardRatio(stopLoss, takeProfit, currentBar.close, 'BUY');
      if (riskRewardRatio >= this.minRiskRewardRatio) {
        return {
          action: 'BUY',
          instrument: context.symbol || 'C:EUR/USD',
          lotSize: this.calculateLotSize(context.currentBalance, stopLoss, currentBar.close),
          stopLoss,
          takeProfit,
          price: currentBar.close,
          reason: 'Technical Analysis - Bullish Signal',
          confidence: this.calculateSignalConfidence(indicators, 'BUY')
        };
      }
    }
    
    return null;
  }

  /**
   * Generate sell signal
   */
  generateSellSignal(indicators, currentBar, context) {
    // Kondisi untuk sell signal
    const conditions = [];
    
    // 1. Trend analysis - SMA crossover
    if (indicators.sma20 && indicators.sma50) {
      const smaCrossover = indicators.sma20 < indicators.sma50;
      conditions.push(smaCrossover);
    }
    
    // 2. RSI overbought condition
    if (indicators.rsi) {
      const rsiOverbought = indicators.rsi > this.rsiOverbought;
      conditions.push(rsiOverbought);
    }
    
    // 3. Volume confirmation
    const volumeConfirmation = indicators.volumeRatio > this.volumeThreshold;
    conditions.push(volumeConfirmation);
    
    // 4. ADX trend strength
    if (indicators.adx) {
      const strongTrend = indicators.adx > this.adxTrend;
      conditions.push(strongTrend);
    }
    
    // 5. Price action confirmation
    const bearishCandle = currentBar.close < currentBar.open;
    conditions.push(bearishCandle);
    
    // 6. Risk management check
    const riskCheck = this.checkRiskManagement(context, 'SELL');
    conditions.push(riskCheck);
    
    // Jika semua kondisi terpenuhi
    if (conditions.every(condition => condition)) {
      const stopLoss = this.calculateStopLoss(currentBar, 'SELL', indicators.atr);
      const takeProfit = this.calculateTakeProfit(currentBar, 'SELL', indicators.atr);
      
      // Cek risk:reward ratio
      const riskRewardRatio = this.calculateRiskRewardRatio(stopLoss, takeProfit, currentBar.close, 'SELL');
      if (riskRewardRatio >= this.minRiskRewardRatio) {
        return {
          action: 'SELL',
          instrument: context.symbol || 'C:EUR/USD',
          lotSize: this.calculateLotSize(context.currentBalance, stopLoss, currentBar.close),
          stopLoss,
          takeProfit,
          price: currentBar.close,
          reason: 'Technical Analysis - Bearish Signal',
          confidence: this.calculateSignalConfidence(indicators, 'SELL')
        };
      }
    }
    
    return null;
  }

  /**
   * Hitung technical indicators
   */
  calculateSMA(data, period) {
    if (data.length < period) return null;
    
    const recentData = data.slice(-period);
    const sum = recentData.reduce((acc, bar) => acc + bar.close, 0);
    return sum / period;
  }

  calculateEMA(data, period) {
    if (data.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = data[0].close;
    
    for (let i = 1; i < data.length; i++) {
      ema = (data[i].close * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  calculateRSI(data, period) {
    if (data.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = data[data.length - i].close - data[data.length - i - 1].close;
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateATR(data, period) {
    if (data.length < period + 1) return null;
    
    const trueRanges = [];
    
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = data[i - 1].close;
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    const recentTR = trueRanges.slice(-period);
    return recentTR.reduce((sum, tr) => sum + tr, 0) / period;
  }

  calculateADX(data, period) {
    // Simplified ADX calculation
    if (data.length < period) return null;
    
    const recentData = data.slice(-period);
    const priceChanges = recentData.map((bar, i) => {
      if (i === 0) return 0;
      return bar.close - recentData[i - 1].close;
    });
    
    const positiveChanges = priceChanges.filter(change => change > 0).length;
    const negativeChanges = priceChanges.filter(change => change < 0).length;
    
    return Math.abs(positiveChanges - negativeChanges) / period * 100;
  }

  calculateVolumeSMA(data, period) {
    if (data.length < period) return null;
    
    const recentData = data.slice(-period);
    const sum = recentData.reduce((acc, bar) => acc + bar.volume, 0);
    return sum / period;
  }

  calculatePriceChange(data, period) {
    if (data.length < period) return null;
    
    const currentPrice = data[data.length - 1].close;
    const pastPrice = data[data.length - period].close;
    
    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }

  calculateVolatility(data, period) {
    if (data.length < period) return null;
    
    const recentData = data.slice(-period);
    const returns = recentData.map((bar, i) => {
      if (i === 0) return 0;
      return (bar.close - recentData[i - 1].close) / recentData[i - 1].close;
    });
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Risk management methods
   */
  calculateStopLoss(currentBar, action, atr) {
    const atrMultiplier = 2; // 2x ATR untuk stop loss
    const atrValue = atr || 0.001; // Default ATR jika tidak tersedia
    
    if (action === 'BUY') {
      return currentBar.close - (atrValue * atrMultiplier);
    } else {
      return currentBar.close + (atrValue * atrMultiplier);
    }
  }

  calculateTakeProfit(currentBar, action, atr) {
    const atrMultiplier = 3; // 3x ATR untuk take profit
    const atrValue = atr || 0.001;
    
    if (action === 'BUY') {
      return currentBar.close + (atrValue * atrMultiplier);
    } else {
      return currentBar.close - (atrValue * atrMultiplier);
    }
  }

  calculateRiskRewardRatio(stopLoss, takeProfit, entryPrice, action) {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    return reward / risk;
  }

  calculateLotSize(balance, stopLoss, entryPrice) {
    const riskAmount = balance * (POLYGON_CONFIG.TRADING.DEFAULT_RISK_PERCENT / 100);
    const riskPips = Math.abs(entryPrice - stopLoss) * 10000;
    const pipValue = 10; // Untuk lot 0.01
    
    const lotSize = riskAmount / (riskPips * pipValue);
    return Math.max(POLYGON_CONFIG.TRADING.MIN_LOT_SIZE, 
                   Math.min(lotSize, POLYGON_CONFIG.TRADING.MAX_LOT_SIZE));
  }

  checkRiskManagement(context, action) {
    // Cek consecutive losses
    if (this.consecutiveLosses >= 3) {
      return false; // Stop trading setelah 3 loss berturut-turut
    }
    
    // Cek daily loss limit
    if (context.dailyPnL < -(context.currentBalance * 0.05)) {
      return false;
    }
    
    // Cek maximum open positions
    if (context.openPositions >= this.maxOpenPositions) {
      return false;
    }
    
    return true;
  }

  calculateSignalConfidence(indicators, action) {
    let confidence = 0;
    
    // RSI confirmation
    if (indicators.rsi) {
      if (action === 'BUY' && indicators.rsi < this.rsiOversold) {
        confidence += 20;
      } else if (action === 'SELL' && indicators.rsi > this.rsiOverbought) {
        confidence += 20;
      }
    }
    
    // Volume confirmation
    if (indicators.volumeRatio > this.volumeThreshold) {
      confidence += 15;
    }
    
    // Trend confirmation
    if (indicators.adx && indicators.adx > this.adxTrend) {
      confidence += 15;
    }
    
    // Price action confirmation
    confidence += 10;
    
    return Math.min(confidence, 100);
  }

  calculateSpread(currentBar) {
    // Simulasi spread berdasarkan volatility
    const volatility = (currentBar.high - currentBar.low) / currentBar.close;
    return 0.0001 * (1 + volatility * 10);
  }

  updateStrategyState(signals, context) {
    // Update consecutive wins/losses berdasarkan context
    // Ini akan diupdate oleh backtesting engine
    this.lastSignal = signals.length > 0 ? signals[0] : null;
  }
}

export default RealisticForexStrategy;