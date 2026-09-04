/**
 * HTML sanitizer for the battle log and the battle chat.
 *
 * Two very different sources land here. `@pkmn/view`'s LogFormatter output is
 * ours and predictable; chat messages are typed by the other player. So this is
 * not defense-in-depth, it is the only gate on that second source.
 *
 * Allowlist, not blocklist. The previous version deleted `<script>` and `on*`
 * attributes and kept everything else, which still let a chat line through as
 * `<a href="javascript:…">` or an `<iframe>`. Anything not named below is
 * unwrapped (its text survives, the element does not), so a new attack surface
 * has to be added on purpose rather than merely not thought of.
 *
 * No sanitizer library here on purpose: this package is bundled into the Tauri
 * renderer as well as the web app, and the markup it handles is a handful of
 * tags. The CKEditor documents elsewhere in the product are a different problem
 * with a different allowlist — see `apps/web/src/lib/sanitizeHtml.ts`.
 */

/** Everything the LogFormatter and the chat formatter can emit. */
const ALLOWED_TAGS = new Set([
  'b', 'strong', 'i', 'em', 'u', 's', 'del', 'code', 'small', 'br',
  'span', 'div', 'p', 'abbr', 'a', 'img', 'ul', 'ol', 'li', 'psicon',
]);

/** Per-tag attribute allowlist; `*` applies to every allowed tag. */
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  '*': new Set(['class', 'style', 'title', 'aria-label']),
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height']),
  abbr: new Set(['title']),
  psicon: new Set(['pokemon', 'item', 'type']),
};

/**
 * `javascript:` and `data:` are the two schemes that execute. Relative and
 * protocol-relative URLs have no scheme at all, so they pass the test by
 * having nothing before the first `:`.
 */
const UNSAFE_SCHEME = /^\s*(?:javascript|data|vbscript|file)\s*:/i;

function attrAllowed(tag: string, name: string): boolean {
  if (name.startsWith('on')) return false;
  return ALLOWED_ATTRS['*'].has(name) || (ALLOWED_ATTRS[tag]?.has(name) ?? false);
}

export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // SSR / worker: no DOM to parse with, so escape rather than guess. A regex
  // stripper loses to `<scr<script>ipt>`; the log is re-rendered on the client
  // the moment it hydrates, so the escaped pass is never what a user reads.
  if (typeof DOMParser === 'undefined') {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Snapshot the list first: unwrapping mutates the tree, and a live
  // NodeList would skip siblings as they shift.
  for (const el of Array.from(doc.body.querySelectorAll('*'))) {
    const tag = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      // Unwrap rather than remove, so a stray wrapper does not eat the message.
      // `<script>`/`<style>` are the exception: their text content IS the
      // payload, so it goes with them.
      if (tag === 'script' || tag === 'style' || tag === 'iframe') el.remove();
      else el.replaceWith(...Array.from(el.childNodes));
      continue;
    }

    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (!attrAllowed(tag, name)) {
        el.removeAttribute(attr.name);
      } else if ((name === 'href' || name === 'src') && UNSAFE_SCHEME.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }

    // Any link that survives opens in a new tab without handing the opener
    // window to the target page.
    if (tag === 'a' && el.getAttribute('target') === '_blank') {
      el.setAttribute('rel', 'noopener noreferrer');
    }
  }

  return doc.body.innerHTML;
}
