'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import CardWithHover from '@/components/common/CardWithHover';

interface RelatedItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
}

interface RelatedContentProps {
  id: number;
  type: 'movie' | 'tv';
  title: string;
}

export default function RelatedContent({ id, type, title }: RelatedContentProps) {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const router = useRouter();
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      setLoading(true);
      try {
        // Fetch recommendations first
        const recResponse = await axios.get(
          `https://api.themoviedb.org/3/${type}/${id}/recommendations?api_key=${API_KEY}`
        );
        let items: RelatedItem[] = recResponse.data.results || [];

        // If not enough recommendations, fetch similar
        if (items.length < 10) {
          const simResponse = await axios.get(
            `https://api.themoviedb.org/3/${type}/${id}/similar?api_key=${API_KEY}`
          );
          const similarItems: RelatedItem[] = simResponse.data.results || [];
          
          // Merge and remove duplicates
          const existingIds = new Set(items.map(item => item.id));
          for (const item of similarItems) {
            if (!existingIds.has(item.id) && items.length < 20) {
              items.push(item);
              existingIds.add(item.id);
            }
          }
        }

        // Filter out items without poster
        items = items.filter(item => item.poster_path);
        
        setRelatedItems(items.slice(0, 20));
      } catch (error) {
        console.error('Error fetching related content:', error);
        setRelatedItems([]);
      }
      setLoading(false);
    };

    if (id && API_KEY) {
      fetchRelated();
    }
  }, [id, type, API_KEY]);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [relatedItems]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Related {type === 'movie' ? 'Movies' : 'TV Shows'}</h2>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[140px] sm:w-[160px]">
              <div className="aspect-[2/3] bg-gray-700 rounded-lg animate-pulse" />
              <div className="mt-2 h-4 bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (relatedItems.length === 0) {
    return null;
  }

  const linkPrefix = type === 'movie' ? '/movies' : '/tvshows';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
        More Like &quot;{title}&quot;
      </h2>
      
      <div className="relative group">
        {/* Left scroll button */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-2 rounded-full shadow-lg transition-all duration-200 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>

        {/* Scroll container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {relatedItems.map((item, index) => (
            <CardWithHover
              key={item.id}
              id={item.id}
              type={type}
              title={item.title || item.name || ''}
              posterPath={item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : ''}
              onWatchClick={() => router.push(`${linkPrefix}/${item.id}`)}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] cursor-pointer"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 shadow-lg">
                  {item.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                      alt={item.title || item.name || 'Poster'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 120px, (max-width: 768px) 140px, 160px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <span className="text-3xl">{type === 'movie' ? '🎬' : '📺'}</span>
                    </div>
                  )}
                </div>
                
                {/* Title */}
                <h3 className="mt-2 text-sm text-white font-medium line-clamp-2">
                  {item.title || item.name}
                </h3>
              </motion.div>
            </CardWithHover>
          ))}
        </div>

        {/* Right scroll button */}
        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-2 rounded-full shadow-lg transition-all duration-200 ${
            canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>

        {/* Gradient edges */}
        <div className={`absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none transition-opacity ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none transition-opacity ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />
      </div>
    </div>
  );
}
