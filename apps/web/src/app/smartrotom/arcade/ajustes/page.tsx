"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useRotomUsername } from "@/components/smartrotom/behavior/useRotomUuid"
import { Icon, Panel, Tag } from "../_components/ui"
import { CabinaSection } from "./_components/CabinaSection"
import { CuentaSection } from "./_components/CuentaSection"

export default function AjustesPage() {
  const t = useTranslations("arcade")
  const username = useRotomUsername() ?? undefined

  return (
    <>
      <Panel tone="deep" tight className="mb-[18px]">
        <div className="flex flex-wrap items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5">
            <Link
              href="/smartrotom/arcade"
              className="ar-lift inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 font-ar text-[11px] font-semibold uppercase tracking-[0.08em] text-ar-ink-dim hover:text-ar-ink"
            >
              <Icon.Chevron s={12} dir="left" />
              {t("ajustes.backToArcade")}
            </Link>
            <h1 className="ar-chrom font-ar-display text-[16px] uppercase leading-none text-ar-ink">
              {t("ajustes.title")}
            </h1>
          </div>
          {/* El handoff ponía un tag de jugador «#4823»: no existe. La identidad real
              es el usuario de SmartRotom de la sesión. */}
          <Tag tone="cyan" size="md">
            SmartRotom{username ? ` · ${username}` : ""}
          </Tag>
        </div>
      </Panel>

      <div className="grid gap-[18px] lg:grid-cols-2">
        <CabinaSection />
        <CuentaSection />
      </div>
    </>
  )
}
