"use client";

interface TwitchClipPlayerProps {
  clipId: string;
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
  muted?: boolean;
}

export const TwitchClipPlayer = ({ 
  clipId,
  width = "100%",
  height = 480,
  autoplay = true,
  muted = false
}: TwitchClipPlayerProps) => {
  // Twitch clip embed URL
  const embedUrl = `https://clips.twitch.tv/embed?clip=${clipId}&parent=${window.location.hostname}&autoplay=${autoplay}&muted=${muted}`;

  return (
    <div className="w-full">
      <iframe 
        src={embedUrl}
        width={width}
        height={height}
        frameBorder="0"
        scrolling="no"
        allowFullScreen
        className="w-full rounded-lg shadow-lg"
        title="Twitch Clip"
      />
    </div>
  );
};
