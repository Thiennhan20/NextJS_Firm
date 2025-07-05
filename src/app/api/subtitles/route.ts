import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');
  const year = searchParams.get('year');
  const apiKey = process.env.SUBTITLE_API_KEY;

  if (!query || !apiKey) {
    return NextResponse.json({ error: 'Missing query or API key' }, { status: 400 });
  }

  let url = `https://api.opensubtitles.com/api/v1/subtitles?query=${encodeURIComponent(query)}&languages=vi`;
  if (year) url += `&year=${year}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Api-Key': apiKey,
        'User-Agent': 'Movie3DWebsite/1.0',
      },
    });
    
    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`);
    }
    
    const data = await res.json();
    
    // Trả về format dữ liệu phù hợp với component
    return NextResponse.json({
      success: true,
      data: data.data || [],
      total: data.total || 0
    });
  } catch (error) {
    console.error('Subtitle API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch subtitles',
      success: false,
      data: [],
      total: 0
    }, { status: 500 });
  }
} 