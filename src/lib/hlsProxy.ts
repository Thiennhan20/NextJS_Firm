/**
 * HLS Proxy Helper
 * Wrap m3u8 URLs through Cloudflare Workers proxy to bypass CORS
 */

const HLS_PROXY_URL = process.env.NEXT_PUBLIC_HLS_PROXY_URL || '';

/**
 * Wrap an m3u8 URL through the HLS proxy.
 * If no proxy URL is configured, returns the original URL.
 * Only proxies URLs that look like m3u8/HLS streams.
 */
export function proxyHlsUrl(originalUrl: string): string {
  if (!originalUrl || !HLS_PROXY_URL) return originalUrl;

  // Only proxy m3u8 URLs (not embed/iframe URLs)
  const isHlsUrl = originalUrl.includes('.m3u8') || 
                   originalUrl.includes('/m3u8') ||
                   originalUrl.includes('kkphimplayer') ||
                   originalUrl.includes('phim1280.tv');
  
  if (!isHlsUrl) return originalUrl;

  // Don't double-proxy
  if (originalUrl.includes(HLS_PROXY_URL)) return originalUrl;

  return `${HLS_PROXY_URL}/?url=${encodeURIComponent(originalUrl)}`;
}
