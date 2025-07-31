import { POLYGON_CONFIG } from '../polygon/config.js';

/**
 * Realistic Forex Backtesting Engine
 * Simulasi trading forex yang realistis dengan kondisi market yang sebenarnya
 */
class RealisticForexBacktestingEngine {
  constructor(options = {}) {
    // Account settings
    this.initialBalance = options.initialBalance || POLYGON_CONFIG.BACKTESTING.DEFAULT_INITIAL_BALANCE;
    this.leverage = options.leverage || POLYGON_CONFIG.TRADING.DEFAULT_LEVERAGE;
    this.commission = options.commission || POLYGON_CONFIG.BACKTESTING.DEFAULT_COMMISSION;
    this.slippage = options.slippage || POLYGON_CONFIG.BACKTESTING.DEFAULT_SLIPPAGE;
    
    // Market settings
    this.spread = options.spread || POLYGON_CONFIG.TRADING.DEFAULT_SPREAD;
    this.maxSpread = options.maxSpread || POLYGON_CONFIG.TRADING.MAX_SPREAD;
    this.minVolume = options.minVolume || POLYGON_CONFIG.TRADING.MIN_VOLUME;
    
    // Risk management
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
    
    // Market hours tracking
    this.marketHours = POLYGON_CONFIG.MARKET_HOURS.FOREX;
    this.isMarketOpen = true;
    
    // Callbacks
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onTrade = options.onTrade || (() => {});
    this.onError = options.onError || (() => {});
  }

