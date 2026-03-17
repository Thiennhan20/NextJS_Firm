"use client";

import React, { useCallback, useEffect, useRef, useState, forwardRef } from "react";
import Hls, { Level } from "hls.js";
import { PlayIcon, PauseIcon, ArrowsPointingOutIcon, Cog6ToothIcon } from "@heroicons/react/24/solid";

type AvailableSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

export interface EnhancedMoviePlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  onError?: () => void;
  movieId?: number;
  server?: string;
  audio?: string;
  title?: string;
  season?: number;
  episode?: number;
  isTVShow?: boolean;
  userId?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "00:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  if (hrs > 0) {
    return `${hrs}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

import api from '@/lib/axios';

const EnhancedMoviePlayer = forwardRef<HTMLVideoElement, EnhancedMoviePlayerProps>(
  ({ src, poster, autoPlay = false, onError, movieId, server, audio, title, season, episode, isTVShow = false, userId }, ref) => {
    const innerRef = useRef<HTMLVideoElement>(null);

    const hlsRef = useRef<Hls | null>(null);
    const rafRef = useRef<number | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [isEnded, setIsEnded] = useState<boolean>(false);
    const [bufferedEnd, setBufferedEnd] = useState<number>(0);
    const [speed, setSpeed] = useState<AvailableSpeed>(1);
    const [qualities, setQualities] = useState<Array<{ index: number; label: string }>>([]);
    const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1: auto
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'speed' | 'quality'>('speed');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isBuffering, setIsBuffering] = useState<boolean>(false);
    const [isSeeking, setIsSeeking] = useState<boolean>(false);
    const userSeekingRef = useRef<boolean>(false);
    const [showControls, setShowControls] = useState<boolean>(true);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(1);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [showVolume, setShowVolume] = useState<boolean>(false);
    const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
    const hideVolumeTimer = useRef<NodeJS.Timeout | null>(null);

    // Load saved volume from localStorage on mount
    useEffect(() => {
      const saved = parseFloat(localStorage.getItem('player-volume') || '1');
      const v = (ref && typeof ref === "object" && ref !== null
        ? (ref as React.MutableRefObject<HTMLVideoElement | null>).current
        : innerRef.current) as HTMLVideoElement | null;
      if (v) {
        v.volume = saved;
        setVolume(saved);
      }
    }, [ref]);

    // Update isLoading based on buffering or seeking
    useEffect(() => {
      setIsLoading(isBuffering || isSeeking);
    }, [isBuffering, isSeeking]);

    // Auto-hide controls after 5 seconds when playing
    useEffect(() => {
      if (isPlaying && showControls) {
        // Clear existing timer
        if (hideControlsTimer.current) {
          clearTimeout(hideControlsTimer.current);
        }

        // Set new timer to hide controls after 3 seconds (1.5s in fullscreen)
        const hideDelay = isFullscreen ? 1500 : 3000;
        hideControlsTimer.current = setTimeout(() => {
          setShowControls(false);
        }, hideDelay);
      } else if (!isPlaying) {
        // Show controls when paused
        setShowControls(true);
        if (hideControlsTimer.current) {
          clearTimeout(hideControlsTimer.current);
        }
      }

      return () => {
        if (hideControlsTimer.current) {
          clearTimeout(hideControlsTimer.current);
        }
      };
    }, [isPlaying, showControls, isFullscreen]);

    // Show controls on user interaction
    const handleUserInteraction = useCallback(() => {
      setShowControls(true);

      // Reset timer if video is playing
      if (isPlaying) {
        if (hideControlsTimer.current) {
          clearTimeout(hideControlsTimer.current);
        }
        const hideDelay = isFullscreen ? 1500 : 3000;
        hideControlsTimer.current = setTimeout(() => {
          setShowControls(false);
        }, hideDelay);
      }
    }, [isPlaying, isFullscreen]);

    // Hide controls when mouse leaves player (only on devices with mouse)
    const handleMouseLeave = useCallback(() => {
      if (isPlaying) {
        // Clear existing timer
        if (hideControlsTimer.current) {
          clearTimeout(hideControlsTimer.current);
        }
        // Hide controls immediately
        setShowControls(false);
      }
    }, [isPlaying]);

    // Listen for fullscreen changes
    useEffect(() => {
      const handleFullscreenChange = () => {
        const isCurrentlyFullscreen = !!(document.fullscreenElement ||
          (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
          (document as Document & { mozFullScreenElement?: Element }).mozFullScreenElement ||
          (document as Document & { msFullscreenElement?: Element }).msFullscreenElement);
        setIsFullscreen(isCurrentlyFullscreen);
      };

      // Safari-specific fullscreen change events
      const handleSafariFullscreenChange = () => {
        const video = (ref && typeof ref === "object" && ref !== null
          ? (ref as React.MutableRefObject<HTMLVideoElement | null>).current
          : innerRef.current) as HTMLVideoElement | null;

        if (video) {
          const isCurrentlyFullscreen = !!(document.fullscreenElement ||
            (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
            (document as Document & { mozFullScreenElement?: Element }).mozFullScreenElement ||
            (document as Document & { msFullscreenElement?: Element }).msFullscreenElement);
          setIsFullscreen(isCurrentlyFullscreen);
        }
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);

      // Safari-specific events
      document.addEventListener('webkitbeginfullscreen', handleSafariFullscreenChange);
      document.addEventListener('webkitendfullscreen', handleSafariFullscreenChange);

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        document.removeEventListener('webkitbeginfullscreen', handleSafariFullscreenChange);
        document.removeEventListener('webkitendfullscreen', handleSafariFullscreenChange);
      };
    }, [ref]);

    // Safari-specific fixes
    useEffect(() => {
      const video = (ref && typeof ref === "object" && ref !== null
        ? (ref as React.MutableRefObject<HTMLVideoElement | null>).current
        : innerRef.current) as HTMLVideoElement | null;

      if (!video) return;

      // Safari-specific fixes
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
        /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isSafari) {
        // Prevent Safari from showing native controls
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('x5-playsinline', 'true');
        video.setAttribute('x5-video-player-type', 'h5');
        video.setAttribute('x5-video-player-fullscreen', 'true');

        // Enable fullscreen support for Safari
        video.setAttribute('webkit-allow-fullscreen', 'true');
        video.setAttribute('allowfullscreen', 'true');

        // Disable default video controls on Safari
        video.controls = false;

        // Prevent Safari from showing native fullscreen controls
        const preventDefault = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
        };

        video.addEventListener('webkitbeginfullscreen', preventDefault);
        video.addEventListener('webkitendfullscreen', preventDefault);

        // Additional Safari fixes
        video.style.appearance = 'none';
        video.style.webkitAppearance = 'none';
        video.style.userSelect = 'none';
        video.style.webkitUserSelect = 'none';
        (video.style as CSSStyleDeclaration & {
          webkitTouchCallout?: string;
          webkitTapHighlightColor?: string;
        }).webkitTouchCallout = 'none';
        (video.style as CSSStyleDeclaration & {
          webkitTouchCallout?: string;
          webkitTapHighlightColor?: string;
        }).webkitTapHighlightColor = 'transparent';

        return () => {
          video.removeEventListener('webkitbeginfullscreen', preventDefault);
          video.removeEventListener('webkitendfullscreen', preventDefault);
        };
      }
    }, [ref]);

    // Set fullscreen attributes for all browsers
    useEffect(() => {
      const video = (ref && typeof ref === "object" && ref !== null
        ? (ref as React.MutableRefObject<HTMLVideoElement | null>).current
        : innerRef.current) as HTMLVideoElement | null;

      if (!video) return;

      // Set fullscreen attributes
      video.setAttribute('webkit-allow-fullscreen', 'true');
      video.setAttribute('allowfullscreen', 'true');

      // Additional fullscreen support attributes
      const videoElement = video as HTMLVideoElement & {
        webkitEnterFullscreen?: () => void;
        webkitSetPresentationMode?: (mode: string) => void;
      };

      // Ensure video element has fullscreen capabilities
      if (videoElement.webkitEnterFullscreen || videoElement.webkitSetPresentationMode) {
        video.setAttribute('webkit-allow-fullscreen', 'true');
      }
    }, [ref]);

    // Initialize HLS/media
    useEffect(() => {
      const video = (ref && typeof ref === "object" && ref !== null
        ? (ref as React.MutableRefObject<HTMLVideoElement | null>).current
        : innerRef.current) as HTMLVideoElement | null;
      if (!video) return;

      let hls: Hls | null = null;
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, (_, data: { levels: Level[] }) => {
          const q = data.levels
            .map((lvl, idx) => ({
              index: idx,
              height: lvl.height || 0,
              label: lvl.height ? `${lvl.height}p` : `${Math.round((lvl.bitrate || 0) / 1000)}k`
            }))
            // filter duplicates (some manifests repeat heights)
            .filter((v, i, arr) => v.height && i === arr.findIndex((x) => x.height === v.height))
            // sort by height descending (2160p -> 144p)
            .sort((a, b) => b.height - a.height)
            // remove height property for UI
            .map(({ index, label }) => ({ index, label }));
          setQualities([{ index: -1, label: "Auto" }, ...q]);
          setCurrentQuality(-1);
          if (autoPlay) {
            video.play().catch(() => { });
          }
        });
        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        if (autoPlay) {
          video.play().catch(() => { });
        }
      }
      const onLoadedMetadata = () => setDuration(video.duration || 0);
      const onTimeUpdate = () => {
        if (userSeekingRef.current) return; // Don't override user seek position
        const currentTime = video.currentTime || 0;
        setCurrentTime(currentTime);
        setIsBuffering(false);
      };
      const onProgress = () => {
        if (video.buffered.length > 0) {
          // Find the buffered range that contains the current playback position
          let end = 0;
          for (let i = 0; i < video.buffered.length; i++) {
            if (video.buffered.start(i) <= video.currentTime && video.buffered.end(i) >= video.currentTime) {
              end = video.buffered.end(i);
              break;
            }
            // Also track the furthest buffered end overall
            if (video.buffered.end(i) > end) {
              end = video.buffered.end(i);
            }
          }
          setBufferedEnd(end);
        }
      };

      const onWaiting = () => setIsBuffering(true); // Video is waiting for data (buffering)
      const onCanPlay = () => setIsBuffering(false); // Video can play (buffer ready)
      const onSeeking = () => setIsSeeking(true);
      const onSeeked = () => { setIsSeeking(false); userSeekingRef.current = false; };
      const onPlay = () => {
        setIsPlaying(true);
        setIsEnded(false);
      };
      const onPause = () => {
        setIsPlaying(false);
        setIsBuffering(false); // Reset buffering when paused
        setIsSeeking(false); // Reset seeking when paused
      };
      const onEnded = () => {
        setIsPlaying(false);
        setIsEnded(true);
      };
      const onVolume = () => {
        // setVolume(video.volume); // Removed
        // setIsMuted(video.muted); // Removed
      };
      video.addEventListener("loadedmetadata", onLoadedMetadata);
      video.addEventListener("timeupdate", onTimeUpdate);
      video.addEventListener("progress", onProgress);
      video.addEventListener("play", onPlay);
      video.addEventListener("pause", onPause);
      video.addEventListener("ended", onEnded);
      video.addEventListener("volumechange", onVolume);
      video.addEventListener("waiting", onWaiting);
      video.addEventListener("canplay", onCanPlay);
      video.addEventListener("seeking", onSeeking);
      video.addEventListener("seeked", onSeeked);
      // setVolume(video.volume); // Removed
      // setIsMuted(video.muted); // Removed

      // RAF for smoother progress on some browsers
      const loop = () => {
        if (!userSeekingRef.current) { setCurrentTime(video.currentTime || 0); }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("timeupdate", onTimeUpdate);
        video.removeEventListener("progress", onProgress);
        video.removeEventListener("play", onPlay);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("ended", onEnded);
        video.removeEventListener("volumechange", onVolume);
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("seeking", onSeeking);
        video.removeEventListener("seeked", onSeeked);
        if (hls) hls.destroy();
        hlsRef.current = null;
      };
    }, [src, autoPlay, ref]);

    // Resume video progress logic (server if logged in, else localStorage)
    useEffect(() => {
      if (!movieId || !server || !audio) return;

      const video = (ref && typeof ref === "object" && ref !== null
        ? (ref as React.MutableRefObject<HTMLVideoElement | null>).current
        : innerRef.current) as HTMLVideoElement | null;
      if (!video) return;

      const applyTime = (t: number) => {
        if (t > 0) {
          if (video.duration > 0) {
            video.currentTime = Math.min(t, video.duration - 1);
          } else {
            const onLoaded = () => {
              if (video.duration > 0) {
                video.currentTime = Math.min(t, video.duration - 1);
              }
              video.removeEventListener('loadedmetadata', onLoaded);
            };
            video.addEventListener('loadedmetadata', onLoaded);
          }
        }
      };

      const load = async () => {
        // Logged in → fetch from server
        if (userId) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const params: any = {
              contentId: String(movieId),
              isTVShow: String(!!isTVShow),
              server,
              audio,
            };
            if (isTVShow && season && episode) {
              params.season = String(season);
              params.episode = String(episode);
            }
            const resp = await api.get('/recently-watched', { params });
            const savedTime = resp.data?.item?.currentTime || 0;
            applyTime(savedTime);
          } catch { }
          return;
        }

        // Guest → read from localStorage
        const key = isTVShow && season && episode
          ? `tvshow-progress-${movieId}-${season}-${episode}-${server}-${audio}`
          : `movie-progress-${movieId}-${server}-${audio}`;
        const saved = localStorage.getItem(key);
        if (!saved) return;
        let savedTime = 0;
        try {
          const progressData = JSON.parse(saved);
          savedTime = progressData.currentTime || 0;
          if (progressData.expiresAt) {
            const expiresAt = new Date(progressData.expiresAt);
            const now = new Date();
            if (now > expiresAt) {
              localStorage.removeItem(key);
              return;
            }
          }
        } catch {
          savedTime = parseFloat(saved) || 0;
        }
        applyTime(savedTime);
      };

      load();
    }, [movieId, server, audio, src, ref, season, episode, isTVShow, userId]);

    // Save progress periodically (every 30s), on pause, and on beforeunload/unmount
    const lastSavedTimeRef = useRef<number>(0);
    const videoProgressRef = useRef<{ currentTime: number; duration: number }>({ currentTime: 0, duration: 0 });

    useEffect(() => {
      if (!movieId || !server || !audio) return;

      const video = (ref && typeof ref === "object" && ref !== null
        ? (ref as React.MutableRefObject<HTMLVideoElement | null>).current
        : innerRef.current) as HTMLVideoElement | null;
      if (!video) return;

      // Keep tracking video progress in ref (lightweight, no API calls)
      const onTimeUpdateTrack = () => {
        videoProgressRef.current = { currentTime: video.currentTime, duration: video.duration };
      };
      video.addEventListener('timeupdate', onTimeUpdateTrack);

      const buildPayload = (ct: number, dur: number) => ({
        contentId: String(movieId),
        isTVShow: !!isTVShow,
        season: isTVShow ? season : null,
        episode: isTVShow ? episode : null,
        server,
        audio,
        currentTime: ct,
        duration: dur,
        title: title || '',
        poster: poster || ''
      });

      const saveToLocalStorage = (ct: number, dur: number) => {
        const key = isTVShow && season && episode
          ? `tvshow-progress-${movieId}-${season}-${episode}-${server}-${audio}`
          : `movie-progress-${movieId}-${server}-${audio}`;
        const progressData = {
          currentTime: ct,
          duration: dur,
          title: title || '',
          poster: poster || '',
          lastWatched: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          ...(isTVShow && season && episode ? { season, episode } : {})
        };
        localStorage.setItem(key, JSON.stringify(progressData));
      };

      const save = (force?: boolean) => {
        const { currentTime: ct, duration: dur } = videoProgressRef.current;
        if (ct > 0 && dur > 0) {
          // Skip if progress hasn't changed by at least 5 seconds (unless forced)
          if (!force && Math.abs(ct - lastSavedTimeRef.current) < 5) return;
          lastSavedTimeRef.current = ct;

          if (userId) {
            api.post('/recently-watched', buildPayload(ct, dur)).catch(() => { });
          } else {
            saveToLocalStorage(ct, dur);
          }
        }
      };

      // Use fetch with keepalive for unmount/beforeunload — guaranteed to complete even during navigation
      // Unlike sendBeacon, fetch supports custom headers so token stays secure in Authorization header
      const saveWithKeepalive = () => {
        const { currentTime: ct, duration: dur } = videoProgressRef.current;
        if (ct > 0 && dur > 0 && Math.abs(ct - lastSavedTimeRef.current) >= 2) {
          lastSavedTimeRef.current = ct;

          if (userId) {
            let fetchBaseURL = process.env.NEXT_PUBLIC_API_URL || '';
            if (typeof window !== 'undefined' &&
              (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
              fetchBaseURL = 'http://localhost:3001/api';
            }
            const token = localStorage.getItem('token');
            fetch(`${fetchBaseURL}/recently-watched`, {
              method: 'POST',
              keepalive: true,
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify(buildPayload(ct, dur))
            }).catch(() => { });
          } else {
            saveToLocalStorage(ct, dur);
          }
        }
      };

      // Save every 30 seconds instead of on every timeupdate (~4x/sec)
      const intervalId = setInterval(() => save(), 30000);

      const onPause = () => save(true);
      const onBeforeUnload = () => saveWithKeepalive();

      video.addEventListener('pause', onPause);
      window.addEventListener('beforeunload', onBeforeUnload);
      return () => {
        saveWithKeepalive(); // Save on unmount (SPA navigation) — keepalive won't be cancelled
        clearInterval(intervalId);
        video.removeEventListener('timeupdate', onTimeUpdateTrack);
        video.removeEventListener('pause', onPause);
        window.removeEventListener('beforeunload', onBeforeUnload);
      };
    }, [movieId, server, audio, src, ref, title, poster, season, episode, isTVShow, userId]);

    // Handlers
    const togglePlay = useCallback(() => {
      const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
      if (!v) return;
      if (v.paused) v.play().catch(() => { });
      else v.pause();
    }, [ref]);

    const handleReplay = useCallback(() => {
      const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
      if (!v) return;
      v.currentTime = 0;
      setIsEnded(false);
      v.play().catch(() => { });
    }, [ref]);

    const changeSpeed = useCallback((s: AvailableSpeed) => {
      const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
      if (!v) return;
      v.playbackRate = s;
      setSpeed(s);
    }, [ref]);

    const requestPiP = useCallback(() => {
      const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
      if (!v) return;
      const videoElement = v as HTMLVideoElement & {
        disablePictureInPicture?: boolean;
        requestPictureInPicture?: () => Promise<void>;
        webkitSetPresentationMode?: (mode: string) => void;
      };
      if (document.pictureInPictureEnabled && !videoElement.disablePictureInPicture) {
        videoElement.requestPictureInPicture?.();
      } else {
        videoElement.webkitSetPresentationMode?.("picture-in-picture");
      }
    }, [ref]);

    const toggleFullscreen = useCallback(() => {
      const container = innerContainerRef.current;
      if (!container) return;

      // Check if we're on Safari/iOS
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
        /iPad|iPhone|iPod/.test(navigator.userAgent);

      // Check current fullscreen state
      const isCurrentlyFullscreen = !!(document.fullscreenElement ||
        (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
        (document as Document & { mozFullScreenElement?: Element }).mozFullScreenElement ||
        (document as Document & { msFullscreenElement?: Element }).msFullscreenElement);

      if (isCurrentlyFullscreen) {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
          (document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen?.();
        } else if ((document as Document & { mozCancelFullScreen?: () => void }).mozCancelFullScreen) {
          (document as Document & { mozCancelFullScreen?: () => void }).mozCancelFullScreen?.();
        } else if ((document as Document & { msExitFullscreen?: () => void }).msExitFullscreen) {
          (document as Document & { msExitFullscreen?: () => void }).msExitFullscreen?.();
        }
      } else {
        // Enter fullscreen
        const element = container as HTMLElement & {
          webkitRequestFullscreen?: () => void;
          mozRequestFullScreen?: () => void;
          msRequestFullscreen?: () => void;
        };

        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen();
        } else if (isSafari) {
          // Safari-specific fallback - try to use video element directly
          const video = (ref && typeof ref === "object" && ref !== null
            ? (ref as React.MutableRefObject<HTMLVideoElement | null>).current
            : innerRef.current) as HTMLVideoElement | null;

          if (video) {
            const videoElement = video as HTMLVideoElement & {
              webkitEnterFullscreen?: () => void;
              webkitSetPresentationMode?: (mode: string) => void;
            };

            if (videoElement.webkitEnterFullscreen) {
              videoElement.webkitEnterFullscreen();
            } else if (videoElement.webkitSetPresentationMode) {
              videoElement.webkitSetPresentationMode('fullscreen');
            }
          }
        }
      }
    }, [ref]);

    const changeQuality = useCallback((level: number) => {
      const hls = hlsRef.current;
      if (!hls) return;
      hls.currentLevel = level; // -1 auto
      setCurrentQuality(level);
    }, []);

    const toggleMute = useCallback(() => {
      const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
      if (!v) return;
      v.muted = !v.muted;
      setIsMuted(v.muted);
      if (v.muted) {
        setVolume(0);
      } else {
        const saved = parseFloat(localStorage.getItem('player-volume') || '1');
        v.volume = saved > 0 ? saved : 1;
        setVolume(v.volume);
      }
    }, [ref]);

    const changeVolume = useCallback((newVol: number) => {
      const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
      if (!v) return;
      const clamped = Math.max(0, Math.min(1, newVol));
      v.volume = clamped;
      v.muted = clamped === 0;
      setVolume(clamped);
      setIsMuted(clamped === 0);
      if (clamped > 0) localStorage.setItem('player-volume', String(clamped));
    }, [ref]);

    const toggleSettings = useCallback(() => {
      setShowSettings(prev => !prev);
    }, []);

    const switchToSpeed = useCallback(() => {
      setActiveTab('speed');
    }, []);

    const switchToQuality = useCallback(() => {
      setActiveTab('quality');
    }, []);

    const innerContainerRef = useRef<HTMLDivElement>(null);

    // Keyboard shortcuts
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (!innerContainerRef.current) return;
        const target = e.target as HTMLElement;
        const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
        if (isTyping) return;
        switch (e.key.toLowerCase()) {
          case " ":
          case "k":
            e.preventDefault();
            togglePlay();
            break;
          case "arrowright":
            {
              const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
              if (v) v.currentTime = Math.min(v.currentTime + 10, v.duration || v.currentTime + 10);
            }
            break;
          case "arrowleft":
            {
              const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
              if (v) v.currentTime = Math.max(v.currentTime - 10, 0);
            }
            break;
          case "f":
            toggleFullscreen();
            break;
          case "m":
            toggleMute();
            break;
          case "escape":
            setShowSettings(false);
            break;
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [togglePlay, toggleFullscreen, toggleMute, ref]);

    // Thêm các ref cho speed và quality
    const speedRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const qualityRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Scroll tới item đang chọn khi showSettings hoặc đổi tab
    useEffect(() => {
      if (!showSettings) return;
      setTimeout(() => {
        if (activeTab === 'speed') {
          const idx = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].findIndex((s) => s === speed);
          if (speedRefs.current[idx]) {
            speedRefs.current[idx]?.scrollIntoView({ block: 'nearest' });
          }
        } else if (activeTab === 'quality') {
          const idx = qualities.findIndex((q) => q.index === currentQuality);
          if (qualityRefs.current[idx]) {
            qualityRefs.current[idx]?.scrollIntoView({ block: 'nearest' });
          }
        }
      }, 0);
    }, [showSettings, activeTab, speed, currentQuality, qualities]);

    return (
      <div
        ref={innerContainerRef}
        className={`relative w-full h-full bg-black transition-all duration-300 ${showControls ? 'cursor-default' : 'cursor-none'
          }`}
        onMouseMove={handleUserInteraction}
        onMouseEnter={handleUserInteraction}
        onMouseLeave={handleMouseLeave}
        onClick={handleUserInteraction}
        onDoubleClick={toggleFullscreen}
        style={{
          // Prevent Safari from showing native controls
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        {/* Cross-browser volume slider thumb styles */}
        <style>{`
          .volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
            border: none;
            box-shadow: 0 0 2px rgba(0,0,0,0.3);
          }
          .volume-slider::-moz-range-thumb {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
            border: none;
            box-shadow: 0 0 2px rgba(0,0,0,0.3);
          }
          .volume-slider::-moz-range-track {
            background: transparent;
          }
        `}</style>
        <video
          ref={ref || innerRef}
          controls={false}
          poster={poster}
          className="w-full h-full bg-black"
          onError={onError}
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          x5-video-player-type="h5"
          x5-video-player-fullscreen="true"
          preload="metadata"
          disablePictureInPicture={false}
          controlsList="nodownload nofullscreen noremoteplayback"
          style={{
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent',
            // Prevent Safari native controls
            WebkitAppearance: 'none',
            WebkitOverflowScrolling: 'touch',
            // Additional Safari fixes
            objectFit: 'contain',
            backgroundColor: '#000'
          }}
        />

        {/* Start Streaming Button - Top Right Corner */}
        {src && (
          <div className={`absolute top-3 right-3 sm:top-4 sm:right-4 transition-all duration-500 ease-in-out ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            }`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Navigate to streaming lobby with video info
                console.log('Start Streaming clicked', { movieId, season, episode, isTVShow, title });
              }}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/50 hover:scale-105"
              aria-label="Start Streaming Room"
              title="Start Streaming Room"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Stream</span>
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/50 text-white">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:h-10 border-b-2 border-white"></div>
            </div>
          </div>
        )}

        {/* Center Play/Pause Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!isPlaying ? (
            <div className="pointer-events-auto flex items-center gap-4">
              {!isEnded && (
                <>
                  {/* Tua lùi 10s */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
                      if (v) v.currentTime = Math.max(v.currentTime - 10, 0);
                    }}
                    className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 hover:bg-white/25 text-white transition"
                    aria-label="Rewind 10 seconds"
                    title="Rewind 10 seconds"
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                    </svg>
                  </button>
                </>
              )}

              {/* Play/Replay button */}
              <button
                onClick={isEnded ? handleReplay : togglePlay}
                className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 hover:bg-white/25 text-white transition"
                aria-label={isEnded ? "Replay" : "Play"}
                title={isEnded ? "Replay" : "Play"}
              >
                {isEnded ? (
                  <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                )}
              </button>

              {!isEnded && (
                <>
                  {/* Tua tới 10s */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
                      if (v) v.currentTime = Math.min(v.currentTime + 10, v.duration || v.currentTime + 10);
                    }}
                    className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 hover:bg-white/25 text-white transition"
                    aria-label="Forward 10 seconds"
                    title="Forward 10 seconds"
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.934 12.8a1 1 0 000-1.6L6.6 7.2a1 1 0 00-1.6.8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6L14.6 7.2a1 1 0 00-1.6.8v8a1 1 0 001.6.8l5.334-4z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="pointer-events-auto flex items-center gap-4">
              {/* Tua lùi 10s */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
                  if (v) v.currentTime = Math.max(v.currentTime - 10, 0);
                }}
                className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent hover:bg-white/10 text-white transition ${showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                  }`}
                aria-label="Rewind 10 seconds"
                title="Rewind 10 seconds"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>

              {/* Pause button */}
              <button
                onClick={togglePlay}
                className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-transparent hover:bg-white/10 text-white transition ${showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                  }`}
                aria-label="Pause"
                title="Pause"
              >
                <PauseIcon className="w-8 h-8 sm:w-10 sm:h-10" />
              </button>

              {/* Tua tới 10s */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
                  if (v) v.currentTime = Math.min(v.currentTime + 10, v.duration || v.currentTime + 10);
                }}
                className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent hover:bg-white/10 text-white transition ${showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                  }`}
                aria-label="Forward 10 seconds"
                title="Forward 10 seconds"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.934 12.8a1 1 0 000-1.6L6.6 7.2a1 1 0 00-1.6.8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6L14.6 7.2a1 1 0 00-1.6.8v8a1 1 0 001.6.8l5.334-4z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className={`absolute inset-x-0 bottom-0 p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 transition-all duration-500 ease-in-out transform ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}>
          {/* Progress bar with buffer */}
          <div
            className="relative w-full h-5 flex items-center cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const pct = x / rect.width;
              const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
              if (v && duration > 0) { userSeekingRef.current = true; v.currentTime = pct * duration; setCurrentTime(pct * duration); }
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              const bar = e.currentTarget;
              const onMove = (ev: MouseEvent) => {
                const rect = bar.getBoundingClientRect();
                const x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width));
                const pct = x / rect.width;
                const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
                if (v && duration > 0) { userSeekingRef.current = true; v.currentTime = pct * duration; setCurrentTime(pct * duration); }
              };
              const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              const bar = e.currentTarget;
              const onTouchMove = (ev: TouchEvent) => {
                const touch = ev.touches[0];
                const rect = bar.getBoundingClientRect();
                const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
                const pct = x / rect.width;
                const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
                if (v && duration > 0) { userSeekingRef.current = true; v.currentTime = pct * duration; setCurrentTime(pct * duration); }
              };
              const onTouchEnd = () => { document.removeEventListener('touchmove', onTouchMove); document.removeEventListener('touchend', onTouchEnd); };
              document.addEventListener('touchmove', onTouchMove);
              document.addEventListener('touchend', onTouchEnd);
            }}
          >
            {/* Track background */}
            <div className="absolute left-0 right-0 h-1 group-hover:h-1.5 rounded-full bg-white/20 transition-[height]" />
            {/* Buffered bar (light red) */}
            <div
              className="absolute left-0 h-1 group-hover:h-1.5 rounded-full bg-red-500/30 transition-[height]"
              style={{ width: duration > 0 ? `${(bufferedEnd / duration) * 100}%` : '0%' }}
            />
            {/* Played bar (red) */}
            <div
              className="absolute left-0 h-1 group-hover:h-1.5 rounded-full bg-red-500 transition-[height]"
              style={{ width: duration > 0 ? `${(Math.min(currentTime, duration) / duration) * 100}%` : '0%' }}
            />
            {/* Thumb / knob */}
            <div
              className="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-red-500 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
              style={{ left: duration > 0 ? `${(Math.min(currentTime, duration) / duration) * 100}%` : '0%' }}
            />
          </div>

          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={togglePlay}
                className="p-1.5 sm:p-2 rounded bg-white/10 hover:bg-white/20 text-white"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <PauseIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              {/* Volume Button */}
              <div
                className="relative flex items-center"
                onMouseEnter={() => { if (hideVolumeTimer.current) clearTimeout(hideVolumeTimer.current); setShowVolume(true); }}
                onMouseLeave={() => { hideVolumeTimer.current = setTimeout(() => setShowVolume(false), 300); }}
              >
                <button
                  onClick={toggleMute}
                  className="p-1.5 sm:p-2 rounded bg-white/10 hover:bg-white/20 text-white"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  title={isMuted ? "Unmute (M)" : "Mute (M)"}
                >
                  {isMuted || volume === 0 ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728" />
                    </svg>
                  )}
                </button>
                {/* Volume slider - horizontal, appears on hover */}
                <div className={`flex items-center overflow-hidden transition-all duration-200 ${showVolume ? 'w-20 sm:w-24 ml-1 opacity-100' : 'w-0 opacity-0'}`}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="volume-slider w-full h-1.5 cursor-pointer appearance-none rounded-full"
                    style={{
                      background: `linear-gradient(to right, #e0e0e0 0%, #e0e0e0 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`,
                      WebkitAppearance: 'none',
                    }}
                    aria-label="Volume"
                  />
                </div>
              </div>

              <span className="text-[10px] sm:text-xs text-gray-200 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">

              {/* Settings Button */}
              <div className="relative">
                <button
                  onClick={toggleSettings}
                  className="p-1.5 sm:p-2 rounded bg-white/10 hover:bg-white/20 text-white"
                  aria-label="Settings"
                  title="Settings"
                >
                  <Cog6ToothIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Settings Dropdown */}
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[120px] max-h-[200px] border border-white/20">
                    {/* Tab Buttons */}
                    <div className="flex mb-2 border-b border-white/20">
                      <button
                        onClick={switchToSpeed}
                        className={`flex-1 px-2 py-1 text-[10px] sm:text-xs rounded-t transition-colors ${activeTab === 'speed' ? 'text-blue-400 bg-blue-400/20' : 'text-gray-300 hover:text-white'
                          }`}
                      >
                        Speed
                      </button>
                      {qualities.length > 0 && (
                        <button
                          onClick={switchToQuality}
                          className={`flex-1 px-2 py-1 text-[10px] sm:text-xs rounded-t transition-colors ${activeTab === 'quality' ? 'text-blue-400 bg-blue-400/20' : 'text-gray-300 hover:text-white'
                            }`}
                        >
                          Quality
                        </button>
                      )}
                    </div>

                    {/* Speed Options */}
                    {activeTab === 'speed' && (
                      <div className="space-y-1 max-h-[56px] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s, idx) => (
                          <button
                            key={s}
                            ref={el => { speedRefs.current[idx] = el; }}
                            onClick={() => {
                              changeSpeed(s as AvailableSpeed);
                              setShowSettings(false);
                            }}
                            className={`w-full text-left px-2 py-1 text-[10px] sm:text-xs rounded hover:bg-white/10 transition-colors ${speed === s ? 'text-blue-400 bg-blue-400/20' : 'text-white'
                              }`}
                          >
                            {s === 1 ? 'Normal' : `${s}x`}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quality Options */}
                    {activeTab === 'quality' && qualities.length > 0 && (
                      <div className="space-y-1 max-h-[56px] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {qualities.map((q, idx) => (
                          <button
                            key={q.label}
                            ref={el => { qualityRefs.current[idx] = el; }}
                            onClick={() => {
                              changeQuality(q.index);
                              setShowSettings(false);
                            }}
                            className={`w-full text-left px-2 py-1 text-[10px] sm:text-xs rounded hover:bg-white/10 transition-colors ${currentQuality === q.index ? 'text-blue-400 bg-blue-400/20' : 'text-white'
                              }`}
                          >
                            {q.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PiP */}
              <button
                onClick={requestPiP}
                className="p-1.5 sm:p-2 rounded bg-white/10 hover:bg-white/20 text-white hidden sm:inline-flex"
                aria-label="Picture in Picture"
                title="Picture in Picture"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6h-8a2 2 0 0 0-2 2v6H5a2 2 0 0 1-2-2V5z" opacity=".35" />
                  <rect x="12" y="11" width="9" height="7" rx="1.5" />
                </svg>
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 sm:p-2 rounded bg-white/10 hover:bg-white/20 text-white"
                aria-label="Fullscreen"
                title="Fullscreen"
              >
                <ArrowsPointingOutIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

EnhancedMoviePlayer.displayName = "EnhancedMoviePlayer";

export default EnhancedMoviePlayer;