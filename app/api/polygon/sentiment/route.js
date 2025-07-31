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

    // Dapatkan data sentiment dari Polygon
    const sentimentResult = await polygonClient.getMarketSentiment(symbol);
    
    if (!sentimentResult.success) {
      return NextResponse.json(
        { error: sentimentResult.error.message },
        { status: 500 }
      );
    }

    const sentiment = sentimentResult.data;

    return NextResponse.json({
      success: true,
      data: {
        symbol: sentiment.symbol,
        sentiment: sentiment.sentiment,
        volume: sentiment.volume,
        priceChange: sentiment.priceChange,
        priceChangePercent: sentiment.priceChangePercent,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching Polygon sentiment:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data sentiment dari Polygon' },
      { status: 500 }
    );
  }
}