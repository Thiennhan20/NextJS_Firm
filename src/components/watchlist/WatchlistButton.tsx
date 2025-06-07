import { useWatchlistStore } from '@/store/store';
import { motion } from 'framer-motion';
import { FaBookmark } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface WatchlistButtonProps {
  movie: {
    id: number;
    title: string;
    poster_path: string;
  };
}

export default function WatchlistButton({ movie }: WatchlistButtonProps) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
  const isBookmarked = isInWatchlist(movie.id);

  const handleClick = () => {
    if (isBookmarked) {
      removeFromWatchlist(movie.id);
      toast.success('Removed from watchlist');
    } else {
      addToWatchlist(movie);
      toast.success('Added to watchlist');
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