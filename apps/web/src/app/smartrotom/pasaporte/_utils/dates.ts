/**
 * The document's dates.
 *
 * `parseDate` in `@/lib/utils` appends a wall-clock time, which is exactly what a passport
 * never prints — an entry is stamped on a DAY. Every date in the book therefore goes
 * through here, in es-ES, and an absent or unparseable one prints an em dash rather than
 * "Invalid Date".
 */
function parse(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

/** "14 mar 2026" — the printed form, on the carné and under every seal. */
export function docDate(value: string | Date | null | undefined): string {
  const date = parse(value)
  if (!date) return "—"
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
}

/** The three pieces a rubber stamp inks separately. */
export function stampDate(value: string | Date | null | undefined): {
  day: string
  month: string
  year: string
  numeric: string
} {
  const date = parse(value)
  if (!date) return { day: "--", month: "---", year: "----", numeric: "--/--/--" }

  const day = String(date.getDate()).padStart(2, "0")
  const month = date
    .toLocaleDateString("es-ES", { month: "short" })
    .replace(".", "")
    .toUpperCase()
  const year = String(date.getFullYear())
  const numeric = `${day}/${String(date.getMonth() + 1).padStart(2, "0")}/${year.slice(2)}`

  return { day, month, year, numeric }
}

/** The crónica's left rail: "04 mar" over "2026". */
export function timelineDate(value: string | Date | null | undefined): { day: string; month: string; year: string } {
  const date = parse(value)
  if (!date) return { day: "--", month: "---", year: "----" }
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleDateString("es-ES", { month: "short" }).replace(".", ""),
    year: String(date.getFullYear()),
  }
}

/** The carné expires four years after it was issued. Null when there is nothing to date. */
export function expiryDate(issued: string | Date | null | undefined): Date | null {
  const date = parse(issued)
  if (!date) return null
  const expires = new Date(date)
  expires.setFullYear(expires.getFullYear() + 4)
  return expires
}
