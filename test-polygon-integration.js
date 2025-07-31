#!/usr/bin/env node

/**
 * Test script untuk integrasi Polygon API
 * Memastikan semua endpoint berfungsi dengan data real
 */

import PolygonClient from './lib/polygon/client.js';
import { POLYGON_CONFIG } from './lib/polygon/config.js';

// Test configuration
const TEST_CONFIG = {
  symbols: ['C:EUR/USD', 'C:GBP/USD', 'C:USD/JPY'],
  timeframes: ['hour', 'day'],
  multipliers: [1, 4],
  dateRange: {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0]
  }
};

class PolygonIntegrationTest {
  constructor(apiKey) {
    if (!apiKey || apiKey.includes('demo')) {
      throw new Error('API Key Polygon yang valid diperlukan untuk testing');
    }
    
    this.apiKey = apiKey;
    this.client = null;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async initialize() {
    try {
      console.log('🔧 Initializing Polygon client...');
      this.client = new PolygonClient(this.apiKey);
      
      // Test connection
      const connectionValid = await this.client.validateConnection();
      if (!connectionValid) {
        throw new Error('Failed to connect to Polygon API');
      }
      
      console.log('✅ Polygon client initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Polygon client:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('\n🚀 Starting Polygon API Integration Tests...\n');
    
    const tests = [
      this.testRealTimePrice.bind(this),
      this.testHistoricalData.bind(this),
      this.testForexPairs.bind(this),
      this.testMarketSentiment.bind(this),
      this.testDataQuality.bind(this),
      this.testErrorHandling.bind(this)
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.printResults();
  }

  async runTest(testFunction) {
    const testName = testFunction.name.replace('test', '').replace(/([A-Z])/g, ' $1').trim();
    
    try {
      console.log(`🧪 Running test: ${testName}`);
      const result = await testFunction();
      
      if (result.success) {
        console.log(`✅ ${testName}: PASSED`);
        this.results.passed++;
      } else {
        console.log(`❌ ${testName}: FAILED - ${result.error}`);
        this.results.failed++;
      }
      
      this.results.tests.push({
        name: testName,
        success: result.success,
        error: result.error,
        data: result.data
      });
      
    } catch (error) {
      console.log(`❌ ${testName}: FAILED - ${error.message}`);
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        success: false,
        error: error.message
      });
    }
    
    console.log('');
  }

  async testRealTimePrice() {
    try {
      const symbol = TEST_CONFIG.symbols[0];
      const result = await this.client.getRealTimePrice(symbol);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      const data = result.data;
      
      // Validasi data real-time
      if (!data.symbol || !data.bid || !data.ask || !data.spread) {
        return { success: false, error: 'Missing required real-time data fields' };
      }
      
      if (data.bid <= 0 || data.ask <= 0 || data.spread <= 0) {
        return { success: false, error: 'Invalid price data' };
      }
      
      if (data.spread > POLYGON_CONFIG.TRADING.MAX_SPREAD) {
        return { success: false, error: `Spread too high: ${data.spreadPips} pips` };
      }
      
      console.log(`   📊 Real-time data for ${symbol}:`);
      console.log(`      Bid: ${data.bid}`);
      console.log(`      Ask: ${data.ask}`);
      console.log(`      Spread: ${data.spreadPips} pips`);
      console.log(`      Time: ${data.time}`);
      
      return { success: true, data };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testHistoricalData() {
    try {
      const symbol = TEST_CONFIG.symbols[0];
      const result = await this.client.getHistoricalData(
        symbol,
        TEST_CONFIG.multipliers[0],
        TEST_CONFIG.timeframes[0],
        TEST_CONFIG.dateRange.from,
        TEST_CONFIG.dateRange.to
      );
      
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      const data = result.data;
      const metadata = result.metadata;
      
      // Validasi data historis
      if (!Array.isArray(data) || data.length === 0) {
        return { success: false, error: 'No historical data received' };
      }
      
      if (data.length < POLYGON_CONFIG.BACKTESTING.MIN_DATA_POINTS) {
        return { 
          success: false, 
          error: `Insufficient data points: ${data.length} < ${POLYGON_CONFIG.BACKTESTING.MIN_DATA_POINTS}` 
        };
      }
      
      // Validasi kualitas data
      let invalidBars = 0;
      for (const bar of data) {
        if (!bar.time || !bar.open || !bar.high || !bar.low || !bar.close) {
          invalidBars++;
        }
        if (bar.high < bar.low || bar.open < 0 || bar.close < 0) {
          invalidBars++;
        }
      }
      
      const invalidPercentage = (invalidBars / data.length) * 100;
      if (invalidPercentage > 5) {
        return { 
          success: false, 
          error: `Too many invalid bars: ${invalidBars}/${data.length} (${invalidPercentage.toFixed(1)}%)` 
        };
      }
      
      console.log(`   📈 Historical data for ${symbol}:`);
      console.log(`      Total bars: ${data.length}`);
      console.log(`      Valid bars: ${data.length - invalidBars}`);
      console.log(`      Invalid bars: ${invalidBars}`);
      console.log(`      Data quality: ${metadata.dataQuality}`);
      console.log(`      Date range: ${metadata.from} to ${metadata.to}`);
      
      return { success: true, data, metadata };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testForexPairs() {
    try {
      const result = await this.client.getForexPairs();
      
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      const pairs = result.data;
      
      if (!Array.isArray(pairs) || pairs.length === 0) {
        return { success: false, error: 'No forex pairs received' };
      }
      
      // Validasi pairs
      const validPairs = pairs.filter(pair => 
        pair.symbol && 
        pair.symbol.startsWith('C:') && 
        POLYGON_CONFIG.FOREX_SYMBOLS.includes(pair.symbol)
      );
      
      if (validPairs.length === 0) {
        return { success: false, error: 'No valid forex pairs found' };
      }
      
      console.log(`   💱 Forex pairs available: ${pairs.length}`);
      console.log(`   ✅ Valid pairs: ${validPairs.length}`);
      console.log(`   📋 Sample pairs:`);
      validPairs.slice(0, 5).forEach(pair => {
        console.log(`      - ${pair.symbol}: ${pair.name}`);
      });
      
      return { success: true, data: pairs };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testMarketSentiment() {
    try {
      const symbol = TEST_CONFIG.symbols[0];
      const result = await this.client.getMarketSentiment(symbol);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      const sentiment = result.data.sentiment;
      
      // Validasi sentiment data
      if (typeof sentiment.score !== 'number' || 
          typeof sentiment.trend !== 'string' || 
          typeof sentiment.confidence !== 'number') {
        return { success: false, error: 'Invalid sentiment data structure' };
      }
      
      if (sentiment.score < -1 || sentiment.score > 1) {
        return { success: false, error: `Invalid sentiment score: ${sentiment.score}` };
      }
      
      if (!['bullish', 'bearish', 'neutral'].includes(sentiment.trend)) {
        return { success: false, error: `Invalid sentiment trend: ${sentiment.trend}` };
      }
      
      console.log(`   📊 Market sentiment for ${symbol}:`);
      console.log(`      Score: ${sentiment.score.toFixed(3)}`);
      console.log(`      Trend: ${sentiment.trend}`);
      console.log(`      Confidence: ${sentiment.confidence.toFixed(3)}`);
      console.log(`      Indicators:`, sentiment.indicators);
      
      return { success: true, data: sentiment };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testDataQuality() {
    try {
      const symbol = TEST_CONFIG.symbols[0];
      
      // Test different timeframes
      const timeframes = ['hour', 'day'];
      const results = {};
      
      for (const timeframe of timeframes) {
        const result = await this.client.getHistoricalData(
          symbol,
          1,
          timeframe,
          TEST_CONFIG.dateRange.from,
          TEST_CONFIG.dateRange.to
        );
        
        if (result.success) {
          const data = result.data;
          const metadata = result.metadata;
          
          results[timeframe] = {
            totalBars: data.length,
            validBars: metadata.validBars,
            invalidBars: metadata.invalidBars,
            dataQuality: metadata.dataQuality,
            averageVolume: data.reduce((sum, bar) => sum + (bar.volume || 0), 0) / data.length,
            averageVolatility: data.reduce((sum, bar) => {
              const volatility = (bar.high - bar.low) / bar.low;
              return sum + volatility;
            }, 0) / data.length
          };
        }
      }
      
      console.log(`   🔍 Data quality analysis for ${symbol}:`);
      for (const [timeframe, stats] of Object.entries(results)) {
        console.log(`      ${timeframe.toUpperCase()}:`);
        console.log(`        Total bars: ${stats.totalBars}`);
        console.log(`        Valid bars: ${stats.validBars}`);
        console.log(`        Data quality: ${stats.dataQuality}`);
        console.log(`        Avg volume: ${stats.averageVolume.toFixed(0)}`);
        console.log(`        Avg volatility: ${(stats.averageVolatility * 100).toFixed(2)}%`);
      }
      
      return { success: true, data: results };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testErrorHandling() {
    try {
      const tests = [
        {
          name: 'Invalid symbol',
          test: () => this.client.getRealTimePrice('INVALID_SYMBOL')
        },
        {
          name: 'Invalid timeframe',
          test: () => this.client.getHistoricalData('C:EUR/USD', 1, 'invalid', '2024-01-01', '2024-01-02')
        },
        {
          name: 'Invalid date range',
          test: () => this.client.getHistoricalData('C:EUR/USD', 1, 'hour', '2024-13-01', '2024-01-02')
        }
      ];
      
      let passedTests = 0;
      
      for (const test of tests) {
        try {
          const result = await test.test();
          
          // Should fail for invalid inputs
          if (!result.success) {
            passedTests++;
            console.log(`      ✅ ${test.name}: Properly handled error`);
          } else {
            console.log(`      ❌ ${test.name}: Should have failed`);
          }
        } catch (error) {
          passedTests++;
          console.log(`      ✅ ${test.name}: Properly handled error`);
        }
      }
      
      if (passedTests === tests.length) {
        return { success: true, data: { passedTests, totalTests: tests.length } };
      } else {
        return { success: false, error: `Only ${passedTests}/${tests.length} error handling tests passed` };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => !test.success)
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n🎯 Recommendations:');
    if (this.results.passed === this.results.tests.length) {
      console.log('   ✅ All tests passed! Polygon integration is working correctly.');
      console.log('   ✅ Ready for production use with real data.');
    } else {
      console.log('   ⚠️  Some tests failed. Please check:');
      console.log('      - API key validity');
      console.log('      - Network connectivity');
      console.log('      - Polygon API service status');
      console.log('      - Rate limits');
    }
  }
}

// Main execution
async function main() {
  const apiKey = process.env.POLYGON_API_KEY;
  
  if (!apiKey) {
    console.error('❌ POLYGON_API_KEY environment variable is required');
    console.log('   Set it with: export POLYGON_API_KEY=your_api_key_here');
    process.exit(1);
  }
  
  if (apiKey.includes('demo')) {
    console.error('❌ Demo API key detected. Please use a real Polygon API key for testing.');
    process.exit(1);
  }
  
  try {
    const tester = new PolygonIntegrationTest(apiKey);
    
    const initialized = await tester.initialize();
    if (!initialized) {
      console.error('❌ Failed to initialize test suite');
      process.exit(1);
    }
    
    await tester.runAllTests();
    
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}