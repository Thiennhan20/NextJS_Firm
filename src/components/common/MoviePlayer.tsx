import React, { useEffect, useRef, forwardRef } from 'react';
import Hls from 'hls.js';

interface MoviePlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  onError?: () => void;
}

const MoviePlayer = forwardRef<HTMLVideoElement, MoviePlayerProps>(
  ({ src, poster, autoPlay = true, onError }, ref) => {
    const innerRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
      const video = (ref && typeof ref === 'object' && ref !== null ? (ref as React.MutableRefObject<HTMLVideoElement | null>).current : innerRef.current) || innerRef.current;
      if (!video) return;
      let hls: Hls | null = null;
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
        if (autoPlay) {
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play();
          });
        }
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        if (autoPlay) video.play();
      }
      return () => {
        if (hls) {
          hls.destroy();
        }
      };
    }, [src, autoPlay, ref]);
    return (
      <video
        ref={ref || innerRef}
        controls
        poster={poster}
        style={{ width: '100%', height: '100%', background: '#000' }}
        onError={onError}
      />
    );
  }
);

MoviePlayer.displayName = 'MoviePlayer';

export default MoviePlayer; 