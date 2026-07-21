"use client";

import { useTranslations } from "next-intl";
import { Icon, IconButton, Tooltip, Kbd } from "./ui";

interface TopNavProps {
  activeTitle: string | null;
  onMenu: () => void;
  onSearch: () => void;
  onGraph: () => void;
  onTemplates: () => void;
}

export function TopNav({ activeTitle, onMenu, onSearch, onGraph, onTemplates }: TopNavProps) {
  const t = useTranslations("notas");
  return (
    <header className="z-40 flex h-12 flex-none items-center gap-1 border-b border-nt-border bg-nt-bg-2 px-2.5">
      <button
        onClick={onMenu}
        aria-label="Menu"
        className="inline-flex h-8 min-w-8 items-center justify-center rounded-nt-sm text-nt-fg-muted hover:bg-nt-hover-strong hover:text-nt-fg md:hidden"
      >
        <Icon name="menu" size={18} />
      </button>

      <div className="flex select-none items-center gap-2.5 pl-1 pr-2">
        <span className="grid h-[26px] w-[26px] place-items-center rounded-nt-md bg-gradient-to-br from-nt-400 to-nt-600 text-white shadow-[0_0_14px_rgb(var(--nt-accent)/.45)]">
          <Icon name="zap" size={15} />
        </span>
        <span className="font-nt-display text-[14px] font-bold tracking-[.02em] text-nt-fg">
          Smart<b className="text-nt-accent-fg">Rotom</b>
        </span>
        <span className="rounded bg-nt-accent/15 px-[5px] py-0.5 font-nt-display text-[8.5px] font-bold tracking-[.1em] text-nt-accent-fg">
          NOTAS
        </span>
      </div>

      <span className="mx-1.5 h-[22px] w-px bg-nt-border-2" />

      <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] text-nt-fg-muted" aria-label="Ruta">
        <span className="whitespace-nowrap max-sm:hidden">SmartRotom</span>
        <span className="text-nt-fg-subtle max-sm:hidden">/</span>
        <span className="whitespace-nowrap">Notas</span>
        {activeTitle && (
          <>
            <span className="text-nt-fg-subtle">/</span>
            <span className="min-w-0 truncate font-medium text-nt-fg">{activeTitle}</span>
          </>
        )}
      </nav>

      <button
        onClick={onSearch}
        className="flex h-8 min-w-0 items-center gap-2 rounded-nt-md border border-nt-border bg-nt-hover px-2.5 text-[13px] text-nt-fg-subtle transition-colors hover:border-nt-border-2 hover:text-nt-fg-muted sm:min-w-[200px]"
      >
        <Icon name="search" size={14} />
        <span className="max-sm:hidden">{t("common.search")}…</span>
        <span className="ml-auto max-sm:hidden">
          <Kbd>⌘K</Kbd>
        </span>
      </button>

      <Tooltip label={t("graph.title")}>
        <IconButton onClick={onGraph} aria-label={t("graph.title")}>
          <Icon name="network" size={17} />
        </IconButton>
      </Tooltip>
      <Tooltip label={t("templates.title")}>
        <IconButton onClick={onTemplates} aria-label={t("templates.title")} className="max-sm:hidden">
          <Icon name="layers" size={17} />
        </IconButton>
      </Tooltip>
    </header>
  );
}
