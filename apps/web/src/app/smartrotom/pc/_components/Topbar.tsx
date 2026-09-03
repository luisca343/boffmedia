"use client"

import type { RefObject } from "react"
import { useTranslations } from "next-intl"
import { usePcUi } from "../_stores/pcUiStore"
import { Button, Icon, Input, Kbd } from "./ui"

function Logo() {
  const t = useTranslations("pc")
  return (
    <div className="flex flex-none items-center gap-2.5">
      <span className="relative flex h-[2.375rem] w-[2.375rem] items-center justify-center rounded-[11px] border border-pc-line-strong bg-gradient-to-br from-[#1f3a63] to-[#0c1830] shadow-[inset_0_0_14px_-4px_rgb(79_155_255_/_.6)]">
        <Icon name="boxes" size={20} className="text-pc-accent" />
        <span className="absolute -right-0.5 -top-0.5 h-[0.5625rem] w-[0.5625rem] rounded-pc-pill border-2 border-pc-bg-1 bg-pc-green shadow-[0_0_8px_rgb(var(--pc-green))]" />
      </span>
      <div className="leading-[1.05]">
        <div className="font-pc-display text-[1rem] font-bold tracking-[.02em]">
          SmartRotom <span className="text-pc-accent">PC</span>
        </div>
        <div className="text-[0.625rem] tracking-[.04em] text-pc-fg-subtle">{t("topbar.subtitle")}</div>
      </div>
    </div>
  )
}

const Divider = () => <span className="h-[1.625rem] w-px flex-none bg-pc-line" />

export interface TopbarProps {
  onOpenFilters: () => void
  onOpenLivingDex: () => void
  onOpenPalette: () => void
  onOpenHelp: () => void
  /** The page owns the `/` shortcut; it focuses the field through this ref. */
  searchRef?: RefObject<HTMLInputElement | null>
}

export function Topbar({ onOpenFilters, onOpenLivingDex, onOpenPalette, onOpenHelp, searchRef }: TopbarProps) {
  const t = useTranslations("pc")
  const search = usePcUi((s) => s.search)
  const setSearch = usePcUi((s) => s.setSearch)
  const dualMode = usePcUi((s) => s.dualMode)
  const toggleDual = usePcUi((s) => s.toggleDual)
  const multiMode = usePcUi((s) => s.multiMode)
  const setMultiMode = usePcUi((s) => s.setMultiMode)
  const sound = usePcUi((s) => s.sound)
  const setSound = usePcUi((s) => s.setSound)

  return (
    <div className="flex items-center gap-3">
      <Logo />
      <Divider />

      <div className="relative min-w-0 flex-1">
        <Icon
          name="search"
          size={17}
          className="pointer-events-none absolute left-[0.8125rem] top-1/2 -translate-y-1/2 text-pc-fg-subtle"
        />
        <Input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t("topbar.searchAriaLabel")}
          placeholder={t("topbar.searchPlaceholder")}
          className="h-[2.625rem] rounded-xl pl-10 pr-10 text-sm"
        />
        {search ? (
          <Button
            variant="ghost"
            icon
            aria-label={t("topbar.clearSearch")}
            onClick={() => setSearch("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-[0.3125rem]"
          >
            <Icon name="x" size={14} />
          </Button>
        ) : (
          <span className="absolute right-[0.6875rem] top-1/2 -translate-y-1/2">
            <Kbd>/</Kbd>
          </span>
        )}
      </div>

      <div className="flex flex-none items-center gap-[0.3125rem]">
        <Button icon aria-label={t("topbar.filters")} title={t("topbar.filters")} onClick={onOpenFilters}>
          <Icon name="sliders" size={17} />
        </Button>
        <Button icon active={dualMode} aria-label={t("topbar.dualBox")} title={t("topbar.dualBox")} onClick={toggleDual}>
          <Icon name="columns" size={17} />
        </Button>
        <Button
          icon
          active={multiMode}
          // The multi-selection tone is cyan everywhere it appears — slots, bulk bar, here.
          activeClass="border-pc-cyan bg-pc-cyan/[.16] text-pc-cyan"
          aria-label={t("topbar.multiSelect")}
          title={t("topbar.multiSelect")}
          onClick={() => setMultiMode(!multiMode)}
        >
          <Icon name="check" size={17} />
        </Button>
        <Button icon aria-label={t("topbar.livingDex")} title={t("topbar.livingDex")} onClick={onOpenLivingDex} className="text-pc-gold">
          <Icon name="book" size={17} />
        </Button>
      </div>

      <Divider />

      <div className="flex flex-none items-center gap-[0.3125rem]">
        <Button icon aria-label={t("topbar.commands")} title={t("topbar.commands")} onClick={onOpenPalette}>
          <Icon name="command" size={17} />
        </Button>
        <Button
          icon
          active={sound}
          aria-label={sound ? t("topbar.muteSound") : t("topbar.unmuteSound")}
          title={t("topbar.sound")}
          onClick={() => setSound(!sound)}
        >
          <Icon name={sound ? "volume" : "volumeOff"} size={17} />
        </Button>
        <Button icon aria-label={t("topbar.help")} title={t("topbar.help")} onClick={onOpenHelp}>
          <Icon name="keyboard" size={17} />
        </Button>
      </div>
    </div>
  )
}
