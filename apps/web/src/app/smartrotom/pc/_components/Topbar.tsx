"use client"

import type { RefObject } from "react"
import { usePcUi } from "../_stores/pcUiStore"
import { Button, Icon, Input, Kbd } from "./ui"

function Logo() {
  return (
    <div className="flex flex-none items-center gap-2.5">
      <span className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border border-pc-line-strong bg-gradient-to-br from-[#1f3a63] to-[#0c1830] shadow-[inset_0_0_14px_-4px_rgb(79_155_255_/_.6)]">
        <Icon name="boxes" size={20} className="text-pc-accent" />
        <span className="absolute -right-0.5 -top-0.5 h-[9px] w-[9px] rounded-pc-pill border-2 border-pc-bg-1 bg-pc-green shadow-[0_0_8px_rgb(var(--pc-green))]" />
      </span>
      <div className="leading-[1.05]">
        <div className="font-pc-display text-[16px] font-bold tracking-[.02em]">
          SmartRotom <span className="text-pc-accent">PC</span>
        </div>
        <div className="text-[10px] tracking-[.04em] text-pc-fg-subtle">SISTEMA DE ALMACENAMIENTO</div>
      </div>
    </div>
  )
}

const Divider = () => <span className="h-[26px] w-px flex-none bg-pc-line" />

export interface TopbarProps {
  onOpenFilters: () => void
  onOpenLivingDex: () => void
  onOpenPalette: () => void
  onOpenHelp: () => void
  /** The page owns the `/` shortcut; it focuses the field through this ref. */
  searchRef?: RefObject<HTMLInputElement | null>
}

export function Topbar({ onOpenFilters, onOpenLivingDex, onOpenPalette, onOpenHelp, searchRef }: TopbarProps) {
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
          className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-pc-fg-subtle"
        />
        <Input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar Pokémon"
          placeholder="Buscar por nombre, apodo o número de Pokédex…"
          className="h-[42px] rounded-xl pl-10 pr-10 text-sm"
        />
        {search ? (
          <Button
            variant="ghost"
            icon
            aria-label="Limpiar búsqueda"
            onClick={() => setSearch("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-[5px]"
          >
            <Icon name="x" size={14} />
          </Button>
        ) : (
          <span className="absolute right-[11px] top-1/2 -translate-y-1/2">
            <Kbd>/</Kbd>
          </span>
        )}
      </div>

      <div className="flex flex-none items-center gap-[5px]">
        <Button icon aria-label="Filtros (F)" title="Filtros (F)" onClick={onOpenFilters}>
          <Icon name="sliders" size={17} />
        </Button>
        <Button icon active={dualMode} aria-label="Doble caja (D)" title="Doble caja (D)" onClick={toggleDual}>
          <Icon name="columns" size={17} />
        </Button>
        <Button
          icon
          active={multiMode}
          // The multi-selection tone is cyan everywhere it appears — slots, bulk bar, here.
          activeClass="border-pc-cyan bg-pc-cyan/[.16] text-pc-cyan"
          aria-label="Selección múltiple (M)"
          title="Selección múltiple (M)"
          onClick={() => setMultiMode(!multiMode)}
        >
          <Icon name="check" size={17} />
        </Button>
        <Button icon aria-label="Living Dex" title="Living Dex" onClick={onOpenLivingDex} className="text-pc-gold">
          <Icon name="book" size={17} />
        </Button>
      </div>

      <Divider />

      <div className="flex flex-none items-center gap-[5px]">
        <Button icon aria-label="Comandos (Ctrl/⌘K)" title="Comandos (Ctrl/⌘K)" onClick={onOpenPalette}>
          <Icon name="command" size={17} />
        </Button>
        <Button
          icon
          active={sound}
          aria-label={sound ? "Silenciar sonidos" : "Activar sonidos"}
          title="Sonido"
          onClick={() => setSound(!sound)}
        >
          <Icon name={sound ? "volume" : "volumeOff"} size={17} />
        </Button>
        <Button icon aria-label="Atajos de teclado" title="Ayuda (?)" onClick={onOpenHelp}>
          <Icon name="keyboard" size={17} />
        </Button>
      </div>
    </div>
  )
}
