/**
 * Arbitrage Strategy
 * Exploits price differences between markets
 */

import { BaseStrategy } from './base.js';

class ArbitrageStrategy extends BaseStrategy {
  constructor(config = {}) {
    super({
      name: 'Arbitrage',
      description: 'Exploits price differences between markets',
      ...config
    });

    this.minSpread = config.minSpread || 0.0001; // Minimum spread to trigger arbitrage
    this.maxPositionSize = config.maxPositionSize || 0.1;
  }

  async analyze(data) {
    if (!data || data.length < 10) {
      return { signals: [] };
    }

    const signals = [];
    const prices = data.map(d => d.close);
    const currentPrice = prices[prices.length - 1];

    // Simple arbitrage detection based on price volatility
    const recentPrices = prices.slice(-10);
    const priceRange = Math.max(...recentPrices) - Math.min(...recentPrices);
    const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const priceDeviation = Math.abs(currentPrice - avgPrice) / avgPrice;

    // Generate arbitrage signals
    if (priceDeviation > this.minSpread && currentPrice < avgPrice) {
      signals.push({
        type: 'BUY',
        price: currentPrice,
        confidence: 0.6,
        reason: `Price deviation detected. Current: ${currentPrice.toFixed(4)}, Avg: ${avgPrice.toFixed(4)}`,
        timestamp: new Date().toISOString()
      });
    } else if (priceDeviation > this.minSpread && currentPrice > avgPrice) {
      signals.push({
        type: 'SELL',
        price: currentPrice,
        confidence: 0.6,
        reason: `Price deviation detected. Current: ${currentPrice.toFixed(4)}, Avg: ${avgPrice.toFixed(4)}`,
        timestamp: new Date().toISOString()
      });
    }

    return { signals };
  }
}

export { ArbitrageStrategy };