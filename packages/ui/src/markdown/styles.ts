/**
 * Markdown styles for Boffmedia.
 *
 * Designed for:
 * - react-markdown
 * - remark-gfm
 *
 * The standard and catalog variants share the same visual language while
 * intentionally using different densities.
 *
 * Syntax highlighting is NOT provided by these classes. remark-gfm adds
 * language-* classes to fenced code blocks, but a syntax highlighter is
 * required to color individual tokens.
 */

/* -------------------------------------------------------------------------- */
/* Shared Markdown rhythm                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Structural Markdown rhythm shared by first-party surfaces.
 *
 * Keep typography, colors and decorative styling out of this preset.
 * Surfaces can add their own skin while preserving document rhythm.
 */
export const MARKDOWN_LAYOUT_CLASS = [
  // Headings
  "[&_h1]:mt-10",
  "[&_h2]:mt-9",
  "[&_h3]:mt-7",
  "[&_h4]:mt-6",
  "[&_h5]:mt-5",
  "[&_h6]:mt-5",

  // No artificial top spacing.
  "[&_h1:first-child]:mt-0",
  "[&_h2:first-child]:mt-0",
  "[&_h3:first-child]:mt-0",
  "[&_h4:first-child]:mt-0",
  "[&_h5:first-child]:mt-0",
  "[&_h6:first-child]:mt-0",

  // Paragraphs
  "[&_p]:my-4",
  "[&_p:first-child]:mt-0",
  "[&_p:last-child]:mb-0",

  // Lists
  "[&_ul]:my-4",
  "[&_ol]:my-4",
  "[&_ul]:list-outside",
  "[&_ol]:list-outside",
  "[&_ul]:list-disc",
  "[&_ol]:list-decimal",
  "[&_ul]:pl-6",
  "[&_ol]:pl-6",

  "[&_li]:my-1",
  "[&_li]:pl-1",

  // Nested lists are deliberately tighter.
  "[&_li>ul]:my-1.5",
  "[&_li>ol]:my-1.5",

  // Other blocks
  "[&_blockquote]:my-5",
  "[&_pre]:my-5",
  "[&_table]:my-5",
  "[&_img]:my-5",
  "[&_hr]:my-8",

  // No unnecessary space at the end of a container.
  "[&_blockquote:last-child]:mb-0",
  "[&_pre:last-child]:mb-0",
  "[&_table:last-child]:mb-0",
  "[&_img:last-child]:mb-0",
].join(" ")

/**
 * Chrome for highlighted fenced code.
 *
 * Shiki supplies the token colors using `light-dark()`. These rules bind that
 * function to Boffmedia's explicit `data-theme` switch; the actual palette
 * remains owned by Shiki.
 */
export const MARKDOWN_CODE_BLOCK_CLASS = [
  "relative overflow-hidden rounded-md border border-solid border-line bg-panel-2",
  "[&_pre]:m-0",
  "[&_pre]:overflow-x-auto",
  "[&_pre]:bg-transparent",
  "[&_pre]:p-4",
  "[&_pre]:font-mono",
  "[&_pre]:text-[0.8125rem]",
  "[&_pre]:leading-6",
  "[&_pre]:text-txt",
  "[&_pre]:tab-4",
  "[&_pre_code]:border-0",
  "[&_pre_code]:rounded-none",
  "[&_pre_code]:bg-transparent",
  "[&_pre_code]:p-0",
  "[&_pre_code]:font-inherit",
  "[&_pre_code]:font-normal",
  "[&_pre_code]:text-inherit",
  "[color-scheme:dark]",
  "[[data-theme=light]_&]:[color-scheme:light]",
].join(" ")

/* -------------------------------------------------------------------------- */
/* Standard Boffmedia Markdown                                                */
/* -------------------------------------------------------------------------- */

/**
 * Default first-party Markdown presentation.
 *
 * Heading hierarchy:
 *
 * H1 — document title
 * H2 — major section
 * H3 — subsection
 * H4 — minor subsection
 * H5 — structural label
 * H6 — secondary/muted label
 */
