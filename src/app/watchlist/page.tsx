'use client';

import { useTemporaryWatchlistStore } from '@/store/store';
import { useAuthStore } from '@/store/store';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { FaBookmark } from 'react-icons/fa';

const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });

export default function WatchlistPage() {
  const { temporaryWatchlist, removeTemporarilyFromWatchlist } = useTemporaryWatchlistStore();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center p-8 rounded-xl shadow-2xl bg-gradient-to-br from-red-900/80 to-black/80 border border-yellow-600">
          <h1 className="text-2xl font-bold text-yellow-400 mb-4">Vui lòng đăng nhập để xem danh sách xem của bạn</h1>
          <Link
            href="/login"
            className="inline-block bg-yellow-600 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors transform hover:scale-105 shadow-lg"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-black">
      <h1 className="text-3xl font-bold text-yellow-400 mb-8 text-center drop-shadow-lg">Danh sách xem tạm thời của tôi</h1>
      {temporaryWatchlist.length === 0 ? (
        <div className="text-center text-gray-400 p-8 rounded-xl shadow-xl bg-gradient-to-br from-red-900/60 to-black/60 border border-yellow-700 mx-auto max-w-md">
          <FaBookmark className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <p className="text-xl text-yellow-200">Danh sách xem tạm thời của bạn trống</p>
          <p className="text-sm text-gray-300 mt-2">Thêm phim từ trang chi tiết phim!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {temporaryWatchlist.map((movie) => (
            <MotionDiv
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-yellow-700 overflow-hidden"
            >
              <div className="aspect-[2/3] relative rounded-t-lg overflow-hidden">
                <Image
                  src={movie.poster_path}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                  <button
                    onClick={() => removeTemporarilyFromWatchlist(movie.id)}
                    className="bg-red-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-800 transition-colors transform hover:scale-105 shadow-md"
                  >
                    Xóa
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="mt-2 text-yellow-300 font-medium truncate text-lg text-center">{movie.title}</h3>
              </div>
            </MotionDiv>
          ))}
        </div>
      )}
    </div>
  );
} 