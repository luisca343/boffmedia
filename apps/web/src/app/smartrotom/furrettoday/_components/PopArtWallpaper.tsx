"use client"

export default function PopArtWallpaper() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        background: "linear-gradient(180deg, var(--ft-paper) 0%, var(--ft-paper-2) 100%)",
      }}
    />
  );
}
