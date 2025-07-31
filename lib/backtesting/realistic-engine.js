import { POLYGON_CONFIG } from '../polygon/config.js';

/**
 * Realistic Forex Backtesting Engine
 * Simulasi trading forex yang realistis dengan kondisi market yang sebenarnya
 */
class RealisticForexBacktestingEngine {
  constructor(options = {}) {
    // Account settings - menggunakan nilai real bukan demo
    this.initialBalance = options.initialBalance || POLYGON_CONFIG.BACKTESTING.DEFAULT_INITIAL_BALANCE;
    this.leverage = options.leverage || POLYGON_CONFIG.TRADING.DEFAULT_LEVERAGE;
    this.commission = options.commission || POLYGON_CONFIG.BACKTESTING.DEFAULT_COMMISSION;
    this.slippage = options.slippage || POLYGON_CONFIG.BACKTESTING.DEFAULT_SLIPPAGE;
    
    // Market settings - menggunakan spread real berdasarkan volatility
    this.spread = options.spread || POLYGON_CONFIG.TRADING.DEFAULT_SPREAD;
    this.maxSpread = options.maxSpread || POLYGON_CONFIG.TRADING.MAX_SPREAD;
    this.minVolume = options.minVolume || POLYGON_CONFIG.TRADING.MIN_VOLUME;
    
    // Risk management - menggunakan parameter real
    this.maxDrawdown = options.maxDrawdown || POLYGON_CONFIG.RISK_MANAGEMENT.MAX_DRAWDOWN;
    this.maxDailyLoss = options.maxDailyLoss || POLYGON_CONFIG.RISK_MANAGEMENT.MAX_DAILY_LOSS;
    this.maxPositionSize = options.maxPositionSize || POLYGON_CONFIG.RISK_MANAGEMENT.MAX_POSITION_SIZE;
    this.maxOpenPositions = options.maxOpenPositions || POLYGON_CONFIG.RISK_MANAGEMENT.MAX_OPEN_POSITIONS;
    this.minRiskRewardRatio = options.minRiskRewardRatio || POLYGON_CONFIG.RISK_MANAGEMENT.MIN_RISK_REWARD_RATIO;
    
    // Trading state
    this.balance = this.initialBalance;
    this.equity = this.initialBalance;
    this.positions = [];
    this.trades = [];
    this.orders = [];
    this.dailyPnL = 0;
    this.dailyTrades = 0;
    this.currentDate = null;
    
    // Performance tracking
    this.equityHistory = [];
    this.drawdownHistory = [];
    this.dailyStats = [];
    
    // Market hours tracking - menggunakan jam trading forex real
    this.marketHours = POLYGON_CONFIG.MARKET_HOURS.FOREX;
    this.isMarketOpen = true;
    
    // Callbacks
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onTrade = options.onTrade || (() => {});
    this.onError = options.onError || (() => {});
  }

