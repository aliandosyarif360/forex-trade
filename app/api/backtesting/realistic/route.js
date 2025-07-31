import { NextResponse } from 'next/server';
import RealisticForexBacktestingEngine from '@/lib/backtesting/realistic-engine';
import PolygonClient from '@/lib/polygon/client';
import { POLYGON_CONFIG } from '@/lib/polygon/config';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      symbol = 'C:EUR/USD',
      strategy,
      options = {},
      apiKey
    } = body;

    // Validasi input yang lebih ketat
    if (!apiKey || apiKey.includes('demo')) {
      return NextResponse.json(
        { error: 'API Key Polygon yang valid diperlukan untuk backtesting real' },
        { status: 400 }
      );
    }

    if (!strategy || typeof strategy !== 'object') {
      return NextResponse.json(
        { error: 'Strategi trading yang valid diperlukan' },
        { status: 400 }
      );
    }

    // Validasi symbol forex
    if (!POLYGON_CONFIG.FOREX_SYMBOLS.includes(symbol)) {
      return NextResponse.json(
        { error: `Symbol forex tidak valid. Gunakan salah satu: ${POLYGON_CONFIG.FOREX_SYMBOLS.join(', ')}` },
        { status: 400 }
      );
    }

    const polygonClient = new PolygonClient(apiKey);

    // Validasi koneksi ke Polygon API
    try {
      const testResult = await polygonClient.getRealTimePrice(symbol);
      if (!testResult.success) {
        return NextResponse.json(
          { error: 'Gagal terhubung ke Polygon API. Periksa API key Anda.' },
          { status: 500 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Gagal memvalidasi koneksi Polygon API' },
        { status: 500 }
      );
    }

    // Dapatkan data historis untuk backtesting dengan parameter yang lebih ketat
    const from = options.from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 90 hari
    const to = options.to || new Date().toISOString().split('T')[0];
    const multiplier = options.multiplier || 1;
    const timespan = options.timespan || 'hour';

    // Validasi timeframe
    if (!Object.values(POLYGON_CONFIG.TIMEFRAMES).includes(timespan)) {
      return NextResponse.json(
        { error: `Timeframe tidak valid. Gunakan salah satu: ${Object.values(POLYGON_CONFIG.TIMEFRAMES).join(', ')}` },
        { status: 400 }
      );
    }

    // Validasi multiplier
    const validMultipliers = POLYGON_CONFIG.MULTIPLIERS[timespan.toUpperCase()] || [1];
    if (!validMultipliers.includes(multiplier)) {
      return NextResponse.json(
        { error: `Multiplier tidak valid untuk timeframe ${timespan}. Gunakan salah satu: ${validMultipliers.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`Mengambil data historis real untuk ${symbol} dari ${from} sampai ${to}`);

    const historicalResult = await polygonClient.getHistoricalData(symbol, multiplier, timespan, from, to);
    
    if (!historicalResult.success) {
      return NextResponse.json(
        { error: `Gagal mengambil data historis: ${historicalResult.error.message}` },
        { status: 500 }
      );
    }

    const historicalData = historicalResult.data;

    // Validasi data yang lebih ketat
    if (historicalData.length < POLYGON_CONFIG.BACKTESTING.MIN_DATA_POINTS) {
      return NextResponse.json(
        { 
          error: `Data tidak mencukupi untuk backtesting yang akurat. Minimal ${POLYGON_CONFIG.BACKTESTING.MIN_DATA_POINTS} data points, tersedia: ${historicalData.length}` 
        },
        { status: 400 }
      );
    }

    if (historicalData.length > POLYGON_CONFIG.BACKTESTING.MAX_DATA_POINTS) {
      console.log(`Data terlalu banyak, membatasi ke ${POLYGON_CONFIG.BACKTESTING.MAX_DATA_POINTS} data points`);
      historicalData.splice(0, historicalData.length - POLYGON_CONFIG.BACKTESTING.MAX_DATA_POINTS);
    }

    // Validasi kualitas data
    let invalidBars = 0;
    for (const bar of historicalData) {
      if (!bar.time || !bar.open || !bar.high || !bar.low || !bar.close) {
        invalidBars++;
      }
      if (bar.high < bar.low || bar.open < 0 || bar.close < 0) {
        invalidBars++;
      }
    }

    if (invalidBars > historicalData.length * 0.05) { // Lebih dari 5% data invalid
      return NextResponse.json(
        { error: `Data historis memiliki terlalu banyak bar yang tidak valid: ${invalidBars}/${historicalData.length}` },
        { status: 400 }
      );
    }

    // Setup backtesting engine dengan parameter real
    const engineOptions = {
      initialBalance: options.initialBalance || POLYGON_CONFIG.BACKTESTING.DEFAULT_INITIAL_BALANCE,
      leverage: options.leverage || POLYGON_CONFIG.TRADING.DEFAULT_LEVERAGE,
      commission: options.commission || POLYGON_CONFIG.BACKTESTING.DEFAULT_COMMISSION,
      slippage: options.slippage || POLYGON_CONFIG.BACKTESTING.DEFAULT_SLIPPAGE,
      spread: options.spread || POLYGON_CONFIG.TRADING.DEFAULT_SPREAD,
      maxSpread: options.maxSpread || POLYGON_CONFIG.TRADING.MAX_SPREAD,
      minVolume: options.minVolume || POLYGON_CONFIG.TRADING.MIN_VOLUME,
      maxDrawdown: options.maxDrawdown || POLYGON_CONFIG.RISK_MANAGEMENT.MAX_DRAWDOWN,
      maxDailyLoss: options.maxDailyLoss || POLYGON_CONFIG.RISK_MANAGEMENT.MAX_DAILY_LOSS,
      maxPositionSize: options.maxPositionSize || POLYGON_CONFIG.RISK_MANAGEMENT.MAX_POSITION_SIZE,
      maxOpenPositions: options.maxOpenPositions || POLYGON_CONFIG.RISK_MANAGEMENT.MAX_OPEN_POSITIONS,
      minRiskRewardRatio: options.minRiskRewardRatio || POLYGON_CONFIG.RISK_MANAGEMENT.MIN_RISK_REWARD_RATIO,
      onProgress: (progress) => {
        console.log(`Backtesting progress: ${progress.progress.toFixed(2)}% - Equity: $${progress.currentEquity.toFixed(2)}`);
      },
      onComplete: (results) => {
        console.log('Realistic backtesting completed successfully');
      },
      onError: (error) => {
        console.error('Backtesting error:', error);
      }
    };

    const engine = new RealisticForexBacktestingEngine(engineOptions);

    // Jalankan backtesting dengan data real
    console.log(`Memulai realistic backtesting untuk ${symbol} dengan ${historicalData.length} data points real`);
    console.log(`Engine config:`, {
      initialBalance: engineOptions.initialBalance,
      leverage: engineOptions.leverage,
      commission: engineOptions.commission,
      slippage: engineOptions.slippage,
      maxDrawdown: engineOptions.maxDrawdown,
      maxDailyLoss: engineOptions.maxDailyLoss
    });
    
    const results = await engine.runBacktest(historicalData, strategy, options);

    // Validasi hasil backtesting
    if (!results || typeof results !== 'object') {
      return NextResponse.json(
        { error: 'Backtesting gagal menghasilkan hasil yang valid' },
        { status: 500 }
      );
    }

    // Tambahkan metadata untuk audit
    const metadata = {
      symbol,
      dataPoints: historicalData.length,
      invalidBars,
      dataQuality: results.dataQuality,
      from,
      to,
      multiplier,
      timespan,
      engineOptions,
      apiVersion: '1.0.0',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: results,
      metadata,
      message: 'Realistic backtesting completed successfully'
    });

  } catch (error) {
    console.error('Error dalam realistic backtesting:', error);
    return NextResponse.json(
      { 
        error: 'Gagal menjalankan realistic backtesting',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}