import { NextResponse } from 'next/server';
import PolygonClient from '@/lib/polygon/client';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'C:EUR/USD';
    const multiplier = parseInt(searchParams.get('multiplier')) || 1;
    const timespan = searchParams.get('timespan') || 'hour';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const apiKey = request.headers.get('x-polygon-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key Polygon diperlukan' },
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

    // Dapatkan data historis dari Polygon
    const historicalResult = await polygonClient.getHistoricalData(symbol, multiplier, timespan, from, to);
    
    if (!historicalResult.success) {
      return NextResponse.json(
        { error: historicalResult.error.message },
        { status: 500 }
      );
    }

    const candles = historicalResult.data.map(candle => ({
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      vwap: candle.vwap,
      transactions: candle.transactions
    }));

    return NextResponse.json({
      success: true,
      data: candles,
      metadata: {
        symbol,
        multiplier,
        timespan,
        from,
        to,
        count: candles.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching Polygon historical data:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data historis dari Polygon' },
      { status: 500 }
    );
  }
}