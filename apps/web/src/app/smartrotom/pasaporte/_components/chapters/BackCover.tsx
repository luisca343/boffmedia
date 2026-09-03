// The back board. Leather, and nothing else — the document ends here.

import { useTranslations } from "next-intl"

const LEATHER = {
  background:
    "radial-gradient(140% 100% at 50% 0%, rgba(255,235,190,.06), transparent 55%), linear-gradient(160deg, rgb(var(--ps-leather)), rgb(var(--ps-leather-deep)))",
}

export function BackCover() {
  const t = useTranslations("pasaporte")
  return (
    <div style={LEATHER} className="ps-buckram relative grid h-full w-full place-items-center overflow-hidden">
      <p className="relative z-[2] text-center font-ps-mono text-[0.6875rem] leading-relaxed tracking-[.3em] text-ps-gild/50">
        {t("backCover.property")}
        <br />
        Gobierno de Teras · {new Date().getFullYear()}
      </p>
    </div>
  )
}
