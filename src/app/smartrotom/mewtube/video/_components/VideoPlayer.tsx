"use client";

interface VideoPlayerProps {
  videoId: string;
  title: string;
}

export const VideoPlayer = ({ videoId, title }: VideoPlayerProps) => {
  return (
    <div className="aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
      <iframe 
        width="100%" 
        height="100%" 
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        title={title || "YouTube Video"}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full aspect-video"
      ></iframe>
    </div>
  );
};