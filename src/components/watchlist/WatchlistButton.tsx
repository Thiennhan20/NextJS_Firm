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
    type?: 'movie' | 'tv';
  };
}

export default function WatchlistButton({ movie }: WatchlistButtonProps) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
  const { isAuthenticated } = useAuthStore();
  const isBookmarked = isInWatchlist(movie.id);

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast.error('You need to log in to save movies');
      return;
    }
    try {
      if (isBookmarked) {
        // Optimistic update: remove from local state first
        removeFromWatchlist(movie.id);
        toast.success('Removed from watchlist');
        await api.delete('/auth/watchlist', {
          data: { id: movie.id },
        });
      } else {
        // Optimistic update: add to local state first
        addToWatchlist(movie);
        toast.success('Added to watchlist');
        await api.post('/auth/watchlist', {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          type: movie.type || 'movie',
        });
      }
    } catch (err: unknown) {
      // Rollback on error
      if (isBookmarked) {
        addToWatchlist(movie); // Re-add if remove failed
      } else {
        removeFromWatchlist(movie.id); // Re-remove if add failed
      }
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
      className={`p-2 rounded-full transition-colors duration-200 ${isBookmarked
          ? 'bg-blue-600 text-white'
          : 'bg-white/10 text-gray-300 hover:bg-white/20'
        }`}
      aria-label={isBookmarked ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <FaBookmark className="w-5 h-5" />
    </motion.button>
  );
} 