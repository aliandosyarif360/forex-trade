import AlphaVantageClient from '../market-data/alpha-vantage.js';
import YahooFinanceClient from '../market-data/yahoo-finance.js';
import RSIStrategy from './strategies/rsi-strategy.js';
import cron from 'node-cron';

/**
 * Auto Trading Bot - SIAP PAKAI
 * Bot trading otomatis dengan multiple strategies dan risk management
 */
class AutoTrader {
  constructor(options = {}) {
    this.alphaVantage = new AlphaVantageClient(options.alphaVantageKey);
    this.yahooFinance = new YahooFinanceClient();
    
    // Trading configuration
    this.watchlist = options.watchlist || ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    this.strategies = options.strategies || [new RSIStrategy()];
    this.portfolio = options.portfolio || { cash: 10000, positions: {} };
    this.maxPositions = options.maxPositions || 5;
    this.minConfidence = options.minConfidence || 0.7;
    
    // Risk management
    this.maxRiskPerTrade = options.maxRiskPerTrade || 0.02; // 2%
    this.maxPortfolioRisk = options.maxPortfolioRisk || 0.10; // 10%
    
    // State
    this.isRunning = false;
    this.positions = new Map();
    this.tradeHistory = [];
    this.notifications = [];
    
    console.log('🤖 Auto Trading Bot initialized');
    console.log(`📊 Watchlist: ${this.watchlist.join(', ')}`);
    console.log(`💰 Starting portfolio: $${this.portfolio.cash}`);
  }

