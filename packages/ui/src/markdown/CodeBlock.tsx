"use client"

import * as React from "react"
import type { BundledLanguage, Highlighter } from "shiki"

import { cn } from "../cn"
import { useT } from "../i18n"
import { Icon } from "../primitives/icon"
import { MARKDOWN_CODE_BLOCK_CLASS } from "./styles"

/**
 * Languages that are common in changelogs, forum posts and AI answers.
 *
 * The import remains lazy, but keeping the grammar list explicit avoids
 * loading every grammar in the first code block and gives unknown languages a
 * predictable plain-text fallback.
 */
const SHIKI_LANGUAGES = [
  "bash",
  "c",
  "cpp",
  "csharp",
  "css",
  "diff",
  "dockerfile",
  "go",
  "graphql",
  "html",
  "java",
  "javascript",
  "json",
  "jsonc",
  "jsx",
  "kotlin",
  "markdown",
  "mdx",
  "php",
  "powershell",
  "python",
  "ruby",
  "rust",
  "scss",
  "shellscript",
  "sql",
  "swift",
  "tsx",
  "typescript",
  "vue",
  "xml",
  "yaml",
  "zsh",
] as const satisfies readonly BundledLanguage[]

const SHIKI_THEMES = {
  light: "github-light",
  dark: "github-dark",
} as const

const LANGUAGE_ALIASES: Record<string, string> = {
  csharp: "csharp",
  cs: "csharp",
  cxx: "cpp",
  hpp: "cpp",
  html: "html",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  md: "markdown",
  ps: "powershell",
  ps1: "powershell",
  py: "python",
  rb: "ruby",
  rs: "rust",
  scss: "scss",
  sh: "bash",
  shell: "bash",
  ts: "typescript",
  yml: "yaml",
}

type CodeElement = React.ReactElement<{
  children?: React.ReactNode
  className?: string
}>

type MarkdownCodeBlockProps = React.HTMLAttributes<HTMLPreElement> & {
  node?: unknown
}

type HighlightedCode = {
  html: string
  language: BundledLanguage
  source: string
}

let highlighterPromise: Promise<Highlighter> | null = null

/**
 * React-Markdown's `pre` component receives the generated `<code>` element.
 * Replacing the wrapper lets us add a copy action without producing invalid
 * nested markup, while Shiki's inline structure keeps the final `<pre>` ours.
 */
export function MarkdownCodeBlock({ children, className, node: _node, ...rest }: MarkdownCodeBlockProps) {
  const t = useT()
  const codeElement = getCodeElement(children)
  const source = getTextContent(codeElement?.props.children ?? children)
  const rawLanguage = getLanguageFromClassName(codeElement?.props.className)
  const language = resolveLanguage(rawLanguage)
  const [highlighted, setHighlighted] = React.useState<HighlightedCode | null>(null)
  const [copied, setCopied] = React.useState(false)
  const copyTimeout = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!language || !source) return

    let active = true
    void getHighlighter()
      .then((highlighter) => {
        if (!active) return
        try {
          const html = highlighter.codeToHtml(source, {
            lang: language,
            themes: SHIKI_THEMES,
            defaultColor: "light-dark()",
            structure: "inline",
          })
          if (active) setHighlighted({ html, language, source })
        } catch {
          // Unsupported grammar or malformed input stays readable as plain text.
          if (active) setHighlighted(null)
        }
      })
      .catch(() => {
        if (active) setHighlighted(null)
      })

    return () => {
      active = false
    }
  }, [language, source])

  React.useEffect(
    () => () => {
      if (copyTimeout.current !== null) window.clearTimeout(copyTimeout.current)
    },
    [],
  )

  const copy = async () => {
    try {
      await copyText(source)
      setCopied(true)
      if (copyTimeout.current !== null) window.clearTimeout(copyTimeout.current)
      copyTimeout.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard access is optional in embedded/webview contexts.
    }
  }

  const languageLabel = rawLanguage ? rawLanguage.toUpperCase() : null
  const highlightedHtml =
    highlighted?.source === source && highlighted.language === language
      ? highlighted.html
      : null

  return (
    <div className={cn(MARKDOWN_CODE_BLOCK_CLASS, className)}>
      <div className="flex min-h-10 items-center gap-3 border-b border-solid border-line px-3 py-2">
        {languageLabel && (
          <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-txt-muted">
            {languageLabel}
          </span>
        )}
        <span className="ml-auto" aria-hidden="true" />
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={t("copyCode")}
          title={t("copyCode")}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.04em] transition-colors",
            copied ? "text-ok" : "text-txt-muted hover:text-txt",
          )}
        >
          <Icon name={copied ? "check" : "copy"} size={14} />
          {copied ? t("copied") : t("copy")}
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? t("copied") : ""}
        </span>
      </div>

      <pre {...rest} className="m-0 overflow-x-auto bg-transparent p-4 font-mono text-[0.8125rem] leading-6 text-txt">
        {highlightedHtml ? (
          <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        ) : (
          <code>{source}</code>
        )}
      </pre>
    </div>
  )
}

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then(({ createHighlighter }) =>
      createHighlighter({
        langs: [...SHIKI_LANGUAGES],
        themes: [SHIKI_THEMES.light, SHIKI_THEMES.dark],
      }),
    )
  }
  return highlighterPromise
}

function getCodeElement(children: React.ReactNode): CodeElement | null {
  const element = React.Children.toArray(children).find(React.isValidElement)
  return element ? (element as CodeElement) : null
}

function getTextContent(value: React.ReactNode): string {
  return React.Children.toArray(value)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child)
      if (!React.isValidElement(child)) return ""
      const props = child.props as { children?: React.ReactNode }
      return getTextContent(props.children)
    })
    .join("")
}

function getLanguageFromClassName(className: string | undefined): string | null {
  if (!className) return null
  const match = className.match(/(?:^|\s)(?:language|lang)-([^\s]+)/i)
  return match?.[1]?.trim().toLowerCase() || null
}

function resolveLanguage(value: string | null): BundledLanguage | null {
  if (!value) return null
  const normalized = LANGUAGE_ALIASES[value] ?? value
  return SHIKI_LANGUAGES.includes(normalized as (typeof SHIKI_LANGUAGES)[number])
    ? (normalized as BundledLanguage)
    : null
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  let copied = false
  try {
    textarea.select()
    copied = document.execCommand("copy")
  } finally {
    textarea.remove()
  }
  if (!copied) throw new Error("Clipboard unavailable")
}
