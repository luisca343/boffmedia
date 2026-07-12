import { formatMoney } from "../bankUtils";

export { formatMoney };

/** Plain integer with es-ES grouping, no currency (for the hero split ¥). */
export function fmtInt(n: number): string {
  return new Intl.NumberFormat("es-ES").format(Math.round(n || 0));
}

/** Signed money: "+ 1.234 ¥" / "− 1.234 ¥". Amounts in our data are positive;
 *  pass a signed number or use `sign` to force the prefix. */
export function fmtSigned(n: number): string {
  const abs = Math.abs(n);
  const prefix = n < 0 ? "− " : "+ ";
  return prefix + fmtInt(abs) + " ¥";
}

export function fmtDate(iso: string | Date, mode: "short" | "long" | "rel" = "short"): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  if (mode === "rel") {
    const diff = Math.floor((Date.now() - d.getTime()) / 86_400_000);
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Ayer";
    if (diff > 1 && diff < 7) return `Hace ${diff} d`;
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: mode === "long" ? "numeric" : undefined,
  });
}

export function fmtTime(iso: string | Date): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}
