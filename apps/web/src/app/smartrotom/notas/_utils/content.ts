// Pure HTML helpers — regex-based so they run on server or client. Note content
// is trusted HTML authored in our own editor.

export function stripHtml(html: string): string {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(html: string): number {
  const text = stripHtml(html);
  return text ? text.split(/\s+/).length : 0;
}

export function extractTitle(html: string): string {
  const m = (html || "").match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? stripHtml(m[1]) : "";
}

/** First body text after the H1 title, for list snippets. */
export function snippet(html: string, max = 140): string {
  const body = (html || "").replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "");
  const text = stripHtml(body);
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}
