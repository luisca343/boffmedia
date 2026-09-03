import Link from "next/link"
import { useTranslations } from "next-intl"
import { Bar, Card, Icon, type IconName } from "../ui"
import { hrefOf } from "../../_utils/nav"
import { TONES, type Tone } from "../../_utils/tones"

export function QuickActionsCard() {
  const t = useTranslations("gobierno")
  const ACTIONS: { label: string; icon: IconName; slug: string; tone: Tone }[] = [
    { label: t("quickActions.nuevaDenuncia"), icon: "fileText", slug: "denuncias", tone: "seguridad" },
    { label: t("quickActions.emitirMulta"), icon: "gavel", slug: "multas", tone: "hacienda" },
    { label: t("quickActions.abrirMapa"), icon: "map", slug: "mapa", tone: "urbanismo" },
    { label: t("quickActions.verCenso"), icon: "users", slug: "censo", tone: "poblacion" },
  ]

  return (
    <Card>
      <Bar icon="zap" dep="gold">
        {t("quickActions.title")}
      </Bar>
      <div className="grid grid-cols-2">
        {ACTIONS.map((a, i) => (
          <Link
            key={a.slug}
            href={hrefOf(a.slug)}
            className={`flex items-center gap-[0.5625rem] px-[0.875rem] py-[0.8125rem] text-[0.78125rem] font-semibold text-gt-ink-700 transition-colors hover:bg-gt-paper-1 ${
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
