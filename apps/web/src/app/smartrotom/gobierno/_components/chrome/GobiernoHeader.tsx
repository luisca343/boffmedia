"use client"

import { useTranslations } from "next-intl"
import { Avatar, Icon, Seal } from "../ui"
import { OfficialClock } from "./OfficialClock"
import { NotifBell } from "./NotifBell"
import { useOfficer } from "../../_hooks/useOfficer"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"

export function GobiernoHeader() {
  const t = useTranslations("gobierno")
  const { username, uuid, badge, rankLabel } = useOfficer()
  const setCmdOpen = useGobiernoUi((s) => s.setCmdOpen)
  const openDossier = useGobiernoUi((s) => s.openDossier)

  return (
    // The header sits on brighter paper than the page and is underlined by the tricolour
    // rule — green, gold, green — that marks an official letterhead.
    <header className="relative flex-none border-b border-gt-line-strong bg-gradient-to-b from-[#fbf7ec] to-[#f4eedf] after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-[linear-gradient(90deg,rgb(var(--gt-civic))_0%,rgb(var(--gt-gold))_50%,rgb(var(--gt-civic))_100%)] after:opacity-85 after:content-['']">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Seal size={48} />
          <div className="min-w-0">
            <h1 className="whitespace-nowrap font-gt-display text-lg leading-none tracking-[.01em] text-gt-ink-900 md:text-[23px]">
              {t("header.title")}
            </h1>
            <div className="mt-[3px] hidden font-gt-mono text-[9.5px] uppercase tracking-[.18em] text-gt-ink-400 sm:block">
              {t("header.subtitle")}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="hidden min-w-[220px] items-center gap-2.5 rounded-gt-sm border border-gt-line-strong bg-gt-paper-0 px-3.5 py-2 text-gt-ink-400 transition-colors hover:bg-gt-paper-1 lg:flex"
        >
          <Icon name="search" size={15} />
          <span className="flex-1 text-left text-[13px]">{t("header.searchPlaceholder")}</span>
          <span className="rounded border border-gt-line-strong px-1.5 py-px font-gt-mono text-[10px]">⌘K</span>
        </button>

        <div className="flex items-center gap-3">
          <OfficialClock />
          <NotifBell />
          <button
            type="button"
            onClick={() => openDossier(uuid)}
            className="hidden items-center gap-2.5 rounded-gt-sm border border-gt-line-strong bg-gt-paper-0 py-[5px] pl-3 pr-[6px] transition-colors hover:bg-gt-paper-1 md:flex"
          >
            <div className="text-right">
              <div className="text-[12.5px] font-bold leading-none text-gt-ink-900">{username}</div>
              <div className="mt-0.5 font-gt-mono text-[9.5px] text-gt-accent">
                {rankLabel} · {t("poblacion.placa", { badge })}
              </div>
            </div>
            <Avatar user={username} size={34} />
          </button>
        </div>
      </div>
    </header>
  )
}
