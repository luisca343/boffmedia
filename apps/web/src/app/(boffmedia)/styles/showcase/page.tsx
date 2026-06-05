"use client"

import "./showcase.css"
import * as React from "react"

// Primitives — boffmedia design system
import { Icon } from "@/components/boffmedia/primitives/icon"
import { BoffButton as Button } from "@/components/boffmedia/primitives/button"
import { BoffCard as Card } from "@/components/boffmedia/primitives/card"
import { BoffBadge as Badge } from "@/components/boffmedia/primitives/badge"
import { Kicker } from "@/components/boffmedia/primitives/kicker"
import { Tag } from "@/components/boffmedia/primitives/tag"
import { Callout } from "@/components/boffmedia/primitives/callout"
import { BoffAlert as Alert } from "@/components/boffmedia/primitives/alert"
import { ToastProvider, useToast } from "@/components/boffmedia/primitives/toast-provider"
import { BoffTooltip as Tooltip } from "@/components/boffmedia/primitives/tooltip"
import { BoffModal as Modal } from "@/components/boffmedia/primitives/dialog"
import { BoffPopover as Popover } from "@/components/boffmedia/primitives/popover"
import { Field } from "@/components/boffmedia/primitives/field"
import { BoffInput as Input } from "@/components/boffmedia/primitives/input"
import { SearchInput } from "@/components/boffmedia/primitives/search-input"
import { BoffSwitch as Switch } from "@/components/boffmedia/primitives/switch"
import { BoffCheckbox as Checkbox } from "@/components/boffmedia/primitives/checkbox"
import { BoffSlider as Slider } from "@/components/boffmedia/primitives/slider"
import { RadioGroup } from "@/components/boffmedia/primitives/radio-group"
import { BoffTabs as Tabs } from "@/components/boffmedia/primitives/tabs"
import { Segmented } from "@/components/boffmedia/primitives/segmented"
import { Breadcrumb } from "@/components/boffmedia/primitives/breadcrumb"
import { Pagination } from "@/components/boffmedia/primitives/pagination"
import { BoffAvatar as Avatar, BoffAvatarGroup as AvatarGroup } from "@/components/boffmedia/primitives/avatar"
import { IconBox } from "@/components/boffmedia/primitives/icon-box"
import { BoffSkeleton as Skeleton } from "@/components/boffmedia/primitives/skeleton"
import { BoffProgress as Progress, BoffRing as Ring } from "@/components/boffmedia/primitives/progress"
import { Stat } from "@/components/boffmedia/primitives/stat"
import { CodeBlock } from "@/components/boffmedia/primitives/code-block"
import { EmptyState } from "@/components/boffmedia/primitives/empty-state"

// Domain
import { GameCard } from "@/components/boffmedia/ui/games/game-card"
import { ToolsTypeBadge } from "@/components/boffmedia/ui/tools/tool-type-badge"

// Tool-kit components
import { ToolPanel, ToolStatBars, ToolApp, SegTabs, ToolSelect, ToolTable, CopyButton, Picker, HpBar, ResultBadge, StatTile, SplitBar, TrendChart, HeatGrid, TagPills } from "@/components/boffmedia/primitives"

// Battlesim components
import { BSType, BSTypeRow, BSCat, BSHpMeter, BSStatusChip, BSBoost, BSTera, BSPokeChip, BSMove, BSFieldCond, BSLogEvent, BSChatRow, BSTraySlot, BSMonCard, BSWinProb, BSTracker, TYPES, tyVar, effMult, effLabel, hpColor, aniF } from "@/components/boffmedia/primitives"
import { PokeSprite } from "@/components/shared/pokemon/PokeSprite"
import { TeamSprites } from "@/components/shared/pokemon/TeamSprites"
import { BaseStatBars } from "@/components/shared/pokemon/BaseStatBars"
import { FeaturedTool } from "@/components/boffmedia/ui/tools/featured-tool"
import { ToolCard } from "@/components/boffmedia/ui/tools/tool-card"

// Domain blocks
import { StatCard } from "@/components/boffmedia/ui/profile/stat-card"
import { Metric } from "@/components/boffmedia/ui/profile/metric"
import { IconButton } from "@/components/boffmedia/ui/layout/icon-button"
import { CardTitle } from "@/components/boffmedia/ui/profile/card-title"
import { ToolRow } from "@/components/boffmedia/ui/tools/tool-row"
import { EventCard } from "@/components/boffmedia/ui/events/event-card"
import { Leaderboard } from "@/components/boffmedia/ui/leaderboard/leaderboard"
import { LeaderRow } from "@/components/boffmedia/ui/leaderboard/leader-row"
import { LinkedRow } from "@/components/boffmedia/ui/profile/linked-row"
import { ActivityItem } from "@/components/boffmedia/ui/profile/activity-item"
import { AchievementTile } from "@/components/boffmedia/ui/profile/achievement-tile"
import { Marquee } from "@/components/boffmedia/ui/layout/marquee"
import { Footer } from "@/components/boffmedia/ui/layout/footer"

// New tool components
import { FavStar } from "@/components/boffmedia/ui/tools/fav-star"
import { ToolTile } from "@/components/boffmedia/ui/tools/tool-tile"
import { ToolCardFav } from "@/components/boffmedia/ui/tools/tool-card-fav"
import { GameSwitcher } from "@/components/boffmedia/ui/games/game-switcher"
import { ToolCommand } from "@/components/boffmedia/ui/tools/tool-command"
import { useFavorites, useRecent } from "@/components/boffmedia/ui/tools/tools-store"

// Data
import { GAMES, GAMES_ORDER, type GameData } from "./_data/games-data"
import Link from "next/link"

// ============================================================================
// Data helpers (unify categories.tools nav + game.tools rich entries)
// ============================================================================
interface NormalizedTool {
  title: string
  name: string
  desc: string
  icon: string
  features: string[]
  href: string
  popularity?: string
  isNew?: boolean
  soon?: boolean
  status: string
  cat: string
  hue: number
}

function gameToolList(game: GameData) {
  const rich: Record<string, (typeof game.tools)[number]> = {}
  ;(game.tools || []).forEach((t) => {
    rich[t.href] = t
  })
  const cats = (game.categories || []).map((c) => ({
    name: c.name,
    tools: c.tools.map((nav) => {
      const r = rich[nav.href] || ({} as Record<string, unknown>)
      const status = nav.badge || ((r as { soon?: boolean }).soon ? "soon" : (r as { isNew?: boolean }).isNew ? "new" : "live")
      return {
        title: (r as { title?: string }).title || nav.name,
        name: nav.name,
        desc: (r as { desc?: string }).desc || "Herramienta del set de " + game.short + ".",
        icon: nav.icon || (r as { icon?: string }).icon || "wrench",
        features: (r as { features?: string[] }).features || [],
        href: nav.href,
        popularity: (r as { popularity?: string }).popularity,
        isNew: status === "new",
        soon: status === "soon",
        status,
        cat: c.name,
        hue: game.hue,
      } as NormalizedTool
    }),
  }))
  return { cats, all: cats.flatMap((c) => c.tools) }
}

function allGamesList() {
  return GAMES_ORDER.map((s) => GAMES[s])
}

function lookupTool(href: string): { tool: NormalizedTool; game: GameData } | null {
  for (const s of GAMES_ORDER) {
    const { all } = gameToolList(GAMES[s])
    const t = all.find((x) => x.href === href)
    if (t) return { tool: t, game: GAMES[s] }
  }
  return null
}

function rankedTools() {
  const out: (NormalizedTool & { game: GameData })[] = []
  GAMES_ORDER.forEach((s) => {
    const { all } = gameToolList(GAMES[s])
    all.forEach((t) => out.push({ ...t, game: GAMES[s] }))
  })
  const score = (t: NormalizedTool) =>
    (t.popularity === "high" ? 3 : t.popularity === "medium" ? 2 : t.soon ? 0 : 1) + (t.isNew ? 0.5 : 0)
  return out.sort((a, b) => score(b) - score(a))
}

// ============================================================================
// Shared helpers
// ============================================================================
function Spec2({
 title,
 tag,
 intro,
 a11y,
 children,
}: {
 title: string
 tag?: string
 intro?: string
 a11y?: string
 children: React.ReactNode
}) {
 return (
  <section className="py-8 pb-10 border-b border-[var(--border)] last:border-b-0 scroll-mt-[90px]">
   <div className="flex items-baseline gap-[0.8rem] mb-2 flex-wrap">
    <h3 className="text-[length:var(--t-xl)]">{title}</h3>
    {tag && (
     <span className="font-mono text-[length:var(--t-xs)] text-[color:var(--text-dim)] px-2 py-[0.15rem] border border-[var(--border)] rounded-[var(--radius-pill)]">
      {tag}
     </span>
    )}
   </div>
   {intro && (
    <p className="text-[length:var(--t-sm)] text-[color:var(--text-muted)] max-w-[66ch] mb-[1.4rem] leading-[1.6]">
     {intro}
    </p>
   )}
   <div className="p-7 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] bg-[radial-gradient(var(--grid-dot)_1px,transparent_1px)] bg-[length:22px_22px] flex flex-col gap-5">
    {children}
   </div>
   {a11y && (
    <p className="flex gap-[0.55rem] items-start mt-4 text-[length:var(--t-xs)] text-[color:var(--text-dim)] leading-[1.5] [&_svg]:text-[color:var(--emerald-400)] [&_svg]:shrink-0 [&_svg]:mt-px">
     <Icon name="shield" size={14} />
     <span>{a11y}</span>
    </p>
   )}
  </section>
 )
}

function Row2({
 children,
 style,
}: {
 children: React.ReactNode
 style?: React.CSSProperties
}) {
 return (
  <div className="flex flex-wrap gap-[0.85rem] items-center" style={style}>
   {children}
  </div>
 )
}

function Row3({ children }: { children: React.ReactNode }) {
 return (
  <div className="flex flex-wrap gap-[0.85rem] items-center" style={{ gap: "0.85rem" }}>
   {children}
  </div>
 )
}

function Sub({ children }: { children: React.ReactNode }) {
 return (
  <p className="dsh-sub font-mono text-[length:var(--t-xs)] tracking-[0.14em] uppercase text-[color:var(--text-dim)] mt-9 mb-4 flex items-center gap-3">
   {children}
  </p>
 )
}

function PropTable({ rows }: { rows: string[][] }) {
 return (
  <table className="w-full border-collapse mt-5 text-[length:var(--t-sm)]">
   <thead>
    <tr>
     {["Prop", "Tipo", "Defecto", "Descripción"].map((h) => (
      <th
       key={h}
       className="text-left font-mono text-[length:var(--t-xs)] tracking-[0.08em] uppercase text-[color:var(--text-dim)] py-[0.6rem] px-[0.8rem] border-b border-[var(--border-strong)]"
      >
       {h}
      </th>
     ))}
    </tr>
   </thead>
   <tbody>
    {rows.map((r) => (
     <tr key={r[0]}>
      <td className="py-[0.65rem] px-[0.8rem] border-b border-[var(--border)] align-top font-mono text-[color:var(--accent-bright)] whitespace-nowrap">
       {r[0]}
      </td>
      <td className="py-[0.65rem] px-[0.8rem] border-b border-[var(--border)] align-top text-[color:var(--text-muted)]">
       <code className="font-mono text-[0.85em] text-[color:var(--text-dim)]">{r[1]}</code>
      </td>
      <td className="py-[0.65rem] px-[0.8rem] border-b border-[var(--border)] align-top text-[color:var(--text-muted)]">
       <code className="font-mono text-[0.85em] text-[color:var(--text-dim)]">{r[2]}</code>
      </td>
      <td className="py-[0.65rem] px-[0.8rem] border-b border-[var(--border)] align-top text-[color:var(--text-muted)]">
       {r[3]}
      </td>
     </tr>
    ))}
   </tbody>
  </table>
 )
}

// ============================================================================
// Hub nav config
// ============================================================================
const HUB_NAV = [
 [
  "Comenzar",
  [
   ["overview", "Resumen", "compass"],
   ["philosophy", "Filosofía", "sparkles"],
  ],
 ],
 ["Fundamentos", [["foundations", "Tokens & escalas", "swatch"]]],
  [
   "Componentes",
   [
    ["primitives", "Primitivos", "puzzle"],
    ["composition", "Composición", "layers"],
    ["blocks", "Bloques", "grid"],
    ["patterns", "Patrones", "grid"],
     ["boff", "Boffmedia", "gamepad"],
      ["toolskit", "Herramientas", "wrench"],
      ["battlesim", "Battlesim", "zap"],
      ["profile", "Perfil", "user"],
   ],
  ],
 [
  "Calidad",
  [
   ["playground", "Playground", "sliders"],
   ["a11y", "Accesibilidad", "shield"],
   ["roadmap", "Hoja de ruta", "trending"],
  ],
 ],
] as const

// ============================================================================
// 1. OVERVIEW
// ============================================================================
function OverviewSection() {
 return (
  <div>
   <div className="mb-8 pb-6 border-b border-[var(--border)]">
    <Kicker>Resumen</Kicker>
    <h2 className="text-[length:var(--t-3xl)] mt-2.5">Un solo sistema para toda la plataforma</h2>
    <p className="text-[length:var(--t-base)] text-[color:var(--text-muted)] max-w-[64ch] mt-[0.7rem] leading-[1.65]">
     Este Hub es la fuente de verdad del frontend de BoffMedia. Centraliza
     tokens, primitivos, composiciones y patrones para que cada pantalla —
     Inicio, Herramientas, Perfil, Comunidad — se construya con las mismas
     piezas. Menos clases sueltas, menos duplicación, una experiencia
     coherente.
    </p>
   </div>

   <Sub>El sistema hoy · auditoría</Sub>
   <p className="text-[length:var(--t-sm)] text-[color:var(--text-muted)] max-w-[70ch] mb-[1.4rem] leading-relaxed">
    El rediseño ya estableció una base sólida: un sistema de tokens
    completo (3 direcciones × 2 temas × acento variable) y dos capas de
    componentes. Pero la documentación vivía dispersa y faltaba inventario
    formal. Diagnóstico honesto:
   </p>
   <div className="grid grid-cols-2 gap-[1.125rem] mb-6 max-[620px]:grid-cols-1">
    <div className="p-[1.4rem] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)]">
     <span className="font-mono text-[length:var(--t-xs)] text-[color:var(--orange-500)] font-bold">FORTALEZAS</span>
     <h4 className="text-[length:var(--t-lg)] mt-2.5 mb-2">Tokens maduros</h4>
     <p className="text-[length:var(--t-sm)] text-[color:var(--text-muted)] leading-[1.6]">
      <code className="font-mono text-[color:var(--accent-bright)]">styles.css</code>{" "}
      ya define marca, superficies, tipografía, espacio, radios y
      movimiento. La separación primitivo / compuesto está documentada en
      código.
     </p>
    </div>
    <div className="p-[1.4rem] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)]">
     <span className="font-mono text-[length:var(--t-xs)] text-[color:var(--rose-400)] font-bold">DEUDA</span>
     <h4 className="text-[length:var(--t-lg)] mt-2.5 mb-2">Catálogo incompleto</h4>
     <p className="text-[length:var(--t-sm)] text-[color:var(--text-muted)] leading-[1.6]">
      Faltaban componentes clave (modal, toast, popover, slider,
      paginación, KPI) y no existía un inventario navegable ni guía de
      accesibilidad por componente. Esto causaba reinvención y clases
      Tailwind duplicadas.
     </p>
    </div>
   </div>

   <Sub>Arquitectura · cuatro capas</Sub>
   <p className="text-[length:var(--t-sm)] text-[color:var(--text-muted)] max-w-[70ch] mb-[1.4rem] leading-relaxed">
    El sistema se organiza en capas. Cada una consume solo la de debajo.
    Nunca se salta hacia arriba.
   </p>
   <div className="flex flex-col gap-2.5 mb-6">
    {[
     [
      "01",
      "Tokens",
      "Variables CSS: color, tipo, espacio, radio, sombra, movimiento, z-index.",
      "globals.css",
      "orange",
     ],
     [
      "02",
      "Primitivos",
      "Elementos atómicos con variantes. Button, Input, Badge, Card, Switch, Checkbox, Slider.",
      "ui/primitives/",
      "accent",
     ],
     [
      "03",
      "Compuestos",
      "Propósito ensamblado: Field, SearchInput, Dropdown, Modal, Alert, Stat.",
      "ui/primitives/",
      "accent",
     ],
     [
      "04",
      "Patrones & páginas",
      "GameCard, ToolCard, shells de Herramientas, perfil — composición de lo anterior.",
      "ui/boffmedia/",
      "purple",
     ],
    ].map(([n, t, d, f, tone]) => (
     <div
      key={n}
      className="flex gap-[1.125rem] items-center py-[1.125rem] px-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)]"
     >
      <span
       className="font-display font-black text-[length:var(--t-2xl)] min-w-[44px]"
       style={{
        color:
         tone === "orange"
          ? "var(--orange-500)"
          : tone === "purple"
          ? "var(--purple-400)"
          : "var(--accent-bright)",
       }}
      >
       {n}
      </span>
      <div className="flex-1 min-w-0">
         <div className="font-display font-bold text-[length:var(--t-base)]">{t}</div>
       <div className="text-[color:var(--text-muted)] text-[length:var(--t-sm)] mt-[0.125rem]">{d}</div>
      </div>
      <code className="font-mono text-[length:var(--t-xs)] text-[color:var(--text-dim)] whitespace-nowrap">
       {f}
      </code>
     </div>
    ))}
   </div>

    <div className="grid grid-cols-2 gap-5 max-[1000px]:grid-cols-1">
     <div className="min-w-0 overflow-hidden">
      <Sub>Convención de nombres</Sub>
     <PropTable
      rows={[
       ["Componente", "PascalCase", "—", "<ToolCard/>, <SearchInput/>"],
       ["variant", "kebab/camel", "—", 'variant="primary"'],
       ["clase base", ".kebab", "—", ".gamecard, .k-stat"],
       ["elemento", "__elem", "—", ".gamecard__head (BEM)"],
       ["modificador", "--mod", "—", ".btn--ghost"],
       ["token", "--grupo-x", "—", "--orange-500, --t-lg"],
      ]}
     />
     </div>
     <div className="min-w-0 overflow-hidden">
      <Sub>Estructura de archivos</Sub>
     <CodeBlock
      lang="estructura"
      code={`components/ui/
├─ primitives/   · Icon, Button, Card, Badge, Input...
├─ boffmedia/   · GameCard, ToolCard, FeaturedTool
└─ display/    · SectionPanel, etc.

app/(boffmedia)/
├─ styles/showcase · Este Hub
├─ herramientas/  · Páginas de herramientas
└─ perfil/     · Perfil de usuario`}
     />
    </div>
   </div>

   <Callout
    icon="sparkles"
    title="Regla de oro"
    style={{ marginTop: "1.5rem" }}
   >
    Usa el{" "}
    <strong>
     primitivo con su <code>variant</code>
    </strong>{" "}
    cuando solo cambia el aspecto. Crea un{" "}
    <strong>componente compuesto</strong> cuando cambia el propósito. Nunca
    reconstruyas a mano algo que ya vive aquí.
   </Callout>
  </div>
 )
}

