import AutoTrader from '@/lib/trading-bot/auto-trader.js';
import RSIStrategy from '@/lib/trading-bot/strategies/rsi-strategy.js';

// Global bot instance
let botInstance = null;

export async function POST(request) {
  try {
    const { action, config } = await request.json();

    switch (action) {
      case 'start':
        if (botInstance && botInstance.isRunning) {
          return Response.json({
            success: false,
            message: 'Bot sudah berjalan'
          });
        }

        // Create new bot instance with config
        botInstance = new AutoTrader({
          alphaVantageKey: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
          watchlist: config?.watchlist || ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
          strategies: [new RSIStrategy(config?.rsiStrategy)],
          portfolio: { cash: config?.startingCash || 10000, positions: {} },
          maxPositions: config?.maxPositions || 5,
          minConfidence: config?.minConfidence || 0.7
        });

        botInstance.start();

        return Response.json({
          success: true,
          message: 'Auto Trading Bot started',
          config: {
            watchlist: botInstance.watchlist,
            startingCash: botInstance.portfolio.cash,
            maxPositions: botInstance.maxPositions
          }
        });

      case 'stop':
        if (!botInstance || !botInstance.isRunning) {
          return Response.json({
            success: false,
            message: 'Bot tidak sedang berjalan'
          });
        }

        botInstance.stop();

        return Response.json({
          success: true,
          message: 'Auto Trading Bot stopped'
        });

      case 'status':
        if (!botInstance) {
          return Response.json({
            success: true,
            data: {
              isRunning: false,
              message: 'Bot belum diinisialisasi'
            }
          });
        }

        const stats = botInstance.getStatistics();
        
        return Response.json({
          success: true,
          data: {
            isRunning: botInstance.isRunning,
            portfolio: {
              cash: botInstance.portfolio.cash,
              totalValue: botInstance.portfolio.cash + Array.from(botInstance.positions.values())
                .reduce((sum, pos) => sum + (pos.shares * pos.entryPrice), 0)
            },
            positions: Array.from(botInstance.positions.entries()).map(([symbol, pos]) => ({
              symbol,
              shares: pos.shares,
              entryPrice: pos.entryPrice,
              strategy: pos.strategy,
              entryTime: pos.entryTime
            })),
            statistics: stats,
            notifications: botInstance.notifications.slice(-10) // Last 10 notifications
          }
        });

      case 'history':
        if (!botInstance) {
          return Response.json({
            success: false,
            message: 'Bot belum diinisialisasi'
          });
        }

        return Response.json({
          success: true,
          data: {
            tradeHistory: botInstance.tradeHistory.slice(-50), // Last 50 trades
            notifications: botInstance.notifications.slice(-100) // Last 100 notifications
          }
        });

      default:
        return Response.json({
          success: false,
          message: 'Action tidak valid'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Trading bot API error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Return bot status
    if (!botInstance) {
      return Response.json({
        success: true,
        data: {
          isRunning: false,
          message: 'Bot belum diinisialisasi'
        }
      });
    }

    const stats = botInstance.getStatistics();
    
    return Response.json({
      success: true,
      data: {
        isRunning: botInstance.isRunning,
        portfolio: {
          cash: botInstance.portfolio.cash.toFixed(2),
          positions: botInstance.positions.size,
          maxPositions: botInstance.maxPositions
        },
        statistics: stats,
        watchlist: botInstance.watchlist
      }
    });

  } catch (error) {
    console.error('Trading bot GET error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}