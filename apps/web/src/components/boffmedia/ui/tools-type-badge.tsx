import { cn } from "@/lib/utils"

const TYPE_COLORS: Record<string, string> = {
  Normal: "#9fa19f", Fuego: "#e62829", Agua: "#2980ef", Eléctrico: "#fac000",
  Planta: "#3fa129", Hielo: "#3dcef3", Lucha: "#ff8000", Veneno: "#9141cb",
  Tierra: "#915121", Volador: "#81b9ef", Psíquico: "#ef4179", Bicho: "#91a119",
  Roca: "#afa981", Fantasma: "#704170", Dragón: "#5060e1", Siniestro: "#624d4e",
  Acero: "#60a1b8", Hada: "#ef70ef",
}

interface ToolsTypeBadgeProps {
  type: string
  pct?: number
  className?: string
}

export function ToolsTypeBadge({ type, pct, className }: ToolsTypeBadgeProps) {
  const bg = TYPE_COLORS[type] || "var(--surface-3)"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white",
        className,
      )}
      style={{ background: bg }}
    >
      {type}
      {pct != null && <b className="font-mono ml-0.5">{pct}%</b>}
    </span>
  )
}
