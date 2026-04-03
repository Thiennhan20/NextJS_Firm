'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'

interface TVShow {
  id: number;
  name: string;
  year: number | '';
}

interface WatchNowTVShowsServer1Props {
  tvShow: TVShow;
  selectedSeason: number;
  selectedEpisode: number;
  onLinksChange: (links: { embed: string; m3u8: string; vietsub: string; dubbed: string }) => void;
  onLoadingChange: (loading: boolean) => void;
  onSearchComplete: (completed: boolean) => void;
  onDataReadyChange: (ready: boolean) => void;
}

export default function WatchNowTVShowsServer1({
  tvShow,
  selectedSeason,
  selectedEpisode,
  onLinksChange,
  onLoadingChange,
  onSearchComplete,
  onDataReadyChange
}: WatchNowTVShowsServer1Props) {
  const { id } = useParams();

  const [episodesData, setEpisodesData] = useState<Array<{
    server_name?: string;
    server_data?: Array<{
      name?: string;
      link_m3u8?: string;
      link_embed?: string;
    }>;
  }> | null>(null);

  const [tvShowLinks, setTVShowLinks] = useState({
    embed: '',
    m3u8: '',
    vietsub: '',
    dubbed: '',
    seasonChanged: false,
    currentSeason: 0,
  });

  const hasInitializedSubtitles = useRef(false);

  useEffect(() => {
    if (tvShow?.name && tvShow?.year && !hasInitializedSubtitles.current) {
      hasInitializedSubtitles.current = true;
      fetch(`/api/subtitles?query=${encodeURIComponent(tvShow.name)}&year=${tvShow.year.toString()}`)
        .then(res => res.json())
        .then(() => { })
        .catch(() => { });
    }
  }, [tvShow?.name, tvShow?.year]);

  // Xử lý khi season thay đổi để trigger tìm kiếm lại
  useEffect(() => {
    // Chỉ đánh dấu khi season thay đổi, không phải episode
    if (tvShowLinks.m3u8 && tvShowLinks.currentSeason !== selectedSeason) {
      setTVShowLinks(links => ({ ...links, seasonChanged: true }));
    }
  }, [selectedSeason, tvShowLinks.m3u8, tvShowLinks.currentSeason]);

  // Main useEffect - giống như code gốc, chỉ có 1 useEffect duy nhất
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    async function fetchPhimApiEmbed() {

      // Nếu đã có audio links cho season hiện tại thì không cần tìm kiếm lại
      if (tvShowLinks.currentSeason === selectedSeason && !tvShowLinks.seasonChanged &&
        (tvShowLinks.vietsub || tvShowLinks.dubbed)) {
        onDataReadyChange(true);

        // Xử lý khi episode thay đổi - cập nhật audio links từ episodesData có sẵn
        if (episodesData && selectedEpisode > 0) {
          let vietsubLink = '';
          let dubbedLink = '';

          for (const episode of episodesData) {
            const targetEpisode = episode.server_data?.find((ep: { name?: string; link_m3u8?: string; link_embed?: string }) => {
              const epName = ep.name?.toLowerCase() || '';
              return epName.includes(`tập ${selectedEpisode}`) ||
                epName.includes(`episode ${selectedEpisode}`) ||
                epName.includes(`tập 0${selectedEpisode}`) ||
                epName.includes(`episode 0${selectedEpisode}`) ||
                epName.includes(`tập ${selectedEpisode.toString().padStart(2, '0')}`) ||
                epName.includes(`episode ${selectedEpisode.toString().padStart(2, '0')}`)
            });

            if (targetEpisode) {
              if (episode.server_name?.toLowerCase().includes('vietsub')) {
                vietsubLink = targetEpisode.link_m3u8 || targetEpisode.link_embed?.split('?url=')[1] || '';
              } else if (episode.server_name?.toLowerCase().includes('thuyết minh') ||
                episode.server_name?.toLowerCase().includes('lồng tiếng') ||
                episode.server_name?.toLowerCase().includes('dubbed')) {
                dubbedLink = targetEpisode.link_m3u8 || targetEpisode.link_embed?.split('?url=')[1] || '';
              } else {
              }
            }
          }

          setTVShowLinks(links => ({
            ...links,
            vietsub: vietsubLink,
            dubbed: dubbedLink
          }));

          onLinksChange({
            embed: '',
            m3u8: tvShowLinks.m3u8,
            vietsub: vietsubLink,
            dubbed: dubbedLink
          });
        }

        return;
      }

      // Nếu season thay đổi, reset tvShowLinks để tìm kiếm lại
      if (tvShowLinks.seasonChanged) {
        setTVShowLinks(links => ({
          ...links,
          m3u8: '',
          vietsub: '',
          dubbed: '',
          seasonChanged: false
        }));
        onDataReadyChange(false);
        return;
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      onLoadingChange(true);
      onSearchComplete(false);
      onDataReadyChange(false);


      timeoutId = setTimeout(() => {
        // Timeout handler
      }, 60000);
      try {
        if (typeof id !== 'string') {
          return;
        }
        let slug = null;

        // OPTIMIZED: Sequential search with early exit on high-confidence match

        if (tvShow?.name) {
          const originNameWithSeason = `${tvShow.name} (Season ${selectedSeason})`;
          const normalizedName = tvShow.name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

          // Unified scoring function
          const scoreMatch = (item: {
            tmdb?: { id?: string | number };
            origin_name?: string;
            name?: string;
            slug?: string;
          }): number => {
            let score = 0;

            if (item.tmdb?.id && String(item.tmdb.id) === String(id)) score += 100;
            if (item.origin_name && item.origin_name.toLowerCase() === originNameWithSeason.toLowerCase()) score += 90;

            if (item.origin_name) {
              const originLower = item.origin_name.toLowerCase();
              if (originLower.includes(`season ${selectedSeason}`) || originLower.includes(`(season ${selectedSeason})`)) score += 70;
            }

            if (item.name) {
              const nameLower = item.name.toLowerCase();
              const seasonPatterns = [`phần ${selectedSeason}`, `part ${selectedSeason}`, `season ${selectedSeason}`, `mùa ${selectedSeason}`];

              for (const pattern of seasonPatterns) {
                if (nameLower.includes(pattern)) {
                  score += 60;
                  break;
                }
              }

              if (nameLower.includes(normalizedName)) score += 30;
              if (nameLower === tvShow.name.toLowerCase()) score += 40;
            }

            if (item.origin_name && item.origin_name.toLowerCase().includes(tvShow.name.toLowerCase())) score += 25;
            if (item.slug && item.slug.toLowerCase().includes(normalizedName.replace(/\s+/g, '-'))) score += 15;

            return score;
          };

          // Helper function to search and score
          const searchAndScore = async (keyword: string, strategyName: string) => {
            try {
              const url = `${apiUrl}/server1/search?keyword=${encodeURIComponent(keyword)}`;
              const res = await fetch(url);
              const data = await res.json();

              if (data?.status === 'success' && Array.isArray(data?.data?.items)) {
                let bestMatch = null;
                let bestScore = 0;

                for (const item of data.data.items) {
                  const score = scoreMatch(item);
                  if (score > 0) {
                  }
                  if (score > bestScore) {
                    bestScore = score;
                    bestMatch = item;
                  }
                }

                if (bestMatch?.slug && bestScore > 0) {
                  return {
                    slug: bestMatch.slug,
                    name: bestMatch.name || '',
                    score: bestScore,
                    strategy: strategyName
                  };
                } else {
                }
              } else {
              }
            } catch {
            }
            return null;
          };

          try {
            // Step 1: Direct TMDB TV lookup (fastest, most reliable)
            try {
              const tmdbRes = await fetch(`${apiUrl}/server1/tmdb/tv/${id}`);
              const tmdbData = await tmdbRes.json();
              if (tmdbData?.status === true && tmdbData?.movie?.slug) {
                const apiSlug = tmdbData.movie.slug;
                const apiName = tmdbData.movie.name || '';
                const apiOriginName = tmdbData.movie.origin_name || '';
                
                // Trích xuất số Session từ tên hoặc slug
                const extractSeason = (text: string): number | null => {
                  const patterns = [
                      /ph[aầ]n[-\s]*(\d+)/i,
                      /season[-\s]*(\d+)/i,
                      /m[uù]a[-\s]*(\d+)/i,
                      /part[-\s]*(\d+)/i,
                      /\bs(\d{1,2})\b/i,
                  ];
                  for (const p of patterns) {
                      const m = text.match(p);
                      if (m) return parseInt(m[1], 10);
                  }
                  const trailing = text.match(/-(\d+)$|\s(\d+)$/);
                  if (trailing) {
                    const num = parseInt(trailing[1] || trailing[2], 10);
                    if (num < 100) return num;
                  }
                  return null;
                };

                const textToSearch = `${apiName} ${apiOriginName} ${apiSlug}`.toLowerCase();
                const detectedSeason = extractSeason(textToSearch);

                if (detectedSeason === selectedSeason) {
                  slug = apiSlug;
                } else if (!detectedSeason && selectedSeason === 1) {
                  slug = apiSlug;
                } else {
                }
              } else {
              }
            } catch {
            }

            // Step 2: If TMDB lookup failed, fall back to text search strategies
            if (!slug) {
              const searchPriorities = [
                { keyword: originNameWithSeason, name: 'Origin name', minScore: 80 },
                { keyword: `${normalizedName} phần ${selectedSeason}`, name: 'Vietnamese', minScore: 60 },
                { keyword: tvShow.name, name: 'Show name', minScore: 40 }
              ];

              let bestResult = null;
              let bestScore = 0;

              // Try each keyword sequentially, but stop early if we get a high-confidence match
              for (const { keyword, name, minScore } of searchPriorities) {
                const result = await searchAndScore(keyword, name);

                if (result && result.score > bestScore) {
                  bestScore = result.score;
                  bestResult = result;

                  // Early exit if we have a high-confidence match
                  if (result.score >= minScore) {
                    slug = result.slug;
                    break;
                  }
                }
              }

              // If no early exit, use best result found
              if (!slug && bestResult) {
                slug = bestResult.slug;
              }
            } // end if (!slug)
          } catch {
            // Search error
          }
        }

        if (!slug) {
          return;
        }

        const detailRes = await fetch(`${apiUrl}/server1/detail/${slug}`);
        const detailData = await detailRes.json();

        // Kiểm tra xem phim này có episodes của season đang được chọn không
        let hasSeasonEpisodes = false;
        let finalDetailData = detailData;

        if (detailData.episodes && Array.isArray(detailData.episodes)) {
          // Tìm episode có số thứ tự tương ứng với episode đang được chọn
          const targetEpisode = detailData.episodes.find((ep: { episode_number: number; name?: string }) =>
            ep.episode_number === selectedEpisode ||
            ep.name?.toLowerCase().includes(`tập ${selectedEpisode}`) ||
            ep.name?.toLowerCase().includes(`episode ${selectedEpisode}`)
          );

          hasSeasonEpisodes = !!targetEpisode;
        }

        // Nếu không có episodes của season này, tìm kiếm lại với từ khóa khác
        if (!hasSeasonEpisodes) {

          // Thử tìm kiếm với từ khóa có thêm season
          const seasonKeywords = [
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} phần ${selectedSeason}`,
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} part ${selectedSeason}`,
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} season ${selectedSeason}`,
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} tập ${selectedEpisode}`,
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} episode ${selectedEpisode}`
          ];

          for (const seasonKeyword of seasonKeywords) {
            const altUrl = `${apiUrl}/server1/search?keyword=${encodeURIComponent(seasonKeyword)}`;

            try {
              const altRes = await fetch(altUrl);
              const altData = await altRes.json();

              if (altData.status === 'success' && altData.data?.items?.length > 0) {
                const altItem = altData.data.items[0];

                // Kiểm tra lại với phim mới
                const altDetailRes = await fetch(`${apiUrl}/server1/detail/${altItem.slug}`);
                const altDetailData = await altDetailRes.json();

                if (altDetailData.episodes && Array.isArray(altDetailData.episodes)) {
                  const altTargetEpisode = altDetailData.episodes.find((ep: { episode_number: number; name?: string }) =>
                    ep.episode_number === selectedEpisode ||
                    ep.name?.toLowerCase().includes(`tập ${selectedEpisode}`) ||
                    ep.name?.toLowerCase().includes(`episode ${selectedEpisode}`)
                  );

                  if (altTargetEpisode) {
                    slug = altItem.slug;
                    finalDetailData = altDetailData;
                    hasSeasonEpisodes = true;
                    break;
                  }
                }
              }
            } catch {
            }
          }
        }

        // Tìm episode chính xác dựa trên selectedEpisode
        let vietsubLink = '';
        let dubbedLink = '';
        let defaultEmbed = '';

        if (finalDetailData.episodes && Array.isArray(finalDetailData.episodes)) {

          for (const episode of finalDetailData.episodes) {
            // Tìm episode có số thứ tự tương ứng
            const targetEpisode = episode.server_data?.find((ep: { name?: string; link_m3u8?: string; link_embed?: string }) => {
              const epName = ep.name?.toLowerCase() || '';
              const epNumber = selectedEpisode;

              // Kiểm tra các pattern: "Tập 02", "Episode 2", "2", etc.
              return epName.includes(`tập ${epNumber}`) ||
                epName.includes(`episode ${epNumber}`) ||
                epName.includes(`tập 0${epNumber}`) ||
                epName.includes(`episode 0${epNumber}`) ||
                epName.includes(`tập ${epNumber.toString().padStart(2, '0')}`) ||
                epName.includes(`episode ${epNumber.toString().padStart(2, '0')}`)
            });

            if (targetEpisode) {

              // Phân loại theo server_name
              const sName = episode.server_name?.toLowerCase() || '';
              if (sName.includes('vietsub')) {
                vietsubLink = targetEpisode.link_m3u8 || targetEpisode.link_embed?.split('?url=')[1] || '';
              } else if (sName.includes('thuyết minh') ||
                sName.includes('lồng tiếng') ||
                sName.includes('dubbed')) {
                dubbedLink = targetEpisode.link_m3u8 || targetEpisode.link_embed?.split('?url=')[1] || '';
              } else {
              }
            } else {
            }
          }

          // Fallback: lấy episode đầu tiên nếu không tìm thấy episode cụ thể
          if (!vietsubLink && !dubbedLink) {
            const firstEpisode = finalDetailData.episodes[0]?.server_data?.[0];
            if (firstEpisode) {
              defaultEmbed = firstEpisode.link_m3u8 || firstEpisode.link_embed?.split('?url=')[1] || '';
            }
          }
        }

        // Fallback: sử dụng link_embed gốc nếu có
        if (!vietsubLink && !dubbedLink && !defaultEmbed && finalDetailData.link_embed) {
          defaultEmbed = finalDetailData.link_embed.includes('?url=')
            ? finalDetailData.link_embed.split('?url=')[1]
            : finalDetailData.link_embed;
        }

        // Lưu episodes data để tái sử dụng khi đổi episode
        setEpisodesData(finalDetailData.episodes);

        // Cập nhật tvShowLinks với tất cả audio options

        const updatedLinks = {
          embed: '',
          m3u8: defaultEmbed,
          vietsub: vietsubLink,
          dubbed: dubbedLink,
          seasonChanged: false,
          currentSeason: selectedSeason
        };

        if (vietsubLink || dubbedLink || defaultEmbed) {
        } else {
        }

        setTVShowLinks(updatedLinks);

        // Notify parent
        onLinksChange({
          embed: '',
          m3u8: defaultEmbed,
          vietsub: vietsubLink,
          dubbed: dubbedLink
        });

      } catch {
        // Error handling
      } finally {
        clearTimeout(timeoutId);
        onLoadingChange(false);
        onSearchComplete(true);
        onDataReadyChange(true);
      }
    }
    fetchPhimApiEmbed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tvShow?.name, selectedSeason, selectedEpisode]);

  return null;
}
