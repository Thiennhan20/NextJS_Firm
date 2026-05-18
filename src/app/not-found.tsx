'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const router = useRouter();
  const t = useTranslations('NotFound');

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Animated background gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(239, 68, 68, 0.12) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Error code with glow effect */}
        <div className="relative mb-6">
          <h1
            className="text-[120px] sm:text-[160px] font-black leading-none bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 text-transparent bg-clip-text select-none"
            style={{
              backgroundSize: '300% 300%',
              animation: 'ctaGradientShift 4s ease-in-out infinite',
            }}
          >
            404
          </h1>
          <div
            className="absolute inset-0 text-[120px] sm:text-[160px] font-black leading-none text-white/5 blur-2xl select-none pointer-events-none"
            aria-hidden="true"
          >
            404
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          {t('title')}
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-base sm:text-lg mb-8 leading-relaxed">
          {t('description')}
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            {t('goHome')}
          </Link>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            {t('goBack')}
          </button>
        </div>
      </div>
    </div>
  );
}
