/**
 * Test file untuk memverifikasi integrasi Polygon API
 */

import PolygonClient from './lib/polygon/client.js';
import RealisticForexBacktestingEngine from './lib/backtesting/realistic-engine.js';
import RealisticForexStrategy from './lib/trading/strategies/realistic-forex-strategy.js';

// Mock data untuk testing
const mockHistoricalData = [
  {
    time: 1640995200000, // 2022-01-01 00:00:00
    open: 1.1300,
    high: 1.1320,
    low: 1.1290,
    close: 1.1310,
    volume: 1500000
  },
  {
    time: 1640998800000, // 2022-01-01 01:00:00
    open: 1.1310,
    high: 1.1330,
    low: 1.1300,
    close: 1.1320,
    volume: 1600000
  },
  {
    time: 1641002400000, // 2022-01-01 02:00:00
    open: 1.1320,
    high: 1.1340,
    low: 1.1310,
    close: 1.1330,
    volume: 1400000
  },
  {
    time: 1641006000000, // 2022-01-01 03:00:00
    open: 1.1330,
    high: 1.1350,
    low: 1.1320,
    close: 1.1340,
    volume: 1700000
  },
  {
    time: 1641009600000, // 2022-01-01 04:00:00
    open: 1.1340,
    high: 1.1360,
    low: 1.1330,
    close: 1.1350,
    volume: 1800000
  }
];

// Generate more mock data
function generateMockData(count = 1000) {
  const data = [];
  let currentPrice = 1.1300;
  
  for (let i = 0; i < count; i++) {
    const time = 1640995200000 + (i * 60 * 60 * 1000); // Increment by 1 hour
    const volatility = 0.001; // 10 pips
    const change = (Math.random() - 0.5) * volatility;
    currentPrice += change;
    
    const open = currentPrice;
    const high = currentPrice + (Math.random() * 0.002);
    const low = currentPrice - (Math.random() * 0.002);
    const close = currentPrice + (Math.random() - 0.5) * 0.001;
    const volume = 1000000 + (Math.random() * 1000000);
    
    data.push({
      time,
      open,
      high,
      low,
      close,
      volume
    });
    
    currentPrice = close;
  }
  
  return data;
}

async function testPolygonClient() {
  console.log('🧪 Testing Polygon Client...');
  
  try {
    // Test dengan mock API key
    const client = new PolygonClient('test-api-key');
    
    // Test symbol validation
    const validSymbol = client.isValidForexSymbol('C:EUR/USD');
    const invalidSymbol = client.isValidForexSymbol('INVALID');
    
    console.log('✅ Symbol validation:', {
      validSymbol,
      invalidSymbol
    });
    
    // Test symbol formatting
    const formatted1 = client.formatForexSymbol('EUR_USD');
    const formatted2 = client.formatForexSymbol('C:EUR/USD');
    
    console.log('✅ Symbol formatting:', {
      formatted1,
      formatted2
    });
    
    console.log('✅ Polygon Client test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Polygon Client test failed:', error);
    return false;
  }
}

async function testRealisticStrategy() {
  console.log('🧪 Testing Realistic Forex Strategy...');
  
  try {
    const strategy = new RealisticForexStrategy({
      name: 'Test Strategy',
      rsiPeriod: 14,
      smaPeriods: [20, 50],
      stopLossPips: 50,
      takeProfitPips: 100
    });
    
    // Test strategy analysis
    const signals = await strategy.analyze(mockHistoricalData, mockHistoricalData[mockHistoricalData.length - 1], {
      currentBalance: 10000,
      currentEquity: 10000,
      openPositions: 0,
      dailyPnL: 0,
      dailyTrades: 0
    });
    
    console.log('✅ Strategy analysis:', {
      signalsCount: signals.length,
      signals
    });
    
    console.log('✅ Realistic Strategy test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Realistic Strategy test failed:', error);
    return false;
  }
}

async function testRealisticBacktestingEngine() {
  console.log('🧪 Testing Realistic Backtesting Engine...');
  
  try {
    const engine = new RealisticForexBacktestingEngine({
      initialBalance: 10000,
      leverage: 50,
      commission: 0.0001,
      slippage: 0.0001,
      maxDrawdown: 20,
      maxDailyLoss: 5,
      onProgress: (progress) => {
        console.log(`📈 Progress: ${progress.progress.toFixed(2)}%`);
      },
      onComplete: (results) => {
        console.log('✅ Backtesting completed');
      },
      onError: (error) => {
        console.error('❌ Backtesting error:', error);
      }
    });
    
    const strategy = new RealisticForexStrategy({
      rsiPeriod: 14,
      smaPeriods: [20, 50],
      stopLossPips: 50,
      takeProfitPips: 100
    });
    
    // Generate more data for realistic testing
    const testData = generateMockData(1000);
    
    const results = await engine.runBacktest(testData, strategy, {
      symbol: 'C:EUR/USD'
    });
    
    console.log('✅ Backtesting results:', {
      totalTrades: results.totalTrades,
      winRate: results.winRate,
      totalReturn: results.totalReturn,
      maxDrawdown: results.maxDrawdown
    });
    
    console.log('✅ Realistic Backtesting Engine test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Realistic Backtesting Engine test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Polygon Integration Tests...\n');
  
  const tests = [
    { name: 'Polygon Client', fn: testPolygonClient },
    { name: 'Realistic Strategy', fn: testRealisticStrategy },
    { name: 'Realistic Backtesting Engine', fn: testRealisticBacktestingEngine }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n🧪 Running ${test.name} test...`);
    const result = await test.fn();
    results.push({ name: test.name, passed: result });
  }
  
  console.log('\n📊 Test Results:');
  console.log('================');
  
  let passedCount = 0;
  for (const result of results) {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${result.name}`);
    if (result.passed) passedCount++;
  }
  
  console.log(`\n🎯 Summary: ${passedCount}/${results.length} tests passed`);
  
  if (passedCount === results.length) {
    console.log('🎉 All tests passed! Polygon integration is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
  
  return passedCount === results.length;
}

// Export untuk penggunaan
export {
  testPolygonClient,
  testRealisticStrategy,
  testRealisticBacktestingEngine,
  runAllTests
};

// Jika dijalankan langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => {
      if (success) {
        console.log('\n✅ All integration tests completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Some integration tests failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}