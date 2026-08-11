"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, Badge, Button, Toggle, type IconName } from "@boffmedia/ui"

// The operative strip that accompanies a legal document: export data, blocked
// essential cookies, analytics/marketing switches and danger-toned deletion.
// Mirrors `.dc-controls` from legal.css.

function Ctrl({
  icon,
  title,
  desc,
  end,
  danger,
}: {
  icon: IconName
  title: React.ReactNode
  desc: React.ReactNode
  end: React.ReactNode
  danger?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-solid border-line px-[22px] py-4 last:border-b-0">
      <span
        className={cn(
          "grid h-10 w-10 flex-none place-items-center border border-solid cut cut-edge-slant [--cut:8px]",
          danger
            ? "border-[color:color-mix(in_srgb,var(--bad)_40%,var(--line-2))] [--cut-line:color-mix(in_srgb,var(--bad)_40%,var(--line-2))] bg-bad-soft text-bad"
            : "border-line-2 [--cut-line:var(--line-2)] bg-panel-2 text-txt-muted",
        )}
      >
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <b className="block font-display text-[14px]/[1.1] font-bold uppercase tracking-[0.02em]">{title}</b>
        <span className="mt-1 block text-[13px]/[1.4] text-txt-muted">{desc}</span>
      </div>
      <span className="flex-none">{end}</span>
    </div>
  )
}

export function DataControls() {
  const t = useTranslations("common.dataControls")
  const [analytics, setAnalytics] = React.useState(true)
  const [marketing, setMarketing] = React.useState(false)
  return (
    <div className="mt-2 border border-solid border-line bg-panel cut-corner cut-corner-edge">
      <div className="flex items-center gap-3 border-b border-solid border-line px-[22px] py-4">
        <Icon name="sliders" size={18} className="text-accent" />
        <h3 className="font-display text-[17px]/none font-bold uppercase tracking-[0.02em]">{t("title")}</h3>
        <span className="ml-auto">
          <Badge tone="ok">{t("youDecide")}</Badge>
        </span>
      </div>

      <Ctrl
        icon="download"
        title={t("downloadData")}
        desc={t("downloadDesc")}
        end={<Button size="sm" icon="download">{t("export")}</Button>}
      />
      <Ctrl
        icon="check"
        title={t("essentialCookies")}
        desc={t("essentialDesc")}
        end={<Badge>{t("alwaysActive")}</Badge>}
      />
      <Ctrl
        icon="chart"
        title={t("analytics")}
        desc={t("analyticsDesc")}
        end={<Toggle on={analytics} onChange={setAnalytics} />}
      />
      <Ctrl
        icon="mail"
        title={t("communications")}
        desc={t("communicationsDesc")}
        end={<Toggle on={marketing} onChange={setMarketing} />}
      />
      <Ctrl
        icon="trash"
        title={t("deleteAccount")}
        desc={t("deleteDesc")}
        end={<Button size="sm" variant="danger" icon="trash">{t("delete")}</Button>}
        danger
      />
    </div>
  )
}
