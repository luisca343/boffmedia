"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useViewerRoles } from "@/services/useBoffSession"
import { buildCommandPaletteEntries, matchesQuery, sortEntries } from "./command-palette-utils"
import type { CommandPaletteEntry } from "./command-palette-utils"

const KEYBINDING = { key: "k", ctrlKey: true } // Ctrl+K or Cmd+K on Mac

interface CommandPaletteContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const CommandPaletteContext = React.createContext<CommandPaletteContextValue | undefined>(undefined)

export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext)
  if (!ctx) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider")
  }
  return ctx
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K (metaKey for Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      // Escape to close
      if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open])

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPaletteContent open={open} onClose={() => setOpen(false)} />
    </CommandPaletteContext.Provider>
  )
}

function CommandPaletteContent({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const t = useTranslations()
  const tNav = useTranslations("nav.v3")
  const roles = useViewerRoles()

  const [query, setQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Build entries (this is the full list)
  const allEntries = React.useMemo(
    () => buildCommandPaletteEntries(t, roles),
    [t, roles],
  )

  // Filter and sort entries based on query
  const filteredEntries = React.useMemo(() => {
    const matching = query.trim()
      ? allEntries.filter((e) => matchesQuery(query, e))
      : allEntries
    return sortEntries(query, matching)
  }, [query, allEntries])

  // Reset state when palette opens/closes
  React.useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIndex(0)
      // Focus input after a frame so the browser doesn't fight us
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const handleSelect = React.useCallback(
    (entry: CommandPaletteEntry) => {
      onClose()
      router.push(entry.href)
    },
    [router, onClose],
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredEntries.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredEntries.length) % filteredEntries.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredEntries[selectedIndex]) {
          handleSelect(filteredEntries[selectedIndex])
        }
      }
    },
    [filteredEntries, selectedIndex, handleSelect],
  )

  // Scroll selected item into view
  React.useEffect(() => {
    const selected = containerRef.current?.querySelector("[data-selected]")
    if (selected) {
      selected.scrollIntoView({ block: "nearest" })
    }
  }, [selectedIndex])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-black/40 pt-[10vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-lg rounded-lg border border-line bg-base shadow-2xl">
        <div className="border-b border-line px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder={tNav("search")}
            className="w-full bg-transparent text-sm outline-none placeholder:text-txt-muted"
            aria-label={tNav("search")}
          />
        </div>

        <div
          ref={containerRef}
          className="max-h-96 overflow-y-auto"
          role="listbox"
        >
          {filteredEntries.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-txt-muted">
              {tNav("palette.noResults")}
            </div>
          ) : (
            filteredEntries.map((entry, idx) => {
              const categoryLabel = {
                route: tNav("palette.category.route"),
                tool: tNav("palette.category.tool"),
                admin: tNav("palette.category.admin"),
              }[entry.category]

              return (
                <button
                  key={entry.id}
                  onClick={() => handleSelect(entry)}
                  data-selected={idx === selectedIndex || undefined}
                  className="w-full px-4 py-3 text-left hover:bg-line-2 data-[selected]:bg-accent/10 data-[selected]:border-l-2 data-[selected]:border-accent transition-colors"
                  role="option"
                  aria-selected={idx === selectedIndex}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-txt truncate">
                        {entry.title}
                      </div>
                      {entry.description && (
                        <div className="text-xs text-txt-muted truncate">
                          {entry.description}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-txt-muted shrink-0 ml-2">
                      {categoryLabel}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="border-t border-line px-4 py-2 text-xs text-txt-muted">
          {tNav("palette.hint")}
        </div>
      </div>
    </div>
  )
}
