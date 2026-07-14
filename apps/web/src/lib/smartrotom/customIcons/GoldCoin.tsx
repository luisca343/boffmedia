import type { SVGProps } from "react"

export interface GoldCoinProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  size?: number
}

// The arcade's currency — the one glyph with its own palette: a radial gold
// gradient + star, so it stays gold on any surface instead of inheriting
// currentColor. The gradient id is a fixed string on purpose — every instance
// defines an identical gradient, so duplicate ids all resolve to the same paint.
export function GoldCoin({ size = 18, ...p }: GoldCoinProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false" {...p}>
      <defs>
        <radialGradient id="ar-coin-au" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffe9a3" />
          <stop offset="55%" stopColor="#f6c945" />
          <stop offset="100%" stopColor="#c98a1b" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#ar-coin-au)" stroke="#8a5a10" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7.2" fill="none" stroke="#8a5a10" strokeWidth="1" opacity=".55" />
      <path
        d="M12 7.6l1.35 2.74 3.02.44-2.18 2.13.51 3.01L12 14.5l-2.7 1.42.51-3.01-2.18-2.13 3.02-.44L12 7.6Z"
        fill="#8a5a10"
        opacity=".85"
      />
    </svg>
  )
}
