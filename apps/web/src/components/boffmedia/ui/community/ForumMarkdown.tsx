import * as React from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

// Renders a forum post body (markdown) as v3 «Señal» prose. GFM is enabled;
// raw HTML is intentionally NOT (no rehype-raw) so user posts cannot inject
// markup — the renderer is XSS-safe by construction.

function hasNewline(children: React.ReactNode): boolean {
  if (typeof children === "string") return children.includes("\n")
  if (Array.isArray(children)) return children.some(hasNewline)
  return false
}

const components: Components = {
  h1: ({ node, ...props }) => (
    <h3 className="mb-3 mt-6 font-display text-[22px]/[1.15] font-bold uppercase not-italic tracking-[0.01em] text-txt first:mt-0" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h3 className="mb-3 mt-6 font-display text-[19px]/[1.15] font-bold uppercase not-italic tracking-[0.01em] text-txt first:mt-0" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h4 className="mb-2.5 mt-5 font-display text-[16px]/[1.2] font-bold uppercase not-italic tracking-[0.02em] text-txt first:mt-0" {...props} />
  ),
  p: ({ node, ...props }) => <p className="my-3 font-body text-[15px]/[1.65] text-txt-muted first:mt-0 last:mb-0" {...props} />,
  ul: ({ node, ...props }) => (
    <ul className="my-3 grid gap-1.5 pl-5 font-body text-[15px]/[1.6] text-txt-muted marker:text-accent [list-style:disc]" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="my-3 grid gap-1.5 pl-5 font-body text-[15px]/[1.6] text-txt-muted marker:font-mono marker:font-semibold marker:text-accent [list-style:decimal]" {...props} />
  ),
  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
  a: ({ node, href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="font-medium text-accent underline decoration-accent-line underline-offset-2 transition-colors hover:text-accent-bright"
      {...props}
    />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote className="my-4 border-l-2 border-solid border-accent bg-panel-2 py-1 pl-4 font-body text-[15px]/[1.6] italic text-txt-muted" {...props} />
  ),
  pre: ({ node, ...props }) => (
    <pre
      className="my-4 overflow-x-auto border border-solid border-line bg-panel-2 p-4 font-mono text-[13px]/[1.6] text-txt cut-corner"
      {...props}
    />
  ),
  code: ({ node, className, children, ...props }) => {
    const block = (typeof className === "string" && className.startsWith("language-")) || hasNewline(children)
    if (block) {
      // Inside <pre>: render bare so the <pre> supplies the block chrome.
      return (
        <code className={cn("font-mono", className)} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code className="border border-solid border-line-2 bg-panel-2 px-1.5 py-0.5 font-mono text-[0.88em] text-accent" {...props}>
        {children}
      </code>
    )
  },
  strong: ({ node, ...props }) => <strong className="font-semibold text-txt" {...props} />,
  em: ({ node, ...props }) => <em className="italic" {...props} />,
  hr: ({ node, ...props }) => <hr className="my-5 border-0 border-t border-solid border-line" {...props} />,
}

export function ForumMarkdown({ children }: { children: string }) {
  return (
    <div className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
