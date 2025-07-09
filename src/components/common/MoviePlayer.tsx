import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface MoviePlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  onError?: () => void;
}

const MoviePlayer: React.FC<MoviePlayerProps> = ({ src, poster, autoPlay = true, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
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
      // Safari native HLS support
      video.src = src;
      if (autoPlay) video.play();
    }
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      controls
      poster={poster}
      style={{ width: '100%', height: '100%', background: '#000' }}
      onError={onError}
    />
  );
};

export default MoviePlayer; 