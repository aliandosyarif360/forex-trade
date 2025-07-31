/**
 * Mean Reversion Strategy
 * Trades price reversions to the mean
 */

import { BaseStrategy } from './base.js';

class MeanReversionStrategy extends BaseStrategy {
  constructor(config = {}) {
    super({
      name: 'Mean Reversion',
      description: 'Trades price reversions to the mean',
      ...config
    });

    this.period = config.period || 20;
    this.deviation = config.deviation || 2;
  }

  async analyze(data) {
    if (!data || data.length < this.period) {
      return { signals: [] };
    }

    const signals = [];
    const prices = data.map(d => d.close);
    const currentPrice = prices[prices.length - 1];

    // Calculate mean and standard deviation
    const mean = prices.slice(-this.period).reduce((a, b) => a + b, 0) / this.period;
    const variance = prices.slice(-this.period).reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / this.period;
    const stdDev = Math.sqrt(variance);

    // Calculate upper and lower bands
    const upperBand = mean + (this.deviation * stdDev);
    const lowerBand = mean - (this.deviation * stdDev);

    // Generate signals
    if (currentPrice < lowerBand) {
      signals.push({
        type: 'BUY',
        price: currentPrice,
        confidence: 0.7,
        reason: `Price below lower band (${lowerBand.toFixed(4)}). Mean reversion expected.`,
        timestamp: new Date().toISOString()
      });
    } else if (currentPrice > upperBand) {
      signals.push({
        type: 'SELL',
        price: currentPrice,
        confidence: 0.7,
        reason: `Price above upper band (${upperBand.toFixed(4)}). Mean reversion expected.`,
        timestamp: new Date().toISOString()
      });
    }

    return { signals };
  }
}

export { MeanReversionStrategy };