// ============================================================================
// 2. FILOSOFÍA
// ============================================================================
const PRINCIPLES = [
 [
  "01",
  "Tokens primero",
  "Ningún valor mágico. Color, espacio y tipo salen siempre de una variable. Cambiar el sistema = cambiar el token.",
 ],
 [
  "02",
  "Componer, no duplicar",
  "Si copias el mismo bloque de clases dos veces, conviértelo en componente. La página se mantiene declarativa.",
 ],
 [
  "03",
  "Una pieza, tres personalidades",
  "Cada componente respeta las direcciones HUD, Neón y Grid sin reescribirse. El estilo vive en los tokens.",
 ],
 [
  "04",
  "Accesible por defecto",
  "Foco visible, contraste AA, teclado y ARIA vienen de fábrica — no son un extra que se añade después.",
 ],
 [
  "05",
  "Movimiento con propósito",
  "La animación guía y confirma; nunca distrae. Todo respeta «reduce motion» y el toggle de movimiento.",
 ],
 [
  "06",
  "Coherencia sobre novedad",
  "Antes de inventar, se reutiliza. La familiaridad es una función, no una limitación.",
 ],
]

function PhilosophySection() {
 return (
  <div>
   <div className="mb-8 pb-6 border-b border-[var(--border)]">
    <Kicker>Filosofía</Kicker>
    <h2 className="text-[length:var(--t-3xl)] mt-2.5">Seis principios que mandan</h2>
    <p className="text-[length:var(--t-base)] text-[color:var(--text-muted)] max-w-[64ch] mt-[0.7rem] leading-[1.65]">
     Las decisiones de diseño no se discuten pantalla a pantalla. Se
     resuelven una vez, aquí, y se aplican en todo el producto.
    </p>
   </div>
   <div className="grid grid-cols-2 gap-[1.125rem] max-[620px]:grid-cols-1">
    {PRINCIPLES.map(([n, t, d]) => (
     <div key={n} className="p-[1.4rem] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)]">
      <span className="font-mono text-[length:var(--t-xs)] text-[color:var(--orange-500)] font-bold">{n}</span>
      <h4 className="text-[length:var(--t-lg)] mt-2.5 mb-2">{t}</h4>
      <p className="text-[length:var(--t-sm)] text-[color:var(--text-muted)] leading-[1.6]">{d}</p>
     </div>
    ))}
   </div>

   <Sub>Primitivo vs. componente</Sub>
   <div className="grid grid-cols-2 gap-[1.125rem] max-[1000px]:grid-cols-1">
    <div className="dodont__col py-5 px-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)]">
     <div className="flex items-center gap-2 font-bold text-[length:var(--t-sm)] mb-[0.875rem] text-[color:var(--emerald-400)]">
      <Icon name="check" size={16} />
      Usa un variant
     </div>
     <ul className="dodont__list list-none p-0 m-0 flex flex-col gap-[0.6rem]">
      <li>
       Mismo elemento, distinto aspecto:{" "}
       <code>Button variant=&quot;ghost&quot;</code>.
      </li>
      <li>
       Estado semántico de un Badge: <code>kind=&quot;live&quot;</code>.
      </li>
      <li>
       Tamaño o densidad: <code>size=&quot;sm&quot;</code>.
      </li>
     </ul>
    </div>
    <div className="dodont__col py-5 px-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)]">
     <div className="flex items-center gap-2 font-bold text-[length:var(--t-sm)] mb-[0.875rem] text-[color:var(--rose-400)]">
      <Icon name="x" size={16} />
      Crea un componente
     </div>
     <ul className="dodont__list list-none p-0 m-0 flex flex-col gap-[0.6rem]">
      <li>
       Distinta composición: icono + título + badges + pie →{" "}
       <code>ToolCard</code>.
      </li>
      <li>
       Comportamiento propio: trigger + menú con teclado →{" "}
       <code>Dropdown</code>.
      </li>
      <li>
       Propósito repetido en varias páginas → extráelo.
      </li>
     </ul>
    </div>
   </div>
  </div>
 )
}

// ============================================================================
// 3. FOUNDATIONS
// ============================================================================
const BRAND = [
 { name: "orange-300", value: "#fdba74" },
 { name: "orange-400", value: "#fb923c" },
 { name: "orange-500", value: "#f97316" },
 { name: "orange-600", value: "#ea580c" },
 { name: "orange-700", value: "#c2410c" },
]
const SUPPORT = [
 { name: "cyan-400", value: "#22d3ee" },
 { name: "cyan-500", value: "#06b6d4" },
 { name: "cyan-600", value: "#0891b2" },
 { name: "purple-400", value: "#c084fc" },
 { name: "purple-500", value: "#a855f7" },
 { name: "purple-600", value: "#9333ea" },
]
const SEMANTIC = [
 { name: "emerald · éxito", value: "#10b981" },
 { name: "amber · aviso", value: "#fbbf24" },
 { name: "rose · error", value: "#f43f5e" },
 { name: "cyan · info", value: "#06b6d4" },
]
const SURFACES = [
 { name: "--bg", value: "fondo base" },
 { name: "--surface", value: "tarjeta" },
 { name: "--surface-2", value: "elevado" },
 { name: "--surface-3", value: "elevado +" },
]
const TYPE_SCALE = [
 ["--t-6xl", "5rem / 80px", "Display"],
 ["--t-5xl", "3.9rem / 62px", "Hero"],
 ["--t-4xl", "3rem / 48px", "Título página"],
 ["--t-3xl", "2.25rem / 36px", "Sección"],
 ["--t-2xl", "1.75rem / 28px", "Subsección"],
 ["--t-xl", "1.375rem / 22px", "Card title"],
 ["--t-lg", "1.125rem / 18px", "Destacado"],
 ["--t-base", "1rem / 16px", "Cuerpo"],
 ["--t-sm", "0.875rem / 14px", "Secundario"],
 ["--t-xs", "0.75rem / 12px", "Etiqueta"],
]
const SPACING = [
 ["space-1", "4px", 4],
 ["space-2", "8px", 8],
 ["space-3", "12px", 12],
 ["space-4", "16px", 16],
 ["space-6", "24px", 24],
 ["space-8", "32px", 32],
 ["space-12", "48px", 48],
 ["space-16", "64px", 64],
]

function FoundationsSection() {
 return (
  <div>
   <div className="mb-8 pb-6 border-b border-[var(--border)]">
    <Kicker>Fundamentos</Kicker>
    <h2 className="text-[length:var(--t-3xl)] mt-2.5">Tokens & escalas</h2>
    <p className="text-[length:var(--t-base)] text-[color:var(--text-muted)] max-w-[64ch] mt-[0.7rem] leading-[1.65]">
     El vocabulario más bajo del sistema. Todo — color, tipo, espacio,
     forma, movimiento — sale de aquí. Cambia un token y cambia toda la
     plataforma de forma coherente.
    </p>
   </div>

   <Sub>Color · marca</Sub>
   <p className="text-[length:var(--t-sm)] text-[color:var(--text-muted)] max-w-[66ch] mb-[1.4rem] leading-[1.6]">
    Naranja es el héroe (acción, marca). Cian acompaña; morado se reserva
    para lo raro o especial. Constantes — no varían por tema.
   </p>
   <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[0.85rem]">
    {BRAND.map((s) => (
     <div key={s.name} className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
      <div className="h-[76px]" style={{ background: s.value }} />
      <div className="py-2.5 px-3">
       <div className="text-[length:var(--t-sm)] font-semibold">{s.name}</div>
       <div className="font-mono text-[length:var(--t-xs)] text-[color:var(--text-dim)] mt-px">{s.value}</div>
      </div>
     </div>
    ))}
   </div>

   <Sub>Color · apoyo & semántico</Sub>
   <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[0.85rem]">
    {[...SUPPORT, ...SEMANTIC].map((s) => (
     <div key={s.name} className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
      <div className="h-[76px]" style={{ background: s.value }} />
      <div className="py-2.5 px-3">
       <div className="text-[length:var(--t-sm)] font-semibold">{s.name}</div>
       <div className="font-mono text-[length:var(--t-xs)] text-[color:var(--text-dim)] mt-px">{s.value}</div>
      </div>
     </div>
    ))}
   </div>

   <Sub>Superficies (vivas según tema)</Sub>
   <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[0.85rem]">
    {SURFACES.map((s) => (
     <div key={s.name} className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
      <div
       className="h-[76px] border border-solid border-[var(--border)]"
       style={{ background: `var(${s.name})` }}
      />
      <div className="py-2.5 px-3">
       <div className="font-mono text-[length:var(--t-xs)]">{s.name}</div>
       <div className="font-mono text-[length:var(--t-xs)] text-[color:var(--text-dim)] mt-px">{s.value}</div>
      </div>
     </div>
    ))}
   </div>

   <Callout icon="swatch" title="El acento es variable">
    <code>--accent</code> es un rol, no un color fijo. Por defecto cian;
    conmutable a morado, esmeralda o naranja desde Tweaks. Los componentes
    nunca codifican el acento a mano — leen <code>var(--accent)</code>.
   </Callout>

   <Sub>Tipografía · familias</Sub>
   <div className="grid grid-cols-2 gap-5 max-[1000px]:grid-cols-1">
    {[
     [
      "Orbitron",
      "var(--font-display)",
      "Display · títulos. Geométrica, técnica, gamer.",
     ],
     [
      "Inter",
      "var(--font-body)",
      "Cuerpo · interfaz. Neutra y muy legible.",
     ],
    ].map(([n, v, d]) => (
     <div
      key={n}
      className="py-5 px-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)]"
     >
      <div
       className="text-[length:var(--t-3xl)] font-extrabold"
       style={{ fontFamily: v }}
      >
       {n}
      </div>
      <div className="text-[color:var(--text-muted)] text-[length:var(--t-sm)] mt-1.5">
       {d}
      </div>
     </div>
    ))}
   </div>
   <div className="mt-4 py-5 px-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)]">
    <div className="font-mono text-[length:var(--t-xl)] font-medium">
     JetBrains Mono
    </div>
    <div className="text-[color:var(--text-muted)] text-[length:var(--t-sm)] mt-1.5">
     Etiquetas · código · datos numéricos.
    </div>
   </div>

   <Sub>Escala tipográfica</Sub>
   <div>
    {TYPE_SCALE.map(([token, size, role]) => (
     <div
      key={token}
      className="py-[1.1rem] border-b border-[var(--border)] flex flex-col gap-[0.35rem] last:border-b-0"
     >
      <div
       className="leading-[1.1] text-balance font-bold"
       style={{
        fontSize: `var(${token})`,
        fontFamily:
         token === "--t-6xl" ||
         token === "--t-5xl" ||
         token === "--t-4xl" ||
         token === "--t-3xl"
          ? "var(--font-display)"
          : "var(--font-body)",
       }}
      >
       {role}
      </div>
      <div className="font-mono text-[length:var(--t-xs)] text-[color:var(--text-dim)] flex gap-4 flex-wrap">
       <span className="text-[color:var(--accent-bright)]">{token}</span>
       <span>{size}</span>
      </div>
     </div>
    ))}
   </div>

   <Sub>Espaciado · base 4px</Sub>
   <p className="text-[length:var(--t-sm)] text-[color:var(--text-muted)] max-w-[66ch] mb-[1.4rem] leading-[1.6]">
    Ritmo en múltiplos de 4. Usa <code>gap</code> en flex/grid; evita
    márgenes sueltos. Las secciones usan <code>--space-section</code>{" "}
    (fluido).
   </p>
   <div>
    {SPACING.map(([token, val, px]) => (
     <div
      key={token}
      className="flex items-center gap-4 py-[0.7rem] border-b border-[var(--border)] last:border-b-0"
     >
      <span className="font-mono text-[length:var(--t-xs)] text-[color:var(--accent-bright)] min-w-[96px]">
       {token}
      </span>
      <span className="font-mono text-[length:var(--t-xs)] text-[color:var(--text-dim)] min-w-[70px]">
       {val}
      </span>
      <span
       className="h-3.5 bg-[var(--orange-500)] rounded-[3px]"
       style={{ width: (px as number) * 3 }}
      />
     </div>
    ))}
   </div>

   <Sub>Radio (vivo según dirección)</Sub>
   <p className="text-[length:var(--t-sm)] text-[color:var(--text-muted)] max-w-[66ch] mb-[1.4rem] leading-[1.6]">
    HUD ≈ recto (3px), Neón ≈ muy redondeado (14–22px), Grid ≈ intermedio
    (8px). Actualmente en modo Neón.
   </p>
   <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
    {[
     ["--radius", "base"],
     ["--radius-lg", "grande"],
     ["--radius-pill", "pill"],
    ].map(([token, label]) => (
     <div key={token} className="flex flex-col gap-3 items-center text-center">
      <div
       className="w-full h-[84px] bg-[var(--surface-3)] border border-[var(--border-strong)]"
       style={{
        borderRadius: `var(${token})`,
        background:
         "color-mix(in srgb, var(--orange-500) 16%, var(--surface-3))",
        borderColor:
         "color-mix(in srgb, var(--orange-500) 35%, transparent)",
       }}
      />
      <div>
       <div className="font-mono text-[length:var(--t-xs)] text-[color:var(--text-muted)]">{label}</div>
       <div className="font-mono text-[0.66rem] text-[color:var(--text-dim)]">{token}</div>
      </div>
     </div>
    ))}
   </div>

   <Sub>Elevación & sombra</Sub>
   <p className="text-[length:var(--t-sm)] text-[color:var(--text-muted)] max-w-[66ch] mb-[1.4rem] leading-[1.6]">
    La sombra también es personalidad: Neón usa halo difuso con backdrop
    blur.
   </p>
   <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
    {[
     ["--card-shadow", "tarjeta", "var(--card-bg)"],
     ["--card-shadow-hover", "hover", "var(--card-bg)"],
     ["--btn-shadow", "botón", "var(--orange-500)"],
    ].map(([token, label, bg]) => (
     <div key={token} className="flex flex-col gap-3 items-center text-center">
      <div
       className="w-full h-[84px] rounded-[var(--radius-lg)] border border-solid border-[var(--border)]"
       style={{
        boxShadow: `var(${token})`,
        background: bg,
       }}
      />
      <div>
       <div className="font-mono text-[length:var(--t-xs)] text-[color:var(--text-muted)]">{label}</div>
       <div className="font-mono text-[0.66rem] text-[color:var(--text-dim)]">{token}</div>
      </div>
     </div>
    ))}
   </div>

   <Sub>Movimiento</Sub>
   <div className="grid grid-cols-2 gap-5 max-[1000px]:grid-cols-1">
    <PropTable
     rows={[
      ["--dur", "tiempo", "0.32s", "Duración estándar de transición"],
      [
       "--ease",
       "curva",
       "cubic-bezier(.22,1,.36,1)",
       "Salida suave «expo» para todo",
      ],
      ["reveal", "animación", "fade + 18px", "Entrada al hacer scroll"],
     ]}
    />
    <MotionDemo />
   </div>

   <div className="grid grid-cols-2 gap-5 mt-8 max-[1000px]:grid-cols-1">
    <div>
     <Sub>Capas (z-index)</Sub>
     <PropTable
      rows={[
       ["base", "0", "—", "Contenido en flujo"],
       ["dropdown", "80", "—", "Menús, selects"],
       ["tooltip", "120", "—", "Tooltips, popovers"],
       ["overlay", "160", "—", "Modales, sheets"],
       ["toast", "200", "—", "Notificaciones"],
      ]}
     />
    </div>
    <div>
     <Sub>Breakpoints</Sub>
     <PropTable
      rows={[
       ["sm", "≤ 600px", "—", "Móvil · 1 columna"],
       ["md", "≤ 1000px", "—", "Tablet · rail colapsa"],
       ["lg", "≤ 1240px", "—", "--maxw del contenedor"],
       ["xl", "> 1240px", "—", "Escritorio amplio"],
      ]}
     />
    </div>
   </div>
  </div>
 )
}

function MotionDemo() {
 const [on, setOn] = React.useState(false)
 return (
  <div className="flex flex-col gap-4 items-center py-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)]">
   <div
    className="w-14 h-14 rounded-[var(--radius-lg)] bg-[var(--orange-500)]"
    style={{
     transition:
      "transform var(--dur) var(--ease), border-radius var(--dur) var(--ease)",
     transform: on
      ? "translateY(-10px) scale(1.1) rotate(8deg)"
      : "none",
    }}
   />
   <Button variant="ghost" size="sm" onClick={() => setOn((o) => !o)}>
    Animar (--ease)
   </Button>
  </div>
 )
}

