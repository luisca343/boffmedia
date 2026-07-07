import * as React from "react"

export interface VideoHeroProps {
  /** Background video source (mp4). */
  src?: string
  /** Static frame shown before playback and for reduced-motion users. */
  poster?: string
  /** Scrim opacity 0–1. */
  scrim?: number
  children: React.ReactNode
}

/** Hub hero with a looping background video, broadcast scanlines and a scrim. */
export function VideoHero({ src = "/uploads/looptest.mp4", poster, scrim = 0.7, children }: VideoHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-solid border-line bg-base-2">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {/* motion-reduce: hide the video and fall back to the poster/surface */}
        <video
          className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
        >
          <source src={src} type="video/mp4" />
        </video>
        {poster && (
          <div
            className="absolute inset-0 hidden bg-cover bg-center motion-reduce:block"
            style={{ backgroundImage: `url(${poster})` }}
          />
        )}
      </div>
      {/* broadcast scanlines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] opacity-50 mix-blend-multiply [background:repeating-linear-gradient(to_bottom,transparent_0_3px,rgba(0,0,0,0.22)_3px_4px)]"
      />
      {/* directional scrim */}
      <div
        aria-hidden="true"
        style={{ opacity: scrim }}
        className="pointer-events-none absolute inset-0 z-[1] [background:linear-gradient(97deg,var(--bg)_18%,color-mix(in_srgb,var(--bg)_72%,transparent)_52%,color-mix(in_srgb,var(--bg)_30%,transparent)_100%),linear-gradient(to_top,var(--bg)_3%,transparent_42%)]"
      />
      <div className="wrap relative z-[2] pb-16 pt-[76px]">{children}</div>
    </section>
  )
}
