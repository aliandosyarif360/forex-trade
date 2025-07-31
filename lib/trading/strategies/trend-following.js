/**
 * Trend Following Strategy
 * Follows market trends using moving averages and momentum indicators
 */

import { BaseStrategy } from './base.js';

class TrendFollowingStrategy extends BaseStrategy {
  constructor(config = {}) {
    super({
      name: 'Trend Following',
      description: 'Follows market trends using moving averages and momentum indicators',
      ...config
    });

    this.shortPeriod = config.shortPeriod || 10;
    this.longPeriod = config.longPeriod || 30;
    this.rsiPeriod = config.rsiPeriod || 14;
    this.rsiOverbought = config.rsiOverbought || 70;
    this.rsiOversold = config.rsiOversold || 30;
  }

  async analyze(data) {
    if (!data || data.length < this.longPeriod) {
      return { signals: [] };
    }

    const signals = [];
    const prices = data.map(d => d.close);
    
    // Calculate indicators
    const shortMA = this.calculateSMA(prices, this.shortPeriod);
    const longMA = this.calculateSMA(prices, this.longPeriod);
    const rsi = this.calculateRSI(prices, this.rsiPeriod);

    // Get latest values
    const currentShortMA = shortMA[shortMA.length - 1];
    const currentLongMA = longMA[longMA.length - 1];
    const currentRSI = rsi[rsi.length - 1];
    const currentPrice = prices[prices.length - 1];

    // Generate signals
    if (currentShortMA > currentLongMA && currentRSI < this.rsiOverbought) {
      signals.push({
        type: 'BUY',
        price: currentPrice,
        confidence: 0.7,
        reason: `Short MA (${currentShortMA.toFixed(4)}) > Long MA (${currentLongMA.toFixed(4)}) and RSI (${currentRSI.toFixed(2)}) < ${this.rsiOverbought}`,
        timestamp: new Date().toISOString()
      });
    } else if (currentShortMA < currentLongMA && currentRSI > this.rsiOversold) {
      signals.push({
        type: 'SELL',
        price: currentPrice,
        confidence: 0.7,
        reason: `Short MA (${currentShortMA.toFixed(4)}) < Long MA (${currentLongMA.toFixed(4)}) and RSI (${currentRSI.toFixed(2)}) > ${this.rsiOversold}`,
        timestamp: new Date().toISOString()
      });
    }

    return { signals };
  }

  calculateSMA(prices, period) {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  calculateRSI(prices, period) {
    const rsi = [];
    for (let i = 1; i < prices.length; i++) {
      const gains = [];
      const losses = [];
      
      for (let j = Math.max(0, i - period + 1); j <= i; j++) {
        const change = prices[j] - prices[j - 1];
        if (change > 0) {
          gains.push(change);
          losses.push(0);
        } else {
          gains.push(0);
          losses.push(Math.abs(change));
        }
      }
      
      const avgGain = gains.reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    return rsi;
  }
}

export { TrendFollowingStrategy };