"use client"

/** Shown in place of the 3D canvas until a schematic is loaded. */
export function PreviewEmptyStage({ caption }: { caption: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
      <div
        className="grid place-items-center motion-safe:animate-[bm-bob_5s_ease-in-out_infinite]"
        style={{ filter: "drop-shadow(0 8px 24px color-mix(in srgb, var(--accent) 30%, transparent))" }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <g stroke="var(--accent-bright)" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M60 16 L100 38 L60 60 L20 38 Z" fill="color-mix(in srgb, var(--accent) 30%, transparent)" />
            <path d="M20 38 L60 60 L60 104 L20 82 Z" fill="color-mix(in srgb, var(--accent) 15%, transparent)" />
            <path d="M100 38 L60 60 L60 104 L100 82 Z" fill="color-mix(in srgb, var(--accent) 9%, transparent)" />
          </g>
          <g stroke="color-mix(in srgb, var(--accent-bright) 45%, transparent)" strokeWidth="0.75">
            <path d="M40 27 L80 49 M80 27 L40 49" />
          </g>
        </svg>
      </div>
      <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-txt-dim">{caption}</span>
    </div>
  )
}