// ============================================================================
// 4. PRIMITIVES
// ============================================================================
function PrimitivesSection() {
 const [seg, setSeg] = React.useState("grid")
 const [tab, setTab] = React.useState("all")
 const [sel, setSel] = React.useState("vgc")
 const [q, setQ] = React.useState("")
 const [sw, setSw] = React.useState(true)
 const [radio, setRadio] = React.useState("singles")
 const [cb, setCb] = React.useState(true)
 const [vol, setVol] = React.useState(33)
 const [page, setPage] = React.useState(2)
 const [tags, setTags] = React.useState([
  "VGC",
  "Singles",
  "Clima",
  "Compartir",
 ])

 return (
  <div>
   <div className="mb-8 pb-6 border-b border-[var(--border)]">
    <Kicker>Primitivos</Kicker>
    <h2 className="text-[length:var(--t-3xl)] mt-2.5">Catálogo de primitivos</h2>
    <p className="text-[length:var(--t-base)] text-[color:var(--text-muted)] max-w-[64ch] mt-[0.7rem] leading-[1.65]">
     Los átomos del sistema. Cada uno llega completamente estilizado y
     respeta la dirección Neón. Cambia su aspecto con <code>variant</code>,
     nunca con clases sueltas.
    </p>
   </div>

   {/* BUTTON */}
   <Spec2
    title="Button"
    tag="primitives/button.tsx"
    intro="Un primitivo, ocho roles. El elemento es el mismo; variant decide la jerarquía visual."
    a11y="Renderiza &lt;button&gt; o &lt;a&gt; según href. Foco con doble halo. Estados hover/active táctiles ≥44px en tamaño por defecto."
   >
    <Row2>
     <Button variant="primary" icon="bolt">
      Primary
     </Button>
     <Button variant="accent" icon="discord">
      Accent
     </Button>
     <Button variant="ghost">Ghost</Button>
     <Button variant="outline">Outline</Button>
    </Row2>
    <Row2>
     <Button variant="primary" size="sm">
      Small
     </Button>
     <Button variant="primary">Default</Button>
     <Button variant="primary" size="lg" iconRight="arrow">
      Large
     </Button>
     <Button variant="primary" disabled>
      Disabled
     </Button>
    </Row2>
    <PropTable
     rows={[
      [
       "variant",
       "primary|accent|ghost|outline",
       "primary",
       "Rol visual del botón",
      ],
      ["size", "sm|lg", "—", "Densidad; por defecto tamaño medio"],
      [
       "icon / iconRight",
       "string",
       "—",
       "Nombre de icono a izquierda/derecha",
      ],
      ["block", "boolean", "false", "Ocupa el ancho disponible"],
      ["href", "string", "—", "Renderiza como enlace <a>"],
     ]}
    />
   </Spec2>

   {/* BADGE + TAG */}
   <Spec2
    title="Badge & Tag"
    tag="primitives/badge.tsx · tag.tsx"
    intro="Badge comunica estado semántico (el color es significado, no adorno). Tag es un chip de filtro, opcionalmente descartable."
    a11y="El punto pulsante de «en vivo» se detiene con reduce-motion. El color nunca es el único portador de significado: se acompaña de texto."
   >
    <Row2>
     <Badge>Neutral</Badge>
     <Badge kind="new">Nuevo</Badge>
     <Badge kind="soon">Pronto</Badge>
     <Badge kind="live">En vivo</Badge>
     <Badge kind="accent">Destacado</Badge>
    </Row2>
    <Row2>
     {tags.map((t) => (
      <Tag
       key={t}
       tone="accent"
       onRemove={() =>
        setTags((a) => a.filter((x) => x !== t))
       }
      >
       {t}
      </Tag>
     ))}
     {tags.length === 0 && (
      <span className="text-[color:var(--text-dim)] text-[length:var(--t-sm)]">
       Sin filtros — recarga la sección para restaurar.
      </span>
     )}
    </Row2>
   </Spec2>

   {/* INPUTS */}
   <Spec2
    title="Input & Field"
    tag="primitives/input.tsx · field.tsx"
    intro="Field envuelve cualquier control con label, icono, ayuda y error. SearchInput añade icono de búsqueda y botón de limpieza."
    a11y="Label asociada con htmlFor. El mensaje de error usa color + icono, no solo color. Foco con anillo de acento."
   >
    <div className="grid grid-cols-2 gap-5 max-[1000px]:grid-cols-1">
     <Field label="Nombre de usuario" icon="user" hint="Visible para la comunidad.">
      <Input placeholder="RotomChef" />
     </Field>
     <Field label="Correo" icon="mail" error="Introduce un correo válido.">
      <Input placeholder="tu@correo.com" />
     </Field>
     <Field label="Buscar herramientas">
      <SearchInput value={q} onChange={setQ} placeholder="Escribe para buscar…" />
     </Field>
     <Field label="Bio" icon="message">
      <textarea
        className="flex w-full text-[length:var(--t-sm)] text-[color:var(--text,#f4f4f7)] bg-[var(--surface-2,#181826)] border-[var(--border-strong,rgba(255,255,255,0.16))] rounded-[var(--btn-radius,9999px)] px-3.5 py-3 transition-all placeholder:text-[color:var(--text-dim,#71737f)] focus:outline-none focus:border-[var(--accent,var(--cyan-500))] focus:shadow-[0_0_0_3px_var(--accent-soft,rgba(6,182,212,0.14))]"
       rows={2}
       placeholder="Cuéntanos sobre ti…"
      />
     </Field>
    </div>
   </Spec2>

   {/* SELECTION CONTROLS */}
   <Spec2
    title="Checkbox · Radio · Switch"
    tag="primitives/checkbox.tsx · radio-group.tsx · switch.tsx"
    intro="Los tres controles de selección. Checkbox para múltiple, Radio para exclusivo, Switch para encendido/apagado inmediato."
    a11y="role checkbox/radio/switch con aria-checked. Toda la fila es clicable; el área supera 44px."
   >
    <div className="grid grid-cols-2 gap-5 max-[1000px]:grid-cols-1">
     <div className="flex flex-col gap-3">
      <Checkbox checked={cb} onChange={setCb} label="Recibir novedades por correo" />
      <Checkbox defaultChecked label="Mostrar mi actividad" />
      <Checkbox disabled label="Opción no disponible" />
      <div className="mt-1.5">
       <Switch checked={sw} onChange={setSw} label="Notificaciones push" />
      </div>
     </div>
     <RadioGroup
      value={radio}
      onChange={setRadio}
      options={[
       { value: "singles", label: "Singles", desc: "Combate 1v1 clásico." },
       { value: "doubles", label: "Dobles / VGC", desc: "Formato oficial por equipos." },
       { value: "draft", label: "Draft", desc: "Selección por turnos." },
      ]}
     />
    </div>
   </Spec2>

   {/* SLIDER + PROGRESS */}
   <Spec2
    title="Slider · Progress · Ring"
    tag="primitives/slider.tsx · progress.tsx"
    intro="Entrada por rango y dos formas de progreso: barra lineal y anillo radial."
    a11y="Slider con role slider y aria-valuenow/min/max; controlable por flechas del teclado."
   >
    <div className="flex flex-col gap-5 max-w-[460px]">
     <Slider defaultValue={vol} onChange={setVol} unit="%" />
     <Progress label="Progreso del build" value={vol} tone="orange" />
    </div>
    <Row2 style={{ marginTop: "0.5rem", gap: "1.5rem" }}>
     <Ring value={vol} tone="orange" />
     <Ring value={72} tone="accent" />
     <Ring value={95} tone="emerald" />
    </Row2>
   </Spec2>

   {/* TABS + SEGMENTED */}
   <Spec2
    title="Tabs & Segmented"
    tag="primitives/tabs.tsx · segmented.tsx"
    intro="Tabs para navegar contenido (con contadores); Segmented para alternar vistas equivalentes."
    a11y="role tablist/tab con aria-selected. La pestaña activa se marca con color y subrayado, no solo color."
   >
    <Row2 style={{ alignItems: "flex-start" }}>
     <Tabs
      value={tab}
      onChange={setTab}
      options={[
       { value: "all", label: "Todas", count: 12 },
       { value: "pkm", label: "Pokémon", count: 5 },
       { value: "mh", label: "MH Wilds", count: 4 },
      ]}
     />
    </Row2>
    <Row2>
     <Segmented
      value={seg}
      onChange={setSeg}
      options={[
       { value: "grid", label: "Cuadrícula", icon: "grid" },
       { value: "list", label: "Lista", icon: "list" },
      ]}
     />
    </Row2>
   </Spec2>

   {/* AVATAR + ICONBOX + SKELETON */}
   <Spec2
    title="Avatar · IconBox · Skeleton"
    tag="primitives/avatar.tsx · icon-box.tsx · skeleton.tsx"
    intro="Identidad, iconografía contenida y estados de carga. IconBox es el patrón recurrente «icono en cuadro tintado»."
    a11y="Avatar cae a iniciales si la imagen falla. Skeleton se detiene con reduce-motion."
   >
    <Row2 style={{ gap: "1.5rem" }}>
     <AvatarGroup
      size={42}
      items={[
       { src: "https://i.pravatar.cc/80?img=12", fallback: "AX", ring: true },
       { src: "https://i.pravatar.cc/80?img=32", fallback: "MG" },
       { fallback: "CL", tone: "purple" },
       { fallback: "JR", tone: "accent" },
       { fallback: "Nn" },
       { fallback: "Zz" },
      ]}
     />
     <IconBox icon="sword" tone="orange" size="lg" />
     <IconBox icon="cards" tone="accent" size="md" />
     <IconBox icon="tree" tone="muted" size="sm" />
    </Row2>
    <div className="flex gap-4 items-center max-w-[420px]">
     <Skeleton w={48} h={48} circle />
     <div className="flex-1 flex flex-col gap-2">
      <Skeleton w="60%" />
      <Skeleton w="90%" h={12} />
      <Skeleton w="40%" h={12} />
     </div>
    </div>
   </Spec2>

   {/* TOOLTIP + PAGINATION */}
   <Spec2
    title="Tooltip & Pagination"
    tag="primitives/tooltip.tsx · pagination.tsx"
    intro="Ayuda contextual al pasar el cursor y navegación entre páginas con truncado inteligente."
    a11y="Tooltip aparece en hover y focus, con role tooltip. Pagination marca la página actual con aria-current."
   >
    <Row2 style={{ gap: "1.25rem" }}>
     <Tooltip label="Añadir al equipo">
      <Button variant="outline">Pasa el cursor</Button>
     </Tooltip>
     <Tooltip label="Más información" side="bottom">
      <Button variant="ghost" aria-label="Info">
       <Icon name="info" size={18} />
      </Button>
     </Tooltip>
    </Row2>
    <Pagination page={page} total={8} onChange={setPage} />
   </Spec2>
  </div>
 )
}

// ============================================================================
// 5. COMPOSITION
// ============================================================================
function CompositionSection() {
 const toast = useToast()
 const [alertOpen, setAlertOpen] = React.useState(true)

 return (
  <div>
   <div className="mb-8 pb-6 border-b border-[var(--border)]">
    <Kicker>Composición</Kicker>
    <h2 className="text-[length:var(--t-3xl)] mt-2.5">Primitivos trabajando juntos</h2>
    <p className="text-[length:var(--t-base)] text-[color:var(--text-muted)] max-w-[64ch] mt-[0.7rem] leading-[1.65]">
     Componentes con propósito ensamblado: superficies, retroalimentación
     y overlays. Construidos al 100% sobre los primitivos y los tokens.
    </p>
   </div>

   {/* CARD */}
   <Spec2
    title="Card"
    tag="primitives/card.tsx"
    intro="La superficie base. Acepta cualquier composición; aquí, el patrón icono + título + features + acción."
    a11y="Las tarjetas clicables exponen role button y responden a Enter. El hover eleva, no solo cambia color."
   >
    <div className="grid grid-cols-2 gap-5 max-[1000px]:grid-cols-1">
     <Card hover style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="flex gap-4 items-center">
       <IconBox icon="calc" tone="orange" size="md" />
       <div>
        <h4 className="text-[length:var(--t-lg)]">Calculadora de daño</h4>
        <span className="text-[color:var(--text-dim)] text-[length:var(--t-xs)] font-mono">
         Pokémon · VGC
        </span>
       </div>
      </div>
      <p className="text-[color:var(--text-muted)] text-[length:var(--t-sm)] m-0">
       Simula intercambios con spreads, naturalezas y campos activos.
      </p>
      <div className="flex gap-2">
       <Tag tone="accent">Spreads</Tag>
       <Tag tone="accent">Campos</Tag>
      </div>
      <Button variant="primary" size="sm" iconRight="arrow" block>
       Abrir herramienta
      </Button>
     </Card>
     <Card hover style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="flex gap-4 items-center">
       <IconBox icon="shield" tone="accent" size="md" />
       <div>
        <h4 className="text-[length:var(--t-lg)]">Card · hover</h4>
        <span className="text-[color:var(--text-dim)] text-[length:var(--t-xs)] font-mono">
         Elevación Neón
        </span>
       </div>
      </div>
      <p className="text-[color:var(--text-muted)] text-[length:var(--t-sm)] m-0">
       El hover eleva con sombra difusa y borde de acento. En HUD usa offset duro, en Grid es casi plano.
      </p>
     </Card>
    </div>
   </Spec2>

   {/* ALERT */}
   <Spec2
    title="Alert"
    tag="primitives/alert.tsx"
    intro="Mensaje contextual en línea. Cuatro tonos semánticos; el icono y el color refuerzan el significado."
    a11y="tone='error' usa role=alert (anuncio inmediato); el resto, role=status. Botón de cierre con aria-label."
   >
    <div className="flex flex-col gap-[0.875rem]">
     {alertOpen && (
      <Alert tone="info" title="Build guardado en borradores" onClose={() => setAlertOpen(false)}>
       Puedes retomarlo desde tu perfil cuando quieras.
      </Alert>
     )}
     <Alert tone="success" title="Equipo validado">
      Cumple las reglas del formato VGC 2026 Reg I.
     </Alert>
     <Alert tone="warning" title="Item duplicado">
      Dos Pokémon llevan Restos. Revisa la cláusula de objetos.
     </Alert>
     <Alert tone="error" title="No se pudo sincronizar">
      Sin conexión con el servidor de torneos. Reintentando…
     </Alert>
    </div>
   </Spec2>

   {/* OVERLAYS */}
   <Spec2
    title="Modal · Popover · Toast"
    tag="primitives/dialog.tsx · popover.tsx · toast-provider.tsx"
    intro="La familia de overlays. Modal bloquea para decisiones; Popover ancla ajustes ligeros; Toast confirma sin interrumpir."
    a11y="Modal atrapa el foco, cierra con Escape y clic en backdrop. Toasts en una región live; se autodescartan."
   >
    <Row3>
     <Modal
      trigger={
       <Button variant="primary" icon="plus">
        Nuevo equipo
       </Button>
      }
      title="Crear equipo"
      description="Dale un nombre y elige el formato. Podrás añadir Pokémon después."
      footer={(close) => (
       <>
        <Button variant="ghost" onClick={close}>
         Cancelar
        </Button>
        <Button
         variant="primary"
         onClick={() => {
          close()
          toast({
           tone: "success",
           title: "Equipo creado",
           desc: "«Lluvia ofensiva» listo para editar.",
          })
         }}
        >
         Crear equipo
        </Button>
       </>
      )}
     >
      <div className="flex flex-col gap-4">
       <Field label="Nombre del equipo" icon="bookmark">
        <Input defaultValue="Lluvia ofensiva" />
       </Field>
      </div>
     </Modal>

     <Popover
      trigger={
       <Button variant="outline" icon="sliders">
        Vista
       </Button>
      }
      width={250}
     >
      <span className="font-bold text-sm">Densidad de la cuadrícula</span>
      <div className="flex flex-col gap-3 mt-3">
       <Switch defaultChecked label="Mostrar miniaturas" />
       <Switch label="Compactar tarjetas" />
       <Switch defaultChecked label="Animaciones" />
      </div>
     </Popover>

     <Button
      variant="ghost"
      icon="bell"
      onClick={() =>
       toast({
        tone: "neutral",
        title: "Notificación de ejemplo",
        desc: "Así se ve un toast en vivo.",
       })
      }
     >
      Lanzar toast
     </Button>
    </Row3>
   </Spec2>

   {/* STAT GROUP */}
   <Spec2
    title="Stat / KPI"
    tag="primitives/stat.tsx"
    intro="Indicadores para dashboards: valor grande, delta de tendencia y subtexto. El delta usa color + flecha."
    a11y="El valor es el texto principal; el delta complementa con icono direccional, no solo color."
   >
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
     <Stat icon="users" label="Miembros activos" value="12.4k" delta="+8.2%" deltaTone="up" sub="vs. mes anterior" />
     <Stat icon="trophy" label="Torneos jugados" value="328" delta="+12" deltaTone="up" sub="esta temporada" />
     <Stat icon="sword" label="Builds creados" value="9.1k" delta="-3.4%" deltaTone="down" sub="vs. semana pasada" />
    </div>
   </Spec2>

   {/* TABLE */}
   <Spec2
    title="Table"
    tag="showcase inline"
    intro="Datos tabulares con cabecera mono, filas con hover y columnas numéricas alineadas a la derecha."
    a11y="Estructura semántica thead/tbody. Los estados se comunican con Badge (texto), no solo color de fila."
   >
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden">
     <table className="w-full border-collapse text-[length:var(--t-sm)]">
      <thead>
        <tr className="[&_th]:text-left [&_th]:font-mono [&_th]:text-[length:var(--t-xs)] [&_th]:tracking-[0.06em] [&_th]:uppercase [&_th]:text-[color:var(--text-dim)] [&_th]:py-[0.7rem] [&_th]:px-4 [&_th]:bg-[var(--surface-2)] [&_th]:border-b [&_th]:border-[var(--border-strong)]">
        <th className="text-right font-mono">#</th>
        <th>Jugador</th>
        <th>Juego</th>
        <th>Estado</th>
        <th className="text-right font-mono">Puntos</th>
       </tr>
      </thead>
       <tbody className="[&_tr]:transition-[background] [&_tr]:duration-[var(--dur)] [&_tr:hover]:bg-[var(--surface-2)] [&_td]:py-[0.7rem] [&_td]:px-4 [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:text-[color:var(--text-muted)] [&_tr:last-child_td]:border-b-0">
       <tr>
        <td className="text-right font-mono text-[color:var(--text)]">01</td>
        <td className="text-[color:var(--text)] font-semibold">RotomChef</td>
        <td>Pokémon VGC</td>
        <td>
         <Badge kind="live">En vivo</Badge>
        </td>
        <td className="text-right font-mono text-[color:var(--text)]">2,480</td>
       </tr>
       <tr>
        <td className="text-right font-mono text-[color:var(--text)]">02</td>
        <td className="text-[color:var(--text)] font-semibold">GemmaHunts</td>
        <td>MH Wilds</td>
        <td>
         <Badge kind="accent">Clasificado</Badge>
        </td>
        <td className="text-right font-mono text-[color:var(--text)]">2,310</td>
       </tr>
       <tr>
        <td className="text-right font-mono text-[color:var(--text)]">03</td>
        <td className="text-[color:var(--text)] font-semibold">BlockMaster</td>
        <td>Minecraft</td>
        <td>
         <Badge>Inactivo</Badge>
        </td>
        <td className="text-right font-mono text-[color:var(--text)]">2,090</td>
       </tr>
      </tbody>
     </table>
    </div>
   </Spec2>

   {/* EMPTY STATE */}
   <Spec2
    title="Empty State"
    tag="primitives/empty-state.tsx"
    intro="Qué mostrar cuando no hay datos: icono, mensaje y una acción que desbloquea al usuario."
    a11y="Siempre ofrece una salida accionable; nunca un callejón sin salida."
   >
    <Card style={{ padding: 0, overflow: "hidden" }}>
     <EmptyState
      icon="search"
      title="Sin resultados"
      sub="No encontramos herramientas para esa búsqueda. Prueba con otro término o explora por juego."
      action={
       <Button variant="ghost" icon="arrow">
        Ver todos los juegos
       </Button>
      }
     />
    </Card>
   </Spec2>
  </div>
 )
}

// ============================================================================
// 6. BLOCKS (from the handoff's segunda pasada)
// ============================================================================
const NOOP = () => {}

