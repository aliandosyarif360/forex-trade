import PolygonClient from '@/lib/polygon/client';

export async function GET(request) {
  try {
    // Ambil parameter dari URL
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols') || 'AAPL,MSFT,GOOGL,AMZN,TSLA';
    
    // Ambil API key dari headers
    const apiKey = request.headers.get('x-polygon-api-key');

    if (!apiKey) {
      return Response.json(
        { error: 'API Key Polygon diperlukan' },
        { status: 400 }
      );
    }

    // Inisialisasi Polygon client
    const polygonClient = new PolygonClient(apiKey);

    // Dapatkan harga real-time dari Polygon
    const symbolsArray = symbols.split(',').map(s => s.trim());
    const pricesResult = await polygonClient.getCurrentPrices(symbolsArray);

    if (!pricesResult.success) {
      return Response.json(
        { error: pricesResult.error.message },
        { status: 500 }
      );
    }

    // Format data untuk konsistensi dengan format sebelumnya
    const formattedPrices = pricesResult.data.map(ticker => ({
      symbol: ticker.ticker,
      bid: ticker.lastQuote?.bid || 0,
      ask: ticker.lastQuote?.ask || 0,
      price: ticker.lastTrade?.price || ticker.value || 0,
      spread: ticker.lastQuote ? (ticker.lastQuote.ask - ticker.lastQuote.bid) : 0,
      timestamp: ticker.updated || Date.now(),
      change: ticker.todaysChange || 0,
      changePercent: ticker.todaysChangePerc || 0,
      volume: ticker.volume || 0,
      high: ticker.high || 0,
      low: ticker.low || 0,
      open: ticker.open || 0,
      close: ticker.prevClose || 0
    }));

    return Response.json({
      success: true,
      data: {
        prices: formattedPrices,
        timestamp: new Date().toISOString(),
        source: 'Polygon.io'
      }
    });

  } catch (error) {
    console.error('Error fetching Polygon prices:', error);
    return Response.json(
      { error: 'Gagal mengambil harga dari Polygon' },
      { status: 500 }
    );
  }
}