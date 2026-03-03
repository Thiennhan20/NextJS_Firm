import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://server-nextjs-firm.onrender.com/api/tmdb'
  : 'http://localhost:3001/api/tmdb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Forward all query parameters to backend
    const backendUrl = `${BACKEND_BASE_URL}?${searchParams.toString()}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend API failed:', response.status, errorText);
      return NextResponse.json(
        { error: 'Backend API request failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const xCache = response.headers.get('X-Cache') || 'UNKNOWN';

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        'X-Cache': xCache
      }
    });
  } catch (error) {
    console.error('💥 Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}