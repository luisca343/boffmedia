"use client";

import { useEffect, useRef } from "react";

interface TwitchVideoPlayerProps {
  videoId: string;
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
  muted?: boolean;
  time?: string; // Format: "1h2m30s"
  theme?: "light" | "dark";
}

declare global {
  interface Window {
    Twitch: any;
  }
}

export const TwitchVideoPlayer = ({ 
  videoId,
  width = "100%",
  height = 480,
  autoplay = false,
  muted = false,
  time = "0h0m0s",
  theme = "dark"
}: TwitchVideoPlayerProps) => {
  const embedRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Load Twitch embed script if not already loaded
    if (!window.Twitch) {
      const script = document.createElement('script');
      script.src = 'https://embed.twitch.tv/embed/v1.js';
      script.async = true;
      script.onload = initializePlayer;
      document.head.appendChild(script);
    } else {
      initializePlayer();
    }

    return () => {
      // Cleanup player when component unmounts
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.error('Error destroying Twitch video player:', error);
        }
      }
    };
  }, [videoId]);

  const initializePlayer = () => {
    if (!embedRef.current || !window.Twitch) return;

    // Clear any existing embed
    embedRef.current.innerHTML = '';

    try {
      playerRef.current = new window.Twitch.Embed(embedRef.current, {
        width,
        height,
        video: videoId,
        layout: "video", // VODs don't support chat
        autoplay,
        muted,
        time,
        theme,
        // Parent domains for embedding - adjust as needed
        parent: [window.location.hostname]
      });

      // Add event listeners
      playerRef.current.addEventListener(window.Twitch.Embed.VIDEO_READY, () => {
        console.log('Twitch video player is ready');
      });

      playerRef.current.addEventListener(window.Twitch.Embed.VIDEO_PLAY, (data: any) => {
        console.log('Video started playing', data);
      });

    } catch (error) {
      console.error('Error initializing Twitch video player:', error);
    }
  };

  return (
    <div className="w-full">
      <div 
        ref={embedRef}
        className="rounded-lg overflow-hidden shadow-lg bg-black"
        style={{ width: "100%", minHeight: typeof height === 'number' ? `${height}px` : height }}
      />
    </div>
  );
};
