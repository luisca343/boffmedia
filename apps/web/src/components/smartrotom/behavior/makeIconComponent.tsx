import type { CSSProperties, SVGProps } from "react"
import type { LucideIcon } from "lucide-react"

export type IconGlyph = LucideIcon

/**
 * The one prop contract every SmartRotom icon set speaks. Each app keeps its own
 * name→glyph map (that is its identity); only this renderer is shared.
 */
export interface IconStyleProps {
  size?: number
  /**
   * Stroke WIDTH, not a colour — the system's historical name for it. Kept as an
   * alias of `strokeWidth`; if both are given, `strokeWidth` wins.
   */
  stroke?: number
  strokeWidth?: number
  /**
   * `true`/`false` draws the glyph solid/outlined (fill+stroke swapped to
   * `currentColor`/`none`). A string is handed to SVG `fill` verbatim and the
   * stroke is left alone.
   */
  fill?: boolean | string
  /** Alias for `fill={true}`. Wins over `fill` when both are given. */
  filled?: boolean
  className?: string
  style?: CSSProperties
}

/** Everything else forwards to the underlying `<svg>`. */
export type IconPassthroughProps = Omit<
  SVGProps<SVGSVGElement>,
  "fill" | "stroke" | "strokeWidth" | "width" | "height" | "ref"
>

export interface IconRendererOptions {
  /** Default pixel size. */
  size?: number
  /** Default stroke width. */
  strokeWidth?: number
  /** Default fill (see `IconStyleProps.fill`). Omit to emit no `fill` at all. */
  fill?: boolean | string
  /** Rewrite the final className (default classes, prefixes…). */
  className?: (className?: string) => string
  /** Do not emit a size — the glyph is sized by class. */
  sizeless?: boolean
}

interface ResolvedAttrs {
  size?: number
  strokeWidth?: number
  fill?: string
  stroke?: string
  className?: string
  style?: CSSProperties
}

function resolveAttrs(props: IconStyleProps, options: IconRendererOptions): ResolvedAttrs {
  const fill = props.filled ?? props.fill ?? options.fill
  const attrs: ResolvedAttrs = {}

  if (typeof fill === "boolean") {
    attrs.fill = fill ? "currentColor" : "none"
    attrs.stroke = fill ? "none" : "currentColor"
  } else if (fill !== undefined) {
    attrs.fill = fill
  }

  const strokeWidth = props.strokeWidth ?? props.stroke ?? options.strokeWidth
  if (strokeWidth !== undefined) attrs.strokeWidth = strokeWidth

  if (!options.sizeless) {
    const size = props.size ?? options.size
    if (size !== undefined) attrs.size = size
  }

  const className = options.className ? options.className(props.className) : props.className
  if (className !== undefined) attrs.className = className
  if (props.style !== undefined) attrs.style = props.style

  return attrs
}

export type IconComponentProps<M> = IconStyleProps &
  IconPassthroughProps & { name: keyof M & string }

/**
 * Build an app's `<Icon name="…" />` from its own glyph map. An unknown name
 * renders nothing.
 */
export function makeIconComponent<M extends Record<string, IconGlyph>>(
  map: M,
  options: IconRendererOptions & {
    /** Names always drawn as a solid. */
    filled?: ReadonlySet<keyof M & string>
  } = {},
) {
  return function Icon({
    name,
    size,
    stroke,
    strokeWidth,
    fill,
    filled,
    className,
    style,
    ...rest
  }: IconComponentProps<M>) {
    const Glyph = map[name] as IconGlyph | undefined
    if (!Glyph) return null
    const base = options.filled?.has(name) ? { ...options, fill: true } : options
    const attrs = resolveAttrs({ size, stroke, strokeWidth, fill, filled, className, style }, base)
    return <Glyph {...attrs} aria-hidden="true" focusable="false" {...rest} />
  }
}

export type GlyphIconProps = IconStyleProps &
  IconPassthroughProps & {
    /** Short alias for `size`, kept for the sets that shipped with it. */
    s?: number
  }

/** Build a single named component around one glyph (`Icon.Trophy`, `I.home`). */
export function makeGlyphIcon(Glyph: IconGlyph, options: IconRendererOptions = {}) {
  return function GlyphIcon({
    size,
    s,
    stroke,
    strokeWidth,
    fill,
    filled,
    className,
    style,
    ...rest
  }: GlyphIconProps) {
    const attrs = resolveAttrs(
      { size: size ?? s, stroke, strokeWidth, fill, filled, className, style },
      options,
    )
    return <Glyph {...attrs} aria-hidden="true" focusable="false" {...rest} />
  }
}
