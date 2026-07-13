"use client"

import { useState } from "react"

// A citizen's Minecraft head, framed like a photo on an identity document.
// Falls back to the initial when the render service has no skin for the name.
export function Avatar({
  user,
  size = 40,
  round = false,
}: {
  user: string | null | undefined
  size?: number
  round?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const name = user || "steve"

  return (
    <div
      className={`flex-none overflow-hidden border border-gt-line-strong bg-gt-paper-3 shadow-gt-sm ${round ? "rounded-full" : "rounded-[4px]"}`}
      style={{ width: size, height: size }}
    >
      {failed ? (
        <div
          className="grid h-full w-full place-items-center font-gt-display font-bold text-gt-ink-400"
          style={{ fontSize: size * 0.42 }}
        >
          {name[0]?.toUpperCase() ?? "?"}
        </div>
      ) : (
        // mc-heads renders on demand from a username, so there is no static asset for
        // next/image to optimise.
        <img
          src={`https://mc-heads.net/avatar/${encodeURIComponent(name)}/${Math.round(size * 2)}`}
          alt={name}
          width={size}
          height={size}
          onError={() => setFailed(true)}
          className="block h-full w-full [image-rendering:pixelated]"
        />
      )}
    </div>
  )
}
