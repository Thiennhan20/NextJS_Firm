import { NextRequest, NextResponse } from 'next/server';
import { telegramImageCacheDB } from '@/lib/telegramImageCache';

export async function POST(req: NextRequest) {
  try {
    const { id, url } = await req.json();
    
    if (!id || !url) {
      return NextResponse.json({ 
        error: 'Missing id or url' 
      }, { status: 400 });
    }

    // Xóa cache entry cụ thể để force re-upload
    await telegramImageCacheDB.delete(id, url);
    
    // Tạo URL với cache busting để force browser refresh
    const refreshUrl = `/api/cache-image?id=${id}&url=${encodeURIComponent(url)}&bust=${Date.now()}`;
    
    return NextResponse.json({
      success: true,
      message: `Cache refreshed for ${id}`,
      refreshUrl: refreshUrl,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Refresh cache error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
