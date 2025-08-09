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

const EnhancedMoviePlayer = forwardRef<HTMLVideoElement, EnhancedMoviePlayerProps>(
  ({ src, poster, autoPlay = false, onError, movieId, server, audio }, ref) => {
    const innerRef = useRef<HTMLVideoElement>(null);

    const hlsRef = useRef<Hls | null>(null);
    const rafRef = useRef<number | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
         const [speed, setSpeed] = useState<AvailableSpeed>(1);
     const [qualities, setQualities] = useState<Array<{ index: number; label: string }>>([]);
     const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1: auto
     const [showSettings, setShowSettings] = useState<boolean>(false);
     const [activeTab, setActiveTab] = useState<'speed' | 'quality'>('speed');
     const [isLoading, setIsLoading] = useState<boolean>(false);
     const [isBuffering, setIsBuffering] = useState<boolean>(false);
     const [isSeeking, setIsSeeking] = useState<boolean>(false);
     const [showControls, setShowControls] = useState<boolean>(true);
     const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
     const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

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

       document.addEventListener('fullscreenchange', handleFullscreenChange);
       document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
       document.addEventListener('mozfullscreenchange', handleFullscreenChange);
       document.addEventListener('MSFullscreenChange', handleFullscreenChange);

       return () => {
         document.removeEventListener('fullscreenchange', handleFullscreenChange);
         document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
         document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
         document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
       };
     }, []);

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
            .map(({index, label}) => ({index, label}));
          setQualities([{ index: -1, label: "Auto" }, ...q]);
          setCurrentQuality(-1);
          if (autoPlay) {
            video.play().catch(() => {});
          }
        });
        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        if (autoPlay) {
          video.play().catch(() => {});
        }
      }
      const onLoadedMetadata = () => setDuration(video.duration || 0);
             const onTimeUpdate = () => {
         const currentTime = video.currentTime || 0;
         setCurrentTime(currentTime);
         setIsBuffering(false); // Video is updating, not buffering
       };
       
       const onWaiting = () => setIsBuffering(true); // Video is waiting for data (buffering)
       const onCanPlay = () => setIsBuffering(false); // Video can play (buffer ready)
       const onSeeking = () => setIsSeeking(true); // User is seeking
       const onSeeked = () => setIsSeeking(false); // Seeking completed
       const onPlay = () => setIsPlaying(true);
       const onPause = () => {
         setIsPlaying(false);
         setIsBuffering(false); // Reset buffering when paused
         setIsSeeking(false); // Reset seeking when paused
       };
      const onVolume = () => {
        // setVolume(video.volume); // Removed
        // setIsMuted(video.muted); // Removed
      };
      video.addEventListener("loadedmetadata", onLoadedMetadata);
      video.addEventListener("timeupdate", onTimeUpdate);
      video.addEventListener("play", onPlay);
      video.addEventListener("pause", onPause);
      video.addEventListener("volumechange", onVolume);
      video.addEventListener("waiting", onWaiting);
      video.addEventListener("canplay", onCanPlay);
      video.addEventListener("seeking", onSeeking);
      video.addEventListener("seeked", onSeeked);
      // setVolume(video.volume); // Removed
      // setIsMuted(video.muted); // Removed

      // RAF for smoother progress on some browsers
      const loop = () => {
        setCurrentTime(video.currentTime || 0);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("timeupdate", onTimeUpdate);
        video.removeEventListener("play", onPlay);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("volumechange", onVolume);
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("seeking", onSeeking);
        video.removeEventListener("seeked", onSeeked);
        if (hls) hls.destroy();
        hlsRef.current = null;
      };
    }, [src, autoPlay, ref]);

    // Resume video progress logic
    useEffect(() => {
      if (!movieId || !server || !audio) return;
      const key = `movie-progress-${movieId}-${server}-${audio}`;
      const video = (ref && typeof ref === "object" && ref !== null
        ? (ref as React.MutableRefObject<HTMLVideoElement | null>).current
        : innerRef.current) as HTMLVideoElement | null;
      if (!video) return;
      const saved = localStorage.getItem(key);
      if (saved) {
        const time = parseFloat(saved);
        if (!isNaN(time) && time > 0 && video.duration > 0) {
          video.currentTime = Math.min(time, video.duration - 1);
        } else if (!isNaN(time) && time > 0) {
          // Nếu duration chưa có, chờ loadedmetadata
          const onLoaded = () => {
            video.currentTime = Math.min(time, video.duration - 1);
            video.removeEventListener('loadedmetadata', onLoaded);
          };
          video.addEventListener('loadedmetadata', onLoaded);
        }
      }
    }, [movieId, server, audio, src, ref]);

    // Save progress on timeupdate, pause, beforeunload
    useEffect(() => {
      if (!movieId || !server || !audio) return;
      const key = `movie-progress-${movieId}-${server}-${audio}`;
      const video = (ref && typeof ref === "object" && ref !== null
        ? (ref as React.MutableRefObject<HTMLVideoElement | null>).current
        : innerRef.current) as HTMLVideoElement | null;
      if (!video) return;
      const save = () => {
        if (video.currentTime > 0 && video.duration > 0) {
          const remainingTime = video.duration - video.currentTime;
          if (remainingTime <= 240) {
            // Nếu còn 240s (4 phút) hoặc ít hơn, xóa progress (reset về 00:00)
            localStorage.removeItem(key);
          } else {
            // Lưu progress bình thường
            localStorage.setItem(key, video.currentTime.toString());
          }
        }
      };
      video.addEventListener('timeupdate', save);
      video.addEventListener('pause', save);
      window.addEventListener('beforeunload', save);
      return () => {
        video.removeEventListener('timeupdate', save);
        video.removeEventListener('pause', save);
        window.removeEventListener('beforeunload', save);
      };
    }, [movieId, server, audio, src, ref]);

    // Handlers
    const togglePlay = useCallback(() => {
      const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
      if (!v) return;
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    }, [ref]);

    const onSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
      if (!v) return;
      const value = Number(e.target.value);
      v.currentTime = value;
      setCurrentTime(value);
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
      const doc = document as Document & { 
        webkitFullscreenElement?: Element; 
        webkitExitFullscreen?: () => void;
      };
      const el = container as HTMLElement & { 
        webkitRequestFullscreen?: () => void;
      };
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        document.exitFullscreen?.();
        doc.webkitExitFullscreen?.();
      } else {
        el.requestFullscreen?.();
        el.webkitRequestFullscreen?.();
      }
    }, []);

         const changeQuality = useCallback((level: number) => {
       const hls = hlsRef.current;
       if (!hls) return;
       hls.currentLevel = level; // -1 auto
       setCurrentQuality(level);
     }, []);

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
                if (v) v.currentTime = Math.min(v.currentTime + 15, v.duration || v.currentTime + 15);
              }
              break;
            case "arrowleft":
              {
                const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
                if (v) v.currentTime = Math.max(v.currentTime - 15, 0);
              }
              break;
            case "f":
              toggleFullscreen();
              break;
            case "escape":
              setShowSettings(false);
              break;
          }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
      }, [togglePlay, toggleFullscreen, ref]);

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
        className={`relative w-full h-full bg-black transition-all duration-300 ${
          showControls ? 'cursor-default' : 'cursor-none'
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
        <video
          ref={ref || innerRef}
          controls={false}
          poster={poster}
          onError={onError}
          playsInline
          webkit-playsinline="true"
          preload="metadata"
        />

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
               {/* Tua lùi 15s */}
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
                   if (v) v.currentTime = Math.max(v.currentTime - 15, 0);
                 }}
                 className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 hover:bg-white/25 text-white transition"
                 aria-label="Rewind 15 seconds"
                 title="Rewind 15 seconds"
               >
                 <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                 </svg>
               </button>
               
               {/* Play button */}
               <button
                 onClick={togglePlay}
                 className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 hover:bg-white/25 text-white transition"
                 aria-label="Play"
                 title="Play"
               >
                 <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10" />
               </button>
               
               {/* Tua tới 15s */}
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
                   if (v) v.currentTime = Math.min(v.currentTime + 15, v.duration || v.currentTime + 15);
                 }}
                 className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 hover:bg-white/25 text-white transition"
                 aria-label="Forward 15 seconds"
                 title="Forward 15 seconds"
               >
                 <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.934 12.8a1 1 0 000-1.6L6.6 7.2a1 1 0 00-1.6.8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6L14.6 7.2a1 1 0 00-1.6.8v8a1 1 0 001.6.8l5.334-4z" />
                 </svg>
               </button>
             </div>
           ) : (
             <div className="pointer-events-auto flex items-center gap-4">
               {/* Tua lùi 15s */}
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
                   if (v) v.currentTime = Math.max(v.currentTime - 15, 0);
                 }}
                 className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent hover:bg-white/10 text-white transition ${
                   showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                 }`}
                 aria-label="Rewind 15 seconds"
                 title="Rewind 15 seconds"
               >
                 <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                 </svg>
               </button>
               
               {/* Pause button */}
               <button
                 onClick={togglePlay}
                 className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-transparent hover:bg-white/10 text-white transition ${
                   showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                 }`}
                 aria-label="Pause"
                 title="Pause"
               >
                 <PauseIcon className="w-8 h-8 sm:w-10 sm:h-10" />
               </button>
               
               {/* Tua tới 15s */}
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   const v = (ref && typeof ref === "object" && ref !== null ? ref.current : innerRef.current) as HTMLVideoElement | null;
                   if (v) v.currentTime = Math.min(v.currentTime + 15, v.duration || v.currentTime + 15);
                 }}
                 className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent hover:bg-white/10 text-white transition ${
                   showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                 }`}
                 aria-label="Forward 15 seconds"
                 title="Forward 15 seconds"
               >
                 <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.934 12.8a1 1 0 000-1.6L6.6 7.2a1 1 0 00-1.6.8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6L14.6 7.2a1 1 0 00-1.6.8v8a1 1 0 001.6.8l5.334-4z" />
                 </svg>
               </button>
             </div>
           )}
         </div>

        {/* Controls bar */}
        <div className={`absolute inset-x-0 bottom-0 p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 transition-all duration-500 ease-in-out transform ${
          showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}>
          {/* Progress */}
          <input
            type="range"
            min={0}
            max={Math.max(duration, 0.1)}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={onSeek}
            className="w-full accent-red-500 sm:accent-red-600 cursor-pointer"
          />

                     <div className="flex items-center justify-between gap-1.5 sm:gap-2">
             <div className="flex items-center gap-1.5 sm:gap-2">
               <button
                 onClick={togglePlay}
                 className="p-1.5 sm:p-2 rounded bg-white/10 hover:bg-white/20 text-white"
                 aria-label={isPlaying ? "Pause" : "Play"}
               >
                 {isPlaying ? <PauseIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
               </button>
               
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
                         className={`flex-1 px-2 py-1 text-[10px] sm:text-xs rounded-t transition-colors ${
                           activeTab === 'speed' ? 'text-blue-400 bg-blue-400/20' : 'text-gray-300 hover:text-white'
                         }`}
                       >
                         Speed
                       </button>
                       {qualities.length > 0 && (
                         <button
                           onClick={switchToQuality}
                           className={`flex-1 px-2 py-1 text-[10px] sm:text-xs rounded-t transition-colors ${
                             activeTab === 'quality' ? 'text-blue-400 bg-blue-400/20' : 'text-gray-300 hover:text-white'
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
                             className={`w-full text-left px-2 py-1 text-[10px] sm:text-xs rounded hover:bg-white/10 transition-colors ${
                               speed === s ? 'text-blue-400 bg-blue-400/20' : 'text-white'
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
                             className={`w-full text-left px-2 py-1 text-[10px] sm:text-xs rounded hover:bg-white/10 transition-colors ${
                               currentQuality === q.index ? 'text-blue-400 bg-blue-400/20' : 'text-white'
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


