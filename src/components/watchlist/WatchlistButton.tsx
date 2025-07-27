import { useWatchlistStore } from '@/store/store';
import { motion } from 'framer-motion';
import { FaBookmark } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import api from '@/lib/axios';

interface WatchlistButtonProps {
  movie: {
    id: number;
    title: string;
    poster_path: string;
  };
}

export default function WatchlistButton({ movie }: WatchlistButtonProps) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, fetchWatchlistFromServer } = useWatchlistStore();
  const { isAuthenticated, token } = useAuthStore();
  const isBookmarked = isInWatchlist(movie.id);

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast.error('You need to log in to save movies');
      return;
    }
    try {
      if (isBookmarked) {
        await api.delete('/auth/watchlist', {
          data: { id: movie.id },
        });
        removeFromWatchlist(movie.id);
        toast.success('Removed from watchlist');
      } else {
        await api.post('/auth/watchlist', {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
        });
        addToWatchlist(movie);
        toast.success('Added to watchlist');
      }
      // Đồng bộ lại watchlist từ server
      if (token) await fetchWatchlistFromServer(token);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'An error occurred');
      } else {
        toast.error('An error occurred');
      }
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={`p-2 rounded-full transition-colors duration-200 ${
        isBookmarked
          ? 'bg-blue-600 text-white'
          : 'bg-white/10 text-gray-300 hover:bg-white/20'
      }`}
      aria-label={isBookmarked ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <FaBookmark className="w-5 h-5" />
    </motion.button>
  );
} 