import { Icon, type IconName } from "../ui"

/**
 * A literal reproduction of a highway sign — road-class liveries are real-world colours,
 * not this design system's palette, so raw hex/gradients here are the sanctioned
 * exception to the gt-token-only rule (SMARTROTOM_V3 hard rule #3). Kept as inline
 * `style` only (no Tailwind classes) because this component is also rendered inside the
 * `/smartrotom/cartel` edge `ImageResponse` route, which cannot resolve Tailwind or
 * `.gt-app` CSS custom properties.
 */
export type CartelRoadType = "autopista" | "nacional" | "comarcal" | "rural"
export type CartelDirection = "recto" | "left" | "right" | "down"

const SIGN_THEMES: Record<
  CartelRoadType,
  {
    kicker: string
    bg: string
    text: string
    rowBg: string
    rowBd: string
    badgeBg: string
    badgeText: string
    trim: string
    arrowBg: string
    distBg: string
  }
> = {
  autopista: {
    kicker: "Autopista",
    bg: "linear-gradient(180deg,#0a4ea3,#063a76)",
    text: "#fff",
    rowBg: "rgba(255,255,255,.12)",
    rowBd: "rgba(255,255,255,.24)",
    badgeBg: "#ffffff",
    badgeText: "#063a76",
    trim: "linear-gradient(90deg,#f3c33b,#e0a020)",
    arrowBg: "rgba(255,255,255,.18)",
    distBg: "rgba(0,0,0,.24)",
  },
  nacional: {
    kicker: "Carretera nacional",
    bg: "linear-gradient(180deg,#b23a3a,#8c2727)",
    text: "#fff",
    rowBg: "rgba(255,255,255,.14)",
    rowBd: "rgba(255,255,255,.26)",
    badgeBg: "#ffffff",
    badgeText: "#8c2727",
    trim: "linear-gradient(90deg,#ffffff,#f1dede)",
    arrowBg: "rgba(255,255,255,.2)",
    distBg: "rgba(0,0,0,.22)",
  },
  comarcal: {
    kicker: "Vía comarcal",
    bg: "linear-gradient(180deg,#1f6f4a,#154f37)",
    text: "#fff",
    rowBg: "rgba(255,255,255,.13)",
    rowBd: "rgba(255,255,255,.24)",
    badgeBg: "#ffffff",
    badgeText: "#154f37",
    trim: "linear-gradient(90deg,#d8b96e,#a9842f)",
    arrowBg: "rgba(255,255,255,.18)",
    distBg: "rgba(0,0,0,.2)",
  },
  rural: {
    kicker: "Camino rural",
    bg: "linear-gradient(180deg,#6b4a2a,#4c351d)",
    text: "#fff",
    rowBg: "rgba(255,255,255,.12)",
    rowBd: "rgba(255,255,255,.22)",
    badgeBg: "#f1e9d3",
    badgeText: "#4c351d",
    trim: "linear-gradient(90deg,#d8b96e,#b08a3e)",
    arrowBg: "rgba(255,255,255,.16)",
    distBg: "rgba(0,0,0,.22)",
  },
}

const DIR_ICON: Record<string, IconName> = {
  recto: "arrowUp",
  up: "arrowUp",
  down: "arrowDown",
  left: "arrowLeft",
  right: "arrowRight",
}

export type CartelDestinationInput = { dest: string; dist: string; dir: string }

export function HighwaySign({
  type = "autopista",
  highway,
  destinations = [],
  unit = "bq",
  width = 440,
}: {
  type?: string
  highway?: string
  destinations?: CartelDestinationInput[]
  unit?: string
  width?: number
}) {
  const t = SIGN_THEMES[type as CartelRoadType] || SIGN_THEMES.autopista
  const dests = destinations.length ? destinations : [{ dest: "", dist: "", dir: "recto" }]

  return (
    <div
      style={{
        width,
        background: t.bg,
        borderRadius: 14,
        border: "3px solid rgba(255,255,255,.16)",
        boxShadow: "0 14px 30px -12px rgba(0,0,0,.5)",
        padding: "0 0 16px",
        position: "relative",
        overflow: "hidden",
        fontFamily: '"Public Sans", Arial, sans-serif',
        color: t.text,
        boxSizing: "border-box",
      }}
    >
      <div style={{ height: 7, background: t.trim }} />
      <div style={{ padding: "16px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div
            style={{
              background: t.badgeBg,
              color: t.badgeText,
              fontWeight: 800,
              fontSize: 26,
              lineHeight: 1,
              padding: "8px 16px",
              borderRadius: 9,
              letterSpacing: ".02em",
              boxShadow: "0 2px 0 rgba(0,0,0,.18)",
              whiteSpace: "nowrap",
            }}
          >
            {highway || "A-1"}
          </div>
          <div style={{ textTransform: "uppercase", fontSize: 10, fontWeight: 700, letterSpacing: ".18em", opacity: 0.82 }}>
            {t.kicker}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {dests.map((d, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                background: t.rowBg,
                borderRadius: 8,
                border: `1px solid ${t.rowBd}`,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: "1 1 auto" }}>
                <span
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: t.arrowBg,
                    flex: "0 0 auto",
                  }}
                >
                  <Icon name={DIR_ICON[d.dir] || "arrowUp"} size={18} />
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 19,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textShadow: "0 1px 2px rgba(0,0,0,.25)",
                  }}
                >
                  {d.dest || "Destino"}
                </span>
              </span>
              {d.dist !== "" && d.dist != null && (
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 17,
                    background: t.distBg,
                    padding: "5px 11px",
                    borderRadius: 6,
                    whiteSpace: "nowrap",
                    flex: "0 0 auto",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {d.dist} {unit}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const ROAD_TYPES: { value: CartelRoadType; label: string; example: string }[] = [
  { value: "autopista", label: "Autopista", example: "A-2" },
  { value: "nacional", label: "Nacional", example: "N-IV" },
  { value: "comarcal", label: "Comarcal", example: "TE-12" },
  { value: "rural", label: "Rural", example: "Camino del Bosque" },
]

export const DIR_OPTIONS: { value: CartelDirection; label: string }[] = [
  { value: "recto", label: "↑ Recto" },
  { value: "left", label: "← Izquierda" },
  { value: "right", label: "→ Derecha" },
  { value: "down", label: "↓ Salida" },
]
