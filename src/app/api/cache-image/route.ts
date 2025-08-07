import { NextRequest, NextResponse } from 'next/server';
import { getCachedImageFromTelegram, cacheImageToTelegram, telegramImageCacheDB } from '@/lib/telegramImageCache';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const id = searchParams.get('id');
  const type = searchParams.get('type') as 'poster' | 'backdrop' | 'scene' || 'poster';
  const bust = searchParams.get('bust'); // Cache busting parameter
  
  if (!url || !id) {
    return new NextResponse('Missing url or id', { status: 400 });
  }

  console.log('Cache image request:', { id, url, type, bust });

  try {
    // Kiểm tra cache trước
    const cached = await getCachedImageFromTelegram(id, url);
    if (cached) {
      console.log('Found cached image:', cached);
      // Proxy ảnh từ Telegram
      const response = await fetch(cached);
      if (!response.ok) {
        console.log('Telegram fetch failed, removing from cache and retrying');
        // Remove from cache if Telegram fetch fails
        await telegramImageCacheDB.delete(id, url);
        throw new Error('Telegram fetch failed');
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log('Cached image buffer size:', buffer.length);
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
          'X-Source': 'telegram-cache',
          'ETag': `"${id}-${Date.now()}"`, // Dynamic ETag to prevent browser cache issues
        },
      });
    }

    console.log('No cache found, uploading to Telegram...');
    // Cache image mới lên Telegram
    const telegramUrl = await cacheImageToTelegram(id, url, type);
    console.log('Uploaded to Telegram:', telegramUrl);

    // Proxy ảnh từ Telegram
    const response = await fetch(telegramUrl);
    if (!response.ok) {
      throw new Error('New Telegram fetch failed');
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('New image buffer size:', buffer.length);
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        'X-Source': 'telegram-new',
        'ETag': `"${id}-${Date.now()}"`,
      },
    });
  } catch (error) {
    console.error('Error caching image:', error);
    // Fallback: proxy từ URL gốc
    try {
      console.log('Falling back to original URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Original URL fetch failed');
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log('Fallback image buffer size:', buffer.length);
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=3600',
          'X-Source': 'fallback',
          'ETag': `"${id}-fallback-${Date.now()}"`,
        },
      });
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      return new NextResponse('Error fetching image', { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache errors
        }
      });
    }
  }
}
