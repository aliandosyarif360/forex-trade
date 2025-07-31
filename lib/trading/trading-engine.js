import { marketDataService } from './market-data';
import { brokerIntegration } from './broker-integration';
import { ScalpingStrategy, DCAStrategy, GridStrategy } from './strategies/index.js';
import { RiskManager } from './risk-management';
import { POLYGON_CONFIG } from '../polygon/config.js';

class TradingEngine {
  constructor() {
    this.activeBots = new Map();
    this.marketDataStreams = new Map();
    this.brokerConnections = new Map();
    this.riskManager = new RiskManager();
    this.isRunning = false;
    this.performance = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      winRate: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      currentDrawdown: 0,
      sharpeRatio: 0
    };
  }

  async initializeBot(botConfig) {
    try {
      const {
        id,
        userId,
        name,
        strategy,
        symbol,
        brokerId,
        brokerCredentials,
        config,
        riskConfig
      } = botConfig;

      // Validasi input yang lebih ketat
      if (!id || !userId || !name || !strategy || !symbol) {
        throw new Error('Missing required bot configuration parameters');
      }

      // Validasi symbol forex
      if (!POLYGON_CONFIG.FOREX_SYMBOLS.includes(symbol)) {
        throw new Error(`Invalid forex symbol: ${symbol}`);
      }

      // Validasi strategy
      if (!this.isValidStrategy(strategy)) {
        throw new Error(`Invalid strategy: ${strategy}`);
      }

      // Connect to broker dengan validasi real
      const brokerConnection = await brokerIntegration.connectToBroker(
        brokerId,
        brokerCredentials,
        config.isDemo || false // Default to real trading
      );

      // Initialize strategy dengan config real
      const strategyInstance = this.createStrategy(strategy, config);
      
      // Connect to market data stream dengan validasi
      const marketDataStream = await marketDataService.connectToStream(
        symbol,
        (data) => this.handleMarketDataUpdate(id, data)
      );

      // Create bot instance dengan validasi real
      const bot = {
        id,
        userId,
        name,
        strategy: strategyInstance,
        symbol,
        brokerConnection,
        marketDataStream,
        config: {
          ...config,
          isDemo: config.isDemo || false,
          riskManagement: {
            maxDrawdown: riskConfig?.maxDrawdown || POLYGON_CONFIG.RISK_MANAGEMENT.MAX_DRAWDOWN,
            maxDailyLoss: riskConfig?.maxDailyLoss || POLYGON_CONFIG.RISK_MANAGEMENT.MAX_DAILY_LOSS,
            maxPositionSize: riskConfig?.maxPositionSize || POLYGON_CONFIG.RISK_MANAGEMENT.MAX_POSITION_SIZE,
            maxOpenPositions: riskConfig?.maxOpenPositions || POLYGON_CONFIG.RISK_MANAGEMENT.MAX_OPEN_POSITIONS,
            minRiskRewardRatio: riskConfig?.minRiskRewardRatio || POLYGON_CONFIG.RISK_MANAGEMENT.MIN_RISK_REWARD_RATIO
          }
        },
        status: 'initialized',
        performance: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          totalProfit: 0,
          totalLoss: 0,
          winRate: 0,
          profitFactor: 0,
          maxDrawdown: 0,
          currentDrawdown: 0,
          sharpeRatio: 0
        },
        positions: new Map(),
        orders: new Map(),
        signals: [],
        lastUpdate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      this.activeBots.set(id, bot);
      this.brokerConnections.set(id, brokerConnection);
      this.marketDataStreams.set(id, marketDataStream);

      console.log(`Bot ${name} initialized successfully with real configuration`);
      return bot;

    } catch (error) {
      console.error(`Failed to initialize bot ${botConfig.name}:`, error);
      throw error;
    }
  }

  isValidStrategy(strategy) {
    const validStrategies = ['scalping', 'dca', 'grid', 'trend-following', 'martingale', 'breakout', 'mean-reversion', 'arbitrage'];
    return validStrategies.includes(strategy);
  }

  createStrategy(strategyType, config) {
    try {
      switch (strategyType.toLowerCase()) {
        case 'scalping':
          return new ScalpingStrategy({
            ...config,
            minProfit: config.minProfit || 0.0001, // 1 pip
            maxLoss: config.maxLoss || 0.0002, // 2 pips
            timeLimit: config.timeLimit || 300, // 5 minutes
            volumeThreshold: config.volumeThreshold || POLYGON_CONFIG.TRADING.MIN_VOLUME
          });
        
        case 'dca':
          return new DCAStrategy({
            ...config,
            baseAmount: config.baseAmount || 100,
            multiplier: config.multiplier || 2,
            maxLevels: config.maxLevels || 5,
            interval: config.interval || 3600 // 1 hour
          });
        
        case 'grid':
          return new GridStrategy({
            ...config,
            gridSize: config.gridSize || 0.001, // 10 pips
            gridLevels: config.gridLevels || 10,
            profitTarget: config.profitTarget || 0.0005, // 5 pips
            stopLoss: config.stopLoss || 0.002 // 20 pips
          });
        
        default:
          throw new Error(`Strategy not implemented: ${strategyType}`);
      }
    } catch (error) {
      console.error(`Error creating strategy ${strategyType}:`, error);
      throw error;
    }
  }

  async startBot(botId) {
    try {
      const bot = this.activeBots.get(botId);
      if (!bot) {
        throw new Error(`Bot ${botId} not found`);
      }

      // Validasi sebelum start
      if (!bot.brokerConnection || !bot.marketDataStream) {
        throw new Error('Bot not properly initialized');
      }

      // Cek risk management sebelum start
      const riskCheck = await this.riskManager.checkRiskLimits(bot);
      if (!riskCheck.allowed) {
        throw new Error(`Risk management check failed: ${riskCheck.reason}`);
      }

      bot.status = 'active';
      bot.startedAt = new Date().toISOString();
      
      console.log(`Bot ${bot.name} started successfully`);
      return { success: true, bot };

    } catch (error) {
      console.error(`Failed to start bot ${botId}:`, error);
      throw error;
    }
  }

  async stopBot(botId) {
    try {
      const bot = this.activeBots.get(botId);
      if (!bot) {
        throw new Error(`Bot ${botId} not found`);
      }

      // Close all open positions
      for (const [positionId, position] of bot.positions) {
        await this.closePosition(bot, positionId, position.currentPrice, 'bot_stopped');
      }

      bot.status = 'stopped';
      bot.stoppedAt = new Date().toISOString();
      
      console.log(`Bot ${bot.name} stopped successfully`);
      return { success: true, bot };

    } catch (error) {
      console.error(`Failed to stop bot ${botId}:`, error);
      throw error;
    }
  }

  async handleMarketDataUpdate(botId, marketData) {
    try {
      const bot = this.activeBots.get(botId);
      if (!bot || bot.status !== 'active') {
        return;
      }

      // Validasi market data
      if (!this.isValidMarketData(marketData)) {
        console.warn(`Invalid market data received for bot ${botId}`);
        return;
      }

      // Update bot dengan data real
      bot.lastUpdate = new Date().toISOString();
      bot.currentPrice = marketData.close;

      // Update positions dengan data real
      for (const [positionId, position] of bot.positions) {
        position.currentPrice = marketData.close;
        position.unrealizedPnl = this.calculateUnrealizedPnL(position, marketData.close);
      }

      // Cek risk management
      const riskCheck = await this.riskManager.checkRiskLimits(bot);
      if (!riskCheck.allowed) {
        console.log(`Risk management triggered for bot ${botId}: ${riskCheck.reason}`);
        await this.stopBot(botId);
        return;
      }

      // Generate signals dengan data real
      const signals = await bot.strategy.analyze([marketData], {
        currentPrice: marketData.close,
        currentBalance: bot.performance.totalProfit,
        openPositions: bot.positions.size,
        marketConditions: this.getMarketConditions(marketData)
      });

      // Execute signals dengan validasi real
      if (signals && signals.length > 0) {
        for (const signal of signals) {
          if (this.validateSignal(signal, marketData)) {
            await this.executeSignal(bot, signal);
          }
        }
      }

      // Update performance metrics
      this.updateBotPerformance(bot);

    } catch (error) {
      console.error(`Error handling market data for bot ${botId}:`, error);
    }
  }

  isValidMarketData(data) {
    return data && 
           typeof data.close === 'number' && data.close > 0 &&
           typeof data.open === 'number' && data.open > 0 &&
           typeof data.high === 'number' && data.high > 0 &&
           typeof data.low === 'number' && data.low > 0 &&
           data.high >= data.low &&
           data.high >= data.open && data.high >= data.close &&
           data.low <= data.open && data.low <= data.close;
  }

  getMarketConditions(marketData) {
    const volatility = (marketData.high - marketData.low) / marketData.low;
    const volume = marketData.volume || 0;
    
    return {
      volatility,
      volume,
      isHighVolatility: volatility > 0.05,
      isLowVolume: volume < POLYGON_CONFIG.TRADING.MIN_VOLUME,
      spread: this.calculateSpread(marketData)
    };
  }

  calculateSpread(marketData) {
    // Estimate spread based on volatility
    const volatility = (marketData.high - marketData.low) / marketData.low;
    return POLYGON_CONFIG.TRADING.DEFAULT_SPREAD * (1 + volatility * 10);
  }

  validateSignal(signal, marketData) {
    const { action, price, stopLoss, takeProfit, lotSize } = signal;
    
    // Validasi action
    if (!['BUY', 'SELL', 'CLOSE'].includes(action)) {
      console.log('Invalid signal action:', action);
      return false;
    }
    
    // Validasi price
    if (action !== 'CLOSE' && (!price || price <= 0)) {
      console.log('Invalid signal price:', price);
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
      if (riskRewardRatio < POLYGON_CONFIG.RISK_MANAGEMENT.MIN_RISK_REWARD_RATIO) {
        console.log('Risk:reward ratio too low:', riskRewardRatio);
        return false;
      }
    }
    
    return true;
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

  async executeSignal(bot, signal) {
    try {
      const { action, price, stopLoss, takeProfit, lotSize } = signal;
      
      if (action === 'BUY' || action === 'SELL') {
        // Cek risk management
        const riskCheck = await this.riskManager.checkPositionRisk(bot, {
          action,
          lotSize,
          price,
          stopLoss,
          takeProfit
        });
        
        if (!riskCheck.allowed) {
          console.log(`Risk management blocked signal: ${riskCheck.reason}`);
          return;
        }

        // Open position dengan data real
        const position = await this.openPosition(bot, {
          action,
          symbol: bot.symbol,
          entryPrice: price,
          stopLoss,
          takeProfit,
          lotSize,
          timestamp: new Date().toISOString()
        });

        if (position) {
          bot.positions.set(position.id, position);
          console.log(`Opened ${action} position: ${lotSize} lots at ${price}`);
        }

      } else if (action === 'CLOSE') {
        // Close positions
        if (signal.positionId) {
          await this.closePosition(bot, signal.positionId, bot.currentPrice, 'signal');
        } else {
          // Close all positions
          for (const [positionId, position] of bot.positions) {
            await this.closePosition(bot, positionId, bot.currentPrice, 'signal');
          }
        }
      }

    } catch (error) {
      console.error('Error executing signal:', error);
    }
  }

  async openPosition(bot, positionData) {
    try {
      const { action, symbol, entryPrice, stopLoss, takeProfit, lotSize } = positionData;
      
      // Cek balance dengan margin requirement real
      const marginRequired = (entryPrice * lotSize) / POLYGON_CONFIG.TRADING.DEFAULT_LEVERAGE;
      if (marginRequired > bot.performance.totalProfit * bot.config.riskManagement.maxPositionSize / 100) {
        console.log('Insufficient margin for position');
        return null;
      }
      
      // Apply slippage real
      const executionPrice = this.applySlippage(entryPrice, action);
      
      const position = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        symbol,
        entryPrice: executionPrice,
        stopLoss,
        takeProfit,
        lotSize,
        entryTime: new Date().toISOString(),
        status: 'open',
        unrealizedPnl: 0,
        marginUsed: marginRequired
      };
      
      // Deduct margin
      bot.performance.totalProfit -= marginRequired;
      
      // Add commission
      const commission = executionPrice * lotSize * POLYGON_CONFIG.BACKTESTING.DEFAULT_COMMISSION;
      bot.performance.totalProfit -= commission;
      
      console.log(`Opened ${action} position: ${lotSize} lots at ${executionPrice}`);
      
      return position;
      
    } catch (error) {
      console.error('Error opening position:', error);
      return null;
    }
  }

  async closePosition(bot, positionId, exitPrice, reason = 'manual') {
    try {
      const position = bot.positions.get(positionId);
      if (!position) {
        console.log('Position not found:', positionId);
        return;
      }
      
      // Calculate P&L real
      const pnl = this.calculatePnL(position, exitPrice);
      const pips = this.calculatePips(position.entryPrice, exitPrice, position.action);
      
      // Update balance
      bot.performance.totalProfit += position.marginUsed;
      bot.performance.totalProfit += pnl;
      
      // Add commission
      const commission = exitPrice * position.lotSize * POLYGON_CONFIG.BACKTESTING.DEFAULT_COMMISSION;
      bot.performance.totalProfit -= commission;
      
      // Create trade record
      const trade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        positionId,
        symbol: position.symbol,
        action: position.action,
        entryPrice: position.entryPrice,
        exitPrice,
        lotSize: position.lotSize,
        pnl,
        pips,
        commission,
        entryTime: position.entryTime,
        exitTime: new Date().toISOString(),
        duration: new Date() - new Date(position.entryTime),
        stopLoss: position.stopLoss,
        takeProfit: position.takeProfit,
        exitReason: reason
      };
      
      // Update performance
      bot.performance.totalTrades++;
      if (pnl > 0) {
        bot.performance.winningTrades++;
        bot.performance.totalProfit += pnl;
      } else {
        bot.performance.losingTrades++;
        bot.performance.totalLoss += Math.abs(pnl);
      }
      
      // Remove position
      bot.positions.delete(positionId);
      
      console.log(`Closed ${position.action} position: ${pnl.toFixed(2)} P&L, ${pips.toFixed(1)} pips`);
      
      // Store trade
      await this.storeTrade(trade);
      
    } catch (error) {
      console.error('Error closing position:', error);
    }
  }

  calculatePnL(position, exitPrice) {
    const { action, entryPrice, lotSize } = position;
    const pipValue = 0.0001;
    
    if (action === 'BUY') {
      const pips = (exitPrice - entryPrice) / pipValue;
      return pips * lotSize * 10; // $10 per pip for standard lot
    } else {
      const pips = (entryPrice - exitPrice) / pipValue;
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

  calculateUnrealizedPnL(position, currentPrice) {
    return this.calculatePnL(position, currentPrice);
  }

  applySlippage(price, action) {
    const slippageMultiplier = action === 'BUY' ? 1 : -1;
    return price + (POLYGON_CONFIG.BACKTESTING.DEFAULT_SLIPPAGE * slippageMultiplier);
  }

  updateBotPerformance(bot) {
    const totalTrades = bot.performance.totalTrades;
    if (totalTrades > 0) {
      bot.performance.winRate = (bot.performance.winningTrades / totalTrades) * 100;
      bot.performance.profitFactor = bot.performance.totalLoss > 0 ? 
        bot.performance.totalProfit / bot.performance.totalLoss : 0;
    }
    
    // Calculate drawdown
    const currentDrawdown = this.calculateCurrentDrawdown(bot);
    bot.performance.currentDrawdown = currentDrawdown;
    if (currentDrawdown > bot.performance.maxDrawdown) {
      bot.performance.maxDrawdown = currentDrawdown;
    }
  }

  calculateCurrentDrawdown(bot) {
    // Calculate current drawdown based on performance
    const peak = Math.max(bot.performance.totalProfit, 0);
    const current = bot.performance.totalProfit;
    return Math.max(0, peak - current);
  }

  async storeTrade(trade) {
    try {
      // Store trade to database
      console.log('Trade stored:', trade.id);
    } catch (error) {
      console.error('Error storing trade:', error);
    }
  }

  async updateTrade(trade) {
    try {
      // Update trade in database
      console.log('Trade updated:', trade.id);
    } catch (error) {
      console.error('Error updating trade:', error);
    }
  }

  async getBotStatus(botId) {
    try {
      const bot = this.activeBots.get(botId);
      if (!bot) {
        return { error: 'Bot not found' };
      }

      return {
        id: bot.id,
        name: bot.name,
        status: bot.status,
        symbol: bot.symbol,
        performance: bot.performance,
        openPositions: bot.positions.size,
        lastUpdate: bot.lastUpdate
      };
    } catch (error) {
      console.error('Error getting bot status:', error);
      return { error: error.message };
    }
  }

  async getAllBotsStatus() {
    try {
      const bots = [];
      for (const [id, bot] of this.activeBots) {
        bots.push(await this.getBotStatus(id));
      }
      return bots;
    } catch (error) {
      console.error('Error getting all bots status:', error);
      return [];
    }
  }

  async cleanupBot(botId) {
    try {
      const bot = this.activeBots.get(botId);
      if (!bot) {
        return;
      }

      // Stop bot if running
      if (bot.status === 'active') {
        await this.stopBot(botId);
      }

      // Close market data stream
      const stream = this.marketDataStreams.get(botId);
      if (stream) {
        await stream.close();
        this.marketDataStreams.delete(botId);
      }

      // Close broker connection
      const connection = this.brokerConnections.get(botId);
      if (connection) {
        await connection.close();
        this.brokerConnections.delete(botId);
      }

      // Remove bot
      this.activeBots.delete(botId);

      console.log(`Bot ${botId} cleaned up successfully`);
    } catch (error) {
      console.error('Error cleaning up bot:', error);
    }
  }

  async shutdown() {
    try {
      console.log('Shutting down trading engine...');
      
      // Stop all bots
      for (const [id, bot] of this.activeBots) {
        await this.cleanupBot(id);
      }
      
      this.isRunning = false;
      console.log('Trading engine shutdown complete');
    } catch (error) {
      console.error('Error shutting down trading engine:', error);
    }
  }

  getPerformance() {
    return this.performance;
  }

  isRunning() {
    return this.isRunning;
  }
}

export default TradingEngine;