function BlocksSection() {
  const tags = ["Pokémon VGC", "Singles", "Clima", "Compartir"]

  return (
   <div>
    <div className="mb-8 pb-6 border-b border-[var(--border)]">
     <Kicker>Bloques</Kicker>
     <h2 className="text-[length:var(--t-3xl)] mt-2.5">Compuestos extraídos de las páginas</h2>
     <p className="text-[length:var(--t-base)] text-[color:var(--text-muted)] max-w-[64ch] mt-[0.7rem] leading-[1.65]">
      Durante la segunda pasada sobre Inicio, Perfil, Navegación y Footer
      detectamos composiciones que se repetían en línea. Aquí viven ahora
      como piezas únicas — la página solo las invoca.
     </p>
    </div>

    <Callout icon="sparkles" title="De dónde salió cada bloque" tone="orange" style={{ marginBottom: "1.75rem" }}>
     <code>Metric</code>, <code>Marquee</code>, <code>ToolRow</code>,{" "}
     <code>EventCard</code> y <code>Leaderboard</code> vienen de{" "}
     <strong>Inicio</strong>. <code>LinkedRow</code>, <code>ActivityItem</code>,{" "}
     <code>AchievementTile</code> y <code>CardTitle</code> de{" "}
     <strong>Perfil</strong>. <code>IconButton</code> estaba duplicado en{" "}
     <strong>navbar, footer y perfil</strong>.
    </Callout>

    {/* METRIC */}
    <Spec2
     title="Metric"
     tag="metric.tsx"
     intro="Número grande + etiqueta. Unifica los tres tratamientos que existían sueltos: el héroe de Inicio, las cifras del Hub y la cabecera de Perfil. Props size · tone · mono · boxed."
     a11y="Usa tabular display para las cifras; la etiqueta describe la métrica y no depende solo de color."
    >
     <div className="flex gap-10 items-end flex-wrap">
      <Metric value="12K+" label="Jugadores" />
      <Metric value="#42" label="Ranking" size="sm" tone="orange" mono />
      <Metric value="28+" label="Componentes" size="lg" tone="orange" mono boxed />
     </div>
     <PropTable
      rows={[
       ["value", "node", "—", "Cifra principal."],
       ["label", "node", "—", "Etiqueta descriptiva."],
       ['size', '"sm"|"md"|"lg"', '"md"', "Escala de la cifra."],
       ['tone', '"text"|"orange"|"accent"', '"text"', "Color de la cifra."],
       ["mono", "boolean", "false", "Etiqueta en mono mayúsculas."],
       ["boxed", "boolean", "false", "Envuelve en superficie de tarjeta."],
      ]}
     />
    </Spec2>

    {/* ICONBUTTON */}
    <Spec2
     title="IconButton"
     tag="icon-button.tsx"
     intro="El control cuadrado de 38px que aparece en la navbar, el footer y los sheets. Variante bordeada y punto de notificación incluidos."
     a11y="Siempre exige aria-label; el área cumple el mínimo táctil. Renderiza &lt;a&gt; si se pasa href, &lt;button&gt; si no."
    >
     <Row2>
      <IconButton icon="search" label="Buscar" />
      <IconButton icon="bell" label="Notificaciones" dot />
      <IconButton icon="sun" label="Tema" />
      <IconButton icon="discord" label="Discord" bordered href="#" />
      <IconButton icon="globe" label="Web" bordered href="#" />
     </Row2>
     <PropTable
      rows={[
       ["icon", "string", "—", "Nombre del icono."],
       ["label", "string", "—", "aria-label (obligatorio)."],
       ["dot", "boolean", "false", "Punto de notificación."],
       ["bordered", "boolean", "false", "Variante con borde."],
       ["href", "string", "—", "Si se pasa, renderiza enlace."],
      ]}
     />
    </Spec2>

    {/* CARDTITLE */}
    <Spec2
     title="CardTitle"
     tag="card-title.tsx"
     intro='El encabezado "icono + título" dentro de una Card. Con la prop right añade una acción o contador alineado a la derecha.'
     a11y="Es un h3 real: mantiene la jerarquía de encabezados dentro de la tarjeta."
    >
     <div className="grid grid-cols-2 gap-5 max-[1000px]:grid-cols-1">
      <Card style={{ padding: "1.5rem" }}>
       <CardTitle icon="user">Datos de la cuenta</CardTitle>
       <p className="text-[color:var(--text-muted)] text-[length:var(--t-sm)] m-0">
        Encabezado simple con icono.
       </p>
      </Card>
      <Card style={{ padding: "1.5rem" }}>
       <CardTitle icon="star" right={<span className="text-[color:var(--text-dim)] font-mono text-xs">37 / 60</span>}>
        Logros
       </CardTitle>
       <p className="text-[color:var(--text-muted)] text-[length:var(--t-sm)] m-0">
        Con acción/contador a la derecha.
       </p>
      </Card>
     </div>
    </Spec2>

    {/* TOOLROW */}
    <Spec2
     title="ToolRow"
     tag="tool-row.tsx"
     intro="El hermano horizontal de ToolCard: mismo propósito (una herramienta), formato denso de lista. Se usa en la sección «Herramientas» de Inicio."
     a11y="Es un botón completo, enfocable y activable con teclado; el estado se comunica con Badge (texto), no solo color."
    >
     <div className="flex flex-col gap-5">
      <ToolRow
       tool={{ icon: "calc", name: "Calculadora de Daño", cat: "Pokémon", desc: "Cálculo de daño VGC y singles.", status: "live" }}
       onClick={NOOP}
      />
      <ToolRow
       tool={{ icon: "cards", name: "TCG Pocket", cat: "TCG", desc: "Constructor de mazos y meta.", status: "new" }}
       onClick={NOOP}
      />
     </div>
    </Spec2>

    {/* EVENTCARD */}
    <Spec2
     title="EventCard"
     tag="event-card.tsx"
     intro="Una entrada de torneo / evento: bloque de fecha, cuerpo y CTA. Vive en Inicio y alimentará la futura página de Eventos."
     a11y="La fecha se lee como día + mes; el estado de inscripción usa Badge con texto."
    >
     <div className="max-w-[560px]">
      <EventCard
       event={{ date: "14 JUN", title: "VGC Regional — Series 3", game: "Pokémon", players: 128, status: "open" }}
       go={NOOP}
      />
     </div>
    </Spec2>

    {/* LEADERBOARD */}
    <Spec2
     title="Leaderboard"
     tag="leaderboard.tsx"
     intro="Tabla de clasificación con cabecera, top-3 destacado y fila «tú». Compuesta por filas LeaderRow."
     a11y="Lista semántica; el rango usa tabular-nums; los tres primeros se distinguen por estilo además de posición."
    >
     <div className="max-w-[420px]">
      <Leaderboard
       leaders={[
        { rank: 1, name: "RotomChef", pts: 4820 },
        { rank: 2, name: "Zephyr_VGC", pts: 4610 },
        { rank: 3, name: "Mikiri.K", pts: 4395 },
        { rank: 4, name: "AlexBoff", pts: 4180, you: true },
       ]}
       onViewAll={NOOP}
      />
     </div>
    </Spec2>

    {/* LINKEDROW + ACTIVITY + ACHIEVEMENTS */}
    <Spec2
     title="LinkedRow · ActivityItem · AchievementTile"
     tag="linked-row.tsx · activity-item.tsx · achievement-tile.tsx"
     intro="Los tres bloques de listado del Perfil: cuenta vinculada, fila de actividad y casilla de logro."
     a11y="Iconos decorativos; el significado vive en el texto. Los logros bloqueados muestran un candado, no solo un color apagado."
    >
     <div className="grid grid-cols-2 gap-5 items-start max-[1000px]:grid-cols-1">
      <Card style={{ padding: "1.25rem" }}>
       <CardTitle icon="link">Cuentas vinculadas</CardTitle>
       <div className="flex flex-col gap-3">
        <LinkedRow icon="discord" iconClass="discord" name="Discord" sub="alexboff#0420" end={<Badge kind="live">Vinculado</Badge>} />
        <LinkedRow icon="gamepad" name="Minecraft" sub="Sin vincular" end={<Button variant="outline" size="sm">Vincular</Button>} />
       </div>
      </Card>
      <Card style={{ padding: "1.25rem" }}>
       <CardTitle icon="bell">Actividad</CardTitle>
       <ul className="list-none m-0 p-0 flex flex-col">
        <ActivityItem icon="trophy" text="Quedó 2º en VGC Regional" time="hace 2 días" color="var(--orange-500)" />
        <ActivityItem icon="calc" text="Guardó 3 sets en la Calculadora" time="hace 4 días" color="var(--accent-bright)" />
       </ul>
      </Card>
     </div>
     <div className="grid grid-cols-3 gap-3 mt-5 max-[620px]:grid-cols-2">
      <AchievementTile icon="trophy" name="Campeón Regional" done />
      <AchievementTile icon="zap" name="Racha de 10" done />
      <AchievementTile icon="cards" name="Coleccionista TCG" />
     </div>
    </Spec2>

    {/* MARQUEE */}
    <Spec2
     title="Marquee"
     tag="marquee.tsx"
     intro="Tira de etiquetas en desplazamiento infinito. Decorativa; se detiene con el toggle de movimiento y prefers-reduced-motion."
     a11y="aria-hidden: es decoración, su contenido se anuncia en otro lugar de la página."
    >
     <div className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)]">
      <Marquee items={["POKÉMON VGC", "MONSTER HUNTER", "MYSTERY DUNGEON", "TCG POCKET", "MINECRAFT", "SHOWDOWN"]} />
     </div>
    </Spec2>

    {/* NAVBAR (documented, visual frame) */}
    <Spec2
     title="Navbar"
     tag="ui.jsx → boffmedia/navbar.tsx"
     intro="La barra de navegación global. Logo + enlaces con icono + acciones (IconButton) + usuario. Fija arriba, gana fondo al hacer scroll (backdrop-filter), y colapsa en un sheet en móvil. No se renderiza inline porque es position:fixed — aquí se documenta su estructura."
     a11y="nav con aria-label; aria-current en el enlace activo; el sheet móvil atrapa el foco y cierra con Escape."
    >
     {/* Visual frame showing navbar structure */}
     <div className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden bg-[var(--bg-grad-2)]">
      <div className="flex items-center gap-2 py-[0.6rem] px-[0.9rem] border-b border-[var(--border)] bg-[var(--surface-2)]">
       <span className="w-[9px] h-[9px] rounded-full bg-[var(--surface-3)]" />
       <span className="w-[9px] h-[9px] rounded-full bg-[var(--surface-3)]" />
       <span className="w-[9px] h-[9px] rounded-full bg-[var(--surface-3)]" />
       <span className="ml-2 font-mono text-[length:var(--t-xs)] text-[color:var(--text-dim)]">navbar — position:fixed</span>
      </div>
      <div className="p-7">
       {/* Navbar mock */}
       <div className="flex items-center justify-between gap-6 py-[0.85rem] px-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <Link href="/" className="inline-flex items-center gap-[0.6rem] flex-shrink-0">
          <img
            src="/img/boff-logo.webp"
            alt=""
            width={34}
            height={34}
            className="rounded-[6px]"
          />
          <span className="relative font-display font-extrabold text-[1.3rem] tracking-[0.01em] text-[var(--orange-500)] pr-[2.6rem]">
            BoffMedia
            <span className="absolute -top-[0.4rem] right-0 font-mono text-[0.5rem] font-bold tracking-[0.1em] px-[0.3rem] py-[0.12rem] text-[var(--on-accent)] bg-[var(--accent-bright)] rounded-[3px]">
              BETA
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-1 max-[920px]:hidden">
         {[
          ["home", "Inicio", true],
          ["trophy", "Eventos", false],
          ["wrench", "Herramientas", false],
          ["users", "Comunidad", false],
         ].map(([icon, label, active]) => (
          <span
           key={label as string}
           className={
            "inline-flex items-center gap-[0.45rem] text-[length:var(--t-sm)] font-medium py-2 px-[0.85rem] rounded-[var(--btn-radius)] transition-colors " +
            (active
             ? "text-[var(--orange-500)] font-semibold bg-[color-mix(in_srgb,var(--orange-500)_14%,transparent)]"
             : "text-[var(--text-muted)]")
           }
          >
           <Icon name={icon as string} size={17} />
           <span>{label}</span>
          </span>
         ))}
        </div>
        <div className="flex items-center gap-2">
         <IconButton icon="search" label="Buscar" />
         <IconButton icon="bell" label="Notificaciones" dot />
         <IconButton icon="sun" label="Cambiar tema" />
         <span className="inline-flex items-center gap-[0.55rem] py-[0.3rem] pr-[0.75rem] pl-[0.35rem] rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-[var(--surface-2)]">
          <span className="w-[30px] h-[30px] rounded-full grid place-items-center font-display font-extrabold text-[0.85rem] text-white bg-gradient-to-br from-[var(--orange-500)] to-[var(--orange-700)]">A</span>
          <span className="text-[length:var(--t-sm)] font-semibold max-[920px]:hidden">Alex</span>
         </span>
        </div>
       </div>
       <p className="text-[length:var(--t-xs)] text-[color:var(--text-dim)] mt-3 text-center">
        Vista simplificada — la navbar real es position:fixed con backdrop-filter
       </p>
      </div>
     </div>

     <div className="grid grid-cols-2 gap-5 mt-5 max-[1000px]:grid-cols-1">
      <PropTable
       rows={[
        ["route", "string", "—", "Ruta activa para resaltar el enlace."],
        ["go", "(route) => void", "—", "Navegación hash."],
        ['theme', '"dark"|"light"', "—", "Tema actual (icono sol/luna)."],
        ["onToggleTheme", "() => void", "—", "Alterna el tema."],
       ]}
      />
      <div>
       <p className="text-[length:var(--t-sm)] text-[color:var(--text-muted)] max-w-[66ch] leading-[1.6] mb-3">
        Compuesta por <code>Logo</code>, <code>Icon</code>,{" "}
        <code>IconButton</code> y <code>Button</code> — cero clases sueltas
        tras la segunda pasada.
       </p>
       <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[length:var(--t-sm)]">
         <Icon name="check" size={14} className="text-[var(--emerald-400)]" />
         <span className="text-[var(--text-muted)]">Fondo translúcido con <code>backdrop-filter: blur(14px)</code></span>
        </div>
        <div className="flex items-center gap-2 text-[length:var(--t-sm)]">
         <Icon name="check" size={14} className="text-[var(--emerald-400)]" />
         <span className="text-[var(--text-muted)]">Gana borde al hacer scroll (8px+)</span>
        </div>
        <div className="flex items-center gap-2 text-[length:var(--t-sm)]">
         <Icon name="check" size={14} className="text-[var(--emerald-400)]" />
         <span className="text-[var(--text-muted)]">Sheet lateral en móvil con enlaces + tema</span>
        </div>
        <div className="flex items-center gap-2 text-[length:var(--t-sm)]">
         <Icon name="check" size={14} className="text-[var(--emerald-400)]" />
         <span className="text-[var(--text-muted)]">Punto de notificación en campana</span>
        </div>
       </div>
      </div>
     </div>
    </Spec2>

    {/* FOOTER */}
    <Spec2
     title="Footer"
     tag="footer.tsx"
     intro="El pie global: marca + tagline + IconButtons sociales, columnas de enlaces, newsletter y barra legal."
     a11y="Enlaces agrupados por encabezado; iconos sociales con aria-label; el formulario es enfocable y enviable con teclado."
    >
     <div className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)]">
      <Footer go={NOOP as (path: string) => void} />
     </div>
    </Spec2>
   </div>
  )
}

// ============================================================================
// 7. PATTERNS
// ============================================================================
function PatternsSection() {
 const [seg, setSeg] = React.useState("grid")
 const [q, setQ] = React.useState("")
 const [game, setGame] = React.useState("all")
 const [tags, setTags] = React.useState(["Reciente", "Popular"])

 return (
  <div>
   <div className="mb-8 pb-6 border-b border-[var(--border)]">
    <Kicker>Patrones</Kicker>
    <h2 className="text-[length:var(--t-3xl)] mt-2.5">Soluciones recurrentes de UX</h2>
    <p className="text-[length:var(--t-base)] text-[color:var(--text-muted)] max-w-[64ch] mt-[0.7rem] leading-[1.65]">
     Composiciones que se repiten en todo el producto. Estandarizarlas
     elimina decisiones y mantiene la coherencia entre Herramientas,
     Eventos y Comunidad.
    </p>
   </div>

   <Spec2
    title="Barra de filtros"
    tag="patrón"
    intro="El encabezado de toda página de catálogo: buscar + alternar vista + filtrar + chips activos. Siempre en este orden."
    a11y="Cada control es independiente y enfocable; los chips se quitan con teclado."
   >
    <div className="flex flex-col gap-4">
     <div className="flex gap-[0.875rem] flex-wrap items-center">
      <div className="flex-1 min-w-[220px]">
       <SearchInput value={q} onChange={setQ} placeholder="Buscar herramientas…" />
      </div>
      <Segmented
       value={seg}
       onChange={setSeg}
       options={[
        { value: "grid", icon: "grid", label: "" },
        { value: "list", icon: "list", label: "" },
       ]}
      />
     </div>
     <div className="flex gap-2 flex-wrap items-center">
      <span className="text-[color:var(--text-dim)] text-[length:var(--t-xs)] font-mono uppercase tracking-[0.1em]">
       Filtros
      </span>
      {tags.map((t) => (
       <Tag
        key={t}
        tone="accent"
        onRemove={() => setTags((a) => a.filter((x) => x !== t))}
       >
        {t}
       </Tag>
      ))}
     </div>
    </div>
   </Spec2>

   <Spec2
    title="Paleta de comandos"
    tag="patrón"
    intro="Acceso rápido a cualquier acción o destino. Se invoca con ⌘K; busca, agrupa y navega por teclado."
    a11y="Modal con foco atrapado; lista filtrable con role; resultados agrupados con encabezados."
   >
    <CommandPaletteDemo />
   </Spec2>

   <Spec2
    title="Encabezado de página"
    tag="patrón"
    intro="Kicker + título + acción. La migaja de pan (Breadcrumb) sitúa al usuario en secciones anidadas como Herramientas."
    a11y="Breadcrumb en nav con aria-label; el elemento actual no es enlace."
   >
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden bg-[var(--bg-grad-2)]">
      <div className="flex items-center gap-2 py-[0.6rem] px-[0.9rem] border-b border-[var(--border)] bg-[var(--surface-2)]">
      <span className="w-[9px] h-[9px] rounded-full bg-[var(--surface-3)]" />
      <span className="w-[9px] h-[9px] rounded-full bg-[var(--surface-3)]" />
      <span className="w-[9px] h-[9px] rounded-full bg-[var(--surface-3)]" />
      <span className="ml-2 font-mono text-[length:var(--t-xs)] text-[color:var(--text-dim)]">/herramientas/mhwilds</span>
     </div>
     <div className="p-7">
      <Breadcrumb
       go={() => {}}
       items={[
        { label: "Herramientas", href: "#/herramientas" },
        { label: "MH Wilds", href: "#/herramientas/mhwilds" },
        { label: "Planificador" },
       ]}
      />
      <div className="flex items-end justify-between gap-4 flex-wrap mt-2">
       <div>
        <Kicker>Build Planner</Kicker>
        <h3 className="text-[length:var(--t-3xl)] mt-2">Planificador de Builds</h3>
       </div>
       <div className="flex gap-2.5">
        <Button variant="ghost" icon="bookmark">
         Guardar
        </Button>
        <Button variant="primary" icon="plus">
         Nuevo set
        </Button>
       </div>
      </div>
     </div>
    </div>
   </Spec2>
  </div>
 )
}

