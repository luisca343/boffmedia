import type { TierListDisplayOptions } from "../display"

/** The same restrained heading in standalone boards, embedded examples and PNGs. */
export function TierListHeading({ title, description, display, level = "h1" }: {
  title: string; description?: string; display: TierListDisplayOptions; level?: "h1" | "h2" | "h3"
}) {
  const Heading = level
  if (!display.title && (!display.descriptions || !description)) return null
  return <header className="grid gap-2">
    {display.title && <Heading className="break-words font-display text-2xl font-semibold not-italic normal-case leading-tight tracking-normal sm:text-3xl">{title}</Heading>}
    {display.descriptions && description && <p className="max-w-3xl whitespace-pre-wrap break-words text-sm text-txt-muted">{description}</p>}
  </header>
}
