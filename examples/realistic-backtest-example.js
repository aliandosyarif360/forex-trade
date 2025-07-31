/**
 * Contoh penggunaan Realistic Forex Backtesting Engine dengan Polygon API
 */

import RealisticForexBacktestingEngine from '../lib/backtesting/realistic-engine.js';
import RealisticForexStrategy from '../lib/trading/strategies/realistic-forex-strategy.js';
import PolygonClient from '../lib/polygon/client.js';

// Konfigurasi
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const SYMBOL = 'C:EUR/USD';
const FROM_DATE = '2024-01-01';
const TO_DATE = '2024-12-31';

async function runRealisticBacktest() {
  try {
    console.log('🚀 Memulai Realistic Forex Backtesting...');
    
    // 1. Setup Polygon Client
    const polygonClient = new PolygonClient(POLYGON_API_KEY);
    
    // 2. Ambil data historis
    console.log(`📊 Mengambil data historis untuk ${SYMBOL}...`);
    const historicalResult = await polygonClient.getHistoricalData(
      SYMBOL, 
      1, // multiplier
      'hour', // timespan
      FROM_DATE,
      TO_DATE
    );
    
    if (!historicalResult.success) {
      throw new Error(`Gagal mengambil data: ${historicalResult.error.message}`);
    }
    
    const historicalData = historicalResult.data;
    console.log(`✅ Data berhasil diambil: ${historicalData.length} data points`);
    
    // 3. Setup strategy
    const strategy = new RealisticForexStrategy({
      name: 'EUR/USD Realistic Strategy',
      rsiPeriod: 14,
      smaPeriods: [20, 50, 200],
      emaPeriods: [12, 26],
      atrPeriod: 14,
      adxPeriod: 14,
      stopLossPips: 50,
      takeProfitPips: 100,
      minRiskRewardRatio: 1.5
    });
    
    // 4. Setup backtesting engine
    const engineOptions = {
      initialBalance: 10000,
      leverage: 50,
      commission: 0.0001, // 1 pip
      slippage: 0.0001, // 1 pip
      spread: 0.0001, // 1 pip
      maxSpread: 0.0010, // 10 pips
      minVolume: 1000000,
      maxDrawdown: 20, // 20%
      maxDailyLoss: 5, // 5%
      maxPositionSize: 10, // 10% of account
      maxOpenPositions: 5,
      minRiskRewardRatio: 1.5,
      onProgress: (progress) => {
        console.log(`📈 Progress: ${progress.progress.toFixed(2)}% | Equity: $${progress.currentEquity.toFixed(2)} | Drawdown: ${progress.currentDrawdown.toFixed(2)}%`);
      },
      onComplete: (results) => {
        console.log('✅ Backtesting selesai!');
        displayResults(results);
      },
      onError: (error) => {
        console.error('❌ Error dalam backtesting:', error);
      }
    };
    
    const engine = new RealisticForexBacktestingEngine(engineOptions);
    
    // 5. Jalankan backtesting
    console.log('🔄 Menjalankan realistic backtesting...');
    const results = await engine.runBacktest(historicalData, strategy, {
      symbol: SYMBOL
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

function displayResults(results) {
  console.log('\n📊 HASIL BACKTESTING REALISTIS');
  console.log('================================');
  
  // Balance & Equity
  console.log(`💰 Initial Balance: $${results.initialBalance.toFixed(2)}`);
  console.log(`💰 Final Balance: $${results.finalBalance.toFixed(2)}`);
  console.log(`💰 Final Equity: $${results.finalEquity.toFixed(2)}`);
  console.log(`📈 Total Return: $${results.totalReturn.toFixed(2)} (${results.totalReturnPercent.toFixed(2)}%)`);
  
  // Trading Statistics
  console.log(`\n📊 Trading Statistics:`);
  console.log(`   Total Trades: ${results.totalTrades}`);
  console.log(`   Winning Trades: ${results.winningTrades}`);
  console.log(`   Losing Trades: ${results.losingTrades}`);
  console.log(`   Win Rate: ${results.winRate.toFixed(2)}%`);
  
  // Profit & Loss
  console.log(`\n💵 Profit & Loss:`);
  console.log(`   Total Profit: $${results.totalProfit.toFixed(2)}`);
  console.log(`   Total Loss: $${results.totalLoss.toFixed(2)}`);
  console.log(`   Net Profit: $${results.netProfit.toFixed(2)}`);
  console.log(`   Average Win: $${results.averageWin.toFixed(2)}`);
  console.log(`   Average Loss: $${results.averageLoss.toFixed(2)}`);
  console.log(`   Profit Factor: ${results.profitFactor.toFixed(2)}`);
  
  // Risk Metrics
  console.log(`\n⚠️ Risk Metrics:`);
  console.log(`   Max Drawdown: $${results.maxDrawdown.toFixed(2)} (${results.maxDrawdownPercent.toFixed(2)}%)`);
  console.log(`   Sharpe Ratio: ${results.sharpeRatio.toFixed(2)}`);
  console.log(`   Recovery Factor: ${results.recoveryFactor.toFixed(2)}`);
  console.log(`   Calmar Ratio: ${results.calmarRatio.toFixed(2)}`);
  
  // Market Conditions
  console.log(`\n📈 Market Conditions:`);
  console.log(`   Average Spread: ${results.averageSpread.toFixed(5)}`);
  console.log(`   Average Slippage: ${results.averageSlippage.toFixed(5)}`);
  console.log(`   Total Commission: $${results.totalCommission.toFixed(2)}`);
  
  // Summary
  console.log(`\n🎯 Summary:`);
  console.log(`   Profitable: ${results.summary.profitable ? '✅ Yes' : '❌ No'}`);
  console.log(`   Risk-Adjusted Return: ${results.summary.riskAdjustedReturn.toFixed(2)}`);
  console.log(`   Consistency: ${results.summary.consistency.toFixed(2)}%`);
  console.log(`   Risk Management: ${results.summary.riskManagement}`);
  
  // Trade Analysis
  if (results.trades.length > 0) {
    console.log(`\n📋 Sample Trades (Last 5):`);
    results.trades.slice(-5).forEach((trade, index) => {
      console.log(`   ${index + 1}. ${trade.action} ${trade.lotSize} ${trade.instrument}`);
      console.log(`      Open: ${trade.openPrice.toFixed(5)} | Close: ${trade.closePrice.toFixed(5)}`);
      console.log(`      P&L: $${trade.pnl.toFixed(2)} | Pips: ${trade.pips.toFixed(1)}`);
      console.log(`      Duration: ${Math.round(trade.duration / (1000 * 60 * 60))} hours`);
      console.log(`      Reason: ${trade.reason}`);
      console.log('');
    });
  }
}

// Contoh penggunaan dengan API endpoint
async function runBacktestViaAPI() {
  try {
    const response = await fetch('/api/backtesting/realistic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-polygon-api-key': POLYGON_API_KEY
      },
      body: JSON.stringify({
        symbol: SYMBOL,
        strategy: {
          name: 'EUR/USD Realistic Strategy',
          type: 'realistic-forex',
          parameters: {
            rsiPeriod: 14,
            smaPeriods: [20, 50, 200],
            stopLossPips: 50,
            takeProfitPips: 100,
            minRiskRewardRatio: 1.5
          }
        },
        options: {
          from: FROM_DATE,
          to: TO_DATE,
          initialBalance: 10000,
          leverage: 50,
          commission: 0.0001,
          slippage: 0.0001
        }
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      displayResults(result.data);
    } else {
      console.error('❌ API Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error calling API:', error);
  }
}

// Export untuk penggunaan
export {
  runRealisticBacktest,
  runBacktestViaAPI,
  displayResults
};

// Jika dijalankan langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  runRealisticBacktest()
    .then(results => {
      console.log('✅ Backtesting completed successfully!');
    })
    .catch(error => {
      console.error('❌ Backtesting failed:', error);
      process.exit(1);
    });
}