  /**
   * Jalankan backtesting dengan data historis real
   */
  async runBacktest(historicalData, strategy, options = {}) {
    try {
      this.reset();
      
      const startTime = new Date();
      const totalBars = historicalData.length;
      
      console.log(`Memulai realistic backtesting dengan ${totalBars} bar data real...`);
      
      // Validasi data - memastikan data cukup untuk analisis yang akurat
      if (totalBars < POLYGON_CONFIG.BACKTESTING.MIN_DATA_POINTS) {
        throw new Error(`Data tidak mencukupi untuk backtesting yang akurat. Minimal ${POLYGON_CONFIG.BACKTESTING.MIN_DATA_POINTS} data points`);
      }
      
      // Validasi data quality
      this.validateHistoricalData(historicalData);
      
      for (let i = 0; i < totalBars; i++) {
        const currentBar = historicalData[i];
        const previousBars = historicalData.slice(0, i + 1);
        
        // Update market hours berdasarkan timestamp real
        this.updateMarketHours(currentBar.time);
        
        // Update posisi yang ada dengan data real
        this.updatePositions(currentBar);
        
        // Cek risk management dengan parameter real
        if (!this.checkRiskManagement()) {
          console.log('Risk management triggered - stopping trading untuk melindungi capital');
          break;
        }
        
        // Jalankan strategi hanya jika market terbuka
        if (this.isMarketOpen) {
          const signals = await strategy.analyze(previousBars, currentBar, {
            currentBalance: this.balance,
            currentEquity: this.equity,
            openPositions: this.positions.length,
            dailyPnL: this.dailyPnL,
            dailyTrades: this.dailyTrades,
            marketConditions: this.getMarketConditions(currentBar)
          });
          
          // Proses sinyal trading dengan validasi real
          if (signals && signals.length > 0) {
            for (const signal of signals) {
              if (this.validateSignal(signal, currentBar)) {
                this.processSignal(signal, currentBar);
              }
            }
          }
        }
        
        // Update equity history dengan data real
        this.updateEquityHistory(currentBar);
        
        // Update daily stats
        this.updateDailyStats(currentBar);
        
        // Update progress dengan data real
        if (i % 100 === 0) {
          const progress = (i / totalBars) * 100;
          this.onProgress({
            progress,
            currentBar: i,
            totalBars,
            currentEquity: this.equity,
            currentDrawdown: this.getCurrentDrawdown(),
            dailyPnL: this.dailyPnL,
            openPositions: this.positions.length
          });
        }
      }
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      const results = this.calculateResults();
      results.duration = duration;
      results.startTime = startTime;
      results.endTime = endTime;
      results.dataQuality = this.assessDataQuality(historicalData);
      
      console.log(`Realistic backtesting selesai dalam ${duration}ms`);
      console.log(`Total trades: ${this.trades.length}`);
      console.log(`Final equity: $${this.equity.toFixed(2)}`);
      console.log(`Max drawdown: ${this.getMaxDrawdownPercent().toFixed(2)}%`);
      
      if (this.onComplete) {
        this.onComplete(results);
      }
      
      return results;
      
    } catch (error) {
      console.error('Error dalam realistic backtesting:', error);
      this.onError(error);
      throw error;
    }
  }

  /**
   * Validasi data historis untuk memastikan kualitas
   */
  validateHistoricalData(data) {
    if (!data || data.length === 0) {
      throw new Error('Data historis kosong');
    }
    
    // Cek struktur data
    const requiredFields = ['time', 'open', 'high', 'low', 'close', 'volume'];
    const sample = data[0];
    
    for (const field of requiredFields) {
      if (!(field in sample)) {
        throw new Error(`Data historis tidak memiliki field: ${field}`);
      }
    }
    
    // Cek konsistensi data
    let invalidBars = 0;
    for (const bar of data) {
      if (bar.high < bar.low || bar.open < 0 || bar.close < 0) {
        invalidBars++;
      }
    }
    
    if (invalidBars > data.length * 0.01) { // Lebih dari 1% data invalid
      throw new Error(`Data historis memiliki terlalu banyak bar yang tidak valid: ${invalidBars}`);
    }
    
    console.log(`Data historis valid: ${data.length} bars, ${invalidBars} invalid bars`);
  }

  /**
   * Assess data quality untuk backtesting
   */
  assessDataQuality(data) {
    const totalBars = data.length;
    let missingData = 0;
    let zeroVolume = 0;
    let extremeVolatility = 0;
    
    for (const bar of data) {
      if (!bar.volume || bar.volume === 0) zeroVolume++;
      if (bar.high === bar.low) missingData++;
      
      // Cek volatility ekstrim
      const volatility = (bar.high - bar.low) / bar.low;
      if (volatility > 0.1) extremeVolatility++; // 10% volatility
    }
    
    return {
      totalBars,
      missingData: (missingData / totalBars) * 100,
      zeroVolume: (zeroVolume / totalBars) * 100,
      extremeVolatility: (extremeVolatility / totalBars) * 100,
      quality: totalBars >= 1000 && (missingData / totalBars) < 0.05 ? 'good' : 'poor'
    };
  }

  /**
   * Get market conditions berdasarkan data real
   */
  getMarketConditions(currentBar) {
    const volatility = (currentBar.high - currentBar.low) / currentBar.low;
    const spread = this.calculateSpread(currentBar);
    const volume = currentBar.volume || 0;
    
    return {
      volatility,
      spread,
      volume,
      isHighVolatility: volatility > 0.05,
      isLowVolume: volume < this.minVolume,
      isWideSpread: spread > this.maxSpread
    };
  }

