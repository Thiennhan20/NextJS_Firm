import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');
  const year = searchParams.get('year');
  const apiKey = process.env.SUBTITE_API_KEY;

  if (!query || !apiKey) {
    return NextResponse.json({ error: 'Missing query or API key' }, { status: 400 });
  }

  let url = `https://api.opensubtitles.com/api/v1/subtitles?query=${encodeURIComponent(query)}&languages=vi`;
  if (year) url += `&year=${year}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Api-Key': apiKey,
      },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch subtitles' }, { status: 500 });
  }
} 