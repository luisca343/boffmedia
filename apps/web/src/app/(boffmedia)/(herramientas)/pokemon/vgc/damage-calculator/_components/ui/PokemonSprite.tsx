import { getSpriteUrl, handleSpriteError } from "../../_lib/spriteUtils"

// Pokémon sprite via the tracker's shared sprite helper (graceful fallback).
export function PokemonSprite({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  return (
    <span
      className={className}
      style={{ width: size, height: size, display: "inline-grid", placeItems: "center", flex: "none" }}
    >
      <img
        src={getSpriteUrl(name)}
        alt={name}
        width={size}
        height={size}
        style={{ imageRendering: "pixelated", objectFit: "contain" }}
        onError={handleSpriteError}
      />
    </span>
  )
}
