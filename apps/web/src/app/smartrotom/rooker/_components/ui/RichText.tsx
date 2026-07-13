"use client"

import { Fragment } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

/**
 * A trino's body, with #etiquetas and @menciones lit up and linked.
 *
 * The split keeps its own separators (`/(\s+)/` with a capture group), so the original
 * spacing and line breaks survive the round trip — a timeline that silently collapses
 * a reader's blank lines is rewriting what they wrote.
 *
 * The hashtag pattern accepts accented Spanish letters and ñ: `#PokédexViva` is a tag
 * players actually use, and `\w` alone would cut it at the é.
 */
const TAG = /^[#＃][\wáéíóúüñ]+$/i
const MENTION = /^@[a-z0-9_]+$/i

export interface RichTextProps {
  text: string
  className?: string
}

export function RichText({ text, className }: RichTextProps) {
  const parts = String(text).split(/(\s+)/)

  return (
    <span className={cn("whitespace-pre-wrap break-words leading-normal text-rk-fg", className)}>
      {parts.map((word, i) => {
        if (TAG.test(word)) {
          return (
            <Link
              key={i}
              href={`/smartrotom/rooker/buscar?q=${encodeURIComponent(word.slice(1))}`}
              onClick={(e) => e.stopPropagation()}
              className="text-rk-accent hover:underline"
            >
              {word}
            </Link>
          )
        }
        if (MENTION.test(word)) {
          return (
            <Link
              key={i}
              href={`/smartrotom/rooker/${word.slice(1)}`}
              onClick={(e) => e.stopPropagation()}
              className="text-rk-accent hover:underline"
            >
              {word}
            </Link>
          )
        }
        return <Fragment key={i}>{word}</Fragment>
      })}
    </span>
  )
}
