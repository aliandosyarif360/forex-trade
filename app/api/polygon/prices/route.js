import { NextResponse } from 'next/server';
import PolygonClient from '@/lib/polygon/client';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'C:EUR/USD';
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

    // Dapatkan harga real-time dari Polygon
    const priceResult = await polygonClient.getRealTimePrice(symbol);
    
    if (!priceResult.success) {
      return NextResponse.json(
        { error: priceResult.error.message },
        { status: 500 }
      );
    }

    const price = priceResult.data;

    return NextResponse.json({
      success: true,
      data: [{
        symbol: price.symbol,
        bid: price.bid,
        ask: price.ask,
        spread: price.spread,
        spreadPips: price.spreadPips,
        time: price.time,
        tradeable: price.tradeable,
        status: price.status,
        liquidity: price.liquidity
      }],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching Polygon prices:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil harga dari Polygon' },
      { status: 500 }
    );
  }
}