function CommandPaletteDemo() {
 const GROUPS = [
  {
   heading: "Ir a",
   items: [
    ["home", "Inicio"],
    ["wrench", "Herramientas"],
    ["trophy", "Eventos"],
    ["user", "Mi perfil"],
   ],
  },
  {
   heading: "Acciones",
   items: [
    ["plus", "Crear equipo"],
    ["sword", "Nuevo build"],
    ["search", "Buscar Pokémon"],
   ],
  },
 ]
 const [q, setQ] = React.useState("")
 const filtered = GROUPS.map((g) => ({
  ...g,
  items: g.items.filter(([, l]) =>
   l.toLowerCase().includes(q.toLowerCase())
  ),
 })).filter((g) => g.items.length)

 return (
  <Modal
   trigger={
    <Button variant="outline" icon="search">
     Abrir paleta (⌘K)
    </Button>
   }
   title={null}
   size="md"
  >
   <div className="flex flex-col">
    <div className="flex items-center gap-2.5 py-[0.4rem] px-[0.4rem] pb-4 border-b border-[var(--border)] text-[color:var(--text-dim)]">
     <Icon name="search" size={18} />
     <input
      autoFocus
      placeholder="Escribe un comando o busca…"
      value={q}
      onChange={(e) => setQ(e.target.value)}
      className="flex-1 border-0 bg-transparent text-[color:var(--text)] font-[inherit] text-[length:var(--t-base)] outline-none"
     />
     <kbd className="font-mono text-[length:var(--t-xs)] text-[color:var(--text-dim)]">ESC</kbd>
    </div>
    <div className="flex flex-col gap-[0.2rem] pt-3 max-h-[320px] overflow-y-auto">
     {filtered.length === 0 ? (
      <div className="text-center text-[color:var(--text-dim)] text-[length:var(--t-sm)] py-6">
       Sin resultados para «{q}».
      </div>
     ) : (
      filtered.map((g) => (
       <div key={g.heading}>
         <div className="font-mono text-[length:var(--t-xs)] tracking-[0.1em] uppercase text-[color:var(--text-dim)] pt-[0.5rem] pb-[0.3rem] px-[0.7rem]">
         {g.heading}
        </div>
        {g.items.map(([icon, label]) => (
         <button
          key={label}
          className="flex items-center gap-[0.7rem] w-full text-left border-0 bg-transparent text-[color:var(--text-muted)] font-[inherit] text-[length:var(--t-sm)] py-[0.6rem] px-[0.7rem] rounded-[var(--radius)] cursor-pointer hover:bg-[var(--surface-2)] hover:text-[color:var(--text)] [&_svg]:text-[color:var(--text-dim)] [&_kbd]:ml-auto [&_kbd]:font-mono [&_kbd]:text-[length:var(--t-xs)] [&_kbd]:text-[color:var(--text-dim)] [&_kbd]:border [&_kbd]:border-[var(--border)] [&_kbd]:rounded-[5px] [&_kbd]:py-px [&_kbd]:px-1.5"
         >
          <Icon name={icon} size={16} />
          {label}
          <kbd>↵</kbd>
         </button>
        ))}
       </div>
      ))
     )}
    </div>
   </div>
  </Modal>
 )
}

// ============================================================================
// 8. BOFFMEDIA
// ============================================================================
function BoffSection({ go }: { go?: (path: string) => void }) {
 const g = GAMES.mhwilds
 const pokemonGame = GAMES.pokemon
 const { all: pokemonTools } = gameToolList(pokemonGame)
 const allRanked = rankedTools()
 const allGames = allGamesList()
 const goFn = go || (() => {})

 return (
   <div>
    <div className="mb-8 pb-6 border-b border-[var(--border)]">
     <Kicker>Boffmedia</Kicker>
     <h2 className="text-[length:var(--t-3xl)] mt-2.5">Componentes del producto</h2>
     <p className="text-[length:var(--t-base)] text-[color:var(--text-muted)] max-w-[64ch] mt-[0.7rem] leading-[1.65]">
      Piezas específicas de BoffMedia, compuestas sobre el sistema. Una sola
      fuente de datos (<code>games-data</code>) alimenta tarjetas,
      herramientas destacadas y navegación.
     </p>
    </div>

    <Spec2
     title="GameCard"
     tag="boffmedia/game-card.tsx"
     intro="La entrada de un juego en el hub de Herramientas. Muestra logo, categorías y recuento total de herramientas."
     a11y="role button, navegable por teclado; el glow de acento por juego deriva del token hue, no de color fijo."
    >
     <div className="max-w-[420px]">
       <GameCard game={g} go={goFn} />
     </div>
    </Spec2>

    <Spec2
     title="FeaturedTool"
     tag="boffmedia/featured-tool.tsx"
     intro="El héroe de una página de juego: herramienta destacada con descripción, features y arte de apoyo."
     a11y="Jerarquía clara con un solo CTA primario; el placeholder de arte indica su contenido."
    >
     <FeaturedTool tool={g.featured} go={goFn} />
    </Spec2>

    <Spec2
     title="ToolCard"
     tag="boffmedia/tool-card.tsx"
     intro="Una herramienta dentro de la cuadrícula. Estados «nuevo» y «pronto»; el segundo se desactiva."
     a11y="Las tarjetas «pronto» pierden el rol interactivo (tabIndex -1) para no confundir."
    >
     <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[1.125rem]">
      {g.tools.slice(0, 3).map((t) => (
        <ToolCard key={t.title} tool={t} go={goFn} />
      ))}
     </div>
    </Spec2>

    <Spec2
     title="Cabecera de perfil"
     tag="patrón"
     intro="El encabezado de comunidad: avatar, identidad, etiquetas y estadísticas rápidas. Reutiliza Avatar, Badge y Stat."
     a11y="Las cifras usan tabular-nums; los iconos sociales tienen aria-label."
    >
     <div className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden bg-[var(--bg-grad-2)]">
      <div className="p-7 flex gap-6 items-center flex-wrap">
       <Avatar size={84} fallback="AX" ring tone="orange" />
       <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2.5 flex-wrap">
         <h3 className="text-[length:var(--t-2xl)]">Alex Rivera</h3>
         <Badge kind="accent">Pro</Badge>
         <Badge kind="live">En línea</Badge>
        </div>
        <p className="text-[color:var(--text-muted)] text-[length:var(--t-sm)] mt-1 mb-3">
         @rotomchef · se unió en marzo de 2024
        </p>
        <div className="flex gap-2 flex-wrap">
         <Tag>Pokémon VGC</Tag>
         <Tag>MH Wilds</Tag>
         <Tag>Top 50</Tag>
        </div>
       </div>
       <div className="flex gap-6">
        {[
         ["128", "Builds"],
         ["32", "Torneos"],
         ["2.4k", "Seguidores"],
        ].map(([n, l]) => (
         <div key={l} className="flex flex-col">
          <span className="font-display font-extrabold text-[length:var(--t-xl)] text-[color:var(--orange-500)]">
           {n}
          </span>
          <span className="text-[color:var(--text-dim)] font-mono text-[length:var(--t-xs)] uppercase tracking-[0.1em]">
           {l}
          </span>
         </div>
        ))}
       </div>
      </div>
     </div>
    </Spec2>

    {/* ---- Herramientas · componentes nuevos ---- */}
    <div className="dsh-subdivider">
     <span className="dsh-subdivider__kicker">Herramientas · nuevos</span>
     <p>
      Piezas reutilizables extraídas al construir la sección Herramientas (dirección <strong>«Rail»</strong>).
      Todas funcionan con cualquier juego del registro <code>games-data</code> y comparten un único almacén de
      favoritos y recientes (<code>localStorage</code>), así que el estado es consistente en toda la plataforma.
     </p>
    </div>

    <Spec2
     title="FavStar"
     tag="boffmedia/fav-star.tsx"
     intro="Botón de favorito reutilizable. Alterna una herramienta en el almacén global de favoritos por su href; el mismo href se refleja en cualquier lugar donde aparezca (tarjeta, lista, aside)."
     a11y="aria-pressed comunica el estado; aria-label cambia entre añadir/quitar; detiene la propagación para no disparar la tarjeta contenedora."
    >
     <div className="flex gap-[0.8rem] items-center">
      <FavStar href="#/demo/fav-a" />
      <FavStar href="#/demo/fav-b" />
      <span className="text-[color:var(--text-muted)] text-[length:var(--t-sm)]">
       Pulsa una estrella — el estado persiste.
      </span>
     </div>
     <PropTable rows={[
      ["href", "string", "—", "Identificador de la herramienta (su ruta)."],
      ["className", "string", '""', "Clases extra (p. ej. posicionado sobre una tarjeta)."],
     ]} />
    </Spec2>

    <Spec2
     title="ToolTile"
     tag="boffmedia/tool-tile.tsx"
     intro="Tarjeta compacta de herramienta: icono coloreado por juego, título, descripción a dos líneas, categoría/juego y favorito. Es la unidad densa para rejillas y listas; el acento deriva del hue del juego."
     a11y="role button enfocable; las herramientas «pronto» pierden el rol interactivo; el estado se comunica con Badge (texto), no solo color."
    >
     <div className="grid grid-cols-2 gap-4 max-[620px]:grid-cols-1">
      {pokemonTools.slice(0, 2).map((t) => (
       <ToolTile key={t.href} tool={t} game={pokemonGame} go={goFn} showGame />
      ))}
     </div>
     <PropTable rows={[
      ["tool", "object", "—", "Herramienta normalizada (de gameToolList)."],
      ["game", "object", "—", "Juego, para color (hue) y etiqueta."],
      ["go", "(route) => void", "—", "Navegación; registra «reciente» al abrir."],
      ["showGame", "boolean", "false", "Muestra el juego en vez de la categoría."],
     ]} />
    </Spec2>

    <Spec2
     title="ToolCardFav"
     tag="boffmedia/tool-card-fav.tsx"
     intro="La ToolCard estándar envuelta con una FavStar superpuesta y registro automático de «reciente» al abrir. Es la tarjeta que usa la dirección Rail en las páginas de juego — composición pura, sin CSS nuevo de tarjeta."
     a11y="Hereda la accesibilidad de ToolCard; la estrella es un control independiente que no interfiere con la activación de la tarjeta."
    >
     <div className="toolgrid">
      {pokemonTools.slice(0, 2).map((t, i) => (
       <ToolCardFav key={t.href} tool={t} go={goFn} delay={i * 50} />
      ))}
     </div>
    </Spec2>

    <Spec2
     title="GameSwitcher"
     tag="boffmedia/game-switcher.tsx"
     intro="Selector de juego: un Dropdown con el logo y el nombre del juego activo que lista el resto del registro para saltar entre ellos. Pensado para barras y asides; escala automáticamente al añadir juegos."
     a11y="Es un Dropdown accesible (menú con teclado); el logo es decorativo y el nombre da el contexto."
    >
     <div className="max-w-[240px]">
       <GameSwitcher game={g} go={goFn} games={allGames} />
     </div>
    </Spec2>

    <Spec2
     title="ToolCommand · ⌘K"
     tag="boffmedia/tool-command.tsx"
     intro="Buscador global de herramientas en un modal tipo paleta de comandos. Busca por herramienta, categoría o juego sobre todo el registro y navega al resultado. Reutiliza Modal y el patrón de command-palette del kit."
     a11y="El campo recibe foco al abrir; Escape cierra; cada resultado es un botón navegable por teclado."
    >
     <div className="max-w-[420px]">
       <ToolCommand tools={allRanked} go={goFn} />
     </div>
    </Spec2>

    <Spec2
     title="Favoritos & recientes"
     tag="boffmedia/tools-store.ts"
     intro="Un almacén externo minúsculo y persistido (localStorage) con dos hooks: useFavorites() → { favs, isFav, toggle } y useRecent() → { recent, push }. Cualquier componente que los use queda sincronizado al instante, sin pasar props ni elevar estado."
     a11y="Sin UI propia; habilita estados (favorito/reciente) que los componentes comunican con texto e iconos."
    >
     <DemoFavCounter />
    </Spec2>
   </div>
 )
}

function DemoFavCounter() {
 const { favs } = useFavorites()
 return (
   <div className="flex items-center gap-4 flex-wrap">
    <div className="flex gap-[0.6rem]">
     <FavStar href="#/demo/fav-a" />
     <FavStar href="#/demo/fav-b" />
     <FavStar href="#/demo/fav-c" />
    </div>
    <Badge kind="accent">{favs.length} favorito{favs.length === 1 ? "" : "s"} en el almacén</Badge>
    <span className="text-[color:var(--text-dim)] text-[length:var(--t-xs)]">
     Compartido con toda la sección Herramientas.
    </span>
   </div>
 )
}

// ============================================================================
// 9. PROFILE
// ============================================================================
const PROFILE_STATS = [
  { icon: "trophy", label: "Ranking global", value: "#42", sub: "Top 1%" },
  { icon: "bolt", label: "Puntos", value: "4 180", sub: "+210 esta semana" },
  { icon: "chart", label: "Victorias", value: "73%", sub: "128 partidas" },
  { icon: "star", label: "Logros", value: "37", sub: "de 60" },
]
const ACHIEVEMENTS = [
  { icon: "trophy", name: "Campeón Regional", done: true },
  { icon: "zap", name: "Racha de 10", done: true },
  { icon: "calc", name: "Maestro del cálculo", done: true },
  { icon: "sword", name: "Cazador veterano", done: true },
  { icon: "cards", name: "Coleccionista TCG", done: false },
  { icon: "flask", name: "Pionero del sim", done: false },
]
const ACTIVITY = [
  { icon: "trophy", text: "Quedó 2º en VGC Regional — Series 2", time: "hace 2 días", color: "var(--orange-500)" },
  { icon: "calc", text: "Guardó 3 sets en la Calculadora de Daño", time: "hace 4 días", color: "var(--accent-bright)" },
  { icon: "users", text: "Se unió al equipo «Rotom Squad»", time: "hace 1 semana", color: "var(--purple-400)" },
]

