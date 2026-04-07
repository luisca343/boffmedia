"use client";

import { useEffect, useRef } from "react";

interface TwitchPlayerProps {
  channel: string;
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
  muted?: boolean;
  layout?: "video-with-chat" | "video";
  theme?: "light" | "dark";
}

declare global {
  interface Window {
    Twitch: any;
  }
}

export const TwitchPlayer = ({ 
  channel,
  width = "100%",
  height = 480,
  autoplay = true,
  muted = false,
  layout = "video-with-chat",
  theme = "dark"
}: TwitchPlayerProps) => {
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
          console.error('Error destroying Twitch player:', error);
        }
      }
    };
  }, [channel]);

  const initializePlayer = () => {
    if (!embedRef.current || !window.Twitch) return;

    // Clear any existing embed
    embedRef.current.innerHTML = '';

    try {
      playerRef.current = new window.Twitch.Embed(embedRef.current, {
        width,
        height,
        channel,
        layout,
        autoplay,
        muted,
        theme,
        // Parent domains for embedding - adjust as needed
        parent: [window.location.hostname]
      });

      // Add event listeners
      playerRef.current.addEventListener(window.Twitch.Embed.VIDEO_READY, () => {
        console.log('Twitch player is ready');
      });

      playerRef.current.addEventListener(window.Twitch.Embed.VIDEO_PLAY, (data: any) => {
        console.log('Video started playing', data);
      });

    } catch (error) {
      console.error('Error initializing Twitch player:', error);
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
