/**
 * Lightweight HTML sanitizer for battle log display.
 * Defense-in-depth: strips script tags, event handlers, and dangerous attributes.
 * The HTML source (@pkmn/view LogFormatter) is trusted, but user-supplied
 * replay text could contain crafted HTML.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // SSR: strip anything that looks like a script tag
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '');
  }

  // Client-side: use DOMParser for proper parsing
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Remove script tags
  doc.querySelectorAll('script').forEach((el) => el.remove());

  // Remove event handler attributes from all elements
  doc.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}
