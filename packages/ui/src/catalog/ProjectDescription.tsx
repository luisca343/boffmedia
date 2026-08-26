"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { cn } from "../cn";
import { uiOpenUrl } from "../i18n";

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
      className={cn(
        "font-body text-[13px] leading-[1.6] text-txt-dim",
        "[&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:font-display [&_h1]:text-[18px] [&_h1]:font-bold [&_h1]:uppercase [&_h1]:tracking-[0.03em] [&_h1]:text-txt",
        "[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-[16px] [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-[0.03em] [&_h2]:text-txt",
        "[&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:font-display [&_h3]:text-[14px] [&_h3]:font-bold [&_h3]:text-txt",
        "[&_h4]:mb-1 [&_h4]:mt-3 [&_h4]:font-bold [&_h4]:text-txt [&_h5]:font-bold [&_h5]:text-txt [&_h6]:font-bold [&_h6]:text-txt",
        "[&_p]:my-2",
        "[&_strong]:font-bold [&_strong]:text-txt [&_em]:italic",
        // `list-outside` + padding, so a wrapped bullet lines up under its text
        // instead of under the marker.
        "[&_ul]:my-2 [&_ul]:list-outside [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-2 [&_ol]:list-outside [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:my-[2px] [&_li]:marker:text-txt-muted",
        "[&_a]:text-accent-bright [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-txt",
        // Descriptions are full of full-width screenshots; without max-width
        // they force the whole panel to scroll sideways.
        "[&_img]:my-2 [&_img]:inline-block [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded",
        "[&_hr]:my-4 [&_hr]:border-line",
        "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-solid [&_blockquote]:border-accent-line [&_blockquote]:pl-3 [&_blockquote]:italic",
        "[&_code]:rounded [&_code]:bg-panel-2 [&_code]:px-1 [&_code]:py-[1px] [&_code]:font-mono [&_code]:text-[12px]",
        "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-panel-2 [&_pre]:p-2",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        // The table itself scrolls, not the page — same reason as images.
        "[&_table]:my-2 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse",
        "[&_th]:border [&_th]:border-solid [&_th]:border-line [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-bold [&_th]:text-txt",
        "[&_td]:border [&_td]:border-solid [&_td]:border-line [&_td]:px-2 [&_td]:py-1",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // Order is load-bearing: raw HTML must be parsed into the tree BEFORE
        // it is sanitised, or the sanitiser never sees the nodes it exists to
        // check and they reach the DOM unexamined.
        rehypePlugins={[rehypeRaw, [rehypeSanitize, SCHEMA]]}
        components={{
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
