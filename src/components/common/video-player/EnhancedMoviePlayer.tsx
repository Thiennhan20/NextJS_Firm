"use client";

import React, { useCallback, useEffect, useRef, useState, forwardRef } from "react";
import Hls, { Level } from "hls.js";
import { PlayIcon, PauseIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/solid";
import PlayerSettings from "./PlayerSettings";
import api from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────
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
  /** When true, disables play/pause/seek controls (for watch party viewers) */
  viewerMode?: boolean;
  /** Callback to toggle chat panel visibility (used in streaming room) */
  onToggleChat?: () => void;
  /** When true, shows Chat button instead of Stream button */
  isStreamingRoom?: boolean;
  /** External container ref to use for fullscreen (e.g. player+chat wrapper) */
  fullscreenTarget?: React.RefObject<HTMLDivElement>;
  /** When true in viewerMode, allows play/pause (host has started playing at least once) */
  hostHasPlayed?: boolean;
  /** Number of unread chat messages (shown on chat button badge) */
  chatUnreadCount?: number;
  /** When true, shows loading spinner on play button (viewer waiting for host sync) */
  waitingForHost?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────
const HLS_CONFIG = {
  enableWorker: true,
  maxBufferLength: 30,
  maxMaxBufferLength: 60,
  maxBufferSize: 90 * 1000 * 1000,   // 90MB — handles 1080p high bitrate
  maxBufferHole: 0.5,
  backBufferLength: 10,
  startLevel: -1,
  abrEwmaDefaultEstimate: 1000000,
  abrBandWidthFactor: 0.95,
  abrBandWidthUpFactor: 0.9,
  fragLoadingTimeOut: 15000,          // 15s — faster retry on slow CDN
  fragLoadingMaxRetry: 4,             // 4 retries — worst case ~1 min
  fragLoadingRetryDelay: 1000,
  manifestLoadingTimeOut: 10000,
  manifestLoadingMaxRetry: 3,
  manifestLoadingRetryDelay: 500,
  levelLoadingTimeOut: 10000,
  levelLoadingMaxRetry: 3,
  lowLatencyMode: false,
  testBandwidth: true,
  startFragPrefetch: true,
  progressive: true,
};

// ─── Helpers ──────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "00:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  return hrs > 0 ? `${hrs}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Get the video element from forwarded ref or inner ref */
function getVideo(ref: React.ForwardedRef<HTMLVideoElement>, innerRef: React.RefObject<HTMLVideoElement | null>): HTMLVideoElement | null {
  return (ref && typeof ref === "object" && ref !== null
    ? (ref as React.MutableRefObject<HTMLVideoElement | null>).current
    : innerRef.current) as HTMLVideoElement | null;
}

/** Parse quality levels from HLS manifest */
function parseQualities(levels: Level[]): Array<{ index: number; label: string }> {
  const q = levels
    .map((lvl, idx) => ({
      index: idx,
      height: lvl.height || 0,
      label: lvl.height ? `${lvl.height}p` : `${Math.round((lvl.bitrate || 0) / 1000)}k`
    }))
    .filter((v, i, arr) => v.height && i === arr.findIndex((x) => x.height === v.height))
    .sort((a, b) => b.height - a.height)
    .map(({ index, label }) => ({ index, label }));
  return [{ index: -1, label: "Auto" }, ...q];
}

// ─── Component ────────────────────────────────────────────────────
const EnhancedMoviePlayer = forwardRef<HTMLVideoElement, EnhancedMoviePlayerProps>(
  ({ src, poster, autoPlay = false, onError, movieId, server, audio, title, season, episode, isTVShow = false, userId, viewerMode = false, onToggleChat, isStreamingRoom = false, fullscreenTarget, hostHasPlayed = false, chatUnreadCount = 0, waitingForHost = false }, ref) => {
    const innerRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const innerContainerRef = useRef<HTMLDivElement>(null);

    // ─── State ──────────────────────────────────────────────
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isEnded, setIsEnded] = useState(false);
    const [speed, setSpeed] = useState<AvailableSpeed>(1);
    const [qualities, setQualities] = useState<Array<{ index: number; label: string }>>([]);
    const [currentQuality, setCurrentQuality] = useState(-1);
    const [showSettings, setShowSettings] = useState(false);
    const [activeTab, setActiveTab] = useState<'speed' | 'quality'>('speed');
    const [isBuffering, setIsBuffering] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const userSeekingRef = useRef(false);
    const seekPositionRef = useRef(0);
    // Timeline jump guard: only allow seeks initiated by user interaction
    const allowedSeekRef = useRef(false);
    const lastKnownTimeRef = useRef(0);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showVolume, setShowVolume] = useState(false);
    const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
    const hideVolumeTimer = useRef<NodeJS.Timeout | null>(null);
    const mouseMoveThrottleRef = useRef<NodeJS.Timeout | null>(null);

    // Resume popup
    const [resumePopup, setResumePopup] = useState<{ show: boolean; savedTime: number }>({ show: false, savedTime: 0 });
    const [controlsReady, setControlsReady] = useState(!movieId || !server || !audio);

    // Derived state (no useEffect needed)
    const isLoading = isBuffering || isSeeking;

    // ─── Auto-hide controls ─────────────────────────────────
    useEffect(() => {
      if (isPlaying && showControls) {
        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        const hideDelay = isFullscreen ? 1500 : 3000;
        hideControlsTimer.current = setTimeout(() => setShowControls(false), hideDelay);
      } else if (!isPlaying) {
        setShowControls(true);
        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      }
      return () => { if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current); };
    }, [isPlaying, showControls, isFullscreen]);

    // Show controls on user interaction (throttled for mousemove)
    const handleUserInteraction = useCallback(() => {
      if (mouseMoveThrottleRef.current) return;
      mouseMoveThrottleRef.current = setTimeout(() => { mouseMoveThrottleRef.current = null; }, 50);

      setShowControls(true);
      if (isPlaying) {
        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        const hideDelay = isFullscreen ? 1500 : 3000;
        hideControlsTimer.current = setTimeout(() => setShowControls(false), hideDelay);
      }
    }, [isPlaying, isFullscreen]);

    const handleMouseLeave = useCallback(() => {
      if (isPlaying) {
        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        setShowControls(false);
      }
    }, [isPlaying]);

    // ─── Fullscreen listeners ───────────────────────────────
    useEffect(() => {
      const handleFullscreenChange = () => {
        const fs = !!(document.fullscreenElement ||
          (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
          (document as Document & { mozFullScreenElement?: Element }).mozFullScreenElement ||
          (document as Document & { msFullscreenElement?: Element }).msFullscreenElement);
        setIsFullscreen(fs);
      };
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);
      document.addEventListener('webkitbeginfullscreen', handleFullscreenChange);
      document.addEventListener('webkitendfullscreen', handleFullscreenChange);
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        document.removeEventListener('webkitbeginfullscreen', handleFullscreenChange);
        document.removeEventListener('webkitendfullscreen', handleFullscreenChange);
      };
    }, []);

    // ─── Safari fixes ───────────────────────────────────────
    useEffect(() => {
      const video = getVideo(ref, innerRef);
      if (!video) return;

      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
        /iPad|iPhone|iPod/.test(navigator.userAgent);

      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-allow-fullscreen', 'true');
      video.setAttribute('allowfullscreen', 'true');

      if (isSafari) {
        video.setAttribute('x5-playsinline', 'true');
        video.setAttribute('x5-video-player-type', 'h5');
        video.setAttribute('x5-video-player-fullscreen', 'true');
        video.controls = false;

        const preventDefault = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
        video.addEventListener('webkitbeginfullscreen', preventDefault);
        video.addEventListener('webkitendfullscreen', preventDefault);

        video.style.appearance = 'none';
        video.style.webkitAppearance = 'none';
        video.style.userSelect = 'none';
        video.style.webkitUserSelect = 'none';
        (video.style as CSSStyleDeclaration & { webkitTouchCallout?: string; webkitTapHighlightColor?: string }).webkitTouchCallout = 'none';
        (video.style as CSSStyleDeclaration & { webkitTouchCallout?: string; webkitTapHighlightColor?: string }).webkitTapHighlightColor = 'transparent';

        return () => {
          video.removeEventListener('webkitbeginfullscreen', preventDefault);
          video.removeEventListener('webkitendfullscreen', preventDefault);
        };
      }
    }, [ref]);

    // ─── Initialize HLS ─────────────────────────────────────
    useEffect(() => {
      const video = getVideo(ref, innerRef);
      if (!video) return;

      // Load saved volume
      const savedVol = parseFloat(localStorage.getItem('player-volume') || '1');
      video.volume = savedVol;
      setVolume(savedVol);

      let hls: Hls | null = null;
      if (Hls.isSupported()) {
        hls = new Hls(HLS_CONFIG);
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, (_, data: { levels: Level[] }) => {
          setQualities(parseQualities(data.levels));
          setCurrentQuality(-1);
          if (autoPlay) video.play().catch(() => { });
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR: hls?.startLoad(); break;
              case Hls.ErrorTypes.MEDIA_ERROR: hls?.recoverMediaError(); break;
              default: hls?.destroy(); if (onError) onError(); break;
            }
          }
        });
        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        if (autoPlay) video.play().catch(() => { });
      }

      const onLoadedMetadata = () => setDuration(video.duration || 0);
      const onTimeUpdate = () => {
        if (userSeekingRef.current) return;
        const newTime = video.currentTime || 0;
        const delta = Math.abs(newTime - lastKnownTimeRef.current);

        // Guard: block unexpected jumps > 3s unless user initiated
        if (lastKnownTimeRef.current > 0 && delta > 3 && !allowedSeekRef.current) {
          // Revert to last known position — this was not user-initiated
          video.currentTime = lastKnownTimeRef.current;
          return;
        }

        // Accept the time update
        allowedSeekRef.current = false;
        lastKnownTimeRef.current = newTime;
        setCurrentTime(newTime);
        setIsBuffering(false);
      };
      const onWaiting = () => setIsBuffering(true);
      const onCanPlay = () => setIsBuffering(false);
      const onSeeking = () => setIsSeeking(true);
      const onSeeked = () => { setIsSeeking(false); userSeekingRef.current = false; };
      const onPlay = () => { setIsPlaying(true); setIsEnded(false); };
      const onPause = () => { setIsPlaying(false); setIsBuffering(false); setIsSeeking(false); };
      const onEnded = () => { setIsPlaying(false); setIsEnded(true); };

      video.addEventListener("loadedmetadata", onLoadedMetadata);
      video.addEventListener("timeupdate", onTimeUpdate);
      video.addEventListener("play", onPlay);
      video.addEventListener("pause", onPause);
      video.addEventListener("ended", onEnded);
      video.addEventListener("waiting", onWaiting);
      video.addEventListener("canplay", onCanPlay);
      video.addEventListener("seeking", onSeeking);
      video.addEventListener("seeked", onSeeked);

      return () => {
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("timeupdate", onTimeUpdate);
        video.removeEventListener("play", onPlay);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("ended", onEnded);
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("seeking", onSeeking);
        video.removeEventListener("seeked", onSeeked);
        if (hls) hls.destroy();
        hlsRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src, autoPlay, ref]);

    // ─── Resume: fetch saved time → show popup ──────────────
    useEffect(() => {
      if (!movieId || !server || !audio) return;

      // If video is already playing (e.g. userId changed mid-watch due to login/logout),
      // skip resume check — don't interrupt the current session with a popup
      const video = getVideo(ref, innerRef);
      if (video && !video.paused) {
        setControlsReady(true);
        return;
      }

      let cancelled = false;

      const load = async () => {
        let savedTime = 0;

        if (userId) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const params: any = { contentId: String(movieId), isTVShow: String(!!isTVShow), server, audio };
            if (isTVShow && season && episode) { params.season = String(season); params.episode = String(episode); }
            const resp = await api.get('/recently-watched', { params });
            if (cancelled) return;
            savedTime = resp.data?.item?.currentTime || 0;
          } catch { /* ignore */ }
        } else {
          const key = isTVShow && season && episode
            ? `tvshow-progress-${movieId}-${season}-${episode}-${server}-${audio}`
            : `movie-progress-${movieId}-${server}-${audio}`;
          const saved = localStorage.getItem(key);
          if (saved) {
            try {
              const pd = JSON.parse(saved);
              savedTime = pd.currentTime || 0;
              if (pd.expiresAt && new Date() > new Date(pd.expiresAt)) { localStorage.removeItem(key); savedTime = 0; }
            } catch { savedTime = parseFloat(saved) || 0; }
          }
        }

        if (cancelled) return;

        if (savedTime > 10) {
          setControlsReady(false);
          setResumePopup({ show: true, savedTime });
        } else {
          setControlsReady(true);
        }
      };

      load();
      return () => { cancelled = true; };
    }, [movieId, server, audio, season, episode, isTVShow, userId, ref]);

    // ─── Resume handlers ────────────────────────────────────
    const handleResumeContinue = useCallback(() => {
      const savedTime = resumePopup.savedTime;
      setResumePopup({ show: false, savedTime: 0 });

      const video = getVideo(ref, innerRef);
      if (!video) { setControlsReady(true); return; }

      // Destroy current HLS
      const hls = hlsRef.current;
      if (hls) { hls.destroy(); hlsRef.current = null; }

      if (Hls.isSupported()) {
        const newHls = new Hls(HLS_CONFIG);
        newHls.loadSource(src);
        newHls.attachMedia(video);
        newHls.on(Hls.Events.MANIFEST_PARSED, (_, data: { levels: Level[] }) => {
          // Setup quality list
          setQualities(parseQualities(data.levels));
          setCurrentQuality(-1);

          // Wait for loadedmetadata so video.duration is available for proper clamping
          const doSeek = () => {
            const dur = video.duration;
            allowedSeekRef.current = true; // Mark as user-initiated (resume)
            if (dur && isFinite(dur) && dur > 0) {
              const seekTo = Math.min(savedTime, dur - 1);
              video.currentTime = seekTo;
              lastKnownTimeRef.current = seekTo;
              setCurrentTime(seekTo);
              setDuration(dur);
            } else {
              video.currentTime = savedTime;
              lastKnownTimeRef.current = savedTime;
            }
            setControlsReady(true);
            video.play().catch(() => { });
          };

          // If duration is already available (cached manifest), seek immediately
          if (video.duration && isFinite(video.duration) && video.duration > 0) {
            doSeek();
          } else {
            // Otherwise wait for metadata
            const onMeta = () => {
              video.removeEventListener('loadedmetadata', onMeta);
              doSeek();
            };
            video.addEventListener('loadedmetadata', onMeta);
          }
        });
        newHls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR: newHls.startLoad(); break;
              case Hls.ErrorTypes.MEDIA_ERROR: newHls.recoverMediaError(); break;
              default: newHls.destroy(); setControlsReady(true); break;
            }
          }
        });
        hlsRef.current = newHls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        // For Safari native HLS, wait for loadedmetadata then seek
        const onMetaSafari = () => {
          video.removeEventListener('loadedmetadata', onMetaSafari);
          const dur = video.duration;
          const seekTo = (dur && isFinite(dur) && dur > 0) ? Math.min(savedTime, dur - 1) : savedTime;
          allowedSeekRef.current = true; // Mark as user-initiated (resume Safari)
          video.currentTime = seekTo;
          lastKnownTimeRef.current = seekTo;
          setCurrentTime(seekTo);
          if (dur && isFinite(dur)) setDuration(dur);
          setControlsReady(true);
          video.play().catch(() => { });
        };
        video.addEventListener('loadedmetadata', onMetaSafari);
      } else {
        setControlsReady(true);
      }
    }, [resumePopup.savedTime, src, ref]);

    const handleResumeStartOver = useCallback(() => {
      setResumePopup({ show: false, savedTime: 0 });
      setControlsReady(true);
    }, []);

    // ─── Save progress (5 triggers: interval 10s, pause, seek single, seek debounce, beforeunload) ──
    const lastSavedTimeRef = useRef(0);
    const videoProgressRef = useRef<{ currentTime: number; duration: number }>({ currentTime: 0, duration: 0 });
    const hasEverPlayedRef = useRef(false);
    const seekDebounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (!movieId || !server || !audio) return;
      const video = getVideo(ref, innerRef);
      if (!video) return;

      // When logged in, clear stale localStorage guest data for this movie/show
      if (userId) {
        const movieKey = `movie-progress-${movieId}-${server}-${audio}`;
        const tvKey = isTVShow && season && episode
          ? `tvshow-progress-${movieId}-${season}-${episode}-${server}-${audio}`
          : null;
        localStorage.removeItem(movieKey);
        if (tvKey) localStorage.removeItem(tvKey);
      }

      hasEverPlayedRef.current = false;
      const onPlayMark = () => { hasEverPlayedRef.current = true; };
      video.addEventListener('play', onPlayMark);

      // Track currentTime/duration continuously (including during seek)
      const onTimeUpdateTrack = () => {
        videoProgressRef.current = { currentTime: video.currentTime, duration: video.duration };
      };
      video.addEventListener('timeupdate', onTimeUpdateTrack);

      const buildPayload = (ct: number, dur: number) => ({
        contentId: String(movieId), isTVShow: !!isTVShow,
        season: isTVShow ? season : null, episode: isTVShow ? episode : null,
        server, audio, currentTime: ct, duration: dur,
        title: title || '', poster: poster || ''
      });

      const saveToLocalStorage = (ct: number, dur: number) => {
        const key = isTVShow && season && episode
          ? `tvshow-progress-${movieId}-${season}-${episode}-${server}-${audio}`
          : `movie-progress-${movieId}-${server}-${audio}`;
        localStorage.setItem(key, JSON.stringify({
          currentTime: ct, duration: dur, title: title || '', poster: poster || '',
          lastWatched: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          ...(isTVShow && season && episode ? { season, episode } : {})
        }));
      };

      // ── Core save function ──
      // skipDedup: bypass the 5s dedup check (used for seek saves where position matters)
      const save = (useBeacon = false, skipDedup = false) => {
        if (!hasEverPlayedRef.current) return;
        const { currentTime: ct, duration: dur } = videoProgressRef.current;
        if (ct > 0 && dur > 0) {
          const clampedCt = Math.min(ct, dur);
          if (!skipDedup && Math.abs(clampedCt - lastSavedTimeRef.current) < 5) return;
          lastSavedTimeRef.current = clampedCt;
          if (userId) {
            if (useBeacon && navigator.sendBeacon) {
              let fetchBaseURL = process.env.NEXT_PUBLIC_API_URL || '';
              if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                fetchBaseURL = 'http://localhost:3001/api';
              }
              const blob = new Blob([JSON.stringify(buildPayload(clampedCt, dur))], { type: 'application/json' });
              navigator.sendBeacon(`${fetchBaseURL}/recently-watched`, blob);
            } else {
              api.post('/recently-watched', buildPayload(clampedCt, dur)).catch(() => { });
            }
          } else { saveToLocalStorage(clampedCt, dur); }
        }
      };

      // ── 1) Interval 10s — save while playing ──
      const intervalId = setInterval(() => {
        if (!hasEverPlayedRef.current) return;
        if (video.paused || video.ended) return;
        save();
      }, 10_000);

      // ── 2) Pause — save immediately ──
      const onPauseSave = () => save();
      video.addEventListener('pause', onPauseSave);

      // ── 3+4) Seek — single seek → API ngay, continuous scrub → debounce 0.5s → API ──
      const onSeekedSave = () => {
        if (!hasEverPlayedRef.current) return;

        // Clear any pending debounce
        if (seekDebounceRef.current) clearTimeout(seekDebounceRef.current);

        // Wait 500ms — if no more seeks come in, save
        seekDebounceRef.current = setTimeout(() => {
          // Update progress to latest position after seek settled
          videoProgressRef.current = { currentTime: video.currentTime, duration: video.duration };
          save(false, true); // skipDedup since seek position matters
          seekDebounceRef.current = null;
        }, 500);
      };
      video.addEventListener('seeked', onSeekedSave);

      // ── 5) Đóng tab — sendBeacon (no pause needed, just read currentTime) ──
      const onBeforeUnload = () => {
        // Grab latest position right now
        videoProgressRef.current = { currentTime: video.currentTime, duration: video.duration };
        save(true, true);
      };
      window.addEventListener('beforeunload', onBeforeUnload);

      return () => {
        clearInterval(intervalId);
        if (seekDebounceRef.current) clearTimeout(seekDebounceRef.current);
        // Unmount (Next.js navigation) — save with sendBeacon
        videoProgressRef.current = { currentTime: video.currentTime, duration: video.duration };
        save(true, true);
        video.removeEventListener('play', onPlayMark);
        video.removeEventListener('timeupdate', onTimeUpdateTrack);
        video.removeEventListener('pause', onPauseSave);
        video.removeEventListener('seeked', onSeekedSave);
        window.removeEventListener('beforeunload', onBeforeUnload);
      };
    }, [movieId, server, audio, ref, title, poster, season, episode, isTVShow, userId]);

    // ─── Handlers ───────────────────────────────────────────
    const togglePlay = useCallback(() => {
      const v = getVideo(ref, innerRef);
      if (!v) return;
      if (v.paused) v.play().catch(() => { }); else v.pause();
    }, [ref]);

    const handleReplay = useCallback(() => {
      const v = getVideo(ref, innerRef);
      if (!v) return;
      allowedSeekRef.current = true; v.currentTime = 0; lastKnownTimeRef.current = 0; setIsEnded(false); v.play().catch(() => { });
    }, [ref]);

    const changeSpeed = useCallback((s: AvailableSpeed) => {
      const v = getVideo(ref, innerRef);
      if (!v) return;
      v.playbackRate = s; setSpeed(s); setShowSettings(false);
    }, [ref]);

    const changeQuality = useCallback((level: number) => {
      const hls = hlsRef.current;
      if (!hls) return;
      hls.currentLevel = level; setCurrentQuality(level); setShowSettings(false);
    }, []);

    const requestPiP = useCallback(() => {
      const v = getVideo(ref, innerRef);
      if (!v) return;
      const ve = v as HTMLVideoElement & { disablePictureInPicture?: boolean; requestPictureInPicture?: () => Promise<void>; webkitSetPresentationMode?: (mode: string) => void; };
      if (document.pictureInPictureEnabled && !ve.disablePictureInPicture) { ve.requestPictureInPicture?.(); }
      else { ve.webkitSetPresentationMode?.("picture-in-picture"); }
    }, [ref]);

    const toggleFullscreen = useCallback(() => {
      const container = fullscreenTarget?.current || innerContainerRef.current;
      if (!container) return;

      const isFs = !!(document.fullscreenElement ||
        (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
        (document as Document & { mozFullScreenElement?: Element }).mozFullScreenElement ||
        (document as Document & { msFullscreenElement?: Element }).msFullscreenElement);

      if (isFs) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if ((document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen) (document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen?.();
        else if ((document as Document & { mozCancelFullScreen?: () => void }).mozCancelFullScreen) (document as Document & { mozCancelFullScreen?: () => void }).mozCancelFullScreen?.();
        else if ((document as Document & { msExitFullscreen?: () => void }).msExitFullscreen) (document as Document & { msExitFullscreen?: () => void }).msExitFullscreen?.();
      } else {
        const el = container as HTMLElement & { webkitRequestFullscreen?: () => void; mozRequestFullScreen?: () => void; msRequestFullscreen?: () => void; };
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
        else {
          // Safari fallback
          const video = getVideo(ref, innerRef);
          const ve = video as (HTMLVideoElement & { webkitEnterFullscreen?: () => void; webkitSetPresentationMode?: (mode: string) => void; }) | null;
          if (ve?.webkitEnterFullscreen) ve.webkitEnterFullscreen();
          else if (ve?.webkitSetPresentationMode) ve.webkitSetPresentationMode('fullscreen');
        }
      }
    }, [ref, fullscreenTarget]);

    const toggleMute = useCallback(() => {
      const v = getVideo(ref, innerRef);
      if (!v) return;
      v.muted = !v.muted;
      setIsMuted(v.muted);
      if (v.muted) { setVolume(0); }
      else { const saved = parseFloat(localStorage.getItem('player-volume') || '1'); v.volume = saved > 0 ? saved : 1; setVolume(v.volume); }
    }, [ref]);

    const changeVolume = useCallback((newVol: number) => {
      const v = getVideo(ref, innerRef);
      if (!v) return;
      const clamped = Math.max(0, Math.min(1, newVol));
      v.volume = clamped; v.muted = clamped === 0;
      setVolume(clamped); setIsMuted(clamped === 0);
      if (clamped > 0) localStorage.setItem('player-volume', String(clamped));
    }, [ref]);

    const toggleSettings = useCallback(() => setShowSettings(prev => !prev), []);

    // ─── Keyboard shortcuts ─────────────────────────────────
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (!innerContainerRef.current) return;
        if (!controlsReady) return; // Block keyboard when resume popup is showing
        const target = e.target as HTMLElement;
        if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
        switch (e.key.toLowerCase()) {
          case " ": case "k": e.preventDefault(); togglePlay(); break;
          case "arrowright":
            if (!viewerMode) { allowedSeekRef.current = true; const v = getVideo(ref, innerRef); if (v) { v.currentTime = Math.min(v.currentTime + 10, v.duration || v.currentTime + 10); lastKnownTimeRef.current = v.currentTime; } }
            break;
          case "arrowleft":
            if (!viewerMode) { allowedSeekRef.current = true; const v = getVideo(ref, innerRef); if (v) { v.currentTime = Math.max(v.currentTime - 10, 0); lastKnownTimeRef.current = v.currentTime; } }
            break;
          case "f": toggleFullscreen(); break;
          case "m": toggleMute(); break;
          case "escape": setShowSettings(false); break;
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [togglePlay, toggleFullscreen, toggleMute, ref, viewerMode, controlsReady]);

    // ─── Seek helper (guard duration) ───────────────────────
    const seekTo = useCallback((pct: number) => {
      if (!duration || !isFinite(duration) || duration === 0) return;
      const v = getVideo(ref, innerRef);
      if (!v) return;
      const time = pct * duration;
      allowedSeekRef.current = true;
      userSeekingRef.current = true;
      v.currentTime = time;
      lastKnownTimeRef.current = time;
      setCurrentTime(time);
    }, [duration, ref]);

    // ─── Render ─────────────────────────────────────────────
    return (
      <div
        ref={innerContainerRef}
        className={`relative w-full h-full bg-black transition-all duration-300 ${showControls ? 'cursor-default' : 'cursor-none'}`}
        onMouseMove={handleUserInteraction}
        onTouchStart={handleUserInteraction}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('input') || target.closest('[data-no-toggle]')) return;
          if (viewerMode) return;
          if (!controlsReady) return; // Block click when resume popup is showing
          togglePlay();
        }}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={(node) => {
            (innerRef as React.MutableRefObject<HTMLVideoElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref && typeof ref === "object") (ref as React.MutableRefObject<HTMLVideoElement | null>).current = node;
          }}
          className="w-full h-full object-contain"
          poster={poster}
          playsInline
          preload="auto"
          controls={false}
          disableRemotePlayback
          style={{ WebkitAppearance: 'none', WebkitOverflowScrolling: 'touch', objectFit: 'contain', backgroundColor: '#000' }}
        />

        {/* Chat Button - Only shown in streaming room */}
        {src && controlsReady && isStreamingRoom && (
          <div className={`absolute top-3 right-3 sm:top-4 sm:right-4 transition-all duration-500 ease-in-out ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleChat?.(); }}
              className="relative flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-yellow-500/50 hover:scale-105"
              aria-label="Toggle Chat" title="Toggle Chat"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="hidden sm:inline">Chat</span>
              {chatUnreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-red-500 text-white rounded-full shadow-md animate-bounce">
                  {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && controlsReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/50 text-white">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-white" />
            </div>
          </div>
        )}

        {/* Resume Popup */}
        {resumePopup.show && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70">
            <div className="bg-gray-900/95 border border-gray-700 rounded-2xl px-6 py-5 sm:px-8 sm:py-6 flex flex-col items-center gap-4 shadow-2xl max-w-sm mx-4 backdrop-blur-sm">
              <h3 className="text-white text-base sm:text-lg font-bold tracking-wide">THÔNG BÁO!</h3>
              <p className="text-gray-300 text-sm sm:text-base text-center">
                Bạn đã dừng lại ở{' '}
                <span className="inline-block bg-gray-800 border border-gray-600 text-yellow-400 font-mono font-bold px-2.5 py-0.5 rounded text-sm sm:text-base">
                  {Math.floor(resumePopup.savedTime / 60)} phút {Math.floor(resumePopup.savedTime % 60)} giây
                </span>
              </p>
              <div className="flex gap-3 mt-1">
                <button onClick={handleResumeContinue} className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold text-sm sm:text-base transition-colors shadow-lg hover:shadow-green-500/30">Tiếp tục xem</button>
                <button onClick={handleResumeStartOver} className="px-5 py-2.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-sm sm:text-base transition-colors shadow-lg hover:shadow-yellow-500/30">Xem lại từ đầu</button>
              </div>
            </div>
          </div>
        )}

        {/* Center Play/Pause — hidden during resume popup */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${!controlsReady ? 'hidden' : ''}`}>
          {!isPlaying ? (
            <div className="pointer-events-auto flex items-center gap-4">
              {!isEnded && (
                <>
                  {/* Rewind 10s */}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (viewerMode) return; allowedSeekRef.current = true; const v = getVideo(ref, innerRef); if (v) { v.currentTime = Math.max(v.currentTime - 10, 0); lastKnownTimeRef.current = v.currentTime; } }}
                    className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 hover:bg-white/25 text-white transition ${viewerMode ? 'opacity-40 cursor-not-allowed' : ''}`}
                    aria-label="Rewind 10 seconds" title="Rewind 10 seconds"
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                    </svg>
                  </button>

                  {/* Play */}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (viewerMode && !hostHasPlayed) return; togglePlay(); }}
                    className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 hover:bg-white/25 text-white transition ${viewerMode && !hostHasPlayed ? 'opacity-40 cursor-not-allowed' : ''}`}
                    aria-label={viewerMode && !hostHasPlayed ? 'Waiting for host' : 'Play'}
                    title={viewerMode && !hostHasPlayed ? 'Waiting for host to play' : 'Play'}
                  >
                    {viewerMode && !hostHasPlayed ? (
                      <svg className="w-7 h-7 sm:w-9 sm:h-9 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : waitingForHost ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                    )}
                  </button>

                  {/* Forward 10s */}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (viewerMode) return; allowedSeekRef.current = true; const v = getVideo(ref, innerRef); if (v) { v.currentTime = Math.min(v.currentTime + 10, v.duration || v.currentTime + 10); lastKnownTimeRef.current = v.currentTime; } }}
                    className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 hover:bg-white/25 text-white transition ${viewerMode ? 'opacity-40 cursor-not-allowed' : ''}`}
                    aria-label="Forward 10 seconds" title="Forward 10 seconds"
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.934 12.8a1 1 0 000-1.6L6.6 7.2a1 1 0 00-1.6.8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6L14.6 7.2a1 1 0 00-1.6.8v8a1 1 0 001.6.8l5.334-4z" />
                    </svg>
                  </button>
                </>
              )}
              {isEnded && (
                <button onClick={handleReplay} className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 hover:bg-white/25 text-white transition" aria-label="Replay" title="Replay">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              )}
            </div>
          ) : (
            <div className="pointer-events-auto flex items-center gap-4">
              {/* Rewind 10s */}
              <button
                onClick={(e) => { e.stopPropagation(); if (viewerMode) return; allowedSeekRef.current = true; const v = getVideo(ref, innerRef); if (v) { v.currentTime = Math.max(v.currentTime - 10, 0); lastKnownTimeRef.current = v.currentTime; } }}
                className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent hover:bg-white/10 text-white transition ${showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'} ${viewerMode ? 'opacity-40 cursor-not-allowed' : ''}`}
                aria-label="Rewind 10 seconds" title="Rewind 10 seconds"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>

              {/* Pause */}
              <button
                onClick={togglePlay}
                className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-transparent hover:bg-white/10 text-white transition ${showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
                aria-label="Pause" title="Pause"
              >
                <PauseIcon className="w-8 h-8 sm:w-10 sm:h-10" />
              </button>

              {/* Forward 10s */}
              <button
                onClick={(e) => { e.stopPropagation(); if (viewerMode) return; allowedSeekRef.current = true; const v = getVideo(ref, innerRef); if (v) { v.currentTime = Math.min(v.currentTime + 10, v.duration || v.currentTime + 10); lastKnownTimeRef.current = v.currentTime; } }}
                className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent hover:bg-white/10 text-white transition ${showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'} ${viewerMode ? 'opacity-40 cursor-not-allowed' : ''}`}
                aria-label="Forward 10 seconds" title="Forward 10 seconds"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.934 12.8a1 1 0 000-1.6L6.6 7.2a1 1 0 00-1.6.8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6L14.6 7.2a1 1 0 00-1.6.8v8a1 1 0 001.6.8l5.334-4z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className={`absolute inset-x-0 bottom-0 p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 transition-all duration-500 ease-in-out transform ${!controlsReady ? 'translate-y-full opacity-0 pointer-events-none' : showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
          {/* Progress bar */}
          <div
            className={`relative w-full h-5 flex items-center group ${viewerMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            role="slider"
            aria-valuenow={Math.floor(currentTime)}
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration)}
            aria-label="Video progress"
            onClick={(e) => { e.stopPropagation(); if (viewerMode || !duration || !isFinite(duration)) return; const rect = e.currentTarget.getBoundingClientRect(); seekTo((e.clientX - rect.left) / rect.width); }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (viewerMode || !duration || !isFinite(duration)) return;
              const bar = e.currentTarget;
              userSeekingRef.current = true;
              const onMove = (ev: MouseEvent) => {
                const rect = bar.getBoundingClientRect();
                const x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width));
                const pct = x / rect.width;
                seekPositionRef.current = pct * duration;
                setCurrentTime(pct * duration);
              };
              const onUp = () => {
                const v = getVideo(ref, innerRef);
                if (v && duration > 0) v.currentTime = seekPositionRef.current;
                userSeekingRef.current = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
              };
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              if (viewerMode || !duration || !isFinite(duration)) return;
              const bar = e.currentTarget;
              userSeekingRef.current = true;
              const onTouchMove = (ev: TouchEvent) => {
                ev.preventDefault(); // Prevent page scroll while seeking
                const touch = ev.touches[0];
                const rect = bar.getBoundingClientRect();
                const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
                const pct = x / rect.width;
                seekPositionRef.current = pct * duration;
                setCurrentTime(pct * duration);
              };
              const onTouchEnd = () => {
                const v = getVideo(ref, innerRef);
                if (v && duration > 0) v.currentTime = seekPositionRef.current;
                userSeekingRef.current = false;
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
              };
              document.addEventListener('touchmove', onTouchMove, { passive: false });
              document.addEventListener('touchend', onTouchEnd);
            }}
          >
            <div className="absolute left-0 right-0 h-1 group-hover:h-1.5 rounded-full bg-white/20 transition-[height]" />
            <div className="absolute left-0 h-1 group-hover:h-1.5 rounded-full bg-red-500 transition-[height]" style={{ width: duration > 0 ? `${(Math.min(currentTime, duration) / duration) * 100}%` : '0%' }} />
            <div className="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-red-500 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2" style={{ left: duration > 0 ? `${(Math.min(currentTime, duration) / duration) * 100}%` : '0%' }} />
          </div>

          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button onClick={(e) => { e.stopPropagation(); if (viewerMode && !hostHasPlayed) return; togglePlay(); }} className={`p-1.5 sm:p-2 rounded bg-white/10 hover:bg-white/20 text-white ${viewerMode && !hostHasPlayed ? 'opacity-40 cursor-not-allowed' : ''}`} aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <PauseIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              {/* Volume */}
              <div className="relative flex items-center"
                onMouseEnter={() => { if (hideVolumeTimer.current) clearTimeout(hideVolumeTimer.current); setShowVolume(true); }}
                onMouseLeave={() => { hideVolumeTimer.current = setTimeout(() => setShowVolume(false), 300); }}
              >
                <button onClick={toggleMute} className="p-1.5 sm:p-2 rounded bg-white/10 hover:bg-white/20 text-white" aria-label={isMuted ? "Unmute" : "Mute"} title={isMuted ? "Unmute (M)" : "Mute (M)"}>
                  {isMuted || volume === 0 ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                  ) : volume < 0.5 ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072" /></svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728" /></svg>
                  )}
                </button>
                <div className={`flex items-center overflow-hidden transition-all duration-200 ${showVolume ? 'w-20 sm:w-24 ml-1 opacity-100' : 'w-0 opacity-0'}`}>
                  <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="volume-slider w-full h-1.5 cursor-pointer appearance-none rounded-full" aria-label="Volume"
                    style={{ background: `linear-gradient(to right, #e0e0e0 0%, #e0e0e0 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`, WebkitAppearance: 'none' }} />
                </div>
              </div>

              <span className="text-[10px] sm:text-xs text-gray-200 tabular-nums" aria-live="polite">
                {formatTime(duration > 0 ? Math.min(currentTime, duration) : currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <PlayerSettings
                show={showSettings} activeTab={activeTab} speed={speed}
                qualities={qualities} currentQuality={currentQuality}
                onTabChange={setActiveTab} onSpeedChange={changeSpeed}
                onQualityChange={changeQuality} onToggle={toggleSettings}
                disabled={viewerMode}
              />

              {/* PiP */}
              <button onClick={requestPiP} className="p-1.5 sm:p-2 rounded bg-white/10 hover:bg-white/20 text-white hidden sm:inline-flex" aria-label="Picture in Picture" title="Picture in Picture">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6h-8a2 2 0 0 0-2 2v6H5a2 2 0 0 1-2-2V5z" opacity=".35" /><rect x="12" y="11" width="9" height="7" rx="1.5" /></svg>
              </button>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="p-1.5 sm:p-2 rounded bg-white/10 hover:bg-white/20 text-white" aria-label="Fullscreen" title="Fullscreen">
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