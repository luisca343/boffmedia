// Knowledge-graph derivation — all computed client-side from note HTML, no API.
// A wikilink is authored as <a class="wikilink" data-title="Title">…</a> and may
// also appear as raw [[Title]] before the editor converts it.

export interface OutlineEntry {
  level: 1 | 2 | 3;
  text: string;
}

export interface GraphNode {
  id: number;
  title: string;
}

export interface GraphEdge {
  source: number;
  target: number;
}

/** Titles referenced by a note's content (deduped, order-preserving). */
export function extractLinks(html: string): string[] {
  const titles = new Set<string>();
  const anchorRe = /data-title="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(html || ""))) titles.add(decodeEntities(m[1]).trim());
  const rawRe = /\[\[([^\]]+)\]\]/g;
  while ((m = rawRe.exec(html || ""))) titles.add(m[1].trim());
  return [...titles].filter(Boolean);
}

/** Document outline (h1/h2/h3) for the context panel. */
export function outline(html: string): OutlineEntry[] {
  const out: OutlineEntry[] = [];
  const re = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html || ""))) {
    const text = m[2].replace(/<[^>]*>/g, "").trim();
    if (text) out.push({ level: Number(m[1]) as 1 | 2 | 3, text });
  }
  return out;
}

/** Notes that link *to* the given title. */
export function backlinksTo<T extends { id: number; title: string; content?: string }>(
  target: T,
  notes: T[],
): T[] {
  return notes.filter(
    (n) => n.id !== target.id && extractLinks(n.content ?? "").includes(target.title),
  );
}

/** Full link graph across the note set (edges point source → target note). */
export function buildGraph<T extends { id: number; title: string; content?: string }>(
  notes: T[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const byTitle = new Map(notes.map((n) => [n.title, n.id]));
  const edges: GraphEdge[] = [];
  for (const n of notes) {
    for (const title of extractLinks(n.content ?? "")) {
      const target = byTitle.get(title);
      if (target != null && target !== n.id) edges.push({ source: n.id, target });
    }
  }
  return { nodes: notes.map((n) => ({ id: n.id, title: n.title })), edges };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
