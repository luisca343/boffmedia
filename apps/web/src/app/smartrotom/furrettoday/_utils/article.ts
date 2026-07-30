import type { News } from "@boffmedia/shared";

import { intlLocale } from "@boffmedia/ui/locale";

import { accentFor, type FtAccent } from "./accents";

/**
 * The magazine's view of a news row.
 *
 * The API stores a plain CMS article (title/subtitle/content/category). Every
 * editorial field the design asks for that is NOT a column — the eyebrow, the
 * read time, the dateline, the accent, the tags — is derived here, once, so no
 * component has to re-derive it and they cannot drift apart.
 *
 * `author` / `authorRole` / `issue` / `claps` ARE real columns (migration
 * 0025), but they are nullable on every pre-existing row, so treat them as
 * optional at every usage site.
 */
export interface FtArticle {
  id: number;
  title: string;
  /**
   * The RAW column — null when the newsroom never wrote one. The editor must bind
   * to this, never to `deck`: `deck` falls back to the body's opening sentence, so
   * saving it back would silently persist that fallback as a real subtitle.
   */
  subtitle: string | null;
  /** The standfirst for DISPLAY. Falls back to the opening sentence when unset. */
  deck: string;
  /** Uppercase kicker above the headline. */
  eyebrow: string;
  category: string | null;
  subcategory: string | null;
  accent: FtAccent;
  tags: string[];
  readTime: string;
  /** "17 · MAY · 2026" */
  dateline: string;
  /** "15 · MAY" — the compact form used on cards. */
  datelineShort: string;
  createdAt: Date;
  updatedAt: Date;
  imageUrl: string | null;
  buttonText: string | null;
  content: string;
  published: boolean;
  featured: boolean;
  author: string | null;
  authorRole: string | null;
  issue: number | null;
  claps: number;
}

const MONTHS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

/** Average adult reading speed, in words per minute. */
const WPM = 200;

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** "6 min" — derived from the body, because the API has no readtime column. */
export function readTimeOf(content: string): string {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / WPM))} min`;
}

function toDate(value: Date | string): Date {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

export function datelineOf(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")} · ${MONTHS[date.getMonth()]} · ${date.getFullYear()}`;
}

export function datelineShortOf(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")} · ${MONTHS[date.getMonth()]}`;
}

/** "17 de mayo, 2026" — the long form used in the article header. */
export function longDateOf(date: Date, locale?: string | null): string {
  return date.toLocaleDateString(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * The deck. Prefers the real `subtitle`; when an article has none, the opening
 * sentence of the body stands in rather than leaving a hole in the layout.
 */
function deckOf(news: News): string {
  const subtitle = news.subtitle?.trim();
  if (subtitle) return subtitle;

  const text = stripHtml(news.content ?? "");
  if (!text) return "";
  const firstSentence = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return firstSentence.length > 180
    ? `${firstSentence.slice(0, 177).trimEnd()}…`
    : firstSentence;
}

export function toArticle(news: News): FtArticle {
  const createdAt = toDate(news.createdAt);
  const category = news.category?.trim() || null;
  const subcategory = news.subcategory?.trim() || null;

  return {
    id: news.id,
    title: news.title,
    subtitle: news.subtitle?.trim() || null,
    deck: deckOf(news),
    eyebrow: (subcategory || category || "Furret Today").toUpperCase(),
    category,
    subcategory,
    accent: accentFor(category),
    tags: [category, subcategory].filter((t): t is string => Boolean(t)),
    readTime: readTimeOf(news.content ?? ""),
    dateline: datelineOf(createdAt),
    datelineShort: datelineShortOf(createdAt),
    createdAt,
    updatedAt: toDate(news.updatedAt),
    imageUrl: news.imageUrl?.trim() || null,
    buttonText: news.buttonText?.trim() || null,
    content: news.content ?? "",
    published: news.published === 1,
    featured: news.featured === 1,
    author: news.author?.trim() || null,
    authorRole: news.authorRole?.trim() || null,
    issue: news.issue ?? null,
    claps: news.claps ?? 0,
  };
}

export interface FtCategory {
  id: string;
  label: string;
  count: number;
  accent: FtAccent;
}

/**
 * The section list, derived from the categories actually in use. The handoff
 * hardcoded seven sections; the real ones are whatever the newsroom has
 * published, so an empty category simply never appears.
 */
export function categoriesOf(articles: FtArticle[]): FtCategory[] {
  const counts = new Map<string, number>();
  for (const a of articles) {
    if (!a.category) continue;
    counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({
      id: label.toLowerCase(),
      label,
      count,
      accent: accentFor(label),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/**
 * The ticker. Real headlines, uppercased — the handoff's list was invented, but
 * a breaking-news rail full of real ones says the same thing and is true.
 */
export function tickerOf(articles: FtArticle[], limit = 8): string[] {
  return articles.slice(0, limit).map((a) => a.title.toUpperCase());
}

/** "Seguir leyendo": same section first, then whatever else is newest. */
export function relatedTo(
  article: FtArticle,
  pool: FtArticle[],
  limit = 3,
): FtArticle[] {
  const others = pool.filter((a) => a.id !== article.id && a.published);
  const sameSection = others.filter((a) => a.category === article.category);
  const rest = others.filter((a) => a.category !== article.category);
  return [...sameSection, ...rest].slice(0, limit);
}

/** Free-text search across the fields a reader would actually search. */
export function matchesQuery(article: FtArticle, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    article.title.toLowerCase().includes(q) ||
    article.deck.toLowerCase().includes(q) ||
    (article.category ?? "").toLowerCase().includes(q) ||
    (article.author ?? "").toLowerCase().includes(q)
  );
}