function ProfileSection() {
  const [editing, setEditing] = React.useState(false)
  const [name, setName] = React.useState("Alex Boffmedia")
  const [email, setEmail] = React.useState("alex@boffmedia.gg")

  return (
   <div>
    <div className="mb-8 pb-6 border-b border-[var(--border)]">
     <Kicker>Perfil</Kicker>
     <h2 className="text-[length:var(--t-3xl)] mt-2.5">Página de perfil</h2>
     <p className="text-[length:var(--t-base)] text-[color:var(--text-muted)] max-w-[64ch] mt-[0.7rem] leading-[1.65]">
      La página de comunidad del usuario: identidad, datos, cuentas
      vinculadas, actividad, estadísticas y logros. Compuesta al 100%
      sobre primitivos y bloques del sistema.
     </p>
    </div>

    {/* Page header pattern */}
    <Spec2
     title="Encabezado de página"
     tag="patrón"
     intro="Kicker + título + acción. El patrón estándar de cabecera de página interior."
     a11y="El botón de acción es enfocable y describe su propósito con texto."
    >
     <div className="flex items-end justify-between gap-6 flex-wrap">
      <div>
       <Kicker>Cuenta</Kicker>
       <h3 className="text-[length:var(--t-4xl)] mt-[0.7rem]">Mi perfil</h3>
      </div>
      <Button variant={editing ? "primary" : "ghost"} icon={editing ? "check" : "cog"} onClick={() => setEditing(!editing)}>
       {editing ? "Guardar cambios" : "Editar perfil"}
      </Button>
     </div>
    </Spec2>

    {/* Profile hero / identity card */}
    <Spec2
     title="Tarjeta de identidad"
     tag="patrón"
     intro="Avatar, nombre, handle, etiquetas y estadísticas rápidas. La cubierta usa grid-dots como textura de fondo."
     a11y="Las cifras usan tabular-nums; el avatar tiene fallback de iniciales; la cámara es un control con aria-label."
    >
     <Card ticks className="overflow-hidden">
      {/* Cover */}
      <div
       className="h-[104px] border-b border-[var(--border)]"
       style={{
        background: "color-mix(in srgb, var(--orange-500) 14%, var(--surface-2))",
        backgroundImage: "radial-gradient(var(--grid-dot) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
       }}
      />
      {/* Main row */}
      <div className="flex items-end gap-6 flex-wrap p-[1.4rem_1.75rem_1.75rem]">
       {/* Avatar */}
       <div className="relative w-[110px] h-[110px] shrink-0 -mt-[74px]">
        <Avatar size={110} fallback="A" tone="orange" style={{ border: "4px solid var(--surface)", boxShadow: "0 10px 30px -10px var(--orange-500)" }} />
        <IconButton className="absolute bottom-[2px] right-[2px] w-[30px] h-[30px] rounded-full" icon="camera" size={16} label="Cambiar foto" />
       </div>
       {/* Identity */}
       <div className="flex-1 min-w-[220px] pb-[0.3rem]">
        <div className="flex items-center gap-[0.75rem] flex-wrap">
         <h3 className="text-[length:var(--t-2xl)] whitespace-nowrap">{name}</h3>
         <Badge kind="live">Online</Badge>
        </div>
        <p className="text-[color:var(--text-muted)] text-[length:var(--t-sm)] mt-[0.35rem] mb-[0.75rem]">@alexboff · Miembro desde 2023</p>
        <div className="flex gap-2 flex-wrap">
         <Badge kind="accent">Moderador</Badge>
         <Badge>VGC</Badge>
         <Badge>Monster Hunter</Badge>
        </div>
       </div>
       {/* Quick stats */}
       <div className="flex items-center gap-5 pb-2">
        <Metric value="#42" label="Ranking" size="sm" tone="orange" mono />
        <div className="w-px h-[38px] bg-[var(--border-strong)]" />
        <Metric value="4 180" label="Puntos" size="sm" tone="orange" mono />
       </div>
      </div>
     </Card>
    </Spec2>

    {/* Account details + linked + activity */}
    <Spec2
     title="Datos de la cuenta"
     tag="perfil"
     intro="Formulario de nombre, correo y biografía con edición controlada. Los campos se habilitan al pulsar «Editar perfil»."
     a11y="Labels asociadas con htmlFor; los campos disabled reducen opacidad visual."
    >
     <Card style={{ padding: "1.5rem" }}>
      <CardTitle icon="user">Datos de la cuenta</CardTitle>
      <div className="grid grid-cols-2 gap-[1.1rem] max-[620px]:grid-cols-1">
       <Field label="Nombre" icon="user">
        <Input value={name} disabled={!editing} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
       </Field>
       <Field label="Correo" icon="mail">
        <Input value={email} disabled={!editing} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
       </Field>
       <Field label="Biografía" icon="message" className="col-span-2 max-[620px]:col-span-1">
        <textarea
         className="input"
         style={{
          resize: "vertical",
          fontFamily: "var(--font-body)",
          lineHeight: "1.6",
         }}
         rows={3}
         disabled={!editing}
         defaultValue="Entrenador competitivo de VGC y cazador a tiempo parcial. Construyendo herramientas para la comunidad."
        />
       </Field>
      </div>
     </Card>
    </Spec2>

    {/* Linked accounts */}
    <Spec2
     title="Cuentas vinculadas"
     tag="perfil"
     intro="Filas de cuentas externas con icono coloreado, nombre, estado y acción de vincular/desvincular."
     a11y="Cada fila es un contenedor semántico; el botón de vincular tiene texto descriptivo."
    >
     <Card style={{ padding: "1.5rem" }}>
      <CardTitle icon="link">Cuentas vinculadas</CardTitle>
      <div className="flex flex-col gap-3">
       <LinkedRow icon="discord" iconClass="discord" name="Discord" sub="alexboff#0420" end={<Badge kind="live">Vinculado</Badge>} />
       <LinkedRow icon="gamepad" iconClass="mc" name="Minecraft" sub="Sin vincular" end={<Button variant="outline" size="sm" icon="link">Vincular</Button>} />
       <LinkedRow icon="gamepad" iconClass="steam" name="Showdown" sub="RotomChef" end={<Badge kind="live">Vinculado</Badge>} />
      </div>
     </Card>
    </Spec2>

    {/* Activity feed */}
    <Spec2
     title="Actividad reciente"
     tag="perfil"
     intro="Línea temporal de acciones del usuario: torneos, herramientas, comunidad. Cada fila tiene icono coloreado, texto y timestamp."
     a11y="Los iconos son decorativos; el significado vive en el texto. El color se acompaña de texto, nunca es el único portador."
    >
     <Card style={{ padding: "1.5rem" }}>
      <CardTitle icon="bell">Actividad reciente</CardTitle>
      <ul className="list-none m-0 p-0 flex flex-col">
       {ACTIVITY.map((a, i) => <ActivityItem key={i} icon={a.icon} text={a.text} time={a.time} color={a.color} />)}
      </ul>
     </Card>
    </Spec2>

    {/* Stats grid */}
    <Spec2
     title="Estadísticas"
     tag="perfil"
     intro="Cuatro KPIs en cuadrícula 2×2: ranking, puntos, victorias y logros. Cada Stat reutiliza el primitivo Stat con icono, valor, delta y subtexto."
     a11y="Los deltas usan color + icono direccional; el valor es tabular-nums."
    >
     <Card style={{ padding: "1.5rem" }}>
      <CardTitle icon="chart">Estadísticas</CardTitle>
      <div className="grid grid-cols-2 gap-[0.9rem] max-[620px]:grid-cols-1">
        {PROFILE_STATS.map((s) => (
         <StatCard key={s.label} icon={s.icon} value={s.value} label={s.label} sub={s.sub} />
        ))}
       </div>
      </Card>
     </Spec2>

     {/* Achievements */}
     <Spec2
      title="Logros"
      tag="perfil"
      intro="Cuadrícula de logros desbloqueados y bloqueados. Los bloqueados se atenúan y muestran un candado en vez del icono."
      a11y="Los logros bloqueados usan opacidad + candado; el color nunca es el único portador de estado."
     >
      <Card style={{ padding: "1.5rem" }}>
       <div className="flex items-center justify-between mb-5">
        <h3 className="flex items-center gap-[0.6rem] text-[length:var(--t-lg)] m-0">
         <Icon name="star" size={18} className="text-[var(--orange-500)]" />
         Logros
        </h3>
        <span className="text-[color:var(--text-dim)] font-mono text-[length:var(--t-xs)]">37 / 60</span>
       </div>
       <div className="grid grid-cols-3 gap-3 mb-5 max-[620px]:grid-cols-2">
        {ACHIEVEMENTS.map((a) => (
         <AchievementTile key={a.name} icon={a.icon} name={a.name} done={a.done} />
        ))}
       </div>
       <Button variant="ghost" block iconRight="arrow">Ver todos los logros</Button>
      </Card>
     </Spec2>

    {/* Full profile page (composed) */}
    <Spec2
     title="Página completa"
     tag="perfil"
     intro="Todas las secciones juntas, como aparecen en la página de Perfil. Dos columnas: datos + actividad a la izquierda, stats + logros a la derecha."
     a11y="La jerarquía de encabezados es correcta: h1 → h2 → h3. Los formularios son navegables por teclado."
    >
     <div className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden bg-[var(--bg-grad-2)]">
      <div className="flex items-center gap-2 py-[0.6rem] px-[0.9rem] border-b border-[var(--border)] bg-[var(--surface-2)]">
       <span className="w-[9px] h-[9px] rounded-full bg-[var(--surface-3)]" />
       <span className="w-[9px] h-[9px] rounded-full bg-[var(--surface-3)]" />
       <span className="w-[9px] h-[9px] rounded-full bg-[var(--surface-3)]" />
       <span className="ml-2 font-mono text-[length:var(--t-xs)] text-[color:var(--text-dim)]">/perfil</span>
      </div>
      <div className="p-7">
       {/* Page header */}
       <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
        <div>
         <Kicker>Cuenta</Kicker>
         <h3 className="text-[length:var(--t-4xl)] mt-[0.7rem]">Mi perfil</h3>
        </div>
        <Button variant="ghost" icon="cog">Editar perfil</Button>
       </div>

       {/* Identity card */}
       <Card ticks className="overflow-hidden mb-6">
        <div
         className="h-[104px] border-b border-[var(--border)]"
         style={{
          background: "color-mix(in srgb, var(--orange-500) 14%, var(--surface-2))",
          backgroundImage: "radial-gradient(var(--grid-dot) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
         }}
        />
        <div className="flex items-end gap-6 flex-wrap p-[1.4rem_1.75rem_1.75rem]">
         <div className="relative w-[110px] h-[110px] shrink-0 -mt-[74px]">
          <Avatar size={110} fallback="A" tone="orange" style={{ border: "4px solid var(--surface)", boxShadow: "0 10px 30px -10px var(--orange-500)" }} />
          <IconButton className="absolute bottom-[2px] right-[2px] w-[30px] h-[30px] rounded-full" icon="camera" size={16} label="Cambiar foto" />
         </div>
         <div className="flex-1 min-w-[220px] pb-[0.3rem]">
          <div className="flex items-center gap-[0.75rem] flex-wrap">
           <h3 className="text-[length:var(--t-2xl)] whitespace-nowrap">{name}</h3>
           <Badge kind="live">Online</Badge>
          </div>
          <p className="text-[color:var(--text-muted)] text-[length:var(--t-sm)] mt-[0.35rem] mb-[0.75rem]">@alexboff · Miembro desde 2023</p>
          <div className="flex gap-2 flex-wrap">
           <Badge kind="accent">Moderador</Badge>
           <Badge>VGC</Badge>
           <Badge>Monster Hunter</Badge>
          </div>
         </div>
         <div className="flex items-center gap-5 pb-2">
          <Metric value="#42" label="Ranking" size="sm" tone="orange" mono />
          <div className="w-px h-[38px] bg-[var(--border-strong)]" />
          <Metric value="4 180" label="Puntos" size="sm" tone="orange" mono />
         </div>
        </div>
       </Card>

       {/* Two-column grid */}
       <div className="grid grid-cols-[1.2fr_1fr] gap-6 items-start max-[1000px]:grid-cols-1">
        {/* Left column */}
        <div className="flex flex-col gap-6">
         <Card style={{ padding: "1.5rem" }}>
          <CardTitle icon="user">Datos de la cuenta</CardTitle>
          <div className="grid grid-cols-2 gap-[1.1rem] max-[620px]:grid-cols-1">
           <Field label="Nombre" icon="user">
            <Input value={name} disabled />
           </Field>
           <Field label="Correo" icon="mail">
            <Input value={email} disabled />
           </Field>
          </div>
         </Card>
         <Card style={{ padding: "1.5rem" }}>
          <CardTitle icon="link">Cuentas vinculadas</CardTitle>
          <div className="flex flex-col gap-3">
           <LinkedRow icon="discord" iconClass="discord" name="Discord" sub="alexboff#0420" end={<Badge kind="live">Vinculado</Badge>} />
           <LinkedRow icon="gamepad" iconClass="mc" name="Minecraft" sub="Sin vincular" end={<Button variant="outline" size="sm" icon="link">Vincular</Button>} />
          </div>
         </Card>
         <Card style={{ padding: "1.5rem" }}>
          <CardTitle icon="bell">Actividad reciente</CardTitle>
          <ul className="list-none m-0 p-0 flex flex-col">
           {ACTIVITY.map((a, i) => <ActivityItem key={i} icon={a.icon} text={a.text} time={a.time} color={a.color} />)}
          </ul>
         </Card>
        </div>
        {/* Right column */}
        <div className="flex flex-col gap-6">
         <Card style={{ padding: "1.5rem" }}>
          <CardTitle icon="chart">Estadísticas</CardTitle>
          <div className="grid grid-cols-2 gap-[0.9rem]">
           {PROFILE_STATS.map((s) => (
            <StatCard key={s.label} icon={s.icon} value={s.value} label={s.label} sub={s.sub} />
           ))}
          </div>
         </Card>
         <Card style={{ padding: "1.5rem" }}>
          <div className="flex items-center justify-between mb-5">
           <h3 className="flex items-center gap-[0.6rem] text-[length:var(--t-lg)] m-0">
            <Icon name="star" size={18} className="text-[var(--orange-500)]" />
            Logros
           </h3>
           <span className="text-[color:var(--text-dim)] font-mono text-[length:var(--t-xs)]">37 / 60</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
           {ACHIEVEMENTS.map((a) => (
            <AchievementTile key={a.name} icon={a.icon} name={a.name} done={a.done} />
           ))}
          </div>
          <Button variant="ghost" block iconRight="arrow">Ver todos los logros</Button>
         </Card>
        </div>
       </div>
      </div>
     </div>
    </Spec2>
   </div>
  )
}

