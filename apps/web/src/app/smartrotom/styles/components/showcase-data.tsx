import type { AppKey } from "./showcase-shared"

// Index model for the SmartRotom showcase. Mirrors the Boffmedia showcase's
// `showcase-data.tsx`, with one addition: a chapter carries the `app` whose design
// system it documents, because SmartRotom is many systems rather than one
// (SMARTROTOM_V3.md §0). Domains ARE the systems, so `DOMAINS.length` IS the count —
// the page reads it from here rather than restating it in prose.

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
  // The hand-drawn glyphs (lib/smartrotom/customIcons/) — cross-app, so the
  // chapter hangs off Sistema even though each specimen stages in its app's scope.
  {
    name: "Iconos",
    dom: "Sistema",
    app: "sr",
    sections: [
      { id: "sr-iconos-inventario", label: "Inventario" },
      { id: "sr-iconos-rotom", label: "Rotom" },
      { id: "sr-iconos-rookidee", label: "Rookidee" },
      { id: "sr-iconos-genero", label: "Género" },
      { id: "sr-iconos-economia", label: "Moneda y GIF" },
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

  // ── Taxi · tx-* ────────────────────────────────────────────────────────────
  {
    name: "Bases",
    dom: "Taxi",
    app: "tx",
    sections: [
      { id: "tx-color", label: "Color" },
      { id: "tx-tipografia", label: "Tipografía" },
      { id: "tx-geometria", label: "Geometría" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Taxi",
    app: "tx",
    sections: [
      { id: "tx-botones", label: "Botones" },
      { id: "tx-chips", label: "Chips y píldoras" },
      { id: "tx-formularios", label: "Búsqueda y controles" },
      { id: "tx-datos", label: "Cifras" },
      { id: "tx-estados", label: "Vacíos y carga" },
    ],
  },
  {
    name: "Viaje",
    dom: "Taxi",
    app: "tx",
    sections: [
      { id: "tx-mapa", label: "Mapa" },
      { id: "tx-destinos", label: "Destinos" },
      { id: "tx-pago", label: "Pago y llegada" },
      { id: "tx-diferido", label: "Diferido" },
    ],
  },

  // ── Arcade · ar-* ──────────────────────────────────────────────────────────
  {
    name: "Bases",
    dom: "Arcade",
    app: "ar",
    sections: [
      { id: "ar-color", label: "Color" },
      { id: "ar-tipografia", label: "Tipografía" },
      { id: "ar-crt", label: "Capa CRT" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Arcade",
    app: "ar",
    sections: [
      { id: "ar-botones", label: "Botones" },
      { id: "ar-etiquetas", label: "Etiquetas" },
      { id: "ar-paneles", label: "Paneles" },
      { id: "ar-controles", label: "Controles" },
      { id: "ar-progreso", label: "Progreso y cifras" },
      { id: "ar-estados", label: "Carga" },
    ],
  },
  {
    name: "Cabina",
    dom: "Arcade",
    app: "ar",
    sections: [
      { id: "ar-rarezas", label: "Rarezas" },
      { id: "ar-cabinas", label: "Cabinas" },
      { id: "ar-recompensa", label: "Recompensa" },
      { id: "ar-diferido", label: "Diferido" },
    ],
  },

  // ── Misiones · ms-* ────────────────────────────────────────────────────────
  {
    name: "Bases",
    dom: "Misiones",
    app: "ms",
    sections: [
      { id: "ms-color", label: "Color" },
      { id: "ms-tipografia", label: "Tipografía" },
      { id: "ms-materiales", label: "Materiales" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Misiones",
    app: "ms",
    sections: [
      { id: "ms-sellos", label: "Sellos y chinchetas" },
      { id: "ms-ornamento", label: "Ornamento" },
      { id: "ms-controles", label: "Controles" },
      { id: "ms-recortes", label: "Recortes del corcho" },
      { id: "ms-navegacion", label: "Navegación · estilos de pestaña" },
      { id: "ms-paletas", label: "Paletas · temas del tablón" },
    ],
  },
  {
    name: "Tablón",
    dom: "Misiones",
    app: "ms",
    sections: [
      { id: "ms-papeles", label: "Papeles" },
      { id: "ms-botin", label: "Botín" },
      { id: "ms-cadena", label: "Cadena" },
      { id: "ms-superficie", label: "Superficie" },
    ],
  },

  // ── Furret Today · ft-* ────────────────────────────────────────────────────
  {
    name: "Bases",
    dom: "Furret Today",
    app: "ft",
    sections: [
      { id: "ft-color", label: "Color" },
      { id: "ft-tipografia", label: "Tipografía" },
      { id: "ft-texturas", label: "Texturas y tramas" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Furret Today",
    app: "ft",
    sections: [
      { id: "ft-botones", label: "Botones" },
      { id: "ft-etiquetas", label: "Etiquetas" },
      { id: "ft-tarjetas", label: "Tarjetas" },
      { id: "ft-controles", label: "Controles" },
      { id: "ft-estados", label: "Carga y vacíos" },
    ],
  },
  {
    name: "Quiosco",
    dom: "Furret Today",
    app: "ft",
    sections: [
      { id: "ft-viñeta", label: "Viñeta" },
      { id: "ft-portada", label: "Portada" },
      { id: "ft-articulo", label: "Artículo" },
    ],
  },
  // ── PC · the pc-* storage console ─────────────────────────────────────────
  {
    name: "Bases",
    dom: "PC",
    app: "pc",
    sections: [
      { id: "pc-color", label: "Color" },
      { id: "pc-tipografia", label: "Tipografía" },
      { id: "pc-fondos", label: "Fondos de caja" },
    ],
  },
  {
    name: "Primitivas",
    dom: "PC",
    app: "pc",
    sections: [
      { id: "pc-botones", label: "Botones" },
      { id: "pc-etiquetas", label: "Etiquetas" },
      { id: "pc-campos", label: "Campos" },
      { id: "pc-medidores", label: "Medidores" },
      { id: "pc-estados", label: "Carga" },
    ],
  },
  {
    name: "Almacén",
    dom: "PC",
    app: "pc",
    sections: [
      { id: "pc-huecos", label: "Huecos" },
      { id: "pc-caja", label: "La caja" },
      { id: "pc-tipos", label: "Tipos" },
    ],
  },
  // ── Gobierno de Teras · gt-* ───────────────────────────────────────────────
  {
    name: "Bases",
    dom: "Gobierno",
    app: "gt",
    sections: [
      { id: "gt-color", label: "Color" },
      { id: "gt-tipografia", label: "Tipografía" },
      { id: "gt-geometria", label: "Geometría" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Gobierno",
    app: "gt",
    sections: [
      { id: "gt-botones", label: "Botones y distintivos" },
      { id: "gt-superficies", label: "Superficies" },
      { id: "gt-datos", label: "Datos" },
      { id: "gt-formularios", label: "Formularios" },
      { id: "gt-estados", label: "Vacíos y carga" },
    ],
  },
  // ── Rooker · rk-* ──────────────────────────────────────────────────────────
  {
    name: "Bases",
    dom: "Rooker",
    app: "rk",
    sections: [
      { id: "rk-color", label: "Color y lienzos" },
      { id: "rk-acento", label: "Acento" },
      { id: "rk-tipografia", label: "Tipografía" },
      { id: "rk-geometria", label: "Geometría" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Rooker",
    app: "rk",
    sections: [
      { id: "rk-botones", label: "Botones" },
      { id: "rk-identidad", label: "Identidad" },
      { id: "rk-navegacion", label: "Cabeceras y pestañas" },
      { id: "rk-formularios", label: "Búsqueda y contador" },
      { id: "rk-estados", label: "Vacíos y carga" },
    ],
  },
  {
    name: "Nido",
    dom: "Rooker",
    app: "rk",
    sections: [
      { id: "rk-reacciones", label: "Reacciones" },
      { id: "rk-acciones", label: "Barra de acciones" },
      { id: "rk-datos", label: "Datos del entrenador" },
    ],
  },

  // ── Wigglypop · wp-* ───────────────────────────────────────────────────────
  {
    name: "Bases",
    dom: "Wigglypop",
    app: "wp",
    sections: [
      { id: "wp-color", label: "Color" },
      { id: "wp-tipografia", label: "Tipografía" },
      { id: "wp-geometria", label: "Geometría" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Wigglypop",
    app: "wp",
    sections: [
      { id: "wp-botones", label: "Botones" },
      { id: "wp-dinero", label: "Dinero" },
      { id: "wp-rareza", label: "Rareza" },
      { id: "wp-confianza", label: "Confianza" },
      { id: "wp-navegacion", label: "Navegación" },
      { id: "wp-formularios", label: "Formularios" },
      { id: "wp-estados", label: "Estados" },
    ],
  },

  // ── Pasaporte · ps-* ───────────────────────────────────────────────────────
  {
    name: "Bases",
    dom: "Pasaporte",
    app: "ps",
    sections: [
      { id: "ps-superficies", label: "Dos superficies" },
      { id: "ps-tintas", label: "Tintas de seguridad" },
      { id: "ps-tipografia", label: "Tipografía" },
      { id: "ps-materiales", label: "Materiales y ornamento" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Pasaporte",
    app: "ps",
    sections: [
      { id: "ps-escritorio", label: "El escritorio" },
      { id: "ps-pagina", label: "La página" },
      { id: "ps-etiquetas", label: "Etiquetas y retratos" },
    ],
  },
  {
    name: "Documento",
    dom: "Pasaporte",
    app: "ps",
    sections: [
      { id: "ps-lacres", label: "Lacres y medallas" },
      { id: "ps-visados", label: "Visados y marginalia" },
      { id: "ps-acento", label: "Acento en ejecución" },
    ],
  },
]

export const DOMAIN_ORDER = [
  "Sistema",
  "Starbank",
  "ChatApp",
  "Notas",
  "Pokédex",
  "Media",
  "Taxi",
  "Arcade",
  "Misiones",
  "Furret Today",
  "PC",
  "Gobierno",
  "Rooker",
  "Wigglypop",
  "Pasaporte",
]

// Chapter names repeat across domains ("Bases" exists once per system), so a chapter's
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
  Taxi: { ns: "tx-*", note: "Movilidad · azul estructura, ámbar dinero" },
  Arcade: { ns: "ar-*", note: "Synthwave CRT · oscuro, cinco neones" },
  Misiones: { ns: "ms-*", note: "Taberna · pergamino y cera, oscuro" },
  "Furret Today": { ns: "ft-*", note: "Revista pop · papel de periódico, claro" },
  PC: { ns: "pc-*", note: "Consola de almacenamiento · pizarra y cristal, oscuro" },
  Gobierno: { ns: "gt-*", note: "Institución cívica · papel y sello grabado, claro" },
  Rooker: { ns: "rk-*", note: "El nido social · tres lienzos, seis acentos" },
  Wigglypop: { ns: "wp-*", note: "Mercado burbuja · rosa globo y verde azulado dinero, claro" },
  Pasaporte: { ns: "ps-*", note: "Documento de estado · lienzo fijo: nogal y papel crema en una raíz" },
}
