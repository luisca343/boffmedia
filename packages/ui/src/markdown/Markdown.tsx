import * as React from "react"

import { cn } from "../cn"
import { SafeMarkdown } from "./SafeMarkdown"
import { MARKDOWN_CLASS } from "./styles"

export interface MarkdownProps {
  children: string
  className?: string
  onOpenLink?: (url: string) => void
}

/** First-party Markdown renderer with the shared Boffmedia typography preset. */
export function Markdown({ children, className, onOpenLink }: MarkdownProps) {
  return (
    <SafeMarkdown className={cn(MARKDOWN_CLASS, className)} onOpenLink={onOpenLink}>
      {children}
    </SafeMarkdown>
  )
}
