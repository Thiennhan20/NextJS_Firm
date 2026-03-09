'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'

interface TVShow {
  id: number;
  name: string;
}

interface WatchNowTVShowsServer2Props {
  tvShow: TVShow;
  selectedSeason: number;
  selectedEpisode: number;
  onLinkChange: (link: string) => void;
}

export default function WatchNowTVShowsServer2({
  selectedSeason,
  selectedEpisode,
  onLinkChange
}: WatchNowTVShowsServer2Props) {
  const { id } = useParams();

  // Check server 2 availability
  useEffect(() => {
    if (typeof id === 'string' && id && selectedSeason && selectedEpisode > 0) {
      const server2Url = `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${selectedSeason}&episode=${selectedEpisode}&ds_lang=vi&sub_url=https%3A%2F%2Fvidsrc.me%2Fsample.srt&autoplay=1&autonext=1`;
      onLinkChange(server2Url);
    }
  }, [id, selectedSeason, selectedEpisode, onLinkChange]);

  return null;
}
