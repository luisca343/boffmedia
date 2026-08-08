"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useFormContext } from "react-hook-form"
import type { RandomizerSettings } from "@boffmedia/pack-schema"
import defaultSettings from "../default-settings"

/* ---------------------------------------------------------------------------
 * Shared UI state for the redesigned randomizer editor.
 *
 * The form itself (react-hook-form `RandomizerSettings`) stays the single source
 * of truth for values — this context only carries the *presentation* layer the
 * master-detail redesign needs: which fields differ from their defaults (drives
 * the orange left-bar highlight, rail count badges and the summary drawer),
 * density, the active category, search query, and the gating-reason / warning
 * lookups that the control rows render inline.
 * ------------------------------------------------------------------------- */

export type RzDensity = "comfortable" | "compact"

export interface RzWarning {
  /** `bad` = error, `warn` = warning, `info` = advisory. */
  level: "bad" | "warn" | "info"
  /** The field the warning attaches to (used to jump + flash). */
  field: string
  /** Already-resolved, human-readable text. */
  text: string
}

/** Injected from the shell so this module stays free of the catalog/validation. */
export interface RandomizerUiDeps {
  /** Human gating reason for a field when it is disabled, else null. */
  reasonFor?: (field: string) => string | null
  /** All active warnings, recomputed from the current form values. */
  warnings?: RzWarning[]
}

interface RandomizerUiValue {
  /** Field ids whose value differs from the shipped default. */
  changed: Set<string>
  isChanged: (field: string) => boolean
  changedCount: number

  density: RzDensity
  setDensity: (d: RzDensity) => void

  activeCat: string
  setActiveCat: (id: string) => void

  query: string
  setQuery: (q: string) => void

  summaryOpen: boolean
  setSummaryOpen: (open: boolean) => void

  /** The field currently flashing (after a summary/warning jump). */
  flashField: string | null
  requestFlash: (field: string) => void

  reasonFor: (field: string) => string | null
  warnings: RzWarning[]
  warningFor: (field: string) => RzWarning | null

  resetField: (field: string) => void
  resetAll: () => void
}

const RandomizerUiContext = createContext<RandomizerUiValue | null>(null)

export function useRandomizerUi(): RandomizerUiValue {
  const ctx = useContext(RandomizerUiContext)
  if (!ctx) {
    throw new Error("useRandomizerUi must be used within <RandomizerUiProvider>")
  }
  return ctx
}

/** Optional variant for the control rows — returns null outside a provider so
 *  the primitives can still be used standalone (e.g. in isolation tests). */
export function useRandomizerUiOptional(): RandomizerUiValue | null {
  return useContext(RandomizerUiContext)
}

const DEFAULTS = defaultSettings as unknown as Record<string, unknown>

function sameAsDefault(field: string, value: unknown): boolean {
  const def = DEFAULTS[field]
  if (def === value) return true
  // Objects / arrays (settingBattleStyle, currentRestrictions, …) compare deep.
  if (
    typeof def === "object" &&
    def !== null &&
    typeof value === "object" &&
    value !== null
  ) {
    try {
      return JSON.stringify(def) === JSON.stringify(value)
    } catch {
      return false
    }
  }
  return false
}

export function RandomizerUiProvider({
  children,
  deps,
  initialDensity = "compact",
  initialCat = "general",
}: {
  children: ReactNode
  deps: RandomizerUiDeps
  initialDensity?: RzDensity
  initialCat?: string
}) {
  const form = useFormContext<RandomizerSettings>()

  const [changed, setChanged] = useState<Set<string>>(() => new Set())
  const [density, setDensityState] = useState<RzDensity>(initialDensity)

  // Restore the admin's last density after mount (not in the initializer —
  // this component is SSR'd, so reading localStorage there would mismatch).
  useEffect(() => {
    try {
      const d = window.localStorage.getItem("rz.density")
      if (d === "comfortable" || d === "compact") setDensityState(d)
    } catch {
      /* storage unavailable */
    }
  }, [])

  const setDensity = useCallback((d: RzDensity) => {
    setDensityState(d)
    try {
      window.localStorage.setItem("rz.density", d)
    } catch {
      /* storage unavailable */
    }
  }, [])
  const [activeCat, setActiveCat] = useState<string>(initialCat)
  const [query, setQuery] = useState("")
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [flashField, setFlashField] = useState<string | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Recompute the changed-set from the whole form, and keep it in sync on every
  // value change. Membership-only diffing keeps referential churn out unless the
  // set actually changed, so consumers (rail badges, summary) don't thrash.
  const recomputeAll = useCallback(() => {
    const values = form.getValues() as Record<string, unknown>
    const next = new Set<string>()
    for (const key of Object.keys(DEFAULTS)) {
      if (!sameAsDefault(key, values[key])) next.add(key)
    }
    setChanged((prev) => {
      if (prev.size === next.size) {
        let equal = true
        for (const k of next) {
          if (!prev.has(k)) {
            equal = false
            break
          }
        }
        if (equal) return prev
      }
      return next
    })
  }, [form])

  useEffect(() => {
    recomputeAll()
    const sub = form.watch(() => recomputeAll())
    return () => sub.unsubscribe()
  }, [form, recomputeAll])

  const requestFlash = useCallback((field: string) => {
    setFlashField(field)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlashField(null), 1200)
  }, [])

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    },
    [],
  )

  const resetField = useCallback(
    (field: string) => {
      form.setValue(field as never, DEFAULTS[field] as never, {
        shouldDirty: true,
        shouldValidate: true,
      })
    },
    [form],
  )

  const resetAll = useCallback(() => {
    form.reset(defaultSettings as never, { keepDefaultValues: true })
  }, [form])

  const reasonFor = deps.reasonFor ?? (() => null)
  const warnings = deps.warnings ?? []

  const warningFor = useCallback(
    (field: string) => warnings.find((w) => w.field === field) ?? null,
    [warnings],
  )

  const value = useMemo<RandomizerUiValue>(
    () => ({
      changed,
      isChanged: (field: string) => changed.has(field),
      changedCount: changed.size,
      density,
      setDensity,
      activeCat,
      setActiveCat,
      query,
      setQuery,
      summaryOpen,
      setSummaryOpen,
      flashField,
      requestFlash,
      reasonFor,
      warnings,
      warningFor,
      resetField,
      resetAll,
    }),
    [
      changed,
      density,
      setDensity,
      activeCat,
      query,
      summaryOpen,
      flashField,
      requestFlash,
      reasonFor,
      warnings,
      warningFor,
      resetField,
      resetAll,
    ],
  )

  return (
    <RandomizerUiContext.Provider value={value}>
      {children}
    </RandomizerUiContext.Provider>
  )
}
