const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

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

/** "Hoy" / "Ayer" / weekday (within a week) / full date. */
export function dayLabel(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(d)) / 86_400_000);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays > 1 && diffDays < 7) return WEEKDAYS[d.getDay()];
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}
