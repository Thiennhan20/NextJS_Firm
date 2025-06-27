'use client'

import { motion } from 'framer-motion'
import Hero3D from '@/components/Hero3D'
import MovieCard from '@/components/MovieCard'
import TrendingMovies from '@/components/TrendingMovies'
import MovieNews from '@/components/MovieNews'
import QuickReviews from '@/components/QuickReviews'
import { useEffect, useState } from 'react'
import axios from 'axios'

// Định nghĩa kiểu Movie rõ ràng nếu cần
interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average?: number;
  release_date?: string;
  image?: string;
  rating?: number;
  year?: number;
  genre?: string;
}

export default function Home() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=1`
        );
        const movies = response.data.results.map((movie: Movie) => ({
          id: movie.id,
          title: movie.title,
          rating: movie.vote_average,
          year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : '',
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
          genre: [], // Nếu muốn lấy genre chi tiết cần fetch thêm
        }));
        setFeaturedMovies(movies.slice(0, 9)); // Lấy 9 phim đầu tiên cho đẹp grid
      } catch (error) {
        console.error(error);
        setFeaturedMovies([]);
      }
      setLoading(false);
    };
    fetchMovies();
  }, [API_KEY]);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden">
        {/* Overlay tối giúp chữ nổi bật hơn */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/90 via-black/60 to-transparent pointer-events-none" />
        {/* Hero3D canvas luôn full màn hình */}
        <div className="absolute inset-0 w-full h-full">
          <Hero3D />
        </div>
        {/* Đảm bảo nội dung Hero nằm trên overlay và canvas */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-2 sm:px-4 w-full h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-transparent bg-clip-text drop-shadow-lg break-words leading-tight">
              Welcome to Movie World
            </h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base xs:text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-gray-100 drop-shadow"
            >
              Discover amazing movies in stunning 3D
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full max-w-xs sm:max-w-none mx-auto"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 sm:px-8 rounded-full text-base sm:text-lg font-semibold shadow-lg shadow-red-600/20 w-full sm:w-auto"
              >
                Explore Movies
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 sm:px-8 rounded-full text-base sm:text-lg font-semibold backdrop-blur-sm w-full sm:w-auto"
              >
                Watch Trailer
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trending Movies Section */}
      <TrendingMovies />

      {/* Movie News Section */}
      <MovieNews />

      {/* Featured Movies Section */}
      <section className="py-16 sm:py-24 px-2 sm:px-4 bg-gradient-to-b from-black to-gray-900 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-red-500 to-purple-500 text-transparent bg-clip-text">
              Featured Movies
            </h2>
            <p className="text-gray-400 text-sm sm:text-lg">
              Discover our handpicked selection of amazing films
            </p>
          </motion.div>
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredMovies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MovieCard {...movie} image={movie.image ?? ''} rating={movie.rating ?? 0} year={movie.year ?? 0} genre={Array.isArray(movie.genre) ? movie.genre : [movie.genre ?? '']} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick Reviews Section */}
      <QuickReviews />

      {/* Categories Preview */}
      <section className="py-16 sm:py-24 px-2 sm:px-4 bg-gray-900 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">
              Browse by Category
            </h2>
            <p className="text-gray-400 text-sm sm:text-lg">
              Find your favorite movies by genre
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi'].map((category, index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 sm:p-6 flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 transition-all"
              >
                <span className="text-base sm:text-xl font-semibold text-white text-center w-full break-words">{category}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}