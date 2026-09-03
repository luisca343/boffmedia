"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Icon } from "@boffmedia/ui"
import { AvPanel, AvPill } from "../../../_components/ui/av-kit"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import { EventConfigForm } from "./EventConfigForm"
import { LifecycleActions } from "./LifecycleActions"
import type { RandomizerConfig, RandomizerRom } from "@/services/api/boffmedia/randomizer.types"

const STATUS_TONE: Record<RandomizerConfig["status"], "amber" | "green" | "default" | "accent"> = {
  draft: "amber",
  open: "green",
  closed: "default",
  published: "accent",
}

const STATUS_KEY: Record<RandomizerConfig["status"], string> = {
  draft: "statusDraft",
  open: "statusOpen",
  closed: "statusClosed",
  published: "statusPublished",
}

const ISSUE_KEY: Record<string, string> = {
  "no-pack": "issueNoPack",
  "event-not-active": "issueEventNotActive",
  "config-not-open": "issueConfigNotOpen",
}

interface ConfigSummaryCardProps {
  config: RandomizerConfig
  onChanged: () => void
}

export function ConfigSummaryCard({ config, onChanged }: ConfigSummaryCardProps) {
  const t = useTranslations("randomizer.eventPanel")
  const [roms, setRoms] = useState<RandomizerRom[]>([])

  useEffect(() => {
    RandomizerService.listRoms()
      .then((res) => setRoms(res.success ? res.data || [] : []))
      .catch(() => setRoms([]))
  }, [])

  const notSet = t("summary.notSet")
  const romName =
    roms.find((r) => r.id === config.romId)?.name || config.romHint || notSet
  const truncated = (hash?: string | null) => (hash ? `${hash.slice(0, 16)}…` : notSet)

  const facts: { label: string; value: string; mono?: boolean }[] = [
    { label: t("summary.pack"), value: config.packId || notSet, mono: true },
    { label: t("summary.rom"), value: romName },
    { label: t("summary.platform"), value: config.gamePlatform.toUpperCase(), mono: true },
    { label: t("summary.gameTitle"), value: config.gameTitle },
    { label: t("summary.settingsHash"), value: truncated(config.settingsBlobSha512), mono: true },
    { label: t("summary.romHash"), value: truncated(config.cleanRomSha512), mono: true },
  ]

  return (
    <div className="space-y-5">
      <AvPanel
        title={t("summary.title")}
        icon="dice"
        aside={<AvPill tone={STATUS_TONE[config.status]}>{t(STATUS_KEY[config.status])}</AvPill>}
      >
        <div className="space-y-4">
          {config.launcherResolvable === true && (
            <p className="flex items-center gap-1.5 text-[0.8125rem] text-ok">
              <Icon name="check" size={14} className="shrink-0" />
              {t("resolvableOk")}
            </p>
          )}
          {config.launcherResolvable === false && (
            <p className="flex items-center gap-1.5 text-[0.8125rem] text-warn">
              <Icon name="alert" size={14} className="shrink-0" />
              {t(ISSUE_KEY[config.resolutionIssue ?? ""] ?? "issueNoPack")}
            </p>
          )}

          <dl className="grid gap-x-6 gap-y-3 [grid-template-columns:repeat(auto-fill,minmax(12.5rem,1fr))]">
            {facts.map((fact) => (
              <div key={fact.label} className="min-w-0">
                <dt className="font-mono text-[0.59375rem] font-semibold uppercase tracking-[0.1em] text-txt-dim">
                  {fact.label}
                </dt>
                <dd
                  className={
                    fact.mono
                      ? "mt-1 font-mono text-[0.75rem] text-txt-muted truncate"
                      : "mt-1 text-[0.8125rem] truncate"
                  }
                  title={fact.value}
                >
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </AvPanel>

      {config.status === "draft" && (
        <EventConfigForm config={config} eventId={config.eventId} onSaved={onChanged} />
      )}

      <LifecycleActions config={config} onChanged={onChanged} />
    </div>
  )
}
