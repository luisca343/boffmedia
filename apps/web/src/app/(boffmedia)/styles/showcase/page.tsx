"use client"

import * as React from "react"
import "@/styles/boffmedia-primitives.css"

// Primitives — boffmedia design system
import { Icon } from "@/components/ui/primitives/boffmedia/icon"
import { BoffButton as Button } from "@/components/ui/primitives/boffmedia/button"
import { BoffCard as Card } from "@/components/ui/primitives/boffmedia/card"
import { BoffBadge as Badge } from "@/components/ui/primitives/boffmedia/badge"
import { Kicker } from "@/components/ui/primitives/boffmedia/kicker"
import { Tag } from "@/components/ui/primitives/boffmedia/tag"
import { Callout } from "@/components/ui/primitives/boffmedia/callout"
import { BoffAlert as Alert } from "@/components/ui/primitives/boffmedia/alert"
import { ToastProvider, useToast } from "@/components/ui/primitives/boffmedia/toast-provider"
import { BoffTooltip as Tooltip } from "@/components/ui/primitives/boffmedia/tooltip"
import { BoffModal as Modal } from "@/components/ui/primitives/boffmedia/dialog"
import { BoffPopover as Popover } from "@/components/ui/primitives/boffmedia/popover"
import { Field } from "@/components/ui/primitives/boffmedia/field"
import { BoffInput as Input } from "@/components/ui/primitives/boffmedia/input"
import { SearchInput } from "@/components/ui/primitives/boffmedia/search-input"
import { BoffSwitch as Switch } from "@/components/ui/primitives/boffmedia/switch"
import { BoffCheckbox as Checkbox } from "@/components/ui/primitives/boffmedia/checkbox"
import { BoffSlider as Slider } from "@/components/ui/primitives/boffmedia/slider"
import { RadioGroup } from "@/components/ui/primitives/boffmedia/radio-group"
import { BoffTabs as Tabs } from "@/components/ui/primitives/boffmedia/tabs"
import { Segmented } from "@/components/ui/primitives/boffmedia/segmented"
import { Breadcrumb } from "@/components/ui/primitives/boffmedia/breadcrumb"
import { Pagination } from "@/components/ui/primitives/boffmedia/pagination"
import { BoffAvatar as Avatar, BoffAvatarGroup as AvatarGroup } from "@/components/ui/primitives/boffmedia/avatar"
import { IconBox } from "@/components/ui/primitives/boffmedia/icon-box"
import { BoffSkeleton as Skeleton } from "@/components/ui/primitives/boffmedia/skeleton"
import { BoffProgress as Progress, BoffRing as Ring } from "@/components/ui/primitives/boffmedia/progress"
import { Stat } from "@/components/ui/primitives/boffmedia/stat"
import { CodeBlock } from "@/components/ui/primitives/boffmedia/code-block"
import { EmptyState } from "@/components/ui/primitives/boffmedia/empty-state"

// Domain
import { GameCard } from "@/components/ui/boffmedia/game-card"
import { FeaturedTool } from "@/components/ui/boffmedia/featured-tool"
import { ToolCard } from "@/components/ui/boffmedia/tool-card"

// Data
import { GAMES, GAMES_ORDER } from "./_data/games-data"

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
   ["patterns", "Patrones", "grid"],
   ["boff", "Boffmedia", "gamepad"],
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
    style={{ marginTop: "1.5rem", padding: "1rem" }}
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
// 6. PATTERNS
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
// 7. BOFFMEDIA
// ============================================================================
function BoffSection({ go }: { go: (path: string) => void }) {
 const g = GAMES.mhwilds

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
     <GameCard game={g} go={go} />
    </div>
   </Spec2>

   <Spec2
    title="FeaturedTool"
    tag="boffmedia/featured-tool.tsx"
    intro="El héroe de una página de juego: herramienta destacada con descripción, features y arte de apoyo."
    a11y="Jerarquía clara con un solo CTA primario; el placeholder de arte indica su contenido."
   >
    <FeaturedTool tool={g.featured} go={go} />
   </Spec2>

   <Spec2
    title="ToolCard"
    tag="boffmedia/tool-card.tsx"
    intro="Una herramienta dentro de la cuadrícula. Estados «nuevo» y «pronto»; el segundo se desactiva."
    a11y="Las tarjetas «pronto» pierden el rol interactivo (tabIndex -1) para no confundir."
   >
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[1.125rem]">
     {g.tools.slice(0, 3).map((t) => (
      <ToolCard key={t.title} tool={t} go={go} />
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
  </div>
 )
}

// ============================================================================
// 8. PLAYGROUND
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
// 9. ACCESIBILIDAD + ROADMAP
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

const ROADMAP = [
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
// MAIN SHOWCASE COMPONENT
// ============================================================================
const SECTIONS: Record<string, React.ComponentType<{ go?: (path: string) => void }>> = {
 overview: OverviewSection,
 philosophy: PhilosophySection,
 foundations: FoundationsSection,
 primitives: PrimitivesSection,
 composition: CompositionSection,
 patterns: PatternsSection,
 boff: BoffSection,
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
   <main className="w-full max-w-[var(--maxw)] mx-auto px-[var(--gutter)] pt-[6.5rem] pb-20">
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
