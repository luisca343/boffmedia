import { intlLocale } from "@boffmedia/ui/locale";

// Chat's day-separator helpers. Nothing here overlaps `lib/format` (relative time,
// numbers, money) — these are absolute clock/calendar labels, so there is nothing to
// delegate.

/** "HH:MM" in the viewer's locale/timezone. */
export function timeOf(date: string | number | Date | undefined): string {
  if (date == null) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Stable key for grouping messages into day separators. */
export function dayKey(date: string | Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** "Hoy" / "Ayer" / weekday (within a week) / full date. A pure module: the
 *  viewer's locale arrives as a parameter, never off a global. */
export function dayLabel(
  date: string | Date,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  locale?: string | null,
): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(d)) / 86_400_000);
  if (diffDays === 0) return t("format.today");
  if (diffDays === 1) return t("format.yesterday");
  if (diffDays > 1 && diffDays < 7) return t(`format.weekday.${d.getDay()}`);
  return d.toLocaleDateString(intlLocale(locale), { day: "numeric", month: "long", year: "numeric" });
}