// ============================================================================
// 10. PLAYGROUND
// ============================================================================
function PlaygroundSection() {
 const toast = useToast()
 const [name, setName] = React.useState("Lluvia ofensiva")
 const [format, setFormat] = React.useState("vgc")
 const [atk, setAtk] = React.useState(70)
 const [def, setDef] = React.useState(45)
 const [spe, setSpe] = React.useState(85)
 const [share, setShare] = React.useState(true)
 const total = Math.round((atk + def + spe) / 3)

 return (
  <div>
   <div className="mb-8 pb-6 border-b border-[var(--border)]">
    <Kicker>Playground</Kicker>
    <h2 className="text-[length:var(--t-3xl)] mt-2.5">Composición en vivo</h2>
    <p className="text-[length:var(--t-base)] text-[color:var(--text-muted)] max-w-[64ch] mt-[0.7rem] leading-[1.65]">
     Una mini-feature real construida solo con piezas del sistema. Edita a
     la izquierda y ve el resultado a la derecha — así se prototipan
     funciones nuevas sin escribir CSS.
    </p>
   </div>

   <div className="p-7 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] bg-[radial-gradient(var(--grid-dot)_1px,transparent_1px)] bg-[length:22px_22px]">
    <div className="grid grid-cols-2 gap-8 items-start max-[1000px]:grid-cols-1">
     {/* Controls */}
     <div className="flex flex-col gap-5">
      <Field label="Nombre del set" icon="bookmark">
       <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Formato">
       <RadioGroup
        value={format}
        onChange={setFormat}
        options={[
         { value: "vgc", label: "VGC · Dobles", desc: "Formato oficial." },
         { value: "singles", label: "Singles OU" },
        ]}
       />
      </Field>
      <div className="flex flex-col gap-[0.875rem]">
       <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[color:var(--text-muted,#a9abb8)] mb-2">
         Ataque
        </label>
        <Slider defaultValue={atk} onChange={setAtk} />
       </div>
       <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[color:var(--text-muted,#a9abb8)] mb-2">
         Defensa
        </label>
        <Slider defaultValue={def} onChange={setDef} />
       </div>
       <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[color:var(--text-muted,#a9abb8)] mb-2">
         Velocidad
        </label>
        <Slider defaultValue={spe} onChange={setSpe} />
       </div>
      </div>
      <Checkbox checked={share} onChange={setShare} label="Compartir con la comunidad" />
     </div>

     {/* Live preview */}
     <Card
      style={{
       padding: "1.5rem",
       display: "flex",
       flexDirection: "column",
       gap: "1.1rem",
       position: "sticky",
       top: 90,
      }}
     >
      <div className="flex items-center gap-4">
       <IconBox icon="sword" tone="orange" size="lg" />
       <div className="flex-1">
        <h4 className="text-[length:var(--t-lg)]">
         {name || "Sin título"}
        </h4>
        <div className="flex gap-1.5 mt-1">
         <Badge kind="accent">{format === "vgc" ? "VGC" : "Singles"}</Badge>
         {share && <Badge kind="live">Público</Badge>}
        </div>
       </div>
      </div>
      <Progress label="Ataque" value={atk} tone="orange" />
      <Progress label="Defensa" value={def} tone="accent" />
      <Progress label="Velocidad" value={spe} tone="emerald" />
      <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border)]">
       <span className="text-[color:var(--text-muted)] text-[length:var(--t-sm)] font-semibold">
        Media de stats
       </span>
       <span className="font-display font-extrabold text-[length:var(--t-xl)] text-[color:var(--orange-500)]">
        {total}
       </span>
      </div>
      <Button
       variant="primary"
       icon="bolt"
       block
       onClick={() =>
        toast({
         tone: "success",
         title: "Build guardado",
         desc: `«${name}» · media ${total}`,
        })
       }
      >
       Guardar build
      </Button>
     </Card>
    </div>
   </div>
   <Callout icon="sparkles" title="Esto es el sistema funcionando" style={{ marginTop: "1.5rem" }}>
    Field, RadioGroup, Slider, Checkbox, Card, IconBox, Badge, Progress,
    Button y Toast — nueve componentes, cero CSS nuevo. Así de rápido nace
    una feature cuando el sistema es la base.
   </Callout>
  </div>
 )
}

// ============================================================================
// 10. ACCESIBILIDAD + ROADMAP
// ============================================================================
const A11Y = [
 ["target", "Áreas táctiles ≥ 44px", "Todo control interactivo cumple el mínimo de 44×44px en móvil. Los iconos-botón usan padding, no tamaño de icono."],
 ["sun", "Contraste AA", "Texto sobre superficie cumple 4.5:1; texto grande y UI, 3:1. Validado en los seis modos (3 direcciones × 2 temas)."],
 ["bolt", "Foco visible", "Anillo de foco con doble halo (--bg + --accent-bright) en todo elemento enfocable. Nunca se elimina sin reemplazo."],
 ["target", "Navegable por teclado", "Menús, diálogos y sliders responden a Tab, flechas, Enter y Escape. El foco se atrapa dentro de modales."],
 ["zap", "Movimiento opcional", "Cada animación se desactiva con prefers-reduced-motion y con el toggle global de movimiento."],
 ["message", "Semántica correcta", "role, aria-expanded, aria-checked, aria-current y regiones live aplicados según patrón WAI-ARIA."],
]

function AccessibilitySection() {
 return (
  <div>
   <div className="mb-8 pb-6 border-b border-[var(--border)]">
    <Kicker>Accesibilidad</Kicker>
    <h2 className="text-[length:var(--t-3xl)] mt-2.5">Estándar para cada componente</h2>
    <p className="text-[length:var(--t-base)] text-[color:var(--text-muted)] max-w-[64ch] mt-[0.7rem] leading-[1.65]">
     La accesibilidad es un requisito de aceptación, no una mejora opcional.
     Estos seis criterios se verifican en cada pieza antes de entrar al
     sistema.
    </p>
   </div>
   <div className="grid grid-cols-2 gap-[1.125rem] max-[620px]:grid-cols-1">
    {A11Y.map(([icon, t, d]) => (
     <div
      key={t}
      className="p-[1.4rem] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)] flex gap-4"
     >
      <span className="grid place-items-center w-[38px] h-[38px] rounded-[var(--radius,14px)] text-[color:var(--orange-500)] bg-[color-mix(in_srgb,var(--orange-500)_12%,transparent)] shrink-0">
       <Icon name={icon} size={18} />
      </span>
      <div>
       <h4 className="text-[length:var(--t-lg)] mb-1.5">{t}</h4>
       <p className="text-[length:var(--t-sm)] text-[color:var(--text-muted)] leading-[1.6]">{d}</p>
      </div>
     </div>
    ))}
   </div>
   <Alert tone="success" title="Auditado en seis modos">
    Cada componente del catálogo incluye su nota de accesibilidad (icono
    escudo). Cambia dirección, tema y acento desde el panel de Tweaks para
    verificar el contraste en vivo.
   </Alert>
  </div>
 )
}

const ROADMAP: [string, string, string, string[]][] = [
 [
  "Fase 1",
  "Fundación",
  "live",
  [
   "Sistema de tokens completo y documentado",
   "Primitivos: Button, Card, Badge, Input, Switch",
   "Este Hub como fuente de verdad",
  ],
 ],
 [
  "Fase 2",
  "Completar el catálogo",
  "new",
  [
   "Overlays: Modal, Sheet, Popover, Tooltip, Toast",
   "Formulario: Radio, Slider, Checkbox, Select avanzado",
   "Datos: Table ordenable, paginación, KPI y gráficos",
  ],
 ],
 [
  "Fase 3",
  "Migración guiada",
  "soon",
  [
   "Reemplazar bloques ad-hoc por componentes del kit",
   "Codemod de clases Tailwind duplicadas → tokens",
   "Linter que prohíbe colores y espacios fuera de token",
  ],
 ],
 [
  "Fase 4",
  "Escala de producto",
  "soon",
  [
   "Command palette global y búsqueda universal",
   "Componentes de comunidad: perfil, comentarios, reacciones",
   "Temas por juego derivados del token de acento",
  ],
 ],
]

function RoadmapSection() {
 return (
  <div>
   <div className="mb-8 pb-6 border-b border-[var(--border)]">
    <Kicker>Hoja de ruta</Kicker>
    <h2 className="text-[length:var(--t-3xl)] mt-2.5">De fundación a plataforma</h2>
    <p className="text-[length:var(--t-base)] text-[color:var(--text-muted)] max-w-[64ch] mt-[0.7rem] leading-[1.65]">
     Una secuencia priorizada: primero la base, luego el catálogo, después
     la migración del producto existente y por último las capacidades que
     abren features futuras.
    </p>
   </div>
   <div className="flex flex-col">
    {ROADMAP.map(([phase, title, badge, items]) => (
     <div
      key={phase}
      className="grid grid-cols-[130px_1fr] gap-6 py-6 border-b border-[var(--border)] last:border-b-0 max-[620px]:grid-cols-1 max-[620px]:gap-3"
     >
      <div className="flex flex-col gap-2">
       <span className="font-display font-black text-[length:var(--t-2xl)] text-[color:var(--text-dim)]">
        {phase}
       </span>
       <Badge kind={badge as "live" | "new" | "soon"}>
        {badge === "live"
         ? "En curso"
         : badge === "new"
         ? "Siguiente"
         : "Planificado"}
       </Badge>
      </div>
      <div>
       <h4 className="text-[length:var(--t-lg)] mb-2">{title}</h4>
       <ul className="list-none p-0 m-0 flex flex-col gap-2 [&_li]:flex [&_li]:gap-2.5 [&_li]:items-start [&_li]:text-[length:var(--t-sm)] [[&_li]:text-[color:var(--text-muted)] [&_li]:leading-relaxed_li]:text-[color:var(--text-muted)] [[&_li]:text-[color:var(--text-muted)] [&_li]:leading-relaxed_li]:leading-[1.5] [&_svg]:text-[color:var(--accent-bright)] [&_svg]:shrink-0 [&_svg]:mt-[0.125rem]">
        {(items as string[]).map((it) => (
         <li key={it}>
          <Icon name="check" size={15} />
          {it}
         </li>
        ))}
       </ul>
      </div>
     </div>
    ))}
   </div>

   <div className="grid grid-cols-2 gap-5 mt-8 max-[1000px]:grid-cols-1">
    <Callout icon="layers" tone="orange" title="Estrategia de migración">
     Migración incremental, sin big-bang. Cada página adopta el kit
     pantalla a pantalla; los componentes nuevos conviven con los antiguos
     hasta sustituirlos. El token system actúa de puente: ya comparten
     variables.
    </Callout>
    <Callout icon="trending" title="Escalabilidad">
     Añadir un juego o una feature no añade CSS nuevo: se compone con
     piezas existentes y, como mucho, un token de acento. El sistema crece
     en cobertura, no en complejidad.
    </Callout>
   </div>
  </div>
 )
}

// ============================================================================
// toolskit — Herramientas (showcase section)
// ============================================================================
function ToolsKitSection() {
  const [hpDemo, setHpDemo] = React.useState(142)
  const [pickDemo, setPickDemo] = React.useState("Modesto")
  const [tagDemo, setTagDemo] = React.useState("skill")
  const demoUsage = [{ name: "Bola Sombra", pct: 95 }, { name: "Voz Lunar", pct: 88 }, { name: "Protección", pct: 72 }, { name: "Viento Feérico", pct: 51 }]
  const eloDemo = [1500, 1512, 1505, 1524, 1540, 1533, 1551, 1569, 1560, 1582, 1601, 1593, 1618]
  const eloDemoB = [1500, 1490, 1503, 1498, 1515, 1527, 1519, 1531, 1548, 1540, 1556, 1565, 1574]
  const eloDemoRes: (string | null | undefined)[] = ["", "win", "loss", "win", "win", "loss", "win", "win", "loss", "win", "win", "loss", "win"]
  const heatDemo = [3, 1, 0, 0, 2, 4, 5, 2, 1, 0, 3, 6, 4, 2, 0, 1, 5, 7, 3, 1, 0, 2, 4, 6, 3, 0, 1, 0]
  return (
    <div>
      <div className="dsh-sectionhead">
        <Kicker>Herramientas</Kicker>
        <h2>Piezas compartidas de las herramientas</h2>
        <p>Componentes extraídos al construir las páginas de Herramientas (Planificador y Árbol de MH, Meta VGC, Wonder Mail, Claves de Steam, Sorteos). Son la fuente única para cualquier herramienta nueva — token-driven y compatibles con las tres direcciones.</p>
      </div>

      <Callout icon="wrench" title="Nuevo en este pase" tone="orange" style={{ marginBottom: "1.75rem" }}>
        El rediseño full-bleed de <strong>Meta VGC</strong> y la <strong>Calculadora de Daño</strong> extrajo diez piezas a <code>tool-kit.jsx</code>: <code>ToolApp</code> (marco de app a pantalla completa), <code>SegTabs</code>, <code>ToolSelect</code>, <code>ToolTable</code> (tabla ordenable), <code>Picker</code> (select nativo estilizado), <code>HpBar</code> (barra de recurso), <code>TeamSprites</code>, <code>CopyButton</code>, <code>TypeBadge</code> y <code>BaseStatBars</code> — junto a las ya existentes <code>ToolPanel</code>, <code>ToolStatBars</code> y <code>PokeSprite</code>. Todas token-driven y compatibles con las tres direcciones.
      </Callout>

      <Callout icon="chart" title="Nuevo en este pase · Game Tracker" tone="accent" style={{ marginBottom: "1.75rem" }}>
        El rediseño full-bleed del <strong>VGC Game Tracker</strong> (sesiones de ladder + torneo, partidas, series BO3 y panel de estadísticas) extrajo seis piezas genéricas más a <code>tool-kit.jsx</code>: <code>ResultBadge</code> (chip W/L/D), <code>StatTile</code> (KPI), <code>SplitBar</code> (barra victoria/derrota), <code>TrendChart</code> (gráfico de líneas responsive), <code>HeatGrid</code> (mapa de calor de actividad) y <code>TagPills</code> (chips con tono, seleccionables).
      </Callout>

      <Spec2 title="ToolPanel" tag="tool-kit.jsx" intro="La superficie sobre la que se construye cada página de herramienta: cabecera opcional (título + meta o cabecera propia) y cuerpo con padding. Hereda card-bg / card-border / radius del sistema." a11y="El título es texto real; el panel no aporta semántica falsa. La cabecera mantiene contraste AA en los seis modos.">
        <div className="spec2__grid2">
          <ToolPanel title="Equipo actual" meta="8 piezas">
            <p className="text-[color:var(--text-muted)] m-0 text-sm">Cabecera con título + meta y cuerpo con padding.</p>
          </ToolPanel>
          <ToolPanel title="Sin cabecera meta">
            <p className="text-[color:var(--text-muted)] m-0 text-sm">Solo título. El cuerpo aloja cualquier contenido de la herramienta.</p>
          </ToolPanel>
        </div>
        <PropTable rows={[
          ["title", "node", "—", "Título de la cabecera (Orbitron, mayúsculas)."],
          ["meta", "node", "—", "Texto mono a la derecha (contador, hint)."],
          ["headRight", "node", "—", "Sustituye a meta por contenido propio."],
          ["head", "node", "—", "Cabecera totalmente personalizada."],
          ["noBody", "boolean", "false", "Omite el wrapper de cuerpo con padding."],
        ]} />
      </Spec2>

      <Spec2 title="ToolStatBars" tag="tool-kit.jsx" intro="Lista etiquetada de barras de porcentaje, normalizadas al valor mayor. Usada en Meta VGC para movimientos, objetos, habilidades y teratipos; sirve para cualquier distribución." a11y="Cada fila muestra el porcentaje como texto además de la barra: el dato no depende solo del color o la longitud.">
        <div style={{ maxWidth: 320 }}>
          <ToolStatBars title="Movimientos" items={demoUsage} />
        </div>
        <PropTable rows={[
          ["title", "string", "—", "Encabezado mono de la sección."],
          ["items", "{name,pct}[]", "—", "Filas a representar."],
          ["tone", "color", "var(--accent)", "Color de la barra."],
          ["max", "number", "auto", "Tope para normalizar (auto = mayor pct)."],
        ]} />
      </Spec2>

      <Spec2 title="PokeSprite" tag="tool-kit.jsx" intro="Sprite de Pokémon con respaldo elegante: si la imagen falla, muestra un disco coloreado con la inicial. Variantes artwork (oficial) y front (pixel)." a11y="alt con el nombre del Pokémon; el respaldo es legible y mantiene tamaño táctil cuando es interactivo.">
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <PokeSprite dex={727} name="Incineroar" size={64} />
          <PokeSprite dex={987} name="Flutter Mane" size={64} />
          <PokeSprite dex={25} name="Pikachu" size={56} variant="front" />
          <PokeSprite dex={99999} name="Fallback" size={56} />
        </div>
        <PropTable rows={[
          ["dex", "number", "—", "Número de Pokédex nacional."],
          ["name", "string", '""', "Nombre (alt + inicial del respaldo)."],
          ["size", "number", "40", "Lado del sprite en px."],
          ['variant', '"artwork"|"front"', '"artwork"', "Arte oficial o sprite pixel."],
        ]} />
      </Spec2>

      <Spec2 title="ToolApp" tag="tool-kit.jsx" intro="Marco de aplicación a sangre completa: una columna de altura fija (viewport menos la barra de 68px) con zona de toolbar, sub-barra opcional y un cuerpo flexible que gestiona su propio scroll. Es la base de las herramientas tipo 'app' (Meta VGC, y próximamente Tracker y Calculadora)." a11y="No introduce roles falsos; las regiones internas (listas, tablas) aportan su propia semántica. El cuerpo conserva foco y scroll por teclado.">
        <div style={{ height: 150, border: "var(--hairline) solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0.5rem 0.7rem", borderBottom: "var(--hairline) solid var(--border)", display: "flex", gap: "0.5rem", alignItems: "center", background: "color-mix(in srgb, var(--surface-2) 60%, transparent)" }}>
            <SegTabs value="a" options={[{ value: "a", label: "Toolbar" }, { value: "b", label: "región" }]} onChange={() => {}} size="sm" />
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dim)" }}>shrink-0</span>
          </div>
          <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: 11 }}>cuerpo · scroll propio</div>
        </div>
        <PropTable rows={[
          ["toolbar", "node", "—", "Barra superior fija (selectores, tabs)."],
          ["subbar", "node", "—", "Sub-barra opcional (sub-vistas, avisos)."],
          ["children", "node", "—", "Cuerpo flexible con scroll propio."],
        ]} />
      </Spec2>

      <Spec2 title="SegTabs · ToolSelect" tag="tool-kit.jsx" intro="Los dos controles de la toolbar. SegTabs es un segmentado compacto con estado activo en acento; ToolSelect es un desplegable etiquetado (envuelve el Dropdown compartido) que muestra la opción actual. Sustituyen a los &lt;Select&gt; de Radix del código original." a11y="SegTabs usa role=tab/aria-selected; ToolSelect hereda el manejo de teclado y foco del Dropdown base.">
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
          <SegTabs value="stats" options={[{ value: "stats", label: "Stats" }, { value: "torneo", label: "Torneo" }]} onChange={() => {}} />
          <ToolSelect value="regi" icon="filter" width="200px"
            items={[{ header: "Smogon" }, { value: "regi", label: "VGC 2026 Reg I" }, { value: "regh", label: "VGC 2026 Reg H" }]}
            onSelect={() => {}} />
        </div>
        <PropTable rows={[
          ["SegTabs · options", "string[]|{value,label,count}[]", "—", "Segmentos; count pinta un contador."],
          ["ToolSelect · items", "{value,label}|{header}[]", "—", "Opciones, con cabeceras de grupo."],
          ["icon", "string", "—", "Icono guía opcional en el trigger."],
        ]} />
      </Spec2>

      <Spec2 title="ToolTable" tag="tool-kit.jsx" intro="Tabla de datos con cabecera fija y columnas opcionalmente ordenables. El padre controla el estado de orden y el render de filas; el componente aporta el cromo consistente (usada en Clasificación y Divergencia de Meta VGC)." a11y="La cabecera ordenable es un control real; el indicador de orden no depende solo del color. Las filas mantienen contraste AA.">
        <ToolTable
          columns={[{ key: "n", label: "#", w: 36 }, { key: "name", label: "Pokémon" }, { key: "use", label: "Uso", w: 90, align: "right", sortable: true }]}
          sortKey="use" sortDir="desc" onSort={() => {}} minWidth="320px">
          <tbody>
            <tr className="[&_td]:py-[0.7rem] [&_td]:px-4 [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:text-[color:var(--text-muted)] [&_tr:last-child_td]:border-b-0 [&_td]:text-sm">
              <td className="font-mono text-[color:var(--text)]">1</td><td className="font-semibold text-[color:var(--text)]">Incineroar</td><td className="font-mono text-right text-[color:var(--text)]">43.1%</td>
            </tr>
            <tr className="[&_td]:py-[0.7rem] [&_td]:px-4 [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:text-[color:var(--text-muted)] [&_tr:last-child_td]:border-b-0 [&_td]:text-sm">
              <td className="font-mono text-[color:var(--text)]">2</td><td className="font-semibold text-[color:var(--text)]">Flutter Mane</td><td className="font-mono text-right text-[color:var(--text)]">37.2%</td>
            </tr>
          </tbody>
        </ToolTable>
        <PropTable rows={[
          ["columns", "{key,label,w,align,sortable}[]", "—", "Definición de columnas."],
          ["sortKey / sortDir", "string / 'asc'|'desc'", "—", "Estado de orden (controlado)."],
          ["onSort", "(key) => void", "—", "Click en cabecera ordenable."],
        ]} />
      </Spec2>

      <Spec2 title="TeamSprites · TypeBadge · CopyButton · BaseStatBars" tag="tool-kit.jsx" intro="Cuatro piezas de detalle. TeamSprites pinta una fila compacta de hasta 6 sprites (con selección opcional); TypeBadge es el chip de tipo en su color canónico; CopyButton copia al portapapeles con confirmación; BaseStatBars dibuja la distribución de estadísticas base con su BST." a11y="CopyButton confirma la acción con texto además del icono; TypeBadge mantiene texto legible sobre el color de tipo.">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap" }}>
            <TeamSprites slots={[{ dex: 727, name: "Incineroar" }, { dex: 987, name: "Flutter Mane" }, { dex: 892, name: "Urshifu" }, { dex: 812, name: "Rillaboom" }]} size={34} />
            <ToolsTypeBadge type="Fuego" /><ToolsTypeBadge type="Siniestro" pct={15} />
            <CopyButton text="demo" />
          </div>
          <div style={{ maxWidth: 240 }}><BaseStatBars base={{ hp: 95, atk: 115, def: 90, spa: 80, spd: 90, spe: 60 }} /></div>
        </div>
        <PropTable rows={[
          ["TeamSprites · slots", "{dex,name}[]", "—", "Hasta `max` sprites; onSelect opcional."],
          ["TypeBadge · type / pct", "string / number", "—", "Tipo y porcentaje opcional."],
          ["CopyButton · text", "string", "—", "Texto a copiar; confirma 1.6s."],
          ["BaseStatBars · base", "{hp..spe}", "—", "Seis estadísticas + BST."],
        ]} />
      </Spec2>

      <Spec2 title="Picker · HpBar" tag="tool-kit.jsx" intro="Dos piezas extraídas de la Calculadora de Daño. Picker es un &lt;select&gt; nativo estilizado — preferible a un menú propio cuando la lista es larga (naturalezas, objetos, movimientos): se escanea y teclea más rápido. HpBar es una barra de recurso con rampa verde→ámbar→rojo, editable y con reinicio opcional." a11y="Picker es un select nativo: hereda teclado y lectores de pantalla. HpBar expone el valor como texto además del color y la longitud.">
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ minWidth: 180 }}>
            <span className="font-mono text-xs text-[color:var(--text-dim)] block mb-1.5">Naturaleza</span>
            <Picker value={pickDemo} onChange={setPickDemo} options={["Modesto", "Tímido", "Adamant", "Cauto", "Sereno", "Audaz"]} />
          </div>
          <div style={{ minWidth: 240 }}>
            <HpBar current={hpDemo} max={207} onChange={setHpDemo} onReset={() => setHpDemo(207)} />
          </div>
        </div>
        <PropTable rows={[
          ["Picker · options", "string[]|{value,label}[]", "—", "Opciones del select."],
          ["Picker · value/onChange", "string / (v)=>void", "—", "Controlado."],
          ["HpBar · current/max", "number", "—", "Valor y tope del recurso."],
          ["HpBar · onChange/onReset", "fn", "—", "Editable + reinicio opcionales."],
        ]} />
      </Spec2>

      <Spec2 title="ResultBadge · StatTile" tag="tool-kit.jsx" intro="Dos piezas base del Tracker. ResultBadge es el chip cuadrado de resultado (W / L / D / —) con tono semántico; StatTile es un KPI: número tabular grande sobre etiqueta, con tono (pos/neg/accent/neutral) y tamaño." a11y="ResultBadge usa la letra además del color. StatTile expone valor y etiqueta como texto real.">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <ResultBadge result="win" /><ResultBadge result="loss" /><ResultBadge result="draw" /><ResultBadge result={null} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem", maxWidth: 460 }}>
            <StatTile value="34" label="Jugadas" tone="neutral" />
            <StatTile value="62%" label="Win rate" tone="pos" />
            <StatTile value="1692" label="ELO" tone="accent" />
            <StatTile value="−4.1" label="Δ media" tone="neg" small />
          </div>
        </div>
        <PropTable rows={[
          ["ResultBadge · result", '"win"|"loss"|"draw"|null', "—", "Define letra + tono."],
          ["ResultBadge · size", "number", "32", "Lado en px."],
          ["StatTile · value/label", "node / string", "—", "Valor grande + etiqueta."],
          ["StatTile · tone", '"pos"|"neg"|"accent"|"neutral"', '"neutral"', "Color del valor."],
          ["StatTile · small", "boolean", "false", "Variante compacta."],
        ]} />
      </Spec2>

      <Spec2 title="SplitBar · TrendChart" tag="tool-kit.jsx" intro="SplitBar es la barra proporcional victoria/derrota (verde/rojo, con empate opcional) y su % de win rate. TrendChart es un gráfico de líneas responsive: mide su propio ancho para trazos nítidos, admite varias series, una línea base discontinua y puntos por resultado." a11y="SplitBar muestra el % como texto; TrendChart es decorativo-de-apoyo y el dato vive también en las tablas/KPIs.">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", maxWidth: 520 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <SplitBar win={8} loss={2} /><SplitBar win={5} loss={4} draw={1} /><SplitBar win={2} loss={7} />
          </div>
          <div style={{ border: "var(--hairline) solid var(--border)", borderRadius: "var(--radius)", padding: "0.6rem 0.7rem" }}>
            <TrendChart height={150}
              lines={[{ values: eloDemo, color: "var(--accent)", width: 2 }, { values: eloDemoB, color: "var(--text-dim)", width: 1.5, dashed: true, opacity: 0.7 }]}
              baseline={1500} dots={eloDemoRes} />
          </div>
        </div>
        <PropTable rows={[
          ["SplitBar · win/loss/draw", "number", "0", "Segmentos proporcionales."],
          ["SplitBar · showRate", "boolean", "true", "Muestra el % de victorias."],
          ["TrendChart · lines", "{values,color,width,dashed,opacity}[]", "—", "Series a trazar."],
          ["TrendChart · baseline", "number", "—", "Regla discontinua de referencia."],
          ["TrendChart · dots", '("win"|"loss"|...)[]', "—", "Puntos coloreados en la 1ª serie."],
        ]} />
      </Spec2>

      <Spec2 title="HeatGrid · TagPills" tag="tool-kit.jsx" intro="HeatGrid es una rejilla de intensidad genérica (mapa de calor): ejes con etiquetas y una función value(fila,col) cuya magnitud tiñe la celda hacia el acento. TagPills es una fila de chips con tono, seleccionables (toggle, selección única) cuando se pasa onChange, o de solo lectura." a11y="TagPills seleccionable son botones reales; HeatGrid expone el conteo en el title de cada celda.">
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ minWidth: 240, flex: 1 }}>
            <HeatGrid rows={["L", "M", "X", "J", "V", "S", "D"]} cols={["0", "1", "2", "3"]}
              max={7} value={(ri, ci) => heatDemo[ri * 4 + ci] || 0} colLabel={(c) => ["mañana", "tarde", "noche", "madr."][Number(c)]} />
          </div>
          <div style={{ minWidth: 220 }}>
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--text-dim)] block mb-2">Causa del resultado</span>
            <TagPills value={tagDemo} onChange={(v) => setTagDemo(v ?? "")} options={[
              { value: "skill", label: "Habilidad", tone: "win" },
              { value: "misplay", label: "Error", tone: "loss" },
              { value: "luck", label: "Suerte", tone: "draw" },
              { value: "disconnect", label: "Desconexión", tone: "neutral" },
            ]} />
          </div>
        </div>
        <PropTable rows={[
          ["HeatGrid · rows/cols", "any[]", "—", "Etiquetas de los ejes."],
          ["HeatGrid · value", "(r,c) => number|{n}", "—", "Magnitud de cada celda."],
          ["HeatGrid · max/colLabel", "number / fn", "—", "Tope de intensidad y rótulo de columna."],
          ["TagPills · options", "{value,label,tone}[]", "—", "Chips con tono (win/loss/draw/neutral)."],
          ["TagPills · value/onChange", "string / fn", "—", "Con onChange = seleccionable; sin él, solo lectura."],
        ]} />
      </Spec2>
    </div>
  )
}

