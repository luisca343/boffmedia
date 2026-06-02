"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface CodeBlockProps {
  code: string
  lang?: string
  className?: string
}

export function CodeBlock({ code, lang = "jsx", className }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)
  const copy = () => { navigator.clipboard && navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1400) }

  return (
    <div className={cn("k-code", className)}>
      <div className="k-code__bar">
        <span className="k-code__lang">{lang}</span>
        <button className="k-code__copy" onClick={copy}>
          <Icon name={copied ? "check" : "copy"} size={13} />{copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="k-code__pre"><code>{code}</code></pre>
    </div>
  )
}
