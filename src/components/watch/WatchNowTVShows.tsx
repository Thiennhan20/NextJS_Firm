'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import EnhancedMoviePlayer from '@/components/common/EnhancedMoviePlayer'

// Định nghĩa kiểu TVShow
interface TVShow {
  id: number
  name: string
  duration: string
  year: number | ''
  firstAirDate?: string
  creator: string
  cast: string[]
  genre: string
  description: string
  poster: string
  backdrop: string
  trailer: string
  tvShowUrl: string
  scenes: string[]
  totalSeasons?: number
  totalEpisodes?: number
}

interface Episode {
  id: number
  name: string
  episode_number: number
  season_number: number
  still_path?: string
  overview?: string
  air_date?: string
}

interface WatchNowTVShowsProps {
  tvShow: TVShow;
  selectedSeason: number;
  selectedEpisode: number;
  episodes: Episode[];
}

export default function WatchNowTVShows({ 
  tvShow, 
  selectedSeason, 
  selectedEpisode, 
  episodes: _episodes 
}: WatchNowTVShowsProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const episodes = _episodes;
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [selectedServer, setSelectedServer] = useState<'server1' | 'server2'>('server1');
  const hasInitialized = useRef(false);

  const [selectedAudio, setSelectedAudio] = useState<'vietsub' | 'dubbed' | null>(null);
  const [episodesData, setEpisodesData] = useState<Array<{
    server_name?: string;
    server_data?: Array<{
      name?: string;
      link_m3u8?: string;
      link_embed?: string;
    }>;
  }> | null>(null);
  const [server2Link, setServer2Link] = useState('');
  const [tvShowLinksLoading, setTVShowLinksLoading] = useState(false);
  const [apiSearchCompleted, setApiSearchCompleted] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  // Cập nhật URL khi thay đổi server
  const updateServerInUrl = (server: 'server1' | 'server2') => {
    const params = new URLSearchParams(searchParams.toString());
    const currentServer = searchParams.get('server');
    
    // Chỉ cập nhật nếu server thực sự thay đổi
    if (currentServer !== server) {
      params.set('server', server);
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      
      // Nếu đang từ server2 về server1, sử dụng replace để không tạo history entry mới
      if (currentServer === 'server2' && server === 'server1') {
        router.replace(newUrl, { scroll: false });
      } else {
        router.push(newUrl, { scroll: false });
      }
    }
  };

  // Cập nhật server và URL
  const handleServerChange = (server: 'server1' | 'server2') => {
    if (selectedServer !== server) {
      setSelectedServer(server);
      updateServerInUrl(server);
    }
  };

  // Đọc server từ URL khi component mount hoặc URL thay đổi
  useEffect(() => {
    const serverFromUrl = searchParams.get('server');
    if (serverFromUrl === 'server1' || serverFromUrl === 'server2') {
      setSelectedServer(serverFromUrl);
      hasInitialized.current = true;
    } else {
      // Nếu không có tham số server, mặc định về server1
      setSelectedServer('server1');
      hasInitialized.current = true;
    }
  }, [searchParams]);

  // Function để cập nhật audio links cho episode mới mà không cần tìm kiếm lại
  const updateAudioLinksForEpisode = useCallback((episodeNumber: number) => {
    if (!episodesData) return;
    
    let vietsubLink = '';
    let dubbedLink = '';
    
    for (const episode of episodesData) {
      // Tìm episode có số thứ tự tương ứng
      const targetEpisode = episode.server_data?.find((ep: { name?: string; link_m3u8?: string; link_embed?: string }) => {
        const epName = ep.name?.toLowerCase() || '';
        
        // Kiểm tra các pattern: "Tập 02", "Episode 2", "2", etc.
        return epName.includes(`tập ${episodeNumber}`) || 
               epName.includes(`episode ${episodeNumber}`) ||
               epName.includes(`tập 0${episodeNumber}`) ||
               epName.includes(`episode 0${episodeNumber}`) ||
               epName.includes(`tập ${episodeNumber.toString().padStart(2, '0')}`) ||
               epName.includes(`episode ${episodeNumber.toString().padStart(2, '0')}`)
      });
      
      if (targetEpisode) {
        // Phân loại theo server_name
        if (episode.server_name?.toLowerCase().includes('vietsub')) {
          vietsubLink = targetEpisode.link_m3u8 || targetEpisode.link_embed?.split('?url=')[1] || '';
        } else if (episode.server_name?.toLowerCase().includes('thuyết minh') ||
                   episode.server_name?.toLowerCase().includes('lồng tiếng') || 
                   episode.server_name?.toLowerCase().includes('dubbed')) {
          dubbedLink = targetEpisode.link_m3u8 || targetEpisode.link_embed?.split('?url=')[1] || '';
        }
      }
    }
    
    // Cập nhật tvShowLinks với episode mới
    setTVShowLinks(links => ({
      ...links,
      vietsub: vietsubLink,
      dubbed: dubbedLink
    }));
  }, [episodesData]);

  // Check server 2 availability
  useEffect(() => {
    if (typeof id === 'string' && id && selectedSeason && selectedEpisode > 0) {
      const server2Url = `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${selectedSeason}&episode=${selectedEpisode}&ds_lang=vi&sub_url=https%3A%2F%2Fvidsrc.me%2Fsample.srt&autoplay=1&autonext=1`;
      setServer2Link(server2Url);
    }
  }, [id, selectedSeason, selectedEpisode]);

  const [tvShowLinks, setTVShowLinks] = useState({
    embed: '',
    m3u8: '',
    vietsub: '', // Link cho Vietsub
    dubbed: '', // Link cho Lồng Tiếng
    seasonChanged: false,
    currentSeason: 0, // Lưu season hiện tại đã tìm kiếm
  });

  useEffect(() => {
    if (tvShow?.name && tvShow?.year) {
      fetch(`/api/subtitles?query=${encodeURIComponent(tvShow.name)}&year=${tvShow.year.toString()}`)
        .then(res => res.json())
        .then(() => {})
        .catch(() => {});
    }
  }, [tvShow?.name, tvShow?.year]);

  // Xử lý khi season thay đổi để trigger tìm kiếm lại
  useEffect(() => {
    // Chỉ đánh dấu khi season thay đổi, không phải episode
    if (tvShowLinks.m3u8) {
      setTVShowLinks(links => ({ ...links, seasonChanged: true }));
    }
  }, [selectedSeason, tvShowLinks.m3u8]);

  // Xử lý khi episode thay đổi để cập nhật audio links
  useEffect(() => {
    // Chỉ xử lý khi đã có episodes data và episode thay đổi
    if (episodesData && selectedEpisode > 0 && !tvShowLinks.seasonChanged) {
      // Cập nhật audio links cho episode mới mà không cần tìm kiếm lại
      updateAudioLinksForEpisode(selectedEpisode);
    }
  }, [selectedEpisode, episodesData, tvShowLinks.seasonChanged, updateAudioLinksForEpisode]);

  // Tự động chọn audio khi có sẵn
  useEffect(() => {
    if (tvShowLinks.vietsub && tvShowLinks.dubbed && !selectedAudio) {
      setSelectedAudio('vietsub'); // Default to vietsub
    }
    
    // Nếu chỉ có một loại audio, tự động chọn
    if (tvShowLinks.vietsub && !tvShowLinks.dubbed && !selectedAudio) {
      setSelectedAudio('vietsub');
    }
    if (tvShowLinks.dubbed && !tvShowLinks.vietsub && !selectedAudio) {
      setSelectedAudio('dubbed');
    }
  }, [tvShowLinks.vietsub, tvShowLinks.dubbed, selectedAudio]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    async function fetchPhimApiEmbed() {
      console.log('📺 [TVSHOW DEBUG] Starting TV show search process...');
      console.log('📺 [TVSHOW DEBUG] TV show data:', { 
        name: tvShow?.name, 
        year: tvShow?.year, 
        id, 
        selectedSeason, 
        selectedEpisode 
      });
      
      // Nếu đã có audio links cho season hiện tại thì không cần tìm kiếm lại
      if (tvShowLinks.currentSeason === selectedSeason && !tvShowLinks.seasonChanged && 
          (tvShowLinks.vietsub || tvShowLinks.dubbed)) {
        console.log('📺 [TVSHOW DEBUG] Already have links for current season, skipping search');
        setDataReady(true);
        return;
      }
      
      // Nếu season thay đổi, reset tvShowLinks để tìm kiếm lại
      if (tvShowLinks.seasonChanged) {
        console.log('📺 [TVSHOW DEBUG] Season changed, resetting links');
        setTVShowLinks(links => ({ 
          ...links, 
          m3u8: '', 
          vietsub: '', 
          dubbed: '', 
          seasonChanged: false 
        }));
        setDataReady(false);
        return;
      }
      
      // Tiến hành tìm kiếm
      console.log('📺 [TVSHOW DEBUG] Starting search process...');
      
      setTVShowLinksLoading(true);
      setApiSearchCompleted(false);
      setDataReady(false);

      timeoutId = setTimeout(() => {
        console.log('📺 [TVSHOW DEBUG] Search timeout reached (60s)');
      }, 60000);
      try {
        if (typeof id !== 'string') {
          console.log('📺 [TVSHOW DEBUG] Invalid ID type:', typeof id);
          return;
        }
        let slug = null;
        let logged = false;
        // 1) Try TMDB ID direct search on PhimAPI first
        try {
          if (!slug && typeof id === 'string') {
            const tmdbSearchUrl = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(id)}`;
            console.log('📺 [TVSHOW DEBUG] First pass: TMDB ID search:', tmdbSearchUrl);
            const tmdbRes = await fetch(tmdbSearchUrl);
            const tmdbData = await tmdbRes.json();
            if (tmdbData?.status === 'success' && Array.isArray(tmdbData?.data?.items)) {
              const tmdbMatch = tmdbData.data.items.find((it: { tmdb?: { id?: string | number }; slug?: string; name?: string }) => it?.tmdb?.id && String(it.tmdb.id) === String(id));
              if (tmdbMatch?.slug) {
                slug = tmdbMatch.slug;
                console.log('📺 [TVSHOW DEBUG] TMDB ID match found:', tmdbMatch.name, '->', slug);
              }
            }
          }
        } catch (e) {
          console.log('📺 [TVSHOW DEBUG] TMDB ID search error:', e);
        }

        // 2) English keyword-based search (from TMDB title)
        if (!slug && tvShow?.name) {
          console.log('📺 [TVSHOW DEBUG] Starting search for:', tvShow.name);
          
          // Chuẩn hóa tên phim để tìm kiếm chính xác hơn
          const normalizedName = tvShow.name
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Loại bỏ ký tự đặc biệt
            .replace(/\s+/g, ' ') // Chuẩn hóa khoảng trắng
            .trim();
          
          const keywords = [normalizedName, tvShow.name].filter(Boolean);
          console.log('📺 [TVSHOW DEBUG] Search keywords:', keywords);
          
          outer: for (const keyword of keywords) {
            console.log('📺 [TVSHOW DEBUG] Searching keyword:', keyword);
            // Trừ năm ra - chỉ tìm kiếm theo tên phim
            const url = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}`;
            console.log('📺 [TVSHOW DEBUG] API URL:', url);
            
            if (!logged) {
              logged = true;
            }
            const res = await fetch(url);
            const data = await res.json();
            console.log('📺 [TVSHOW DEBUG] API Response:', { 
              status: data.status, 
              itemsCount: data.data?.items?.length || 0,
              firstItem: data.data?.items?.[0]?.name || 'none'
            });
            
            if (
              data.status === 'success' &&
              data.data &&
              Array.isArray(data.data.items) &&
              data.data.items.length > 0
            ) {
              console.log('📺 [TVSHOW DEBUG] Processing search results...');
              // Tìm kiếm chính xác hơn bằng cách so sánh với nhiều trường và kiểm tra season
              let bestMatch = null;
              let bestScore = 0;
              
              for (const item of data.data.items) {
                let score = 0;
                
                // So sánh với name
                if (item.name && item.name.toLowerCase().includes(normalizedName)) {
                  score += 3;
                }
                
                // So sánh với slug
                if (item.slug && item.slug.toLowerCase().includes(normalizedName.replace(/\s+/g, '-'))) {
                  score += 2;
                }
                
                // So sánh với origin_name
                if (item.origin_name && item.origin_name.toLowerCase().includes(normalizedName)) {
                  score += 2;
                }
                
                // Kiểm tra season trong tên phim - ưu tiên season đang được chọn
                if (item.name) {
                  const itemName = item.name.toLowerCase();
                  
                  // Kiểm tra xem có phải là season đang được chọn không
                  if (selectedSeason === 1) {
                    // Nếu đang ở season 1, ưu tiên "Phần 1" hoặc không có "Phần"
                    if (itemName.includes('phần 1') || itemName.includes('part 1')) {
                      score += 5; // Điểm cao nhất cho season 1
                    } else if (itemName.includes('phần 2') || itemName.includes('part 2')) {
                      score -= 3; // Trừ điểm cho season 2
                    } else if (!itemName.includes('phần') && !itemName.includes('part')) {
                      score += 4; // Điểm cao cho phim không có phần
                    }
                  } else if (selectedSeason === 2) {
                    // Nếu đang ở season 2, ưu tiên "Phần 2"
                    if (itemName.includes('phần 2') || itemName.includes('part 2')) {
                      score += 5;
                    } else if (itemName.includes('phần 1') || itemName.includes('part 1')) {
                      score -= 3;
                    }
                  } else if (selectedSeason === 3) {
                    // Nếu đang ở season 3, ưu tiên "Phần 3"
                    if (itemName.includes('phần 3') || itemName.includes('part 3')) {
                      score += 5;
                    } else if (itemName.includes('phần 1') || itemName.includes('part 1') || itemName.includes('phần 2') || itemName.includes('part 2')) {
                      score -= 3;
                    }
                  }
                }
                
                console.log('📺 [TVSHOW DEBUG] Item score:', { 
                  name: item.name, 
                  score, 
                  bestScore 
                });
                
                if (score > bestScore) {
                  bestScore = score;
                  bestMatch = item;
                }
              }
              
              if (bestMatch && bestMatch.slug && bestScore >= 2) {
                slug = bestMatch.slug;
                console.log('📺 [TVSHOW DEBUG] Best match found:', bestMatch.name, '->', bestMatch.slug, 'score:', bestScore);
                break outer;
              } else {
                console.log('📺 [TVSHOW DEBUG] No good match found, best score:', bestScore);
              }
            }
          }
        }
        // 3) Vietnamese keyword fallback using TMDB translations/alternative names
        if (!slug && tvShow?.name) {
          console.log('📺 [TVSHOW DEBUG] Fallback: Vietnamese keyword search');
          try {
            const viNames: string[] = [];
            if (typeof id === 'string') {
              const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
              if (API_KEY) {
                const [transRes, altRes] = await Promise.all([
                  fetch(`https://api.themoviedb.org/3/tv/${id}/translations?api_key=${API_KEY}`).then(r => r.json()).catch(() => null),
                  fetch(`https://api.themoviedb.org/3/tv/${id}/alternative_titles?api_key=${API_KEY}`).then(r => r.json()).catch(() => null)
                ]);
                const trans = transRes?.translations || [];
                const viTrans = trans.find((t: { iso_639_1?: string; iso_3166_1?: string; data?: { name?: string; title?: string } }) => t?.iso_639_1 === 'vi' || t?.iso_3166_1 === 'VN');
                if (viTrans?.data?.name) viNames.push(viTrans.data.name);
                if (viTrans?.data?.title) viNames.push(viTrans.data.title);
                const alt = altRes?.results || altRes?.titles || [];
                alt.forEach((n: { title?: string }) => { if (n?.title) viNames.push(n.title); });
              }
            }
            const viNoAccents = viNames.map(n => String(n).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim());
            const viSlugs = viNoAccents.map(n => n.replace(/\s+/g, '-'));
            const viKeywords = [...viNames, ...viNoAccents, ...viSlugs].filter(Boolean).map(String);
            console.log('📺 [TVSHOW DEBUG] VI keywords:', viKeywords);

            outerVi: for (const keyword of viKeywords) {
              const url = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}`;
              const res = await fetch(url);
              const data = await res.json();
              if (data?.status === 'success' && Array.isArray(data?.data?.items) && data.data.items.length > 0) {
                // pick first slug (simple for fallback)
                const item = data.data.items[0];
                if (item?.slug) {
                  slug = item.slug;
                  console.log('📺 [TVSHOW DEBUG] VI fallback matched:', item.name, '->', slug);
                  break outerVi;
                }
              }
            }
          } catch (e) {
            console.log('📺 [TVSHOW DEBUG] VI fallback error:', e);
          }
        }
        
        if (!slug) {
          console.log('📺 [TVSHOW DEBUG] No slug found after search');
          return;
        }
        
        console.log('📺 [TVSHOW DEBUG] Fetching TV show details for slug:', slug);
        const detailRes = await fetch(`https://phimapi.com/phim/${slug}`);
        const detailData = await detailRes.json();
        console.log('📺 [TVSHOW DEBUG] TV show details response:', {
          name: detailData.name,
          episodes: detailData.episodes?.length || 0,
          link_embed: !!detailData.link_embed
        });
        
        // Kiểm tra xem phim này có episodes của season đang được chọn không
        let hasSeasonEpisodes = false;
        let finalDetailData = detailData;
        
        if (detailData.episodes && Array.isArray(detailData.episodes)) {
          console.log('📺 [TVSHOW DEBUG] Checking for target episode:', selectedEpisode);
          // Tìm episode có số thứ tự tương ứng với episode đang được chọn
          const targetEpisode = detailData.episodes.find((ep: { episode_number: number; name?: string }) => 
            ep.episode_number === selectedEpisode || 
            ep.name?.toLowerCase().includes(`tập ${selectedEpisode}`) ||
            ep.name?.toLowerCase().includes(`episode ${selectedEpisode}`)
          );
          
          hasSeasonEpisodes = !!targetEpisode;
          console.log('📺 [TVSHOW DEBUG] Has season episodes:', hasSeasonEpisodes);
        }
        
        // Nếu không có episodes của season này, tìm kiếm lại với từ khóa khác
        if (!hasSeasonEpisodes) {
          console.log('📺 [TVSHOW DEBUG] No season episodes found, trying alternative search...');
          
          // Thử tìm kiếm với từ khóa có thêm season
          const seasonKeywords = [
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} phần ${selectedSeason}`,
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} part ${selectedSeason}`,
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} season ${selectedSeason}`,
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} tập ${selectedEpisode}`,
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} episode ${selectedEpisode}`
          ];
          console.log('📺 [TVSHOW DEBUG] Alternative keywords:', seasonKeywords);
          
          for (const seasonKeyword of seasonKeywords) {
            console.log('📺 [TVSHOW DEBUG] Trying alternative keyword:', seasonKeyword);
            const altUrl = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(seasonKeyword)}`;
            
            try {
              const altRes = await fetch(altUrl);
              const altData = await altRes.json();
              console.log('📺 [TVSHOW DEBUG] Alternative search result:', { 
                status: altData.status, 
                itemsCount: altData.data?.items?.length || 0 
              });
              
              if (altData.status === 'success' && altData.data?.items?.length > 0) {
                const altItem = altData.data.items[0];
                console.log('📺 [TVSHOW DEBUG] Alternative item found:', altItem.name);
                
                // Kiểm tra lại với phim mới
                const altDetailRes = await fetch(`https://phimapi.com/phim/${altItem.slug}`);
                const altDetailData = await altDetailRes.json();
                
                if (altDetailData.episodes && Array.isArray(altDetailData.episodes)) {
                  const altTargetEpisode = altDetailData.episodes.find((ep: { episode_number: number; name?: string }) => 
                    ep.episode_number === selectedEpisode || 
                    ep.name?.toLowerCase().includes(`tập ${selectedEpisode}`) ||
                    ep.name?.toLowerCase().includes(`episode ${selectedEpisode}`)
                  );
                  
                  if (altTargetEpisode) {
                    console.log('📺 [TVSHOW DEBUG] Alternative episode found:', altTargetEpisode.name);
                    slug = altItem.slug;
                    finalDetailData = altDetailData;
                    hasSeasonEpisodes = true;
                    break;
                  }
                }
              }
            } catch (error) {
              console.log('📺 [TVSHOW DEBUG] Alternative search error:', error);
            }
          }
        }
        
        // Tìm episode chính xác dựa trên selectedEpisode
        let vietsubLink = '';
        let dubbedLink = '';
        let defaultEmbed = '';
        
        if (finalDetailData.episodes && Array.isArray(finalDetailData.episodes)) {
          console.log('📺 [TVSHOW DEBUG] Processing episodes for audio links...');
          
          for (const episode of finalDetailData.episodes) {
            console.log('📺 [TVSHOW DEBUG] Processing episode:', episode.server_name);
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
              console.log('📺 [TVSHOW DEBUG] Target episode found:', targetEpisode.name);
              
              // Phân loại theo server_name
              if (episode.server_name?.toLowerCase().includes('vietsub')) {
                vietsubLink = targetEpisode.link_m3u8 || targetEpisode.link_embed?.split('?url=')[1] || '';
                console.log('📺 [TVSHOW DEBUG] Vietsub link set:', vietsubLink);
              } else if (episode.server_name?.toLowerCase().includes('thuyết minh') ||
                         episode.server_name?.toLowerCase().includes('lồng tiếng') || 
                         episode.server_name?.toLowerCase().includes('dubbed')) {
                dubbedLink = targetEpisode.link_m3u8 || targetEpisode.link_embed?.split('?url=')[1] || '';
                console.log('📺 [TVSHOW DEBUG] Dubbed link set:', dubbedLink);
              }
            }
          }
          
          // Fallback: lấy episode đầu tiên nếu không tìm thấy episode cụ thể
          if (!vietsubLink && !dubbedLink) {
            console.log('📺 [TVSHOW DEBUG] No specific episode found, using first episode as fallback');
            const firstEpisode = finalDetailData.episodes[0]?.server_data?.[0];
            if (firstEpisode) {
              defaultEmbed = firstEpisode.link_m3u8 || firstEpisode.link_embed?.split('?url=')[1] || '';
              console.log('📺 [TVSHOW DEBUG] Fallback link set:', defaultEmbed);
            }
          }
        }
        
        // Fallback: sử dụng link_embed gốc nếu có
        if (!vietsubLink && !dubbedLink && !defaultEmbed && finalDetailData.link_embed) {
          defaultEmbed = finalDetailData.link_embed.includes('?url=') 
            ? finalDetailData.link_embed.split('?url=')[1] 
            : finalDetailData.link_embed;
          console.log('📺 [TVSHOW DEBUG] Using original link_embed:', defaultEmbed);
        }
        
        console.log('📺 [TVSHOW DEBUG] Final links:', { vietsubLink, dubbedLink, defaultEmbed });
        
        // Lưu episodes data để tái sử dụng khi đổi episode
        setEpisodesData(finalDetailData.episodes);
        
        // Cập nhật tvShowLinks với tất cả audio options
        const updatedLinks = {
          ...tvShowLinks,
          m3u8: defaultEmbed,
          vietsub: vietsubLink,
          dubbed: dubbedLink,
          seasonChanged: false, 
          currentSeason: selectedSeason 
        };
        
        setTVShowLinks(updatedLinks);
        setDataReady(true);
        console.log('📺 [TVSHOW DEBUG] Links updated successfully');
        
      } catch (error) {
        console.log('📺 [TVSHOW DEBUG] Error occurred:', error);
      } finally {
        clearTimeout(timeoutId);
        setTVShowLinksLoading(false);
        setApiSearchCompleted(true);
        console.log('📺 [TVSHOW DEBUG] Search process completed');
      }
    }
    fetchPhimApiEmbed();
  }, [id, tvShow?.name, tvShow?.year, tvShowLinks, selectedSeason, selectedEpisode]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
      <h2 className="text-3xl font-bold mb-6">Watch Now</h2>
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <div className="flex flex-col gap-2">
          <button
            className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-colors ${selectedServer === 'server1' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            onClick={() => handleServerChange('server1')}
          >
            Server 1 
          </button>
          {selectedServer === 'server1' && (
            (tvShowLinks.vietsub || tvShowLinks.dubbed) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-300">Audio:</span>
                {tvShowLinks.vietsub && (
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${selectedAudio === 'vietsub' ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                    onClick={() => setSelectedAudio('vietsub')}
                  >
                    Vietsub
                  </button>
                )}
                {tvShowLinks.dubbed && (
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${selectedAudio === 'dubbed' ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                    onClick={() => setSelectedAudio('dubbed')}
                  >
                    Dubbed
                  </button>
                )}
              </div>
            )
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-colors ${selectedServer === 'server2' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            onClick={() => handleServerChange('server2')}
          >
            Server 2 
          </button>
          {selectedServer === 'server2' && (
            <span className="text-xs text-yellow-300 bg-yellow-900/40 px-2 py-1 rounded w-max">
              This server may contain ads.
            </span>
          )}
        </div>
      </div>

      {/* Header ngoài player, co giãn theo khung hình */}
      {selectedEpisode > 0 && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-white text-xs sm:text-sm md:text-base font-semibold truncate" title={`${tvShow.name} - S${selectedSeason} E${selectedEpisode}`}>
              {tvShow.name} - Season {selectedSeason} Episode {selectedEpisode}
            </h3>
            {selectedServer === 'server1' && (tvShowLinks.vietsub || tvShowLinks.dubbed) && (
              <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white whitespace-nowrap">
                {selectedAudio === 'vietsub' ? 'Vietsub' : 
                 selectedAudio === 'dubbed' ? 'Vietnamese Dubbed' :
                 tvShowLinks.vietsub ? 'Vietsub' : 'Vietnamese Dubbed'}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="relative w-full rounded-lg overflow-hidden bg-black/50 aspect-video">
        {selectedEpisode === 0 ? (
          <div className="flex items-center justify-center h-full text-white">
            <div className="flex flex-col items-center gap-4">
              <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z" />
              </svg>
              <p className="text-lg font-semibold">Please select an episode first</p>
              <p className="text-sm text-gray-400">Choose from the episodes below to start watching</p>
            </div>
          </div>
        ) : selectedServer === 'server1' ? (
          (() => {
            if (!apiSearchCompleted || tvShowLinksLoading || !dataReady) {
              return (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="flex flex-col items-center gap-4">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"
                    />
                    <p className="text-sm text-gray-400">Please wait a moment</p>
                  </div>
                </div>
              );
            }

            const hasVideoSource = tvShowLinks.vietsub || tvShowLinks.dubbed || tvShowLinks.m3u8;
            if (apiSearchCompleted && !tvShowLinksLoading && dataReady && !hasVideoSource) {
              return (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="flex flex-col items-center gap-4">
                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-semibold">No video source available</p>
                    <p className="text-sm text-gray-400">Please try another server</p>
                  </div>
                </div>
              );
            }

            let videoSrc = '';
            let effectiveAudio: 'vietsub' | 'dubbed' | null = null;
            if (selectedAudio === 'vietsub' && tvShowLinks.vietsub) {
              videoSrc = tvShowLinks.vietsub;
              effectiveAudio = 'vietsub';
            } else if (selectedAudio === 'dubbed' && tvShowLinks.dubbed) {
              videoSrc = tvShowLinks.dubbed;
              effectiveAudio = 'dubbed';
            } else if (tvShowLinks.vietsub) {
              videoSrc = tvShowLinks.vietsub;
              effectiveAudio = 'vietsub';
            } else if (tvShowLinks.dubbed) {
              videoSrc = tvShowLinks.dubbed;
              effectiveAudio = 'dubbed';
            } else {
              videoSrc = tvShowLinks.m3u8;
              effectiveAudio = null;
            }

            return videoSrc ? (
              <EnhancedMoviePlayer
                key={`${selectedSeason}-${selectedEpisode}-${videoSrc}`}
                src={videoSrc}
                poster={tvShow.poster}
                autoPlay={false}
                movieId={tvShow.id}
                server={selectedServer}
                audio={effectiveAudio || undefined}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white text-lg font-semibold">
                No video source available
              </div>
            );
          })()
        ) : selectedServer === 'server2' && server2Link ? (
          <iframe
            src={server2Link}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={`${tvShow.name} - Season ${selectedSeason} Episode ${selectedEpisode} - Server 2`}
            referrerPolicy="origin"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <div className="flex flex-col items-center gap-4">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"
              />
              <p className="text-sm text-gray-400">Loading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
