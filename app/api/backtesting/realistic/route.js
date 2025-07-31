import { NextResponse } from 'next/server';
import RealisticForexBacktestingEngine from '@/lib/backtesting/realistic-engine';
import PolygonClient from '@/lib/polygon/client';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      symbol = 'C:EUR/USD',
      strategy,
      options = {},
      apiKey
    } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key Polygon diperlukan' },
        { status: 400 }
      );
    }

    if (!strategy) {
      return NextResponse.json(
        { error: 'Strategi trading diperlukan' },
        { status: 400 }
      );
    }

    const polygonClient = new PolygonClient(apiKey);

    // Validasi symbol
    if (!polygonClient.isValidForexSymbol(symbol)) {
      return NextResponse.json(
        { error: 'Symbol forex tidak valid' },
        { status: 400 }
      );
    }

    // Dapatkan data historis untuk backtesting
    const from = options.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 hari lalu
    const to = options.to || new Date().toISOString().split('T')[0];
    const multiplier = options.multiplier || 1;
    const timespan = options.timespan || 'hour';

    console.log(`Mengambil data historis untuk ${symbol} dari ${from} sampai ${to}`);

    const historicalResult = await polygonClient.getHistoricalData(symbol, multiplier, timespan, from, to);
    
    if (!historicalResult.success) {
      return NextResponse.json(
        { error: historicalResult.error.message },
        { status: 500 }
      );
    }

    const historicalData = historicalResult.data;

    if (historicalData.length < 1000) {
      return NextResponse.json(
        { error: 'Data tidak mencukupi untuk backtesting. Minimal 1000 data points.' },
        { status: 400 }
      );
    }

    // Setup backtesting engine
    const engineOptions = {
      initialBalance: options.initialBalance || 10000,
      leverage: options.leverage || 50,
      commission: options.commission || 0.0001,
      slippage: options.slippage || 0.0001,
      spread: options.spread || 0.0001,
      maxSpread: options.maxSpread || 0.0010,
      minVolume: options.minVolume || 1000000,
      maxDrawdown: options.maxDrawdown || 20,
      maxDailyLoss: options.maxDailyLoss || 5,
      maxPositionSize: options.maxPositionSize || 10,
      maxOpenPositions: options.maxOpenPositions || 5,
      minRiskRewardRatio: options.minRiskRewardRatio || 1.5,
      onProgress: (progress) => {
        console.log(`Backtesting progress: ${progress.progress.toFixed(2)}%`);
      },
      onComplete: (results) => {
        console.log('Backtesting completed');
      },
      onError: (error) => {
        console.error('Backtesting error:', error);
      }
    };

    const engine = new RealisticForexBacktestingEngine(engineOptions);

    // Jalankan backtesting
    console.log(`Memulai realistic backtesting untuk ${symbol} dengan ${historicalData.length} data points`);
    
    const results = await engine.runBacktest(historicalData, strategy, options);

    return NextResponse.json({
      success: true,
      data: results,
      metadata: {
        symbol,
        dataPoints: historicalData.length,
        from,
        to,
        multiplier,
        timespan,
        engineOptions
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error dalam realistic backtesting:', error);
    return NextResponse.json(
      { error: 'Gagal menjalankan realistic backtesting' },
      { status: 500 }
    );
  }
}