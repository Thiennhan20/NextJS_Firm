import { NextResponse } from 'next/server';
import { imageCacheDB } from '@/lib/imageCache';

export async function GET() {
  try {
    const stats = {
      size: imageCacheDB.getSize(),
      keys: imageCacheDB.getKeys(),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return NextResponse.json({ error: 'Failed to get cache stats' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await imageCacheDB.clear();
    return NextResponse.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