export const MARKDOWN_CLASS = [
  /* Base ----------------------------------------------------------------- */

  "max-w-[68ch]",
  "font-body",
  "text-[0.9375rem]",
  "leading-7",
  "text-txt",

  MARKDOWN_LAYOUT_CLASS,

  /* H1 ------------------------------------------------------------------- */

  "[&_h1]:font-display",
  "[&_h1]:text-[1.75rem]",
  "[&_h1]:leading-[1.15]",
  "[&_h1]:font-bold",
  "[&_h1]:uppercase",
  "[&_h1]:tracking-[0.015em]",
  "[&_h1]:text-txt",

  /* H2 ------------------------------------------------------------------- */

  "[&_h2]:font-display",
  "[&_h2]:text-[1.375rem]",
  "[&_h2]:leading-[1.25]",
  "[&_h2]:font-bold",
  "[&_h2]:uppercase",
  "[&_h2]:tracking-[0.02em]",
  "[&_h2]:text-txt",

  /* H3 ------------------------------------------------------------------- */

  "[&_h3]:font-display",
  "[&_h3]:text-[1.125rem]",
  "[&_h3]:leading-[1.35]",
  "[&_h3]:font-bold",
  "[&_h3]:text-txt",

  /* H4 ------------------------------------------------------------------- */

  "[&_h4]:font-body",
  "[&_h4]:text-[1rem]",
  "[&_h4]:leading-6",
  "[&_h4]:font-bold",
  "[&_h4]:text-txt",

  /* H5 ------------------------------------------------------------------- */

  "[&_h5]:font-body",
  "[&_h5]:text-sm",
  "[&_h5]:leading-5",
  "[&_h5]:font-bold",
  "[&_h5]:uppercase",
  "[&_h5]:tracking-[0.06em]",
  "[&_h5]:text-txt",

  /* H6 ------------------------------------------------------------------- */

  "[&_h6]:font-body",
  "[&_h6]:text-[0.8125rem]",
  "[&_h6]:leading-5",
  "[&_h6]:font-bold",
  "[&_h6]:uppercase",
  "[&_h6]:tracking-[0.08em]",
  "[&_h6]:text-txt-muted",

  /* Text ----------------------------------------------------------------- */

  "[&_strong]:font-semibold",
  "[&_strong]:text-txt",

  "[&_em]:italic",

  // GFM strikethrough.
  "[&_del]:text-txt-muted",
  "[&_del]:decoration-current/70",

  /* Links ---------------------------------------------------------------- */

  "[&_a]:font-semibold",
  "[&_a]:text-accent",
  "[&_a]:underline",
  "[&_a]:decoration-current/50",
  "[&_a]:decoration-1",
  "[&_a]:underline-offset-[3px]",
  "[&_a]:transition-colors",

  "hover:[&_a]:text-accent-bright",
  "hover:[&_a]:decoration-current",

  "focus-visible:[&_a]:outline-none",
  "focus-visible:[&_a]:ring-2",
  "focus-visible:[&_a]:ring-accent",
  "focus-visible:[&_a]:ring-offset-2",
  "focus-visible:[&_a]:ring-offset-panel",

  /* Lists ---------------------------------------------------------------- */

  "[&_li]:marker:text-txt-muted",

  // Give deeper unordered lists a visible hierarchy.
  "[&_ul_ul]:list-[circle]",
  "[&_ul_ul_ul]:list-[square]",

  // Loose CommonMark lists can contain <p> elements.
  "[&_li>p]:my-2",
  "[&_li>p:first-child]:mt-0",
  "[&_li>p:last-child]:mb-0",

  /* GFM task lists ------------------------------------------------------- */

  "[&_input[type=checkbox]]:mr-2",
  "[&_input[type=checkbox]]:size-4",
  "[&_input[type=checkbox]]:align-[-2px]",
  "[&_input[type=checkbox]]:accent-accent",

  "[&_li:has(>input[type=checkbox])]:list-none",
  "[&_li:has(>input[type=checkbox])]:pl-0",

  /* Blockquotes ---------------------------------------------------------- */

  "[&_blockquote]:border-l-[3px]",
  "[&_blockquote]:border-solid",
  "[&_blockquote]:border-accent",
  "[&_blockquote]:bg-panel-2",
  "[&_blockquote]:py-3",
  "[&_blockquote]:pr-4",
  "[&_blockquote]:pl-5",
  "[&_blockquote]:not-italic",
  "[&_blockquote]:text-txt-muted",

  "[&_blockquote>p:first-child]:mt-0",
  "[&_blockquote>p:last-child]:mb-0",

  // Keep emphasis readable inside quotes.
  "[&_blockquote_strong]:text-txt",

  // Nested blockquotes.
  "[&_blockquote_blockquote]:my-3",
  "[&_blockquote_blockquote]:bg-transparent",

  /* Inline code ---------------------------------------------------------- */

  "[&_code]:rounded",
  "[&_code]:border",
  "[&_code]:border-solid",
  "[&_code]:border-line-2",
  "[&_code]:bg-panel-2",
  "[&_code]:px-1.5",
  "[&_code]:py-0.5",
  "[&_code]:font-mono",
  "[&_code]:text-[0.875em]",
  "[&_code]:font-medium",
  "[&_code]:text-accent-bright",

  /* Code blocks ---------------------------------------------------------- */

  /*
   * Fenced code intentionally uses text-txt rather than text-txt-dim.
   *
   * Without a syntax highlighter, react-markdown renders the entire block
   * as one color. Using the primary text color keeps it readable instead
   * of making the whole block appear muted/gray.
   */
  "[&_pre]:overflow-x-auto",
  "[&_pre]:rounded-md",
  "[&_pre]:border",
  "[&_pre]:border-solid",
  "[&_pre]:border-line",
  "[&_pre]:bg-panel-2",
  "[&_pre]:p-4",
  "[&_pre]:font-mono",
  "[&_pre]:text-[0.8125rem]",
  "[&_pre]:leading-6",
  "[&_pre]:text-txt",
  "[&_pre]:tab-4",

  /*
   * Reset the inline-code skin inside fenced code blocks.
   *
   * <pre>
   *   <code class="language-ts">...</code>
   * </pre>
   */
  "[&_pre_code]:border-0",
  "[&_pre_code]:rounded-none",
  "[&_pre_code]:bg-transparent",
  "[&_pre_code]:p-0",
  "[&_pre_code]:font-inherit",
  "[&_pre_code]:font-normal",
  "[&_pre_code]:text-inherit",

  /* Horizontal rules ----------------------------------------------------- */

  "[&_hr]:border-0",
  "[&_hr]:border-t",
  "[&_hr]:border-solid",
  "[&_hr]:border-line",

  /* Images --------------------------------------------------------------- */

  "[&_img]:block",
  "[&_img]:h-auto",
  "[&_img]:max-w-full",
  "[&_img]:rounded-md",

  /* Tables --------------------------------------------------------------- */

  /*
   * Prefer wrapping tables in an overflow-x-auto element using the
   * react-markdown table component. Do not set <table> to display:block.
   */
  "[&_table]:w-full",
  "[&_table]:border-collapse",
  "[&_table]:text-[0.875rem]",
  "[&_table]:leading-6",

  "[&_thead]:bg-panel-2",

  "[&_th]:border",
  "[&_th]:border-solid",
  "[&_th]:border-line",
  "[&_th]:px-3",
  "[&_th]:py-2",
  "[&_th]:text-left",
  "[&_th]:align-bottom",
  "[&_th]:font-semibold",
  "[&_th]:text-txt",

  "[&_td]:border",
  "[&_td]:border-solid",
  "[&_td]:border-line",
  "[&_td]:px-3",
  "[&_td]:py-2",
  "[&_td]:align-top",

  "[&_tbody_tr]:transition-colors",
  "hover:[&_tbody_tr]:bg-panel-2/50",
].join(" ")