  /**
   * Start auto trading bot
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Bot sudah berjalan');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Auto Trading Bot...');

    // Jalankan setiap 5 menit selama jam trading
    cron.schedule('*/5 9-16 * * 1-5', async () => {
      if (this.isRunning) {
        await this.runTradingCycle();
      }
    });

    // Jalankan sekali sekarang untuk testing
    this.runTradingCycle();
  }

  /**
   * Stop auto trading bot
   */
  stop() {
    this.isRunning = false;
    console.log('🛑 Auto Trading Bot stopped');
  }

  /**
   * Main trading cycle
   */
  async runTradingCycle() {
    try {
      console.log(`\n🔄 Running trading cycle at ${new Date().toLocaleString()}`);
      
      // Scan semua symbols di watchlist
      for (const symbol of this.watchlist) {
        await this.analyzeSymbol(symbol);
        await this.sleep(1000); // Delay 1 detik antar symbol
      }

      // Update existing positions
      await this.updatePositions();

      // Print portfolio status
      this.printPortfolioStatus();

    } catch (error) {
      console.error('❌ Error in trading cycle:', error);
      this.addNotification('ERROR', `Trading cycle error: ${error.message}`);
    }
  }

  /**
   * Analyze single symbol
   */
  async analyzeSymbol(symbol) {
    try {
      console.log(`📈 Analyzing ${symbol}...`);

      // Get market data (try Alpha Vantage first, fallback to Yahoo)
      let marketData = await this.alphaVantage.getCurrentPrice(symbol);
      if (!marketData.success) {
        console.log(`⚠️  Alpha Vantage failed for ${symbol}, trying Yahoo Finance...`);
        marketData = await this.yahooFinance.getCurrentPrice(symbol);
      }

      if (!marketData.success) {
        console.log(`❌ Failed to get market data for ${symbol}`);
        return;
      }

      // Get technical indicators
      const rsiData = await this.alphaVantage.getTechnicalIndicator(symbol, 'RSI', 'daily');
      
      if (!rsiData.success) {
        console.log(`⚠️  No technical data for ${symbol}`);
        return;
      }

      // Analyze with all strategies
      for (const strategy of this.strategies) {
        const signal = await strategy.analyzeSignal(marketData.data, {
          rsi: rsiData.data
        });

        if (signal.signal !== 'HOLD' && signal.confidence >= this.minConfidence) {
          await this.executeSignal(symbol, signal, marketData.data, strategy);
        }
      }

    } catch (error) {
      console.error(`❌ Error analyzing ${symbol}:`, error);
    }
  }

  /**
   * Execute trading signal
   */
  async executeSignal(symbol, signal, marketData, strategy) {
    try {
      // Check if we already have position for this symbol
      const existingPosition = this.positions.get(symbol);
      
      if (signal.signal === 'BUY') {
        if (existingPosition) {
          console.log(`⚠️  Already have position in ${symbol}, skipping BUY`);
          return;
        }

        if (this.positions.size >= this.maxPositions) {
          console.log(`⚠️  Max positions reached (${this.maxPositions}), skipping BUY`);
          return;
        }

        await this.executeBuy(symbol, signal, marketData, strategy);
      }

      if (signal.signal === 'SELL') {
        if (!existingPosition) {
          console.log(`⚠️  No position in ${symbol}, skipping SELL`);
          return;
        }

        await this.executeSell(symbol, signal, marketData, strategy);
      }

    } catch (error) {
      console.error(`❌ Error executing signal for ${symbol}:`, error);
    }
  }

  /**
   * Execute buy order
   */
  async executeBuy(symbol, signal, marketData, strategy) {
    const price = marketData.price;
    const positionValue = this.portfolio.cash * signal.positionSize;
    const shares = Math.floor(positionValue / price);
    const totalCost = shares * price;

    if (totalCost > this.portfolio.cash) {
      console.log(`⚠️  Insufficient cash for ${symbol}: need $${totalCost}, have $${this.portfolio.cash}`);
      return;
    }

    // Create position
    const position = {
      symbol,
      side: 'LONG',
      shares,
      entryPrice: price,
      entryTime: new Date(),
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      strategy: strategy.name,
      signal: signal
    };

    // Update portfolio
    this.portfolio.cash -= totalCost;
    this.positions.set(symbol, position);

    // Record trade
    const trade = {
      type: 'BUY',
      symbol,
      shares,
      price,
      total: totalCost,
      time: new Date(),
      strategy: strategy.name,
      reason: signal.reason
    };

    this.tradeHistory.push(trade);

    console.log(`✅ BUY ${shares} shares of ${symbol} at $${price} (Total: $${totalCost.toFixed(2)})`);
    console.log(`📊 Reason: ${signal.reason} (Confidence: ${(signal.confidence * 100).toFixed(1)}%)`);
    
    this.addNotification('BUY', `Bought ${shares} ${symbol} at $${price} - ${signal.reason}`);
  }

  /**
   * Execute sell order
   */
  async executeSell(symbol, signal, marketData, strategy) {
    const position = this.positions.get(symbol);
    const currentPrice = marketData.price;
    const totalValue = position.shares * currentPrice;
    const pnl = totalValue - (position.shares * position.entryPrice);
    const pnlPercent = (pnl / (position.shares * position.entryPrice)) * 100;

    // Update portfolio
    this.portfolio.cash += totalValue;
    this.positions.delete(symbol);

    // Record trade
    const trade = {
      type: 'SELL',
      symbol,
      shares: position.shares,
      price: currentPrice,
      total: totalValue,
      pnl,
      pnlPercent,
      time: new Date(),
      strategy: strategy.name,
      reason: signal.reason,
      holdTime: new Date() - position.entryTime
    };

    this.tradeHistory.push(trade);

    const pnlEmoji = pnl > 0 ? '💰' : '📉';
    console.log(`${pnlEmoji} SELL ${position.shares} shares of ${symbol} at $${currentPrice} (Total: $${totalValue.toFixed(2)})`);
    console.log(`📊 P&L: $${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%) - ${signal.reason}`);
    
    this.addNotification('SELL', `Sold ${position.shares} ${symbol} at $${currentPrice} - P&L: $${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);
  }

  /**
   * Update existing positions (check stop loss, take profit)
   */
  async updatePositions() {
    for (const [symbol, position] of this.positions) {
      try {
        // Get current price
        let marketData = await this.yahooFinance.getCurrentPrice(symbol);
        if (!marketData.success) {
          continue;
        }

        const currentPrice = marketData.data.price;

        // Check stop loss
        if (currentPrice <= position.stopLoss) {
          console.log(`🛑 Stop Loss triggered for ${symbol} at $${currentPrice}`);
          await this.executeSell(symbol, {
            signal: 'SELL',
            reason: 'Stop Loss triggered',
            confidence: 1.0
          }, marketData.data, { name: 'Risk Management' });
          continue;
        }

        // Check take profit
        if (currentPrice >= position.takeProfit) {
          console.log(`🎯 Take Profit triggered for ${symbol} at $${currentPrice}`);
          await this.executeSell(symbol, {
            signal: 'SELL', 
            reason: 'Take Profit triggered',
            confidence: 1.0
          }, marketData.data, { name: 'Risk Management' });
          continue;
        }

        // Update trailing stop loss if applicable
        const strategy = this.strategies.find(s => s.name === position.strategy);
        if (strategy) {
          const newStopLoss = strategy.updateStopLoss(
            currentPrice, 
            position.entryPrice, 
            position.stopLoss, 
            'BUY'
          );
          
          if (newStopLoss > position.stopLoss) {
            position.stopLoss = newStopLoss;
            console.log(`📈 Trailing stop updated for ${symbol}: $${newStopLoss.toFixed(2)}`);
          }
        }

      } catch (error) {
        console.error(`❌ Error updating position ${symbol}:`, error);
      }
    }
  }

  /**
   * Print portfolio status
   */
  printPortfolioStatus() {
    console.log('\n💼 PORTFOLIO STATUS');
    console.log('=' .repeat(50));
    console.log(`💵 Cash: $${this.portfolio.cash.toFixed(2)}`);
    
    let totalPositionValue = 0;
    console.log(`📊 Positions (${this.positions.size}/${this.maxPositions}):`);
    
    for (const [symbol, position] of this.positions) {
      const positionValue = position.shares * position.entryPrice;
      totalPositionValue += positionValue;
      console.log(`   ${symbol}: ${position.shares} shares @ $${position.entryPrice} = $${positionValue.toFixed(2)}`);
    }

    const totalPortfolio = this.portfolio.cash + totalPositionValue;
    console.log(`💰 Total Portfolio Value: $${totalPortfolio.toFixed(2)}`);
    console.log('=' .repeat(50));
  }

  /**
   * Add notification
   */
  addNotification(type, message) {
    const notification = {
      type,
      message,
      timestamp: new Date()
    };
    
    this.notifications.push(notification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(-100);
    }
  }

  /**
   * Get trading statistics
   */
  getStatistics() {
    const trades = this.tradeHistory.filter(t => t.type === 'SELL');
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl <= 0);
    
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    
    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: winRate.toFixed(2) + '%',
      totalPnL: totalPnL.toFixed(2),
      averagePnL: totalTrades > 0 ? (totalPnL / totalTrades).toFixed(2) : 0,
      activePositions: this.positions.size
    };
  }

  /**
   * Utility function to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default AutoTrader;