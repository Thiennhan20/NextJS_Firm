'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Movie {
  id: number;
  title: string;
  year: number | '';
}

interface WatchNowMoviesServer2Props {
  movie: Movie;
  onLinkChange: (link: string) => void;
}

export default function WatchNowMoviesServer2({
  movie,
  onLinkChange
}: WatchNowMoviesServer2Props) {
  const { id } = useParams();

  // Check server 2 availability
  useEffect(() => {
    if (typeof id === 'string' && id) {
      const server2Url = `https://vidsrc.me/embed/movie?tmdb=${id}&ds_lang=vi&sub_url=https%3A%2F%2Fvidsrc.me%2Fsample.srt&autoplay=1`;
      onLinkChange(server2Url);
    }
  }, [id, movie?.title, movie?.year, onLinkChange]);

  return null;
}
