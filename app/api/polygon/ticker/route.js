import PolygonClient from '@/lib/polygon/client';

export async function GET(request) {
  try {
    // Ambil parameter dari URL
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    // Ambil API key dari headers
    const apiKey = request.headers.get('x-polygon-api-key');

    if (!apiKey) {
      return Response.json(
        { error: 'API Key Polygon diperlukan' },
        { status: 400 }
      );
    }

    if (!symbol) {
      return Response.json(
        { error: 'Symbol ticker diperlukan' },
        { status: 400 }
      );
    }

    // Inisialisasi Polygon client
    const polygonClient = new PolygonClient(apiKey);

    // Dapatkan detail ticker dari Polygon
    const tickerResult = await polygonClient.getTickerDetails(symbol);

    if (!tickerResult.success) {
      return Response.json(
        { error: tickerResult.error.message },
        { status: 500 }
      );
    }

    // Dapatkan harga terkini
    const priceResult = await polygonClient.getCurrentPrice(symbol);
    
    // Dapatkan berita terkait
    const newsResult = await polygonClient.getTickerNews(symbol, 5);

    // Format data untuk response
    const tickerData = {
      symbol: tickerResult.data.ticker,
      name: tickerResult.data.name,
      description: tickerResult.data.description,
      market: tickerResult.data.market,
      locale: tickerResult.data.locale,
      primaryExchange: tickerResult.data.primary_exchange,
      type: tickerResult.data.type,
      active: tickerResult.data.active,
      currencyName: tickerResult.data.currency_name,
      marketCap: tickerResult.data.market_cap,
      phoneNumber: tickerResult.data.phone_number,
      address: tickerResult.data.address,
      homepage: tickerResult.data.homepage_url,
      totalEmployees: tickerResult.data.total_employees,
      listDate: tickerResult.data.list_date,
      branding: tickerResult.data.branding,
      sharesOutstanding: tickerResult.data.share_class_shares_outstanding,
      weightedSharesOutstanding: tickerResult.data.weighted_shares_outstanding,
      sicCode: tickerResult.data.sic_code,
      sicDescription: tickerResult.data.sic_description
    };

    const response = {
      success: true,
      data: {
        ticker: tickerData,
        currentPrice: priceResult.success ? priceResult.data : null,
        news: newsResult.success ? newsResult.data.slice(0, 5) : [],
        timestamp: new Date().toISOString(),
        source: 'Polygon.io'
      }
    };

    return Response.json(response);

  } catch (error) {
    console.error('Error fetching Polygon ticker:', error);
    return Response.json(
      { error: 'Gagal mengambil data ticker dari Polygon' },
      { status: 500 }
    );
  }
}