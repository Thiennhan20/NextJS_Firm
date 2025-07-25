'use client';

import { useWatchlistStore } from '@/store/store';
import useAuthStore from '@/store/useAuthStore';
import useAuthHydrated from '@/store/useAuthHydrated';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { FaBookmark } from 'react-icons/fa';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });

export default function WatchlistPage() {
  const hydrated = useAuthHydrated();
  const { watchlist, removeFromWatchlist, fetchWatchlistFromServer } = useWatchlistStore();
  const { isAuthenticated } = useAuthStore();

  if (!hydrated) {
    return null; // hoặc spinner nếu muốn
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center p-8 rounded-xl shadow-2xl bg-gradient-to-br from-red-900/80 to-black/80 border border-yellow-600">
          <h1 className="text-2xl font-bold text-yellow-400 mb-4">Please log in to view your watchlist</h1>
          <Link
            href="/login"
            className="inline-block bg-yellow-600 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors transform hover:scale-105 shadow-lg"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  const handleRemove = async (movieId: number) => {
    if (!isAuthenticated) {
      toast.error('You need to log in!');
      return;
    }
    try {
      await api.delete('/auth/watchlist', {
        data: { id: movieId },
      });
      removeFromWatchlist(movieId);
      await fetchWatchlistFromServer();
      toast.success('Removed movie from watchlist!');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'An error occurred while removing the movie');
      } else {
        toast.error('An error occurred while removing the movie');
      }
    }
  };

  return (
    <div className="min-h-screen p-8 bg-black">
      <h1 className="text-3xl font-bold text-yellow-400 mb-8 text-center drop-shadow-lg">My Saved Movies</h1>
      {watchlist.length === 0 ? (
        <div className="text-center text-gray-400 p-8 rounded-xl shadow-xl bg-gradient-to-br from-red-900/60 to-black/60 border border-yellow-700 mx-auto max-w-md">
          <FaBookmark className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <p className="text-xl text-yellow-200">Your watchlist is empty</p>
          <p className="text-sm text-gray-300 mt-2">Add movies from the movie detail page!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {watchlist.map((movie) => (
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
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-2
                    bg-transparent md:bg-black/70
                    opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                  <a
                    href={`/movies/${movie.id}`}
                    className="bg-yellow-500 text-black w-full text-center px-2 py-2 rounded-md font-semibold hover:bg-yellow-600 transition-colors transform hover:scale-105 shadow-md mb-2 text-sm sm:text-base"
                    style={{ textDecoration: 'none' }}
                  >
                    Watch again
                  </a>
                  <button
                    onClick={() => handleRemove(movie.id)}
                    className="bg-red-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-800 transition-colors transform hover:scale-105 shadow-md"
                  >
                    Remove
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