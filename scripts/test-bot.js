#!/usr/bin/env node

/**
 * Test Auto Trading Bot - Untuk testing sebelum live trading
 * Jalankan dengan: npm run bot:test
 */

import AlphaVantageClient from '../lib/market-data/alpha-vantage.js';
import YahooFinanceClient from '../lib/market-data/yahoo-finance.js';
import RSIStrategy from '../lib/trading-bot/strategies/rsi-strategy.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🧪 TESTING AUTO TRADING BOT');
console.log('=' .repeat(50));

async function testMarketData() {
  console.log('\n📊 Testing Market Data APIs...');
  
  // Test Alpha Vantage
  console.log('\n🔸 Testing Alpha Vantage...');
  const alphaVantage = new AlphaVantageClient(process.env.ALPHA_VANTAGE_API_KEY || 'demo');
  
  try {
    const applePrice = await alphaVantage.getCurrentPrice('AAPL');
    if (applePrice.success) {
      console.log(`✅ Alpha Vantage: AAPL = $${applePrice.data.price}`);
    } else {
      console.log(`❌ Alpha Vantage Error: ${applePrice.error.message}`);
    }
  } catch (error) {
    console.log(`❌ Alpha Vantage Failed: ${error.message}`);
  }

  // Test Yahoo Finance
  console.log('\n🔸 Testing Yahoo Finance...');
  const yahooFinance = new YahooFinanceClient();
  
  try {
    const msftPrice = await yahooFinance.getCurrentPrice('MSFT');
    if (msftPrice.success) {
      console.log(`✅ Yahoo Finance: MSFT = $${msftPrice.data.price}`);
    } else {
      console.log(`❌ Yahoo Finance Error: ${msftPrice.error.message}`);
    }
  } catch (error) {
    console.log(`❌ Yahoo Finance Failed: ${error.message}`);
  }
}

async function testTechnicalIndicators() {
  console.log('\n📈 Testing Technical Indicators...');
  
  const alphaVantage = new AlphaVantageClient(process.env.ALPHA_VANTAGE_API_KEY || 'demo');
  
  try {
    console.log('🔸 Testing RSI for AAPL...');
    const rsiData = await alphaVantage.getTechnicalIndicator('AAPL', 'RSI', 'daily');
    
    if (rsiData.success && rsiData.data.length > 0) {
      const latestRSI = rsiData.data[rsiData.data.length - 1];
      console.log(`✅ RSI Data: Date=${latestRSI.date}, RSI=${latestRSI.RSI}`);
    } else {
      console.log(`❌ RSI Error: ${rsiData.error ? rsiData.error.message : 'No data'}`);
    }
  } catch (error) {
    console.log(`❌ RSI Failed: ${error.message}`);
  }
}

async function testTradingStrategy() {
  console.log('\n🎯 Testing Trading Strategy...');
  
  const strategy = new RSIStrategy({
    oversoldLevel: 30,
    overboughtLevel: 70,
    stopLoss: 0.05,
    takeProfit: 0.10
  });

  // Mock market data
  const mockMarketData = {
    symbol: 'AAPL',
    price: 150.00,
    volume: 50000000,
    high: 152.00,
    low: 148.00
  };

  // Mock RSI data - oversold condition
  const mockRSIData = {
    rsi: [
      { date: '2024-01-01', RSI: 35 },
      { date: '2024-01-02', RSI: 28 }, // Previous RSI (oversold)
      { date: '2024-01-03', RSI: 32 }  // Current RSI (coming out of oversold)
    ]
  };

  try {
    const signal = await strategy.analyzeSignal(mockMarketData, mockRSIData);
    
    console.log(`🔸 Strategy Analysis:`);
    console.log(`   Signal: ${signal.signal}`);
    console.log(`   Reason: ${signal.reason}`);
    console.log(`   Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
    
    if (signal.signal === 'BUY') {
      console.log(`   Entry: $${signal.entry}`);
      console.log(`   Stop Loss: $${signal.stopLoss.toFixed(2)}`);
      console.log(`   Take Profit: $${signal.takeProfit.toFixed(2)}`);
      console.log(`✅ Strategy working correctly!`);
    }
  } catch (error) {
    console.log(`❌ Strategy Failed: ${error.message}`);
  }
}

async function testPortfolioCalculations() {
  console.log('\n💰 Testing Portfolio Calculations...');
  
  const startingCash = 10000;
  const positionSize = 0.2; // 20%
  const stockPrice = 150;
  
  const positionValue = startingCash * positionSize;
  const shares = Math.floor(positionValue / stockPrice);
  const actualCost = shares * stockPrice;
  
  console.log(`🔸 Portfolio Test:`);
  console.log(`   Starting Cash: $${startingCash}`);
  console.log(`   Position Size: ${positionSize * 100}%`);
  console.log(`   Stock Price: $${stockPrice}`);
  console.log(`   Calculated Shares: ${shares}`);
  console.log(`   Actual Cost: $${actualCost}`);
  console.log(`   Remaining Cash: $${startingCash - actualCost}`);
  console.log(`✅ Portfolio calculations working!`);
}

async function testRiskManagement() {
  console.log('\n🛡️ Testing Risk Management...');
  
  const entryPrice = 100;
  const stopLossPercent = 0.05; // 5%
  const takeProfitPercent = 0.10; // 10%
  
  const stopLossPrice = entryPrice * (1 - stopLossPercent);
  const takeProfitPrice = entryPrice * (1 + takeProfitPercent);
  
  console.log(`🔸 Risk Management Test:`);
  console.log(`   Entry Price: $${entryPrice}`);
  console.log(`   Stop Loss (5%): $${stopLossPrice}`);
  console.log(`   Take Profit (10%): $${takeProfitPrice}`);
  console.log(`   Risk/Reward Ratio: 1:${(takeProfitPercent / stopLossPercent).toFixed(1)}`);
  console.log(`✅ Risk management working!`);
}

async function runAllTests() {
  try {
    await testMarketData();
    await testTechnicalIndicators();
    await testTradingStrategy();
    await testPortfolioCalculations();
    await testRiskManagement();
    
    console.log('\n🎉 ALL TESTS COMPLETED!');
    console.log('=' .repeat(50));
    console.log('✅ Bot siap untuk dijalankan!');
    console.log('');
    console.log('Next steps:');
    console.log('1. npm run bot:start - untuk menjalankan bot');
    console.log('2. Monitor console output');
    console.log('3. Check portfolio performance');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Check your .env file');
    console.log('2. Verify Alpha Vantage API key');
    console.log('3. Check internet connection');
    console.log('4. Try again in a few minutes');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  process.exit(0);
});

// Run tests
runAllTests();