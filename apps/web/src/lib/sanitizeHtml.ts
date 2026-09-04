import sanitizeHtml from "sanitize-html";

/**
 * The render-side half of the rich-text XSS gate.
 *
 * CKEditor is not a sanitizer. The build in `src/ckeditor5/src/ckeditor.ts`
 * ships `SourceEditing`, `HtmlEmbed` and `GeneralHtmlSupport`, so an author
 * with newsroom access can type a `<script>` (or drop one into a
 * `<div class="raw-html-embed">`) and it round-trips verbatim. Every screen
 * that injects that HTML with `dangerouslySetInnerHTML` therefore has to pass
 * it through here first — the API sanitizes on write, but rows written before
 * that gate landed are still in the table, and an API bug must not be one hop
 * away from a stored XSS on every reader.
 *
 * The allowlist below is derived from what that CKEditor build actually
 * emits, not from a generic "safe HTML" list. Its twin is
 * `apps/api/src/common/html/sanitize-rich-text.ts`, deliberately the same
 * library with the same options so the two are diffable line by line — change
 * one and you must change the other, or the API stores markup the reader
 * silently drops. They are not a shared package: the only thing worth sharing
 * is a list of strings, and a workspace package would have to be registered in
 * `scripts/typecheck-sequential.js` to be type-checked at all.
 *
 * Why `sanitize-html` and not DOMPurify: DOMPurify needs a DOM, so on the
 * server it means `isomorphic-dompurify` → jsdom. Next lists `jsdom` in its
 * built-in `serverExternalPackages`, so the standalone server `require()`s it
 * at runtime — and jsdom 30 pulls an ESM-only transitive that Node 22.6 cannot
 * `require()`. SSR would die with ERR_REQUIRE_ESM the moment this module
 * loaded. `sanitize-html` parses with htmlparser2 and needs no DOM at all, so
 * the same code runs in the browser and during SSR and produces byte-identical
 * markup — which is also what keeps hydration quiet.
 *
 * `sanitize-html` is pinned to `~2.13.x` for that same reason: from 2.14 it
 * depends on an ESM-only htmlparser2. Widen it only once the runtime is on
 * Node >= 22.12.
 */

/**
 * Tags the enabled plugins produce. The non-obvious ones:
 * - `figure`/`figcaption`  — Image + ImageCaption, Table + TableCaption
 * - `label`/`input`        — TodoList renders one disabled checkbox per item
 * - `colgroup`/`col`       — emitted by the table column-resize downcast
 * - `oembed`               — MediaEmbed's data format (`<figure class="media">`)
 * - `div`                  — the `.callout` blocks NotesEditor's `htmlSupport`
 *                            round-trips, plus CKEditor's page-break markup
 */
const ALLOWED_TAGS = [
  "p", "br", "hr", "span", "div",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "del", "ins", "mark", "small",
  "sub", "sup", "code", "pre", "kbd",
  "blockquote", "figure", "figcaption", "img", "a",
  "ul", "ol", "li", "label", "input",
  "table", "thead", "tbody", "tfoot", "tr", "td", "th",
  "caption", "colgroup", "col",
  "oembed",
];

/**
 * Inline styles survive because Alignment, FontColor/Size/Family, IndentBlock
 * and ImageResize all write them — dropping `style` would visibly break every
 * existing article. `url(` is refused outright rather than scheme-checked:
 * nothing CKEditor emits needs it, and it is the one CSS construct that can
 * still fetch or execute. Braces and angle brackets are refused so a value can
 * never close the declaration and open a new rule.
 */
const SAFE_CSS_VALUE = [/^(?!.*(?:url\s*\(|expression\s*\(|javascript:))[^;{}<>]+$/i];

const STYLED_PROPERTIES = [
  "color", "background-color", "background",
  "font-size", "font-family", "font-weight", "font-style",
  "text-align", "text-decoration", "text-indent",
  "margin", "margin-left", "margin-right", "margin-top", "margin-bottom",
  "padding", "padding-left", "padding-right", "padding-top", "padding-bottom",
  "width", "height", "aspect-ratio", "vertical-align",
  "border", "border-color", "border-style", "border-width", "border-radius",
  "border-top", "border-right", "border-bottom", "border-left",
  "list-style-type", "white-space",
];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    // `on*` handlers are absent by construction — anything not named here is
    // dropped, so there is no handler list to keep up to date.
    "*": ["class", "style", "id", "dir", "lang", "title"],
    a: ["href", "target", "rel", "name", "data-title"],
    img: ["src", "alt", "srcset", "sizes", "width", "height", "loading"],
    span: ["data-mention"],
    div: ["data-kind"],
    input: ["type", "checked", "disabled", "value"],
    td: ["colspan", "rowspan", "headers"],
    th: ["colspan", "rowspan", "headers", "scope"],
    col: ["span"],
    colgroup: ["span"],
    oembed: ["url"],
  },
  allowedStyles: {
    "*": Object.fromEntries(STYLED_PROPERTIES.map((p) => [p, SAFE_CSS_VALUE])),
  },
  allowedSchemes: ["http", "https", "mailto"],
  // Base64UploadAdapter stores pasted images inline as `data:image/...`, so
  // `<img>` needs `data:` — and only `<img>`. `data:text/html` on an `<a>` is
  // an XSS in every browser that still navigates to it.
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowedSchemesAppliedToAttributes: ["href", "src", "srcset", "url"],
  // A disallowed tag normally keeps its text; these lose theirs with it,
  // otherwise `<script>alert(1)</script>` would come back out as the visible
  // string "alert(1)". `noscript` is the addition to sanitize-html’s default.
  nonTextTags: ["script", "style", "textarea", "option", "noscript"],
};

/**
 * Sanitize author-written HTML before injecting it with
 * `dangerouslySetInnerHTML`.
 *
 * Returns `""` for empty input rather than throwing: callers pass optional API
 * fields straight through, and a missing body is a loading state, not an error.
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTIONS);
}
