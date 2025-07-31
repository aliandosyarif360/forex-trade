/**
 * Martingale Strategy
 * Doubles position size after losses to recover losses
 */

import { BaseStrategy } from './base.js';

class MartingaleStrategy extends BaseStrategy {
  constructor(config = {}) {
    super({
      name: 'Martingale',
      description: 'Doubles position size after losses to recover losses',
      ...config
    });

    this.basePositionSize = config.basePositionSize || 0.01;
    this.maxMultiplier = config.maxMultiplier || 8;
    this.consecutiveLosses = 0;
    this.lastTradeResult = null;
  }

  async analyze(data) {
    if (!data || data.length < 20) {
      return { signals: [] };
    }

    const signals = [];
    const prices = data.map(d => d.close);
    const currentPrice = prices[prices.length - 1];
    
    // Simple trend detection
    const shortMA = this.calculateSMA(prices, 10);
    const longMA = this.calculateSMA(prices, 20);
    
    const currentShortMA = shortMA[shortMA.length - 1];
    const currentLongMA = longMA[longMA.length - 1];

    // Generate signals based on trend and martingale logic
    if (currentShortMA > currentLongMA) {
      const positionSize = this.calculatePositionSize();
      signals.push({
        type: 'BUY',
        price: currentPrice,
        confidence: 0.6,
        positionSize: positionSize,
        reason: `Uptrend detected. Position size: ${positionSize} (${this.consecutiveLosses} consecutive losses)`,
        timestamp: new Date().toISOString()
      });
    } else if (currentShortMA < currentLongMA) {
      const positionSize = this.calculatePositionSize();
      signals.push({
        type: 'SELL',
        price: currentPrice,
        confidence: 0.6,
        positionSize: positionSize,
        reason: `Downtrend detected. Position size: ${positionSize} (${this.consecutiveLosses} consecutive losses)`,
        timestamp: new Date().toISOString()
      });
    }

    return { signals };
  }

  calculatePositionSize() {
    const multiplier = Math.min(Math.pow(2, this.consecutiveLosses), this.maxMultiplier);
    return this.basePositionSize * multiplier;
  }

  onTradeResult(result) {
    this.lastTradeResult = result;
    
    if (result.profit < 0) {
      this.consecutiveLosses++;
    } else {
      this.consecutiveLosses = 0;
    }
  }

  calculateSMA(prices, period) {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  reset() {
    this.consecutiveLosses = 0;
    this.lastTradeResult = null;
  }
}

export { MartingaleStrategy };