// Image Cache Utility
export interface CachedImage {
  id: string;
  url: string;
  data: string; // base64 data
  timestamp: number;
  type: 'poster' | 'backdrop' | 'scene';
}

// Giả lập database (trong thực tế sẽ dùng MongoDB, PostgreSQL, etc.)
class ImageCacheDB {
  private cache = new Map<string, CachedImage>();

  async get(id: string, url: string): Promise<CachedImage | null> {
    const key = `${id}_${url}`;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return cached;
    }
    
    return null;
  }

  async set(image: CachedImage): Promise<void> {
    const key = `${image.id}_${image.url}`;
    this.cache.set(key, image);
  }

  async delete(id: string, url: string): Promise<void> {
    const key = `${id}_${url}`;
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  // Lấy tất cả cache keys
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Lấy size của cache
  getSize(): number {
    return this.cache.size;
  }
}

export const imageCacheDB = new ImageCacheDB();

// Utility functions
export async function cacheImage(id: string, url: string, type: 'poster' | 'backdrop' | 'scene'): Promise<string> {
  try {
    // Kiểm tra cache trước
    const cached = await imageCacheDB.get(id, url);
    if (cached) {
      return cached.data;
    }

    // Fetch từ URL
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    // Lưu vào cache
    await imageCacheDB.set({
      id,
      url,
      data: dataUrl,
      timestamp: Date.now(),
      type
    });

    return dataUrl;
  } catch (error) {
    console.error('Error caching image:', error);
    throw error;
  }
}

export async function getCachedImage(id: string, url: string): Promise<string | null> {
  try {
    const cached = await imageCacheDB.get(id, url);
    return cached ? cached.data : null;
  } catch (error) {
    console.error('Error getting cached image:', error);
    return null;
  }
}