  reset() {
    this.balance = this.initialBalance;
    this.equity = this.initialBalance;
    this.positions = [];
    this.trades = [];
    this.orders = [];
    this.dailyPnL = 0;
    this.dailyTrades = 0;
    this.currentDate = null;
    this.equityHistory = [];
    this.drawdownHistory = [];
    this.dailyStats = [];
    this.maxDrawdown = 0;
    this.maxDrawdownPercent = 0;
  }

  updateMarketHours(timestamp) {
    const date = new Date(timestamp);
    const dayOfWeek = date.getUTCDay();
    const hour = date.getUTCHours();
    
    // Forex market: Sunday 22:00 UTC - Friday 22:00 UTC
    if (dayOfWeek === 0 && hour < 22) {
      this.isMarketOpen = false; // Sunday sebelum 22:00 UTC
    } else if (dayOfWeek === 5 && hour >= 22) {
      this.isMarketOpen = false; // Friday setelah 22:00 UTC
    } else if (dayOfWeek === 6) {
      this.isMarketOpen = false; // Saturday
    } else {
      this.isMarketOpen = true;
    }
  }

  checkRiskManagement() {
    // Cek daily loss limit
    if (this.dailyPnL < -(this.balance * this.maxDailyLoss / 100)) {
      console.log(`Daily loss limit reached: ${this.dailyPnL.toFixed(2)}`);
      return false;
    }
    
    // Cek max drawdown
    const currentDrawdown = this.getCurrentDrawdownPercent();
    if (currentDrawdown > this.maxDrawdown) {
      console.log(`Max drawdown limit reached: ${currentDrawdown.toFixed(2)}%`);
      return false;
    }
    
    // Cek max open positions
    if (this.positions.length >= this.maxOpenPositions) {
      console.log(`Max open positions reached: ${this.positions.length}`);
      return false;
    }
    
    return true;
  }

  processSignal(signal, currentBar) {
    try {
      const { action, price, stopLoss, takeProfit, lotSize, confidence } = signal;
      
      // Validasi signal dengan kondisi market real
      if (!this.validateSignal(signal, currentBar)) {
        return;
      }
      
      const executionPrice = this.getExecutionPrice(action, currentBar);
      
      if (action === 'BUY' || action === 'SELL') {
        const positionData = {
          id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          action,
          symbol: signal.symbol || 'EUR/USD',
          entryPrice: executionPrice,
          stopLoss: stopLoss || this.calculateStopLoss(action, executionPrice),
          takeProfit: takeProfit || this.calculateTakeProfit(action, executionPrice),
          lotSize: lotSize || this.calculateOptimalLotSize(stopLoss),
          entryTime: currentBar.time,
          confidence,
          status: 'open'
        };
        
        this.openPosition(positionData);
      } else if (action === 'CLOSE') {
        // Close semua posisi atau posisi tertentu
        if (signal.positionId) {
          this.closePosition(signal.positionId, currentBar);
        } else {
          // Close semua posisi
          this.positions.forEach(pos => {
            this.closePosition(pos.id, currentBar);
          });
        }
      }
      
    } catch (error) {
      console.error('Error processing signal:', error);
      this.onError(error);
    }
  }

  validateSignal(signal, currentBar) {
    const { action, price, stopLoss, takeProfit, lotSize } = signal;
    
    // Validasi action
    if (!['BUY', 'SELL', 'CLOSE'].includes(action)) {
      console.log('Invalid action:', action);
      return false;
    }
    
    // Validasi price
    if (action !== 'CLOSE' && (!price || price <= 0)) {
      console.log('Invalid price:', price);
      return false;
    }
    
    // Validasi lot size
    if (action !== 'CLOSE' && lotSize) {
      if (lotSize < POLYGON_CONFIG.TRADING.MIN_LOT_SIZE || 
          lotSize > POLYGON_CONFIG.TRADING.MAX_LOT_SIZE) {
        console.log('Invalid lot size:', lotSize);
        return false;
      }
    }
    
    // Validasi risk:reward ratio
    if (action !== 'CLOSE' && stopLoss && takeProfit) {
      const riskRewardRatio = this.calculateRiskRewardRatio(stopLoss, takeProfit, price, action);
      if (riskRewardRatio < this.minRiskRewardRatio) {
        console.log('Risk:reward ratio too low:', riskRewardRatio);
        return false;
      }
    }
    
    // Cek market conditions
    const marketConditions = this.getMarketConditions(currentBar);
    if (marketConditions.isWideSpread) {
      console.log('Spread too wide for trading');
      return false;
    }
    
    if (marketConditions.isLowVolume) {
      console.log('Volume too low for trading');
      return false;
    }
    
    return true;
  }

