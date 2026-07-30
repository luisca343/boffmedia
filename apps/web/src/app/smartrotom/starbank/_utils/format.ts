import { intlLocale } from "@boffmedia/ui/locale";

export { formatMoney } from "@boffmedia/ui/format";

/** Plain integer with the viewer's locale grouping, no currency (for the hero split ¥). */
export function fmtInt(n: number, locale?: string | null): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(Math.round(n || 0));
}

/** Signed money: "+ 1.234 ¥" / "− 1.234 ¥". Amounts in our data are positive;
 *  pass a signed number or use `sign` to force the prefix. */
export function fmtSigned(n: number, locale?: string | null): string {
  const abs = Math.abs(n);
  const prefix = n < 0 ? "− " : "+ ";
  return prefix + fmtInt(abs, locale) + " ¥";
}

/** A typed amount ("1.234,56") → whole ¥. es-ES writes "." for thousands and "," for
 *  decimals, so both are normalised before Number() ever sees the string. */
export function parseAmount(input: string): number {
  const normalised = input.replace(/\./g, "").replace(",", ".");
  return Math.round(Number(normalised) || 0);
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

export function fmtDate(iso: string | Date, mode: "short" | "long" | "rel" = "short", locale?: string | null): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const tag = intlLocale(locale);
  if (mode === "rel") {
    const diff = Math.floor((Date.now() - d.getTime()) / 86_400_000);
    if (diff >= 0 && diff < 7) {
      const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto", style: "narrow" });
      return capitalize(rtf.format(-diff, "day"));
    }
    return d.toLocaleDateString(tag, { day: "numeric", month: "short" });
  }
  return d.toLocaleDateString(tag, {
    day: "numeric",
    month: "short",
    year: mode === "long" ? "numeric" : undefined,
  });
}

export function fmtTime(iso: string | Date, locale?: string | null): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(intlLocale(locale), { hour: "2-digit", minute: "2-digit" });
}
