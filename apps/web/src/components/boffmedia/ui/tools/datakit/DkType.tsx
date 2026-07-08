import { cn } from "@/lib/utils"

// Canonical Pokémon type colours, English-keyed (matches the calculator kit).
export const TYPE_COLORS: Record<string, string> = {
  Normal: "#9fa19f", Fire: "#e62829", Water: "#2980ef", Electric: "#fac000",
  Grass: "#3fa129", Ice: "#3dcef3", Fighting: "#ff8000", Poison: "#9141cb",
  Ground: "#915121", Flying: "#81b9ef", Psychic: "#ef4179", Bug: "#91a119",
  Rock: "#afa981", Ghost: "#704170", Dragon: "#5060e1", Dark: "#624d4e",
  Steel: "#60a1b8", Fairy: "#ef70ef",
}

export function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? "var(--dim)"
}

/** Pokémon type label in its canonical colour. */
export function DkType({ type, small }: { type: string; small?: boolean }) {
  return (
    <span
      className={cn(
        "cut [--cut:3px] inline-flex items-center font-mono font-bold uppercase tracking-[0.08em] text-white",
        small ? "px-1.5 py-[3px] text-[9px]/none" : "px-2 py-1 text-[10px]/none",
      )}
      style={{ background: typeColor(type), textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
    >
      {type}
    </span>
  )
}