  openPosition(positionData) {
    try {
      const { action, entryPrice, lotSize, stopLoss, takeProfit } = positionData;
      
      // Cek balance
      const requiredMargin = (entryPrice * lotSize) / this.leverage;
      if (requiredMargin > this.balance * this.maxPositionSize / 100) {
        console.log('Insufficient margin for position');
        return;
      }
      
      // Apply slippage
      const executionPrice = this.applySlippage(entryPrice, action);
      
      // Update position dengan execution price
      positionData.entryPrice = executionPrice;
      positionData.requiredMargin = requiredMargin;
      
      // Deduct margin dari balance
      this.balance -= requiredMargin;
      
      // Add commission
      const commission = executionPrice * lotSize * this.commission;
      this.balance -= commission;
      
      this.positions.push(positionData);
      
      console.log(`Opened ${action} position: ${lotSize} lots at ${executionPrice}`);
      
      if (this.onTrade) {
        this.onTrade({
          type: 'open',
          position: positionData,
          commission,
          balance: this.balance
        });
      }
      
    } catch (error) {
      console.error('Error opening position:', error);
      this.onError(error);
    }
  }

  closePosition(positionId, currentBar) {
    try {
      const positionIndex = this.positions.findIndex(p => p.id === positionId);
      if (positionIndex === -1) {
        console.log('Position not found:', positionId);
        return;
      }
      
      const position = this.positions[positionIndex];
      const closePrice = this.getClosePrice(position, currentBar);
      
      // Calculate P&L
      const pnl = this.calculatePnL(position, closePrice);
      const pips = this.calculatePips(position.entryPrice, closePrice, position.action);
      
      // Update balance
      this.balance += position.requiredMargin;
      this.balance += pnl;
      
      // Add commission
      const commission = closePrice * position.lotSize * this.commission;
      this.balance -= commission;
      
      // Create trade record
      const trade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        positionId,
        symbol: position.symbol,
        action: position.action,
        entryPrice: position.entryPrice,
        exitPrice: closePrice,
        lotSize: position.lotSize,
        pnl,
        pips,
        commission,
        entryTime: position.entryTime,
        exitTime: currentBar.time,
        duration: new Date(currentBar.time) - new Date(position.entryTime),
        stopLoss: position.stopLoss,
        takeProfit: position.takeProfit,
        exitReason: this.getExitReason(position, currentBar)
      };
      
      this.trades.push(trade);
      this.positions.splice(positionIndex, 1);
      
      // Update daily stats
      this.dailyPnL += pnl;
      this.dailyTrades++;
      
      console.log(`Closed ${position.action} position: ${pnl.toFixed(2)} P&L, ${pips.toFixed(1)} pips`);
      
      if (this.onTrade) {
        this.onTrade({
          type: 'close',
          trade,
          balance: this.balance
        });
      }
      
    } catch (error) {
      console.error('Error closing position:', error);
      this.onError(error);
    }
  }

  updatePositions(currentBar) {
    for (let i = this.positions.length - 1; i >= 0; i--) {
      const position = this.positions[i];
      
      // Check stop loss
      if (this.shouldCloseOnStopLoss(position, currentBar)) {
        this.closePosition(position.id, currentBar);
        continue;
      }
      
      // Check take profit
      if (this.shouldCloseOnTakeProfit(position, currentBar)) {
        this.closePosition(position.id, currentBar);
        continue;
      }
      
      // Update unrealized P&L
      const currentPrice = this.getCurrentPrice(position, currentBar);
      position.unrealizedPnl = this.calculatePnL(position, currentPrice);
    }
    
    this.updateEquity();
  }

  getExecutionPrice(action, bar) {
    let price;
    
    if (action === 'BUY') {
      price = bar.high; // Worst case scenario
    } else if (action === 'SELL') {
      price = bar.low; // Worst case scenario
    } else {
      price = bar.close;
    }
    
    return this.applySlippage(price, action);
  }

  calculateSpread(bar) {
    // Calculate spread berdasarkan volatility
    const volatility = (bar.high - bar.low) / bar.low;
    const baseSpread = this.spread;
    const volatilityMultiplier = Math.min(volatility * 10, 3); // Max 3x spread
    
    return baseSpread * volatilityMultiplier;
  }

  calculateRiskRewardRatio(stopLoss, takeProfit, entryPrice, action) {
    if (action === 'BUY') {
      const risk = entryPrice - stopLoss;
      const reward = takeProfit - entryPrice;
      return reward / risk;
    } else {
      const risk = stopLoss - entryPrice;
      const reward = entryPrice - takeProfit;
      return reward / risk;
    }
  }

  calculateOptimalLotSize(stopLossPips) {
    const riskAmount = this.balance * POLYGON_CONFIG.TRADING.DEFAULT_RISK_PERCENT / 100;
    const pipValue = 0.0001; // 1 pip untuk EUR/USD
    const lotSize = riskAmount / (stopLossPips * pipValue);
    
    return Math.min(
      Math.max(lotSize, POLYGON_CONFIG.TRADING.MIN_LOT_SIZE),
      POLYGON_CONFIG.TRADING.MAX_LOT_SIZE
    );
  }

  calculateStopLoss(action, entryPrice) {
    const stopLossPips = POLYGON_CONFIG.TRADING.DEFAULT_STOP_LOSS_PIPS;
    const pipValue = 0.0001;
    
    if (action === 'BUY') {
      return entryPrice - (stopLossPips * pipValue);
    } else {
      return entryPrice + (stopLossPips * pipValue);
    }
  }

  calculateTakeProfit(action, entryPrice) {
    const takeProfitPips = POLYGON_CONFIG.TRADING.DEFAULT_TAKE_PROFIT_PIPS;
    const pipValue = 0.0001;
    
    if (action === 'BUY') {
      return entryPrice + (takeProfitPips * pipValue);
    } else {
      return entryPrice - (takeProfitPips * pipValue);
    }
  }

  getExitReason(position, currentBar) {
    if (this.shouldCloseOnStopLoss(position, currentBar)) {
      return 'stop_loss';
    } else if (this.shouldCloseOnTakeProfit(position, currentBar)) {
      return 'take_profit';
    } else {
      return 'manual';
    }
  }

  updateDailyStats(currentBar) {
    const currentDate = new Date(currentBar.time).toDateString();
    
    if (this.currentDate !== currentDate) {
      if (this.currentDate) {
        this.dailyStats.push({
          date: this.currentDate,
          pnl: this.dailyPnL,
          trades: this.dailyTrades
        });
      }
      
      this.currentDate = currentDate;
      this.dailyPnL = 0;
      this.dailyTrades = 0;
    }
  }

  calculateResults() {
    const totalTrades = this.trades.length;
    const winningTrades = this.trades.filter(t => t.pnl > 0).length;
    const losingTrades = this.trades.filter(t => t.pnl < 0).length;
    
    const totalProfit = this.trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = Math.abs(this.trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;
    
    const maxDrawdown = this.getMaxDrawdown();
    const maxDrawdownPercent = this.getMaxDrawdownPercent();
    
    const sharpeRatio = this.calculateSharpeRatio();
    
    const totalReturn = ((this.equity - this.initialBalance) / this.initialBalance) * 100;
    
    return {
      // Account metrics
      initialBalance: this.initialBalance,
      finalBalance: this.balance,
      finalEquity: this.equity,
      totalReturn,
      
      // Trade metrics
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalProfit,
      totalLoss,
      profitFactor,
      
      // Risk metrics
      maxDrawdown,
      maxDrawdownPercent,
      sharpeRatio,
      
      // Performance metrics
      averageTrade: totalTrades > 0 ? (this.equity - this.initialBalance) / totalTrades : 0,
      largestWin: this.trades.length > 0 ? Math.max(...this.trades.map(t => t.pnl)) : 0,
      largestLoss: this.trades.length > 0 ? Math.min(...this.trades.map(t => t.pnl)) : 0,
      averageWin: winningTrades > 0 ? totalProfit / winningTrades : 0,
      averageLoss: losingTrades > 0 ? totalLoss / losingTrades : 0,
      
      // Detailed data
      trades: this.trades,
      equityHistory: this.equityHistory,
      drawdownHistory: this.drawdownHistory,
      dailyStats: this.dailyStats,
      
      // Configuration
      config: {
        leverage: this.leverage,
        commission: this.commission,
        slippage: this.slippage,
        maxDrawdown: this.maxDrawdown,
        maxDailyLoss: this.maxDailyLoss,
        maxPositionSize: this.maxPositionSize,
        maxOpenPositions: this.maxOpenPositions,
        minRiskRewardRatio: this.minRiskRewardRatio
      }
    };
  }

  shouldCloseOnStopLoss(position, currentBar) {
    const currentPrice = this.getCurrentPrice(position, currentBar);
    
    if (position.action === 'BUY') {
      return currentPrice <= position.stopLoss;
    } else {
      return currentPrice >= position.stopLoss;
    }
  }

  shouldCloseOnTakeProfit(position, currentBar) {
    const currentPrice = this.getCurrentPrice(position, currentBar);
    
    if (position.action === 'BUY') {
      return currentPrice >= position.takeProfit;
    } else {
      return currentPrice <= position.takeProfit;
    }
  }

  getClosePrice(position, currentBar) {
    if (position.action === 'BUY') {
      return this.applySlippage(currentBar.low, 'SELL'); // Worst case
    } else {
      return this.applySlippage(currentBar.high, 'BUY'); // Worst case
    }
  }

  getCurrentPrice(position, currentBar) {
    return currentBar.close;
  }

  calculatePnL(position, closePrice) {
    const { action, entryPrice, lotSize } = position;
    const pipValue = 0.0001;
    
    if (action === 'BUY') {
      const pips = (closePrice - entryPrice) / pipValue;
      return pips * lotSize * 10; // $10 per pip for standard lot
    } else {
      const pips = (entryPrice - closePrice) / pipValue;
      return pips * lotSize * 10;
    }
  }

  calculatePips(openPrice, closePrice, action) {
    const pipValue = 0.0001;
    
    if (action === 'BUY') {
      return (closePrice - openPrice) / pipValue;
    } else {
      return (openPrice - closePrice) / pipValue;
    }
  }

  applySlippage(price, action) {
    const slippageMultiplier = action === 'BUY' ? 1 : -1;
    return price + (this.slippage * slippageMultiplier);
  }

  updateEquity() {
    let unrealizedPnl = 0;
    
    for (const position of this.positions) {
      if (position.unrealizedPnl) {
        unrealizedPnl += position.unrealizedPnl;
      }
    }
    
    this.equity = this.balance + unrealizedPnl;
  }

  updateEquityHistory(currentBar) {
    this.updateEquity();
    
    this.equityHistory.push({
      time: currentBar.time,
      equity: this.equity,
      balance: this.balance,
      openPositions: this.positions.length
    });
    
    // Update drawdown
    const currentDrawdown = this.getCurrentDrawdown();
    this.drawdownHistory.push({
      time: currentBar.time,
      drawdown: currentDrawdown,
      drawdownPercent: this.getCurrentDrawdownPercent()
    });
  }

  getCurrentDrawdown() {
    if (this.equityHistory.length === 0) return 0;
    
    const peak = Math.max(...this.equityHistory.map(h => h.equity));
    return peak - this.equity;
  }

  getCurrentDrawdownPercent() {
    if (this.equityHistory.length === 0) return 0;
    
    const peak = Math.max(...this.equityHistory.map(h => h.equity));
    return ((peak - this.equity) / peak) * 100;
  }

  getMaxDrawdown() {
    if (this.drawdownHistory.length === 0) return 0;
    
    return Math.max(...this.drawdownHistory.map(d => d.drawdown));
  }

  getMaxDrawdownPercent() {
    if (this.drawdownHistory.length === 0) return 0;
    
    return Math.max(...this.drawdownHistory.map(d => d.drawdownPercent));
  }

  calculateSharpeRatio() {
    if (this.equityHistory.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < this.equityHistory.length; i++) {
      const return_ = (this.equityHistory[i].equity - this.equityHistory[i-1].equity) / this.equityHistory[i-1].equity;
      returns.push(return_);
    }
    
    const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / returns.length;
    const standardDeviation = Math.sqrt(variance);
    
    return standardDeviation > 0 ? averageReturn / standardDeviation : 0;
  }
}

export default RealisticForexBacktestingEngine;