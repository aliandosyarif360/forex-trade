#!/usr/bin/env node

/**
 * Auto Trading Bot Runner - SIAP PAKAI
 * Jalankan dengan: node scripts/run-trading-bot.js
 */

import AutoTrader from '../lib/trading-bot/auto-trader.js';
import RSIStrategy from '../lib/trading-bot/strategies/rsi-strategy.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🤖 AUTO TRADING BOT - SIAP PAKAI');
console.log('=' .repeat(50));

// Configuration
const config = {
  // Alpha Vantage API Key (gratis dari https://www.alphavantage.co/support/#api-key)
  alphaVantageKey: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
  
  // Watchlist saham yang akan dipantau
  watchlist: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'],
  
  // Portfolio awal
  portfolio: {
    cash: 10000 // $10,000 starting cash
  },
  
  // Risk management
  maxPositions: 5,        // Maksimal 5 posisi bersamaan
  minConfidence: 0.7,     // Minimal 70% confidence untuk trade
  
  // RSI Strategy settings
  rsiStrategy: {
    rsiPeriod: 14,         // RSI period
    oversoldLevel: 30,     // Buy signal
    overboughtLevel: 70,   // Sell signal
    stopLoss: 0.05,        // 5% stop loss
    takeProfit: 0.10,      // 10% take profit
    positionSize: 0.2      // 20% dari cash per trade
  }
};

console.log('📊 Configuration:');
console.log(`   Watchlist: ${config.watchlist.join(', ')}`);
console.log(`   Starting Cash: $${config.portfolio.cash}`);
console.log(`   Max Positions: ${config.maxPositions}`);
console.log(`   Min Confidence: ${config.minConfidence * 100}%`);
console.log(`   RSI Oversold: ${config.rsiStrategy.oversoldLevel}`);
console.log(`   RSI Overbought: ${config.rsiStrategy.overboughtLevel}`);
console.log('');

// Create trading bot
const bot = new AutoTrader({
  alphaVantageKey: config.alphaVantageKey,
  watchlist: config.watchlist,
  strategies: [new RSIStrategy(config.rsiStrategy)],
  portfolio: config.portfolio,
  maxPositions: config.maxPositions,
  minConfidence: config.minConfidence
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  bot.stop();
  
  // Print final statistics
  const stats = bot.getStatistics();
  console.log('\n📊 FINAL STATISTICS:');
  console.log('=' .repeat(50));
  console.log(`Total Trades: ${stats.totalTrades}`);
  console.log(`Win Rate: ${stats.winRate}`);
  console.log(`Total P&L: $${stats.totalPnL}`);
  console.log(`Average P&L: $${stats.averagePnL}`);
  console.log(`Active Positions: ${stats.activePositions}`);
  
  process.exit(0);
});

// Start the bot
console.log('🚀 Starting Auto Trading Bot...');
console.log('Press Ctrl+C to stop');
console.log('');

bot.start();

// Keep the process running
setInterval(() => {
  // Print statistics every 30 minutes
  const stats = bot.getStatistics();
  if (stats.totalTrades > 0) {
    console.log(`\n📈 Quick Stats: ${stats.totalTrades} trades, ${stats.winRate} win rate, $${stats.totalPnL} P&L`);
  }
}, 30 * 60 * 1000); // 30 minutes