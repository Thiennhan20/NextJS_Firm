import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_LOCALES = ['en', 'vi'];
const LOCALE_TO_FULL: Record<string, string> = {
  en: 'en-US',
  vi: 'vi-VN',
};

/**
 * Extracts base locale from "vi-VN" → "vi", "en-US" → "en"
 */
function parseLocale(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const base = raw.split('-')[0].toLowerCase();
  return SUPPORTED_LOCALES.includes(base) ? base : null;
}

export function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;

  // Skip static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const langParam = searchParams.get('lang');
  const cookieLocale = request.cookies.get('locale')?.value;

  // 1. ?lang= is present in URL → use it as source of truth
  const paramLocale = parseLocale(langParam);
  if (paramLocale) {
    const response = NextResponse.next();
    // Update cookie if it differs
    if (cookieLocale !== paramLocale) {
      response.cookies.set('locale', paramLocale, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60, // 1 year
        sameSite: 'lax',
      });
    }
    return response;
  }

  // 2. No ?lang= in URL but cookie exists → redirect to add ?lang= to URL
  const savedLocale = parseLocale(cookieLocale);
  if (savedLocale && savedLocale !== 'en') {
    const url = request.nextUrl.clone();
    url.searchParams.set('lang', LOCALE_TO_FULL[savedLocale] || `${savedLocale}-${savedLocale.toUpperCase()}`);
    return NextResponse.redirect(url);
  }

  // 3. No param, no cookie (or cookie is 'en') → continue with default 'en'
  // For 'en' we don't add ?lang= to keep URLs clean (default language)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
