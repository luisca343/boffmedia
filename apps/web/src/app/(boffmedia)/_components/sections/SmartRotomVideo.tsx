"use client";
import React, { useState } from "react";

export function SmartRotomVideo() {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="relative group flex items-center justify-center w-full transform perspective-1000"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-60 group-hover:opacity-80 transition-opacity duration-300 blur-2xl"
        style={{
          zIndex: 0,
          background: "radial-gradient(circle at 45% 40%, rgba(251,146,60,0.35) 40%, transparent 70%)",
          boxShadow: "0 0 80px 40px rgba(251,146,60,0.18)",
          transform: "perspective(1200px) rotateY(-8deg) rotateX(3deg) rotateZ(2deg)",
        }}
      ></div>

      <video
        autoPlay
        loop
        muted
        playsInline
        className="relative z-10 rounded-2xl transition-all duration-700"
        style={{
          maxWidth: "90%",
          height: "auto",
          filter: "brightness(1.05) contrast(1.1) saturate(1.1)",
          transformStyle: "preserve-3d",
          transform: hover
            ? "perspective(1200px) rotateY(0deg) rotateX(0deg) rotateZ(0deg) scale(1.1)"
            : "perspective(1200px) rotateY(-8deg) rotateX(3deg) rotateZ(2deg)",
        }}
      >
        <source src="/img/rotom_demo3.webm" type="video/webm" />
      </video>

      <div
        className="absolute bottom-0 left-1/2 w-3/4 h-8 bg-gradient-to-b from-orange-500/10 to-transparent rounded-b-2xl blur-lg opacity-30"
        style={{
          transform:
            "translateX(-50%) translateY(100%) perspective(1200px) rotateY(-8deg) rotateX(-3deg) rotateZ(2deg)",
        }}
      ></div>
    </div>
  );
}