/* -------------------------------------------------------------------------- */
/* Compact catalog Markdown                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Compact Markdown/HTML description presentation.
 *
 * Catalog content deliberately owns its spacing instead of inheriting
 * MARKDOWN_LAYOUT_CLASS and overriding most of it.
 *
 * It follows the same hierarchy as MARKDOWN_CLASS at a smaller scale.
 */
export const MARKDOWN_CATALOG_CLASS = [
  /* Base ----------------------------------------------------------------- */

  "max-w-none",
  "font-body",
  "text-[0.8125rem]",
  "leading-[1.65]",
  "text-txt-dim",

  /* H1 ------------------------------------------------------------------- */

  "[&_h1]:mt-6",
  "[&_h1:first-child]:mt-0",
  "[&_h1]:font-display",
  "[&_h1]:text-[1.25rem]",
  "[&_h1]:leading-[1.2]",
  "[&_h1]:font-bold",
  "[&_h1]:uppercase",
  "[&_h1]:tracking-[0.025em]",
  "[&_h1]:text-txt",

  /* H2 ------------------------------------------------------------------- */

  "[&_h2]:mt-5",
  "[&_h2:first-child]:mt-0",
  "[&_h2]:font-display",
  "[&_h2]:text-[1.0625rem]",
  "[&_h2]:leading-[1.3]",
  "[&_h2]:font-bold",
  "[&_h2]:uppercase",
  "[&_h2]:tracking-[0.03em]",
  "[&_h2]:text-txt",

  /* H3 ------------------------------------------------------------------- */

  "[&_h3]:mt-4",
  "[&_h3:first-child]:mt-0",
  "[&_h3]:font-display",
  "[&_h3]:text-[0.9375rem]",
  "[&_h3]:leading-[1.4]",
  "[&_h3]:font-bold",
  "[&_h3]:text-txt",

  /* H4 ------------------------------------------------------------------- */

  "[&_h4]:mt-4",
  "[&_h4:first-child]:mt-0",
  "[&_h4]:font-body",
  "[&_h4]:text-[0.875rem]",
  "[&_h4]:leading-5",
  "[&_h4]:font-bold",
  "[&_h4]:text-txt",

  /* H5 ------------------------------------------------------------------- */

  "[&_h5]:mt-3",
  "[&_h5:first-child]:mt-0",
  "[&_h5]:font-body",
  "[&_h5]:text-xs",
  "[&_h5]:leading-5",
  "[&_h5]:font-bold",
  "[&_h5]:uppercase",
  "[&_h5]:tracking-[0.06em]",
  "[&_h5]:text-txt",

  /* H6 ------------------------------------------------------------------- */

  "[&_h6]:mt-3",
  "[&_h6:first-child]:mt-0",
  "[&_h6]:font-body",
  "[&_h6]:text-[0.6875rem]",
  "[&_h6]:leading-5",
  "[&_h6]:font-bold",
  "[&_h6]:uppercase",
  "[&_h6]:tracking-[0.08em]",
  "[&_h6]:text-txt-muted",

  /* Paragraphs ----------------------------------------------------------- */

  "[&_p]:my-2.5",
  "[&_p:first-child]:mt-0",
  "[&_p:last-child]:mb-0",

  /* Text ----------------------------------------------------------------- */

  "[&_strong]:font-bold",
  "[&_strong]:text-txt",

  "[&_em]:italic",

  "[&_del]:text-txt-muted",
  "[&_del]:decoration-current/70",

  /* Links ---------------------------------------------------------------- */

  "[&_a]:font-medium",
  "[&_a]:text-accent-bright",
  "[&_a]:underline",
  "[&_a]:decoration-current/50",
  "[&_a]:underline-offset-2",
  "[&_a]:transition-colors",

  "hover:[&_a]:text-txt",
  "hover:[&_a]:decoration-current",

  "focus-visible:[&_a]:outline-none",
  "focus-visible:[&_a]:ring-1",
  "focus-visible:[&_a]:ring-accent",

  /* Lists ---------------------------------------------------------------- */

  "[&_ul]:my-2.5",
  "[&_ol]:my-2.5",
  "[&_ul]:list-outside",
  "[&_ol]:list-outside",
  "[&_ul]:list-disc",
  "[&_ol]:list-decimal",
  "[&_ul]:pl-5",
  "[&_ol]:pl-5",

  "[&_li]:my-0.5",
  "[&_li]:pl-0.5",
  "[&_li]:marker:text-txt-muted",

  "[&_li>ul]:my-1",
  "[&_li>ol]:my-1",

  "[&_ul_ul]:list-[circle]",
  "[&_ul_ul_ul]:list-[square]",

  "[&_li>p]:my-1",
  "[&_li>p:first-child]:mt-0",
  "[&_li>p:last-child]:mb-0",

  /* GFM task lists ------------------------------------------------------- */

  "[&_input[type=checkbox]]:mr-1.5",
  "[&_input[type=checkbox]]:size-3.5",
  "[&_input[type=checkbox]]:align-[-2px]",
  "[&_input[type=checkbox]]:accent-accent",

  "[&_li:has(>input[type=checkbox])]:list-none",
  "[&_li:has(>input[type=checkbox])]:pl-0",

  /* Blockquotes ---------------------------------------------------------- */

  "[&_blockquote]:my-3",
  "[&_blockquote]:border-l-2",
  "[&_blockquote]:border-solid",
  "[&_blockquote]:border-accent-line",
  "[&_blockquote]:bg-panel-2/50",
  "[&_blockquote]:py-1.5",
  "[&_blockquote]:pr-3",
  "[&_blockquote]:pl-3",
  "[&_blockquote]:not-italic",
  "[&_blockquote]:text-txt-muted",

  "[&_blockquote>p:first-child]:mt-0",
  "[&_blockquote>p:last-child]:mb-0",

  "[&_blockquote_strong]:text-txt",

  "[&_blockquote_blockquote]:my-2",
  "[&_blockquote_blockquote]:bg-transparent",

  /* Inline code ---------------------------------------------------------- */

  "[&_code]:rounded",
  "[&_code]:bg-panel-2",
  "[&_code]:px-1",
  "[&_code]:py-px",
  "[&_code]:font-mono",
  "[&_code]:text-xs",
  "[&_code]:font-medium",
  "[&_code]:text-accent-bright",

  /* Code blocks ---------------------------------------------------------- */

  "[&_pre]:my-3",
  "[&_pre]:overflow-x-auto",
  "[&_pre]:rounded",
  "[&_pre]:border",
  "[&_pre]:border-solid",
  "[&_pre]:border-line",
  "[&_pre]:bg-panel-2",
  "[&_pre]:p-3",
  "[&_pre]:font-mono",
  "[&_pre]:text-xs",
  "[&_pre]:leading-5",

  // Important: normal foreground, not muted catalog foreground.
  "[&_pre]:text-txt",

  "[&_pre]:tab-4",

  // Reset inline-code presentation.
  "[&_pre_code]:border-0",
  "[&_pre_code]:rounded-none",
  "[&_pre_code]:bg-transparent",
  "[&_pre_code]:p-0",
  "[&_pre_code]:font-inherit",
  "[&_pre_code]:font-normal",
  "[&_pre_code]:text-inherit",

  /* Horizontal rules ----------------------------------------------------- */

  "[&_hr]:my-5",
  "[&_hr]:border-0",
  "[&_hr]:border-t",
  "[&_hr]:border-solid",
  "[&_hr]:border-line",

  /* Images --------------------------------------------------------------- */

  "[&_img]:my-3",
  "[&_img]:block",
  "[&_img]:h-auto",
  "[&_img]:max-w-full",
  "[&_img]:rounded",

  /* Tables --------------------------------------------------------------- */

  "[&_table]:my-3",
  "[&_table]:w-full",
  "[&_table]:border-collapse",
  "[&_table]:text-xs",
  "[&_table]:leading-5",

  "[&_thead]:bg-panel-2",

  "[&_th]:border",
  "[&_th]:border-solid",
  "[&_th]:border-line",
  "[&_th]:px-2",
  "[&_th]:py-1.5",
  "[&_th]:text-left",
  "[&_th]:align-bottom",
  "[&_th]:font-bold",
  "[&_th]:text-txt",

  "[&_td]:border",
  "[&_td]:border-solid",
  "[&_td]:border-line",
  "[&_td]:px-2",
  "[&_td]:py-1.5",
  "[&_td]:align-top",

  "[&_tbody_tr]:transition-colors",
  "hover:[&_tbody_tr]:bg-panel-2/50",
].join(" ")
