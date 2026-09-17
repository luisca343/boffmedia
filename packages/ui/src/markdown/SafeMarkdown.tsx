"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "../cn";
import { uiOpenUrl } from "../i18n";
import { MarkdownCodeBlock } from "./CodeBlock";

/**
 * Renderer for first-party Markdown that is allowed to contain structure but
 * never arbitrary HTML. Changelog bodies are customer-authored content, so
 * images, embeds, event handlers and raw HTML are intentionally unavailable.
 */
export function SafeMarkdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("safe-markdown", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url) => (isSafeUrl(url) ? url : "")}
        components={{
          pre: MarkdownCodeBlock,
          // Keep links from replacing the desktop shell. The same host hook is
          // a normal browser navigation on the web host.
          a: ({ href, children: linkChildren, ...rest }) => {
            if (!href || !isSafeUrl(href)) return <span>{linkChildren}</span>;
            const external = isExternalUrl(href);
            return (
              <a
                {...rest}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                onClick={(event) => {
                  if (!external) return;
                  event.preventDefault();
                  uiOpenUrl(href);
                }}
              >
                {linkChildren}
              </a>
            );
          },
          // Images are not part of V1, even when Markdown syntax is supplied.
          img: () => null,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  try {
    const protocol = new URL(trimmed).protocol.toLowerCase();
    return (
      protocol === "https:" || protocol === "http:" || protocol === "mailto:"
    );
  } catch {
    return false;
  }
}

function isExternalUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return false;
  try {
    return ["https:", "http:", "mailto:"].includes(
      new URL(trimmed).protocol.toLowerCase(),
    );
  } catch {
    return false;
  }
}
