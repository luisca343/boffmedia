"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useArcadeStreak, useArcadeUuid } from "../../_hooks/queries"
import { useCountdown } from "../../_hooks/useCountdown"
import { Button, Icon, Panel, Skeleton, Tag } from "../../_components/ui"
import { AccountCard } from "./AccountCard"

export function CuentaSection() {
  const t = useTranslations("arcade")
  const uuid = useArcadeUuid()
  const streak = useArcadeStreak()
  const resetIn = useCountdown(streak.data?.nextResetTime)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(id)
  }, [copied])

  const copyUuid = async () => {
    if (!uuid) return
    try {
      await navigator.clipboard.writeText(uuid)
      setCopied(true)
    } catch {
      // MCEF and any non-secure context deny the clipboard; failing quietly is
      // better than an error toast over a uuid the player can still select.
    }
  }

  const banner = streak.data?.currentBanner

  return (
    <Panel tone="deep" className="lg:col-span-2">
      <div className="mb-3.5 font-ar-display text-[9px] uppercase leading-relaxed tracking-[0.12em] text-ar-amber">
        {t("ajustes.cuenta.title")}
      </div>

      <div className="grid gap-3.5 md:grid-cols-3">
        <AccountCard kicker={t("ajustes.cuenta.uuid")}>
          <div className="break-all font-ar-mono text-[13px] text-ar-ink">{uuid ?? "—"}</div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2.5"
            onClick={copyUuid}
            disabled={!uuid}
            icon={copied ? <Icon.Shield s={12} /> : undefined}
          >
            {copied ? t("ajustes.cuenta.copied") : t("ajustes.cuenta.copy")}
          </Button>
        </AccountCard>

        <AccountCard kicker={t("ajustes.cuenta.bannerActive")}>
          {streak.isLoading ? (
            <Skeleton className="h-5 w-40 rounded-md" />
          ) : (
            <div className="font-ar text-[14px] font-semibold text-ar-ink">{banner ?? "—"}</div>
          )}
          {/* El único plazo que expone la API es el reinicio diario de la racha; el
              banner no lleva fecha de fin, así que no se anuncia ninguna. */}
          {resetIn && (
            <Tag tone="violet" size="md" className="mt-2">
              {t("ajustes.cuenta.resetsIn", { time: resetIn })}
            </Tag>
          )}
        </AccountCard>

        <AccountCard kicker={t("ajustes.cuenta.session")}>
          <div className="font-ar text-[14px] font-semibold text-ar-ink">{t("ajustes.cuenta.connected")}</div>
          <Button
            variant="danger"
            size="sm"
            className="mt-2.5"
            icon={<Icon.X s={12} />}
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            {t("ajustes.cuenta.signOut")}
          </Button>
        </AccountCard>
      </div>
    </Panel>
  )
}
