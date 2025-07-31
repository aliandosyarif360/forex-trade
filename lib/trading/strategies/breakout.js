/**
 * Breakout Strategy
 * Trades breakouts from support and resistance levels
 */

import { BaseStrategy } from './base.js';

class BreakoutStrategy extends BaseStrategy {
  constructor(config = {}) {
    super({
      name: 'Breakout',
      description: 'Trades breakouts from support and resistance levels',
      ...config
    });

    this.period = config.period || 20;
    this.multiplier = config.multiplier || 2;
  }

  async analyze(data) {
    if (!data || data.length < this.period) {
      return { signals: [] };
    }

    const signals = [];
    const prices = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    const currentPrice = prices[prices.length - 1];
    const currentHigh = highs[highs.length - 1];
    const currentLow = lows[lows.length - 1];

    // Calculate support and resistance levels
    const resistance = Math.max(...highs.slice(-this.period));
    const support = Math.min(...lows.slice(-this.period));

    // Check for breakouts
    if (currentHigh > resistance) {
      signals.push({
        type: 'BUY',
        price: currentPrice,
        confidence: 0.8,
        reason: `Breakout above resistance at ${resistance.toFixed(4)}`,
        timestamp: new Date().toISOString()
      });
    } else if (currentLow < support) {
      signals.push({
        type: 'SELL',
        price: currentPrice,
        confidence: 0.8,
        reason: `Breakout below support at ${support.toFixed(4)}`,
        timestamp: new Date().toISOString()
      });
    }

    return { signals };
  }
}

export { BreakoutStrategy };