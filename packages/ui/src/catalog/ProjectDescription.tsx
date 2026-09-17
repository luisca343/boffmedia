"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { cn } from "../cn";
import { uiOpenUrl } from "../i18n";
import { MarkdownCodeBlock } from "../markdown/CodeBlock";
import { MARKDOWN_CATALOG_CLASS } from "../markdown/styles";

// A catalogue project's long description, rendered the way the platform meant
// it — headings, lists, tables, images, links.
//
// Why a real renderer and not the plain-text stripper next door: this is the
// whole body of a project page. Flattening it loses the structure that makes it
// readable, and Modrinth descriptions lean on that structure heavily (feature
// lists, screenshot galleries, compatibility tables). `toSummaryText` is still
// correct for the one-line clamped summaries on cards; this is for the body.
//
// The two platforms disagree on format — Modrinth sends Markdown, CurseForge
// sends HTML — and one pipeline covers both: `remark-gfm` for the Markdown
// side, `rehype-raw` to parse embedded/raw HTML into the same tree. Modrinth
// needs `rehype-raw` too, not just CurseForge: its descriptions routinely carry
// raw `<img>`, `<p align="center">` and badge tables inline.

/** Raw HTML from a third party is untrusted, so the tree is sanitised AFTER
 *  `rehype-raw` parses it. Built from rehype's default schema — a permissive
 *  hand-written allowlist is how an `onerror` attribute or a `javascript:` href
 *  gets through.
 *
 *  The additions are the two things the default drops that matter here: image
 *  sizing attributes (descriptions rely on them heavily) and `className` on a
 *  handful of elements so platform-authored layout classes survive. */
const SCHEMA = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      "width",
      "height",
      "align",
      "loading",
    ],
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "align"],
  },
};

export function ProjectDescription({
  markup,
  className,
}: {
  /** Markdown (Modrinth) or HTML (CurseForge). Either is handled. */
  markup: string | null | undefined;
  className?: string;
}) {
  if (!markup?.trim()) return null;
  return (
    // Styling lives here rather than in a `prose` plugin: @boffmedia/ui carries
    // no typography plugin, and the launcher and the web app must render this
    // identically. Every rule is scoped to this container so a description
    // cannot restyle the page around it.
    <div
      className={cn(MARKDOWN_CATALOG_CLASS, className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // Order is load-bearing: raw HTML must be parsed into the tree BEFORE
        // it is sanitised, or the sanitiser never sees the nodes it exists to
        // check and they reach the DOM unexamined.
        rehypePlugins={[rehypeRaw, [rehypeSanitize, SCHEMA]]}
        components={{
          pre: MarkdownCodeBlock,
          // Every link leaves the app, so none of them may navigate the
          // webview itself — in Tauri that would replace the launcher UI with
          // a web page and strand the user with no back button.
          a: ({ href, children, ...rest }) => (
            <a
              {...rest}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              // Routed through the host rather than left to the browser: under
              // Tauri a plain navigation would load the page INSIDE the
              // launcher window. `uiOpenUrl` defaults to a new tab, so a plain
              // browser host needs no wiring.
              onClick={(event) => {
                if (!href) return;
                event.preventDefault();
                uiOpenUrl(href);
              }}
            >
              {children}
            </a>
          ),
          img: ({ src, alt, ...rest }) => (
            // `loading="lazy"`: a long description can carry twenty
            // screenshots, and fetching them all on open stalls the panel.
            <img {...rest} src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" />
          ),
        }}
      >
        {markup}
      </ReactMarkdown>
    </div>
  );
}