  /**
   * Jalankan backtesting dengan data historis
   */
  async runBacktest(historicalData, strategy, options = {}) {
    try {
      this.reset();
      
      const startTime = new Date();
      const totalBars = historicalData.length;
      
      console.log(`Memulai realistic backtesting dengan ${totalBars} bar data...`);
      
      // Validasi data
      if (totalBars < POLYGON_CONFIG.BACKTESTING.MIN_DATA_POINTS) {
        throw new Error(`Data tidak mencukupi. Minimal ${POLYGON_CONFIG.BACKTESTING.MIN_DATA_POINTS} data points`);
      }
      
      for (let i = 0; i < totalBars; i++) {
        const currentBar = historicalData[i];
        const previousBars = historicalData.slice(0, i + 1);
        
        // Update market hours
        this.updateMarketHours(currentBar.time);
        
        // Update posisi yang ada
        this.updatePositions(currentBar);
        
        // Cek risk management
        if (!this.checkRiskManagement()) {
          console.log('Risk management triggered - stopping trading');
          break;
        }
        
        // Jalankan strategi hanya jika market terbuka
        if (this.isMarketOpen) {
          const signals = await strategy.analyze(previousBars, currentBar, {
            currentBalance: this.balance,
            currentEquity: this.equity,
            openPositions: this.positions.length,
            dailyPnL: this.dailyPnL,
            dailyTrades: this.dailyTrades
          });
          
          // Proses sinyal trading
          if (signals && signals.length > 0) {
            for (const signal of signals) {
              this.processSignal(signal, currentBar);
            }
          }
        }
        
        // Update equity history
        this.updateEquityHistory(currentBar);
        
        // Update daily stats
        this.updateDailyStats(currentBar);
        
        // Update progress
        if (i % 100 === 0) {
          const progress = (i / totalBars) * 100;
          this.onProgress({
            progress,
            currentBar: i,
            totalBars,
            currentEquity: this.equity,
            currentDrawdown: this.getCurrentDrawdown(),
            openPositions: this.positions.length,
            dailyPnL: this.dailyPnL
          });
        }
      }
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      const results = this.calculateResults();
      results.duration = duration;
      results.startTime = startTime;
      results.endTime = endTime;
      
      console.log(`Realistic backtesting selesai dalam ${duration}ms`);
      
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
   * Reset state backtesting
   */
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
    this.isMarketOpen = true;
  }

  /**
   * Update market hours berdasarkan waktu
   */
  updateMarketHours(timestamp) {
    const date = new Date(timestamp);
    const dayOfWeek = date.getUTCDay();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const timeInMinutes = hour * 60 + minute;
    
    // Forex market buka 24/5 (Senin-Jumat)
    // Market tutup dari Jumat 22:00 UTC sampai Minggu 22:00 UTC
    if (dayOfWeek === 0) { // Minggu
      this.isMarketOpen = timeInMinutes >= 22 * 60; // Setelah 22:00 UTC
    } else if (dayOfWeek === 5) { // Jumat
      this.isMarketOpen = timeInMinutes < 22 * 60; // Sebelum 22:00 UTC
    } else if (dayOfWeek >= 1 && dayOfWeek <= 4) { // Senin-Kamis
      this.isMarketOpen = true;
    } else {
      this.isMarketOpen = false;
    }
  }

  /**
   * Cek risk management
   */
  checkRiskManagement() {
    // Cek maximum drawdown
    const currentDrawdown = this.getCurrentDrawdownPercent();
    if (currentDrawdown > this.maxDrawdown) {
      console.log(`Maximum drawdown terlampaui: ${currentDrawdown.toFixed(2)}%`);
      return false;
    }
    
    // Cek daily loss limit
    if (this.dailyPnL < -(this.balance * this.maxDailyLoss / 100)) {
      console.log(`Daily loss limit terlampaui: ${this.dailyPnL.toFixed(2)}`);
      return false;
    }
    
    // Cek maximum open positions
    if (this.positions.length >= this.maxOpenPositions) {
      console.log(`Maximum open positions terlampaui: ${this.positions.length}`);
      return false;
    }
    
    return true;
  }

  /**
   * Proses sinyal trading
   */
  processSignal(signal, currentBar) {
    const { action, instrument, lotSize, stopLoss, takeProfit, price, reason } = signal;
    
    // Validasi signal
    if (!this.validateSignal(signal, currentBar)) {
      return false;
    }
    
    if (action === 'BUY' || action === 'SELL') {
      return this.openPosition({
        instrument,
        action,
        lotSize: lotSize || this.calculateOptimalLotSize(stopLoss),
        openPrice: price || this.getExecutionPrice(action, currentBar),
        stopLoss,
        takeProfit,
        openTime: currentBar.time,
        bar: currentBar,
        reason
      });
    } else if (action === 'CLOSE') {
      return this.closePosition(signal.positionId || 'all', currentBar);
    } else if (action === 'MODIFY') {
      return this.modifyPosition(signal.positionId, signal.stopLoss, signal.takeProfit);
    }
    
    return false;
  }

  /**
   * Validasi signal trading
   */
  validateSignal(signal, currentBar) {
    const { action, instrument, lotSize, stopLoss, takeProfit } = signal;
    
    // Cek apakah market terbuka
    if (!this.isMarketOpen) {
      console.log('Market sedang tutup, signal diabaikan');
      return false;
    }
    
    // Cek spread
    const currentSpread = this.calculateSpread(currentBar);
    if (currentSpread > this.maxSpread) {
      console.log(`Spread terlalu tinggi: ${currentSpread.toFixed(5)}`);
      return false;
    }
    
    // Cek volume
    if (currentBar.volume < this.minVolume) {
      console.log(`Volume terlalu rendah: ${currentBar.volume}`);
      return false;
    }
    
    // Cek risk:reward ratio
    if (stopLoss && takeProfit) {
      const riskRewardRatio = this.calculateRiskRewardRatio(stopLoss, takeProfit, signal.openPrice || currentBar.close, action);
      if (riskRewardRatio < this.minRiskRewardRatio) {
        console.log(`Risk:reward ratio terlalu rendah: ${riskRewardRatio.toFixed(2)}`);
        return false;
      }
    }
    
    // Cek lot size
    const minLotSize = POLYGON_CONFIG.TRADING.MIN_LOT_SIZE;
    const maxLotSize = POLYGON_CONFIG.TRADING.MAX_LOT_SIZE;
    if (lotSize < minLotSize || lotSize > maxLotSize) {
      console.log(`Lot size tidak valid: ${lotSize}`);
      return false;
    }
    
    return true;
  }

  /**
   * Buka posisi baru dengan simulasi realistis
   */
  openPosition(positionData) {
    const {
      instrument,
      action,
      lotSize,
      openPrice,
      stopLoss,
      takeProfit,
      openTime,
      bar,
      reason
    } = positionData;

    // Hitung margin yang diperlukan
    const positionValue = lotSize * 100000 * openPrice;
    const marginRequired = positionValue / this.leverage;
    
    // Cek apakah margin mencukupi
    if (marginRequired > this.balance) {
      console.log('Margin tidak mencukupi untuk membuka posisi');
      return false;
    }
    
    // Cek maximum position size
    const positionSizePercent = (marginRequired / this.balance) * 100;
    if (positionSizePercent > this.maxPositionSize) {
      console.log(`Position size terlalu besar: ${positionSizePercent.toFixed(2)}%`);
      return false;
    }

    // Simulasi slippage dan spread
    const executionPrice = this.getExecutionPrice(action, bar);
    const actualOpenPrice = this.applySlippage(executionPrice, action);
    
    // Hitung commission
    const commission = positionValue * this.commission;

    const position = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      instrument,
      action,
      lotSize,
      openPrice: actualOpenPrice,
      stopLoss,
      takeProfit,
      openTime,
      marginUsed: marginRequired,
      commission,
      unrealizedPnL: 0,
      status: 'open',
      reason,
      executionPrice,
      slippage: Math.abs(actualOpenPrice - executionPrice)
    };

    this.positions.push(position);
    this.balance -= commission; // Kurangi commission dari balance
    
    console.log(`Posisi dibuka: ${action} ${lotSize} ${instrument} @ ${actualOpenPrice} (Slippage: ${position.slippage.toFixed(5)})`);
    
    // Trigger trade callback
    this.onTrade({
      type: 'OPEN',
      position,
      bar
    });
    
    return position;
  }

