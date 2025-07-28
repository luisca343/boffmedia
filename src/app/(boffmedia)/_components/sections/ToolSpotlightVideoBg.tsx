"use client";

import { useEffect, useState } from "react";

export function ToolsSpotlightVideoBg() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden w-full h-full left-0 top-0">
        <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-contain object-center"
        >
        <source src="/uploads/looptest.mp4" type="video/mp4" />
        Your browser does not support the video tag.
        </video>
      {/* Overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-900/80 via-surface-900/85 to-surface-900/90"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 to-transparent"></div>
    </div>
  );
}