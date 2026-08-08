/**
 * Pure, live-value helpers over the catalog — used by the rail (counts), the
 * summary drawer (changed list) and search. They read the current form values
 * plus the shipped defaults; nothing here holds state.
 */

import defaultSettings from "../default-settings"
import { CATEGORIES, MISC_BITS, type RzCategory, type RzControl } from "./catalog"

const DEF = defaultSettings as unknown as Record<string, unknown>

export function fieldChanged(field: string, values: Record<string, unknown>): boolean {
  const a = values[field]
  const b = DEF[field]
  if (a === b) return false
  if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
    try {
      return JSON.stringify(a) !== JSON.stringify(b)
    } catch {
      return true
    }
  }
  return true
}

export function miscOnCount(values: Record<string, unknown>): number {
  const n = typeof values.currentMiscTweaks === "number" ? values.currentMiscTweaks : 0
  return MISC_BITS.filter((b) => (n & b.mask) !== 0).length
}

/** Number of settings in a category that differ from their defaults. */
export function categoryCount(cat: RzCategory, values: Record<string, unknown>): number {
  let n = 0
  for (const panel of cat.panels) {
    for (const c of panel.controls) {
      if (c.kind === "miscBitmask") n += miscOnCount(values)
      else if (fieldChanged(c.field, values)) n++
    }
  }
  return n
}

export function totalChanged(values: Record<string, unknown>): number {
  return CATEGORIES.reduce((sum, c) => sum + categoryCount(c, values), 0)
}

export interface ChangedRow {
  category: RzCategory
  control: RzControl
  value: unknown
}

/** Every changed control, in catalog order, grouped-ready for the summary. */
export function changedControls(values: Record<string, unknown>): ChangedRow[] {
  const rows: ChangedRow[] = []
  for (const category of CATEGORIES) {
    for (const panel of category.panels) {
      for (const control of panel.controls) {
        if (control.kind === "miscBitmask") {
          if (miscOnCount(values) > 0) {
            rows.push({ category, control, value: values.currentMiscTweaks })
          }
        } else if (fieldChanged(control.field, values)) {
          rows.push({ category, control, value: values[control.field] })
        }
      }
    }
  }
  return rows
}

export interface SearchHit {
  category: RzCategory
  control: RzControl
}

/**
 * Flat search across every control by label / tip / category, resolved through
 * next-intl. `resolve` turns an i18n key into its text (missing keys → "").
 */
export function searchControls(query: string, resolve: (key: string) => string): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits: SearchHit[] = []
  for (const category of CATEGORIES) {
    const catLabel = resolve(category.labelKey).toLowerCase()
    for (const panel of category.panels) {
      for (const control of panel.controls) {
        const haystack = [
          resolve(control.labelKey),
          control.tipKey ? resolve(control.tipKey) : "",
          catLabel,
        ]
          .join(" ")
          .toLowerCase()
        if (haystack.includes(q)) hits.push({ category, control })
      }
    }
  }
  return hits
}
