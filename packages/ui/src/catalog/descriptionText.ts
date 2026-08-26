/** Turn a catalogue description into plain text fit for a `<span>`.
 *
 *  The two platforms hand us different formats for the same field — Modrinth
 *  returns Markdown, CurseForge returns HTML — and both arrive HTML-escaped.
 *  Rendering either one raw is what puts `&amp;`, `&#39;`, `<p>` and
 *  `## Features` in front of the player.
 *
 *  Plain text rather than rendered Markdown on purpose: every call site is a
 *  one- or two-line clamped summary inside a row or a sidebar, so headings and
 *  images have nowhere to go. A real Markdown renderer belongs on a full
 *  project page, which the launcher does not have — it links out instead.
 *
 *  Order matters throughout and is commented where it is load-bearing. */

/** The named entities that actually turn up in mod descriptions. A full table
 *  would be ~2000 entries for no gain; numeric escapes below cover the tail. */
const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  bull: "•",
  middot: "·",
  copy: "©",
  reg: "®",
  trade: "™",
  deg: "°",
  times: "×",
  raquo: "»",
  laquo: "«",
  eacute: "é",
  egrave: "è",
  aacute: "á",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  ntilde: "ñ",
  uuml: "ü",
}

/** `&amp;`, `&#39;`, `&#x2019;`. Runs TWICE at the call site, deliberately:
 *  CurseForge double-escapes often enough (`&amp;lt;`) that a single pass
 *  leaves visible `&lt;` behind. A second pass is idempotent on clean input. */
function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]*);/gi, (whole, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10)
      // Surrogates and out-of-range values would throw; leave them as written.
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return whole
      if (code >= 0xd800 && code <= 0xdfff) return whole
      return String.fromCodePoint(code)
    }
    const named = NAMED[body.toLowerCase()]
    return named ?? whole
  })
}

function stripHtml(value: string): string {
  return (
    value
      // Script/style carry code, not prose — drop the CONTENT, not just tags.
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
      // Block boundaries become newlines before tags are erased, or every
      // paragraph in a CurseForge description runs into the next word.
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr|blockquote|pre)>/gi, "\n")
      .replace(/<(hr|\/table|\/ul|\/ol)\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
  )
}

function stripMarkdown(value: string): string {
  return (
    value
      // Fenced code first: its contents must not be read as markup below.
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/~~~[\s\S]*?~~~/g, " ")
      // Images before links — an image IS a link with a leading `!`, and the
      // link rule would otherwise turn `![alt](src)` into a stray `!`.
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/!\[[^\]]*\]\[[^\]]*\]/g, "")
      // Keep the link TEXT, drop the target.
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1")
      // Reference definitions sit on their own line and render as nothing.
      .replace(/^\s*\[[^\]]+\]:\s*\S+.*$/gm, "")
      // Bare autolinks.
      .replace(/<https?:\/\/[^>]+>/gi, "")
      .replace(/`([^`]*)`/g, "$1")
      // Leading block markers, line-anchored so prose is untouched.
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s{0,3}>\s?/gm, "")
      .replace(/^\s{0,3}([-*+]|\d+[.)])\s+/gm, "")
      .replace(/^\s{0,3}([-*_])(\s*\1){2,}\s*$/gm, "")
      // Emphasis. Bold before italic: `**x**` handled by the italic rule alone
      // would leave one asterisk on each side.
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(?=\S)(.*?\S)\1/g, "$2")
      .replace(/~~(.*?)~~/g, "$1")
      // Table pipes and the |---|---| separator row.
      .replace(/^\s*\|?[\s:|-]{4,}\|?\s*$/gm, "")
      .replace(/\s*\|\s*/g, " ")
  )
}

/** Collapse to something a clamped one-liner can show. Newlines survive as
 *  single spaces: `line-clamp-1` shows one line regardless, and a real newline
 *  would silently eat the rest of a two-line clamp. */
function collapse(value: string): string {
  return value
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim()
}

/** Full pipeline. Safe on plain text, and on already-clean input it is a
 *  no-op apart from whitespace. */
export function toPlainText(value: string | null | undefined): string {
  if (!value) return ""
  // Decode BEFORE stripping: CurseForge escapes the tags it sends, so
  // `&lt;p&gt;` is not a tag until this runs, and stripping first would leave
  // it on screen. The second decode catches double-escaping.
  const decoded = decodeEntities(decodeEntities(value))
  return collapse(stripMarkdown(stripHtml(decoded)))
}

/** One-line variant for row summaries: newlines become spaces so a clamp
 *  measures the whole string rather than stopping at the first break. */
export function toSummaryText(value: string | null | undefined): string {
  return toPlainText(value).replace(/\n+/g, " ")
}
