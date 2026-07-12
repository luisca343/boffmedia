const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

export function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < MIN) return "ahora";
  if (d < HOUR) return `hace ${Math.floor(d / MIN)} min`;
  if (d < DAY) return `hace ${Math.floor(d / HOUR)} h`;
  if (d < 7 * DAY) return `hace ${Math.floor(d / DAY)} d`;
  return new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function fullDate(ts: number): string {
  return new Date(ts).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ISO/string/number → epoch ms (notes store timestamps as ISO strings). */
export function toMs(value: string | number | Date | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}