  /**
   * Tutup posisi dengan simulasi realistis
   */
  closePosition(positionId, currentBar) {
    let positionsToClose = [];
    
    if (positionId === 'all') {
      positionsToClose = [...this.positions];
    } else {
      const position = this.positions.find(p => p.id === positionId);
      if (position) {
        positionsToClose = [position];
      }
    }

    for (const position of positionsToClose) {
      const closePrice = this.getClosePrice(position, currentBar);
      const executionPrice = this.getExecutionPrice(position.action === 'BUY' ? 'SELL' : 'BUY', currentBar);
      const actualClosePrice = this.applySlippage(executionPrice, position.action === 'BUY' ? 'SELL' : 'BUY');
      
      // Hitung profit/loss
      const pnl = this.calculatePnL(position, actualClosePrice);
      
      // Hitung commission untuk closing
      const positionValue = position.lotSize * 100000 * actualClosePrice;
      const closeCommission = positionValue * this.commission;
      
      const totalPnL = pnl - position.commission - closeCommission;
      
      // Update balance
      this.balance += position.marginUsed + totalPnL;
      
      // Update daily P&L
      this.dailyPnL += totalPnL;
      this.dailyTrades++;
      
      // Buat record trade
      const trade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        instrument: position.instrument,
        action: position.action,
        lotSize: position.lotSize,
        openPrice: position.openPrice,
        closePrice: actualClosePrice,
        openTime: position.openTime,
        closeTime: currentBar.time,
        pnl: totalPnL,
        commission: position.commission + closeCommission,
        duration: currentBar.time - position.openTime,
        pips: this.calculatePips(position.openPrice, actualClosePrice, position.action),
        stopLoss: position.stopLoss,
        takeProfit: position.takeProfit,
        reason: position.reason,
        executionPrice,
        slippage: Math.abs(actualClosePrice - executionPrice),
        spread: this.calculateSpread(currentBar)
      };
      
      this.trades.push(trade);
      
      // Remove position dari array
      this.positions = this.positions.filter(p => p.id !== position.id);
      
      console.log(`Posisi ditutup: ${position.action} ${position.lotSize} ${position.instrument} | P&L: ${totalPnL.toFixed(2)} | Pips: ${trade.pips.toFixed(1)}`);
      
      // Trigger trade callback
      this.onTrade({
        type: 'CLOSE',
        trade,
        bar: currentBar
      });
    }
  }

  /**
   * Update posisi yang ada (cek stop loss, take profit)
   */
  updatePositions(currentBar) {
    const positionsToClose = [];
    
    for (const position of this.positions) {
      // Update unrealized P&L
      const currentPrice = this.getCurrentPrice(position, currentBar);
      position.unrealizedPnL = this.calculatePnL(position, currentPrice);
      
      // Cek Stop Loss
      if (position.stopLoss) {
        const shouldCloseOnSL = this.shouldCloseOnStopLoss(position, currentBar);
        if (shouldCloseOnSL) {
          positionsToClose.push({ id: position.id, reason: 'stop_loss' });
          continue;
        }
      }
      
      // Cek Take Profit
      if (position.takeProfit) {
        const shouldCloseOnTP = this.shouldCloseOnTakeProfit(position, currentBar);
        if (shouldCloseOnTP) {
          positionsToClose.push({ id: position.id, reason: 'take_profit' });
          continue;
        }
      }
    }
    
    // Tutup posisi yang memenuhi kondisi
    for (const { id, reason } of positionsToClose) {
      console.log(`Posisi ditutup karena ${reason}: ${id}`);
      this.closePosition(id, currentBar);
    }
    
    // Update equity
    this.updateEquity();
  }

  /**
   * Dapatkan harga eksekusi yang realistis
   */
  getExecutionPrice(action, bar) {
    if (action === 'BUY') {
      return bar.high; // Biasanya eksekusi di high untuk buy
    } else {
      return bar.low; // Biasanya eksekusi di low untuk sell
    }
  }

  /**
   * Hitung spread
   */
  calculateSpread(bar) {
    // Simulasi spread berdasarkan volatility
    const volatility = (bar.high - bar.low) / bar.close;
    return this.spread * (1 + volatility * 10);
  }

  /**
   * Hitung risk:reward ratio
   */
  calculateRiskRewardRatio(stopLoss, takeProfit, entryPrice, action) {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    return reward / risk;
  }

  /**
   * Hitung lot size optimal berdasarkan risk
   */
  calculateOptimalLotSize(stopLossPips) {
    const riskAmount = this.balance * (POLYGON_CONFIG.TRADING.DEFAULT_RISK_PERCENT / 100);
    const pipValue = 10; // Untuk lot 0.01
    const lotSize = riskAmount / (stopLossPips * pipValue);
    return Math.max(POLYGON_CONFIG.TRADING.MIN_LOT_SIZE, 
                   Math.min(lotSize, POLYGON_CONFIG.TRADING.MAX_LOT_SIZE));
  }

  /**
   * Update daily statistics
   */
  updateDailyStats(currentBar) {
    const currentDate = new Date(currentBar.time).toDateString();
    
    if (this.currentDate !== currentDate) {
      if (this.currentDate) {
        this.dailyStats.push({
          date: this.currentDate,
          pnl: this.dailyPnL,
          trades: this.dailyTrades,
          balance: this.balance,
          equity: this.equity
        });
      }
      
      this.currentDate = currentDate;
      this.dailyPnL = 0;
      this.dailyTrades = 0;
    }
  }

  /**
   * Hitung hasil backtesting yang realistis
   */
  calculateResults() {
    const finalBalance = this.balance;
    const totalReturn = finalBalance - this.initialBalance;
    const totalReturnPercent = (totalReturn / this.initialBalance) * 100;
    
    const totalTrades = this.trades.length;
    const winningTrades = this.trades.filter(t => t.pnl > 0).length;
    const losingTrades = totalTrades - winningTrades;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const totalProfit = this.trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = this.trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + Math.abs(t.pnl), 0);
    const netProfit = totalProfit - totalLoss;
    
    const averageWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
    const averageLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;
    
    // Hitung metrics yang realistis
    const maxDrawdown = this.getMaxDrawdown();
    const maxDrawdownPercent = this.getMaxDrawdownPercent();
    const sharpeRatio = this.calculateSharpeRatio();
    const recoveryFactor = maxDrawdown > 0 ? totalReturn / maxDrawdown : 0;
    const calmarRatio = maxDrawdownPercent > 0 ? (totalReturnPercent / maxDrawdownPercent) : 0;
    
    // Hitung average spread dan slippage
    const averageSpread = this.trades.length > 0 ? 
      this.trades.reduce((sum, t) => sum + t.spread, 0) / this.trades.length : 0;
    const averageSlippage = this.trades.length > 0 ? 
      this.trades.reduce((sum, t) => sum + t.slippage, 0) / this.trades.length : 0;

    return {
      // Balance & Equity
      initialBalance: this.initialBalance,
      finalBalance,
      finalEquity: this.equity,
      totalReturn,
      totalReturnPercent,
      
      // Trading Statistics
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      
      // Profit & Loss
      totalProfit,
      totalLoss,
      netProfit,
      averageWin,
      averageLoss,
      largestWin: Math.max(...this.trades.map(t => t.pnl), 0),
      largestLoss: Math.max(...this.trades.map(t => Math.abs(t.pnl)), 0),
      profitFactor,
      
      // Risk Metrics
      maxDrawdown,
      maxDrawdownPercent,
      sharpeRatio,
      recoveryFactor,
      calmarRatio,
      
      // Market Conditions
      averageSpread,
      averageSlippage,
      totalCommission: this.trades.reduce((sum, t) => sum + t.commission, 0),
      
      // Daily Statistics
      dailyStats: this.dailyStats,
      
      // Data
      trades: this.trades,
      equityHistory: this.equityHistory,
      
      // Summary
      summary: {
        profitable: totalReturn > 0,
        riskAdjustedReturn: sharpeRatio,
        consistency: winRate,
        riskManagement: maxDrawdownPercent < this.maxDrawdown ? 'Baik' : 'Perlu Perbaikan',
        marketConditions: {
          averageSpread: averageSpread.toFixed(5),
          averageSlippage: averageSlippage.toFixed(5),
          totalCommission: this.trades.reduce((sum, t) => sum + t.commission, 0).toFixed(2)
        }
      }
    };
  }

  // Helper methods (sama seperti engine sebelumnya)
  shouldCloseOnStopLoss(position, currentBar) {
    if (!position.stopLoss) return false;
    
    if (position.action === 'BUY') {
      return currentBar.low <= position.stopLoss;
    } else {
      return currentBar.high >= position.stopLoss;
    }
  }

  shouldCloseOnTakeProfit(position, currentBar) {
    if (!position.takeProfit) return false;
    
    if (position.action === 'BUY') {
      return currentBar.high >= position.takeProfit;
    } else {
      return currentBar.low <= position.takeProfit;
    }
  }

  getClosePrice(position, currentBar) {
    if (position.stopLoss && this.shouldCloseOnStopLoss(position, currentBar)) {
      return position.stopLoss;
    }
    
    if (position.takeProfit && this.shouldCloseOnTakeProfit(position, currentBar)) {
      return position.takeProfit;
    }
    
    return currentBar.close;
  }

  getCurrentPrice(position, currentBar) {
    return currentBar.close;
  }

  calculatePnL(position, closePrice) {
    const { action, lotSize, openPrice } = position;
    const units = lotSize * 100000;
    
    if (action === 'BUY') {
      return (closePrice - openPrice) * units;
    } else {
      return (openPrice - closePrice) * units;
    }
  }

  calculatePips(openPrice, closePrice, action) {
    const priceDiff = action === 'BUY' ? (closePrice - openPrice) : (openPrice - closePrice);
    return priceDiff * 10000;
  }

  applySlippage(price, action) {
    const slippageDirection = action === 'BUY' ? 1 : -1;
    return price + (this.slippage * slippageDirection);
  }

  updateEquity() {
    let totalUnrealizedPnL = 0;
    
    for (const position of this.positions) {
      totalUnrealizedPnL += position.unrealizedPnL;
    }
    
    this.equity = this.balance + totalUnrealizedPnL;
  }

  updateEquityHistory(currentBar) {
    this.equityHistory.push({
      time: currentBar.time,
      equity: this.equity,
      balance: this.balance,
      drawdown: this.getCurrentDrawdown(),
      drawdownPercent: this.getCurrentDrawdownPercent(),
      openPositions: this.positions.length,
      dailyPnL: this.dailyPnL
    });
  }

  getCurrentDrawdown() {
    if (this.equityHistory.length === 0) return 0;
    
    const peakEquity = Math.max(...this.equityHistory.map(h => h.equity));
    return Math.max(0, peakEquity - this.equity);
  }

  getCurrentDrawdownPercent() {
    if (this.equityHistory.length === 0) return 0;
    
    const peakEquity = Math.max(...this.equityHistory.map(h => h.equity));
    if (peakEquity === 0) return 0;
    
    return Math.max(0, ((peakEquity - this.equity) / peakEquity) * 100);
  }

  getMaxDrawdown() {
    if (this.equityHistory.length === 0) return 0;
    
    let maxDrawdown = 0;
    let peak = this.equityHistory[0].equity;
    
    for (const record of this.equityHistory) {
      if (record.equity > peak) {
        peak = record.equity;
      }
      
      const drawdown = peak - record.equity;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }

  getMaxDrawdownPercent() {
    if (this.equityHistory.length === 0) return 0;
    
    let maxDrawdownPercent = 0;
    let peak = this.equityHistory[0].equity;
    
    for (const record of this.equityHistory) {
      if (record.equity > peak) {
        peak = record.equity;
      }
      
      const drawdownPercent = peak > 0 ? ((peak - record.equity) / peak) * 100 : 0;
      if (drawdownPercent > maxDrawdownPercent) {
        maxDrawdownPercent = drawdownPercent;
      }
    }
    
    return maxDrawdownPercent;
  }

  calculateSharpeRatio() {
    if (this.equityHistory.length < 2) return 0;
    
    const returns = this.equityHistory.map((h, i) => {
      if (i === 0) return 0;
      return (h.equity - this.equityHistory[i - 1].equity) / this.equityHistory[i - 1].equity;
    }).slice(1);
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const returnVariance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const returnStdDev = Math.sqrt(returnVariance);
    
    return returnStdDev > 0 ? avgReturn / returnStdDev : 0;
  }
}

export default RealisticForexBacktestingEngine;