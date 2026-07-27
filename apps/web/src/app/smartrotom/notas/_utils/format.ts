import { intlLocale } from "@/lib/locale";

export { timeAgo, toMs } from "@/lib/format";

export function fullDate(ts: number, locale?: string | null): string {
  return new Date(ts).toLocaleDateString(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