// ============================================================================
// battlesim — Capa de combate (showcase section)
// ============================================================================
interface BSMon {
  id: string; name: string; types: string[]; hp: number; fnt?: boolean; tera?: boolean;
  teraType?: string; status?: string | null; boosts?: Record<string, number>;
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
}

const MK = {
  garchomp: { id:"garchomp", name:"Garchomp", types:["Dragon","Ground"], teraType:"Steel", stats:{hp:108,atk:130,def:95,spa:80,spd:85,spe:102} },
  rillaboom: { id:"rillaboom", name:"Rillaboom", types:["Grass"], teraType:"Fire", stats:{hp:100,atk:125,def:90,spa:60,spd:70,spe:85} },
  ironhands: { id:"ironhands", name:"Iron Hands", types:["Fighting","Electric"], teraType:"Fire", stats:{hp:154,atk:140,def:108,spa:50,spd:68,spe:50} },
  fluttermane: { id:"fluttermane", name:"Flutter Mane", types:["Ghost","Fairy"], teraType:"Fairy", stats:{hp:55,atk:55,def:55,spa:135,spd:135,spe:135} },
  gholdengo: { id:"gholdengo", name:"Gholdengo", types:["Steel","Ghost"], teraType:"Flying", stats:{hp:87,atk:60,def:95,spa:133,spd:91,spe:84} },
  dragonite: { id:"dragonite", name:"Dragonite", types:["Dragon","Flying"], teraType:"Normal", stats:{hp:91,atk:134,def:95,spa:100,spd:100,spe:80} },
}

const mk = (key: string, o: Partial<BSMon>): BSMon => ({ ...(MK as any)[key], hp: 100, status: null, boosts: {}, tera: false, fnt: false, stats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 }, ...o } as BSMon)

const MOVES = [
  { name: "Terremoto", type: "Ground", cat: "phys", power: 100, acc: 100, pp: 9, maxpp: 16 },
  { name: "Enfado", type: "Dragon", cat: "phys", power: 120, acc: 100, pp: 4, maxpp: 16 },
  { name: "Roca Afilada", type: "Rock", cat: "phys", power: 100, acc: 80, pp: 8, maxpp: 8 },
  { name: "Danza Espada", type: "Normal", cat: "status", power: 0, acc: null, pp: 12, maxpp: 32 },
]

const LOG = [
  { turn: 6 },
  { who: "p2", actor: "Dragonite", kind: "move", icon: "bolt", type: "Flying", txt: "usó <b>Acróbata</b> sobre Garchomp.", dmg: "−22%", crit: false },
  { who: "p1", actor: "Garchomp", kind: "ability", icon: "shield", txt: "se aferra con <b>Multiescamas</b> rota — daño completo." },
  { who: "p1", actor: "Garchomp", kind: "move", icon: "bolt", type: "Ground", txt: "usó <b>Terremoto</b>.", dmg: "−38%", crit: true, eff: "super" },
  { kind: "sys", txt: "¡Un golpe crítico!" },
  { turn: 7 },
  { who: "p1", actor: "Alex", kind: "boost", icon: "trending", txt: "<b>Garchomp</b> aumentó su Ataque con Danza Espada.", boost: "+2 Atq" },
]

function BattlesimSection() {
  const demoMon = mk("garchomp", { hp: 78, boosts: { atk: 2, spe: 1 }, tera: true })
  const demoKo = mk("rillaboom", { hp: 0, fnt: true })
  const demoPar = mk("ironhands", { hp: 44, status: "par" })
  const target = MK.dragonite

  return (
    <div>
      <div className="dsh-sectionhead">
        <Kicker>Battlesim</Kicker>
        <h2>Capa de combate</h2>
        <p>Componentes específicos del simulador, construidos íntegramente sobre los tokens del sistema — heredan dirección (HUD/Neón/Grid), tema y acento sin reescribirse. Una sola hoja <code>battlesim.css</code> + <code>bs-kit.tsx</code> alimenta tanto el prototipo jugable como esta documentación.</p>
      </div>

      <Callout icon="sparkles" title="Prototipo jugable" style={{ marginBottom: "1.6rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <span>El flujo completo —inicio, cola, vista previa, combate en vivo, resultado, repetición y modo espectador— vive como prototipo clicable independiente.</span>
          <Button variant="primary" iconRight="external">Abrir prototipo</Button>
        </div>
      </Callout>

      <Spec2 title="Tipos y categorías" tag="battlesim.css · BSType" intro="Insignia de tipo derivada de una paleta de 18 tokens afinada para fondo oscuro. Variante sólida y fantasma; el punto refuerza el color con forma (no solo color)." a11y="El texto del tipo va siempre presente — la información nunca depende solo del color. Contraste AA sobre superficie.">
        <div className="spec2__row">
          {TYPES.slice(0, 9).map((t: string) => <BSType key={t} type={t} />)}
        </div>
        <div className="spec2__row" style={{ marginTop: ".6rem" }}>
          {["Dragon", "Ground", "Fairy", "Steel"].map((t: string) => <BSType key={t} type={t} ghost />)}
        </div>
        <div className="spec2__row" style={{ marginTop: ".6rem" }}>
          <BSCat cat="phys" /><BSCat cat="spec" /><BSCat cat="status" />
        </div>
      </Spec2>

      <Spec2 title="Medidor de PS" tag="BSHpMeter" intro="El bloque de información de un Pokémon en combate: nombre, nivel, gema Tera, barra de PS con segmentación y color por umbral, más estado y cambios de característica como fichas." a11y="El % de PS es texto, no solo barra; los estados (PAR, QUE…) y boosts se leen como etiquetas. Color de PS reforzado por el valor numérico.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1rem" }}>
          <BSHpMeter mon={demoMon} />
          <BSHpMeter mon={demoPar} />
          <BSHpMeter mon={demoKo} />
        </div>
        <PropTable rows={[
          ["mon", "object", "—", "Pokémon con hp (%), status, boosts, teraType, tera."],
          ["compact", "boolean", "false", "Oculta tipos/estado/boosts (solo barra)."],
        ]} />
      </Spec2>

      <Spec2 title="Fichas de estado, boost y Tera" tag="BSStatusChip · BSBoost · BSTera" intro="Micro-indicadores tácticos. Estados con color propio y abreviatura legible; boosts con signo y dirección; gema Tera con la forma del cristal teracristal.">
        <div className="spec2__row">
          {["brn", "par", "psn", "tox", "slp", "frz"].map((s) => <BSStatusChip key={s} status={s} />)}
        </div>
        <div className="spec2__row" style={{ marginTop: ".6rem" }}>
          <BSBoost stat="atk" value={2} /><BSBoost stat="spe" value={1} />
          <BSBoost stat="def" value={-1} /><BSBoost stat="spa" value={-2} />
        </div>
        <div className="spec2__row" style={{ marginTop: ".6rem", alignItems: "center", gap: ".7rem" }}>
          {["Steel", "Fairy", "Dragon", "Fire", "Water"].map((t) => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: ".35rem", fontSize: "var(--t-xs)", color: "var(--text-muted)" }}>
              <BSTera type={t} size="1.2em" />{t}
            </span>
          ))}
        </div>
      </Spec2>

      <Spec2 title="Selector de ataque" tag="BSMove" intro="La ficha de un movimiento: nombre, tipo, categoría, PP y —la pieza clave— una previsualización de eficacia contra el objetivo actual, calculada con la tabla de tipos en vivo." a11y="Eficacia comunicada con texto («Súper eficaz», «Inmune»), no solo color. Botón enfocable; los movimientos sin PP se desactivan con rol no interactivo.">
        <div className="grid grid-cols-2 gap-[.7rem]" style={{ maxWidth: 520 }}>
          {MOVES.map((mv, i) => <BSMove key={i} move={mv} target={target} onClick={() => {}} />)}
        </div>
        <p className="spec2__intro" style={{ marginTop: ".7rem", fontSize: "var(--t-sm)" }}>
          Objetivo de la demo: <b>Dragonite</b> (Dragón/Volador). Nótese cómo Terremoto marca «Inmune» y Enfado «Súper eficaz».
        </p>
      </Spec2>

      <Spec2 title="Condiciones de campo" tag="BSFieldCond" intro="Fichas para clima, terreno, trampas y pantallas. Color por efecto, icono, contador de turnos y nivel de capas. Pensadas para un riel compacto bajo el campo.">
        <div className="flex items-center gap-[.5rem] flex-wrap">
          <BSFieldCond cond={{ name: "Sol", icon: "sun", c: "var(--orange-400)", turns: 3 }} />
          <BSFieldCond cond={{ name: "Campo Eléctrico", icon: "bolt", c: "var(--ty-electric)", turns: 5 }} />
          <BSFieldCond cond={{ name: "Trampa Rocas", icon: "shield", c: "var(--ty-rock)" }} side />
          <BSFieldCond cond={{ name: "Púas", icon: "target", c: "var(--ty-poison)", lvl: 2 }} side />
          <BSFieldCond cond={{ name: "Reflejo", icon: "shield", c: "var(--cyan-400)", turns: 4 }} side />
        </div>
      </Spec2>

      <Spec2 title="Registro de combate" tag="BSLogEvent" intro="La alternativa al muro de texto: eventos como tarjetas con icono por tipo de acción, fichas de daño/curación/eficacia y separadores de turno. Mantiene la claridad competitiva con jerarquía visual." a11y="Cada evento es texto estructurado; las fichas (daño, eficacia) acompañan pero no sustituyen la descripción escrita.">
        <div className="flex flex-col gap-[.55rem]" style={{ maxWidth: 460 }}>
          {LOG.map((ev, i) => <BSLogEvent key={i} ev={ev} />)}
        </div>
      </Spec2>

      <Spec2 title="Banco de equipo y tarjeta de Pokémon" tag="BSTraySlot · BSMonCard" intro="Para cambios en combate (banco compacto con PS y tipos) y para vista previa / lobby (tarjeta con arte, tipos y base stats). Los Pokémon debilitados se desactivan y se marcan.">
        <div className="spec2__grid2" style={{ gap: "1.5rem", alignItems: "start" }}>
          <div className="grid gap-[.6rem]" style={{ gridTemplateColumns: "1fr" }}>
            <BSTraySlot mon={demoMon} active />
            <BSTraySlot mon={demoPar} />
            <BSTraySlot mon={demoKo} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".7rem" }}>
            <BSMonCard mon={mk("fluttermane", { hp: 100 }) as BSMon} lead showStats order={1} />
            <BSMonCard mon={mk("gholdengo", { hp: 100 }) as BSMon} showStats />
          </div>
        </div>
      </Spec2>

      <Spec2 title="Boff Insight y probabilidad" tag="BSWinProb · .insight" intro="Las piezas «esports»: barra de probabilidad de victoria para espectadores y el panel Boff Insight que traduce el estado del combate en lectura táctica (velocidad, rango de daño, prob. de KO)." a11y="Porcentajes y etiquetas textuales en ambos lados; la barra es refuerzo visual del dato numérico.">
        <div className="spec2__grid2" style={{ gap: "1.5rem", alignItems: "start" }}>
          <div style={{ paddingTop: ".4rem" }}>
            <BSWinProb a={64} b={36} nameA="Alex" nameB="Kaito" />
          </div>
          <div
            className="rounded-[var(--radius-lg)]"
            style={{ padding: ".85rem .95rem", background: "linear-gradient(160deg, color-mix(in srgb, var(--purple-500) 14%, var(--surface)), var(--surface))", border: "1px solid color-mix(in srgb, var(--purple-500) 32%, var(--border))" }}
          >
            <div className="flex items-center gap-[.5rem] font-mono text-[.62rem] tracking-[.14em] uppercase text-[var(--purple-400)] font-bold mb-[.6rem]">
              <Icon name="sparkles" size={14} /> Boff Insight
            </div>
            <div className="flex items-center justify-between gap-[.6rem] text-[var(--t-sm)] py-[.3rem] border-t-0 border-x-0 border-b border-solid border-[var(--border)] first:border-t-0">
              <span className="text-[var(--text-muted)]">Velocidad</span>
              <span className="font-mono font-bold text-[var(--emerald-400)]">Atacas primero</span>
            </div>
            <div className="flex items-center justify-between gap-[.6rem] text-[var(--t-sm)] py-[.3rem] border-t border-x-0 border-b-0 border-solid border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Enfado → Dragonite</span>
              <span className="font-mono font-bold">104–122%</span>
            </div>
            <div className="h-[7px] rounded-[4px] overflow-hidden bg-[var(--surface-3)] border border-solid border-[var(--border)] mt-[.3rem]">
              <span className="block h-full" style={{ width: "92%", background: "linear-gradient(90deg, var(--orange-600), var(--orange-400))" }} />
            </div>
            <div className="flex items-center justify-between gap-[.6rem] text-[var(--t-sm)] py-[.3rem] border-t border-x-0 border-b-0 border-solid border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Prob. de debilitar</span>
              <span className="font-mono font-bold" style={{ color: "var(--orange-400)" }}>Garantizado</span>
            </div>
          </div>
        </div>
      </Spec2>

      <Callout icon="layers" tone="orange" title="Una sola fuente, dos destinos" style={{ marginTop: "1.5rem" }}>
        Estas piezas se exportan como componentes (<code>BSHpMeter</code>, <code>BSMove</code>, <code>BSLogEvent</code>…). El prototipo las compone en pantallas completas; el Hub las documenta. Cero CSS duplicado, cambio de dirección/tema en vivo desde Tweaks.
      </Callout>
    </div>
  )
}

// ============================================================================
// MAIN SHOWCASE COMPONENT
// ============================================================================
const SECTIONS: Record<string, React.ComponentType<{ go?: (path: string) => void }>> = {
 overview: OverviewSection,
 philosophy: PhilosophySection,
 foundations: FoundationsSection,
 primitives: PrimitivesSection,
 composition: CompositionSection,
 blocks: BlocksSection,
 patterns: PatternsSection,
  boff: BoffSection,
  toolskit: ToolsKitSection,
  battlesim: BattlesimSection,
  profile: ProfileSection,
 playground: PlaygroundSection,
 a11y: AccessibilitySection,
 roadmap: RoadmapSection,
}

function ShowcaseInner() {
 const [active, setActive] = React.useState(
  () => (typeof window !== "undefined" && localStorage.getItem("dsh-section")) || "overview"
 )

 React.useEffect(() => {
  localStorage.setItem("dsh-section", active)
 }, [active])

 const pick = (id: string) => {
  setActive(id)
  window.scrollTo({ top: 0, behavior: "smooth" })
 }

 const Section = SECTIONS[active] || OverviewSection
 const go = (path: string) => {
  /* noop for showcase */
 }

 return (
   <main className="dsh w-full max-w-[var(--maxw)] mx-auto px-[var(--gutter)] pt-[6.5rem] pb-20">
   {/* Hero */}
   <div className="grid grid-cols-[1.4fr_1fr] gap-10 items-end mb-10 max-[1000px]:grid-cols-1 max-[1000px]:gap-6">
    <div className="min-w-0">
      <div className="flex items-center gap-2.5 flex-wrap mb-[1.1rem]">
      <Kicker>Sistema de diseño</Kicker>
      <span className="font-mono text-[length:var(--t-xs)] tracking-[0.08em] text-[color:var(--text-dim)] py-1 px-2.5 border border-[var(--border)] rounded-[var(--radius-pill)]">
       v2.0 · 4 capas
      </span>
     </div>
     <h1 className="text-[length:clamp(2.6rem,6vw,var(--t-5xl))] leading-none [&_em]:not-italic [&_em]:text-[color:var(--orange-500)]">
      Design <em>System</em> Hub
     </h1>
     <p className="text-[length:var(--t-lg)] text-[color:var(--text-muted)] max-w-[52ch] mt-5 leading-[1.6]">
      Documentación viva, catálogo de componentes y fuente de verdad del
      frontend de BoffMedia. Una sola base para competir y crear.
     </p>
    </div>
     <div className="min-w-0 grid grid-cols-2 gap-[0.875rem] max-[620px]:grid-cols-1">
     {[
      ["12", "Fundamentos"],
      ["28+", "Componentes"],
      ["3×2", "Modos visuales"],
      ["AA", "Accesibilidad"],
     ].map(([n, l]) => (
      <div key={l} className="py-[1.125rem] px-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)]">
       <div className="font-display font-black text-[length:var(--t-3xl)] leading-none text-[color:var(--orange-500)]">
        {n}
       </div>
       <div className="font-mono text-[length:var(--t-xs)] tracking-[0.1em] uppercase text-[color:var(--text-dim)] mt-1.5">
        {l}
       </div>
      </div>
     ))}
    </div>
   </div>

   {/* Layout */}
   <div className="grid grid-cols-[232px_1fr] gap-12 items-start max-[1000px]:grid-cols-1 max-[1000px]:gap-6">
    <aside className="sticky top-[90px] max-h-[calc(100vh-110px)] overflow-y-auto pr-2 max-[1000px]:relative max-[1000px]:top-0 max-[1000px]:max-h-none max-[1000px]:flex max-[1000px]:flex-wrap max-[1000px]:gap-[0.4rem] max-[1000px]:pb-4 max-[1000px]:border-b max-[1000px]:border-[var(--border)]" aria-label="Secciones del sistema">
     {HUB_NAV.map(([group, links]) => (
      <div key={group} className="mb-[1.4rem] max-[1000px]:mb-0">
       <span className="font-mono text-[0.66rem] tracking-[0.16em] uppercase text-[color:var(--text-dim)] block mb-[0.6rem] pl-[0.9rem] max-[1000px]:hidden">
        {group}
       </span>
       {links.map(([id, label, icon]) => (
        <button
         key={id}
         suppressHydrationWarning
         className={
          "flex items-center gap-[0.6rem] w-full text-left text-[length:var(--t-sm)] font-medium py-2 px-[0.9rem] border-0 rounded-[var(--radius)] cursor-pointer transition-[color,background] duration-[var(--dur)] " +
          (active === id
           ? "text-[color:var(--orange-500)] bg-[color-mix(in_srgb,var(--orange-500)_10%,transparent)] font-semibold [&_svg]:text-[color:var(--orange-500)]"
           : "text-[color:var(--text-muted)] bg-transparent hover:text-[color:var(--text)] hover:bg-[var(--surface-2)] [&_svg]:text-[color:var(--text-dim)] [&_svg]:shrink-0 [&_svg]:transition-[color] [&_svg]:duration-[var(--dur)]") +
           " max-[1000px]:w-auto max-[1000px]:border max-[1000px]:border-[var(--border)] max-[1000px]:rounded-[var(--radius-pill)] max-[1000px]:py-[0.4rem] max-[1000px]:px-[0.8rem]"
         }
         onClick={() => pick(id)}
        >
         <Icon name={icon} size={17} />
         <span>{label}</span>
        </button>
       ))}
      </div>
     ))}
    </aside>
    <div className="min-w-0">
     <Section go={go} />
    </div>
   </div>
  </main>
 )
}

export default function ShowcasePage() {
 return (
  <ToastProvider>
   <ShowcaseInner />
  </ToastProvider>
 )
}
