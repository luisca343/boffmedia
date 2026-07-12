import type { AppKey } from "./showcase-shared"

// Index model for the SmartRotom showcase. Mirrors the Boffmedia showcase's
// `showcase-data.tsx`, with one addition: a chapter carries the `app` whose design
// system it documents, because SmartRotom is six systems rather than one
// (SMARTROTOM_V3.md §0). Domains ARE the systems.

export interface SecMeta {
  id: string
  label: string
}
export interface Chapter {
  name: string
  dom: string
  app: AppKey
  sections: SecMeta[]
}

export const CHAPTERS: Chapter[] = [
  // ── Sistema · the sr-* chrome (the frame around the apps) ──────────────────
  {
    name: "Bases",
    dom: "Sistema",
    app: "sr",
    sections: [
      { id: "sr-arquitectura", label: "Seis sistemas" },
      { id: "sr-color", label: "Color" },
      { id: "sr-tipografia", label: "Tipografía" },
      { id: "sr-geometria", label: "Geometría" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Sistema",
    app: "sr",
    sections: [
      { id: "sr-botones", label: "Botones" },
      { id: "sr-badges", label: "Badges" },
      { id: "sr-paneles", label: "Paneles" },
      { id: "sr-carga", label: "Carga" },
    ],
  },

  // ── Starbank · sb-* ────────────────────────────────────────────────────────
  {
    name: "Bases",
    dom: "Starbank",
    app: "sb",
    sections: [
      { id: "sb-color", label: "Color" },
      { id: "sb-tipografia", label: "Tipografía" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Starbank",
    app: "sb",
    sections: [
      { id: "sb-botones", label: "Botones y chips" },
      { id: "sb-formularios", label: "Formularios" },
      { id: "sb-avatares", label: "Avatares" },
      { id: "sb-tarjetas", label: "Tarjetas y cabeceras" },
    ],
  },
  {
    name: "Datos",
    dom: "Starbank",
    app: "sb",
    sections: [
      { id: "sb-kpi", label: "KPI" },
      { id: "sb-graficas", label: "Gráficas" },
      { id: "sb-transacciones", label: "Transacciones" },
      { id: "sb-navegacion", label: "Segmentos y pasos" },
      { id: "sb-estados", label: "Carga y avisos" },
    ],
  },

  // ── ChatApp · ca-* ─────────────────────────────────────────────────────────
  {
    name: "Bases",
    dom: "ChatApp",
    app: "ca",
    sections: [
      { id: "ca-color", label: "Color y temas" },
      { id: "ca-acento", label: "Acento" },
    ],
  },
  {
    name: "Primitivas",
    dom: "ChatApp",
    app: "ca",
    sections: [
      { id: "ca-botones", label: "Botones" },
      { id: "ca-formularios", label: "Campos y búsqueda" },
      { id: "ca-avatares", label: "Avatar y presencia" },
      { id: "ca-overlays", label: "Modal y popover" },
      { id: "ca-estados", label: "Carga y contadores" },
    ],
  },
  {
    name: "Mensajería",
    dom: "ChatApp",
    app: "ca",
    sections: [
      { id: "ca-burbujas", label: "Burbujas y recibos" },
      { id: "ca-contactos", label: "Fila de contacto" },
      { id: "ca-redactor", label: "Redactor" },
    ],
  },

  // ── Notas · nt-* ───────────────────────────────────────────────────────────
  {
    name: "Bases",
    dom: "Notas",
    app: "nt",
    sections: [
      { id: "nt-color", label: "Color y temas" },
      { id: "nt-tipografia", label: "Tipografía y prosa" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Notas",
    app: "nt",
    sections: [
      { id: "nt-botones", label: "Botones" },
      { id: "nt-etiquetas", label: "Etiquetas y teclas" },
      { id: "nt-ayudas", label: "Tooltip y menú" },
      { id: "nt-overlays", label: "Overlay y avisos" },
    ],
  },

  // ── Pokédex · pk-* ─────────────────────────────────────────────────────────
  {
    name: "Bases",
    dom: "Pokédex",
    app: "pk",
    sections: [
      { id: "pk-color", label: "Color" },
      { id: "pk-tipografia", label: "Tipografía" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Pokédex",
    app: "pk",
    sections: [
      { id: "pk-tipos", label: "Tipos" },
      { id: "pk-estado", label: "Estado y pokéball" },
      { id: "pk-cabeceras", label: "Cabeceras" },
    ],
  },

  // ── Media · mw-* (one system, two accents) ─────────────────────────────────
  {
    name: "Bases",
    dom: "Media",
    app: "mw",
    sections: [
      { id: "mw-color", label: "Color y doble acento" },
      { id: "mw-tipografia", label: "Tipografía" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Media",
    app: "mw",
    sections: [
      { id: "mw-botones", label: "Botones" },
      { id: "mw-chips", label: "Chips y etiquetas" },
      { id: "mw-directo", label: "Directo" },
      { id: "mw-controles", label: "Avatar y controles" },
      { id: "mw-estados", label: "Carga" },
    ],
  },
  {
    name: "Tarjetas",
    dom: "Media",
    app: "mw",
    sections: [
      { id: "mw-video", label: "Vídeo" },
      { id: "mw-stream", label: "Directo y categoría" },
      { id: "mw-chat", label: "Chat" },
    ],
  },
]

export const DOMAIN_ORDER = ["Sistema", "Starbank", "ChatApp", "Notas", "Pokédex", "Media"]

// Chapter names repeat across domains ("Bases" exists six times), so a chapter's
// identity is domain + name — not name alone.
export const chapterKey = (c: Pick<Chapter, "dom" | "name">) => `${c.dom}/${c.name}`

export const DOMAINS = DOMAIN_ORDER.map((name) => ({
  name,
  chapters: CHAPTERS.filter((c) => c.dom === name),
})).filter((d) => d.chapters.length > 0)

// One-line framing per system, shown under the domain in the sidebar rail.
export const DOMAIN_META: Record<string, { ns: string; note: string }> = {
  Sistema: { ns: "sr-*", note: "Chrome — el marco alrededor de las apps" },
  Starbank: { ns: "sb-*", note: "Fintech azul · claro" },
  ChatApp: { ns: "ca-*", note: "Mensajería · claro/oscuro real" },
  Notas: { ns: "nt-*", note: "Notas enlazadas · oscuro por defecto" },
  Pokédex: { ns: "pk-*", note: "Gaming · oscuro" },
  Media: { ns: "mw-*", note: "Un sistema, dos acentos" },
}
