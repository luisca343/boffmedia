import Link from "next/link"
import { Bar, Card, Icon, type IconName } from "../ui"
import { hrefOf } from "../../_utils/nav"
import { TONES, type Tone } from "../../_utils/tones"

const ACTIONS: { label: string; icon: IconName; slug: string; tone: Tone }[] = [
  { label: "Nueva denuncia", icon: "fileText", slug: "denuncias", tone: "seguridad" },
  { label: "Emitir multa", icon: "gavel", slug: "multas", tone: "hacienda" },
  { label: "Abrir mapa", icon: "map", slug: "mapa", tone: "urbanismo" },
  { label: "Ver censo", icon: "users", slug: "censo", tone: "poblacion" },
]

export function QuickActionsCard() {
  return (
    <Card>
      <Bar icon="zap" dep="gold">
        Acciones rápidas
      </Bar>
      <div className="grid grid-cols-2">
        {ACTIONS.map((a, i) => (
          <Link
            key={a.slug}
            href={hrefOf(a.slug)}
            className={`flex items-center gap-[9px] px-[14px] py-[13px] text-[12.5px] font-semibold text-gt-ink-700 transition-colors hover:bg-gt-paper-1 ${
              i % 2 === 0 ? "border-r border-gt-line-soft" : ""
            } ${i < 2 ? "border-b border-gt-line-soft" : ""}`}
          >
            <Icon name={a.icon} size={16} className={TONES[a.tone].text} />
            {a.label}
          </Link>
        ))}
      </div>
    </Card>
  )
}
