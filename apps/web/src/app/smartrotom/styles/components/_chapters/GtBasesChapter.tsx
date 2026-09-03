"use client"

import * as React from "react"
import { Sample, Section, Swatches } from "../showcase-shared"

const PAPER = [
  ["bg-gt-paper-bg", "paper-bg · la página"],
  ["bg-gt-paper-0", "paper-0 · la ficha"],
  ["bg-gt-paper-1", "paper-1 · el panel"],
  ["bg-gt-paper-2", "paper-2 · hundido"],
  ["bg-gt-paper-3", "paper-3 · más hondo"],
] as const

const INK = [
  ["bg-gt-ink-900", "ink-900 · titulares"],
  ["bg-gt-ink-700", "ink-700 · cuerpo"],
  ["bg-gt-ink-500", "ink-500 · secundario"],
  ["bg-gt-ink-400", "ink-400 · apagado"],
  ["bg-gt-ink-300", "ink-300 · tenue"],
] as const

const CORE = [
  ["bg-gt-civic", "civic · verde municipal"],
  ["bg-gt-civic-tint", "civic-tint"],
  ["bg-gt-gold", "gold · ocre heráldico"],
  ["bg-gt-gold-tint", "gold-tint"],
  ["bg-gt-line-strong", "line-strong"],
] as const

const DEPS = [
  ["bg-gt-dep-urbanismo", "urbanismo · arcilla"],
  ["bg-gt-dep-seguridad", "seguridad · marino"],
  ["bg-gt-dep-hacienda", "hacienda · verde"],
  ["bg-gt-dep-justicia", "justicia · burdeos"],
  ["bg-gt-dep-poblacion", "poblacion · pizarra"],
] as const

const STATUS = [
  ["bg-gt-ok", "ok"],
  ["bg-gt-warn", "warn"],
  ["bg-gt-danger", "danger"],
  ["bg-gt-info", "info"],
  ["bg-gt-accent", "accent · themeable"],
] as const

export function GtBasesChapter() {
  return (
    <>
      <Section
        id="gt-color"
        kicker="Gobierno de Teras"
        title="Color"
        lead="Papel crema cálido, tinta casi negra pero templada, verde municipal y ocre heráldico. Es un sistema sólo en claro: el papel ES el diseño, así que la app ignora el modo del selector de temas (como Furret Today, Pokédex, Arcade y Misiones)."
      >
        <Sample
          title="Papel"
          code="gt-paper-bg · gt-paper-0 … gt-paper-3"
          app="gt"
          canvas={false}
          note="Cinco superficies, de la página al cajón más hondo. El fondo lleva además `gt-paper`: un grano cálido y un guilloché grabado en aspa — el patrón de seguridad que hace que la superficie se lea como un documento oficial y no como un div beige."
        >
          <Swatches tokens={PAPER} />
        </Sample>

        <Sample
          title="Tinta"
          code="gt-ink-900 … gt-ink-300"
          app="gt"
          canvas={false}
          note="Ninguna tinta es neutra: todas tiran a marrón. Un gris frío sobre papel crema se ve sucio, no impreso."
        >
          <Swatches tokens={INK} />
        </Sample>

        <Sample
          title="Núcleo cívico"
          code="gt-civic · gt-gold"
          app="gt"
          canvas={false}
          note="El verde manda y el oro consagra: el oro sólo aparece en el sello, en el filo superior de una ficha oficial (`gt-edge-gold`) y en el departamento de Gobierno."
        >
          <Swatches tokens={CORE} />
        </Sample>

        <Sample
          title="Departamentos"
          code="gt-dep-*"
          app="gt"
          canvas={false}
          note="El color de un departamento es su identidad y NO sigue al acento: pase lo que pase con `data-accent`, Seguridad sigue siendo marino. Se aplica como `--gt-dep` en la franja lateral (`gt-spine`) de fichas, filas y avisos."
        >
          <Swatches tokens={DEPS} />
        </Sample>

        <Sample
          title="Estado y acento"
          code="gt-ok · gt-warn · gt-danger · gt-info · gt-accent"
          app="gt"
          canvas={false}
          note={
            <>
              Los estados van apagados a propósito: sobre papel, un rojo saturado grita. El acento es el
              único eje temático — <code>data-accent=&quot;civic | navy | burgundy | gold&quot;</code> en la
              raíz repinta <code>--gt-accent</code>, y es identidad de la app, no de la plataforma.
            </>
          }
        >
          <Swatches tokens={STATUS} />
        </Sample>
      </Section>

      <Section
        id="gt-tipografia"
        kicker="Gobierno de Teras"
        title="Tipografía"
        lead="Tres familias con tres trabajos que no se solapan: la serif graba, la sans informa y la mono etiqueta."
      >
        <Sample title="Las tres voces" code="font-gt-display · font-gt · font-gt-mono" app="gt" col>
          <div>
            <div className="font-gt-mono text-[0.59375rem] font-bold uppercase tracking-[.14em] text-gt-ink-400">
              font-gt-display · Libre Baskerville
            </div>
            <div className="mt-1 font-gt-display text-[1.875rem] leading-[1.05] text-gt-ink-900">
              Gobierno de Teras
            </div>
            <div className="mt-1 font-gt-display text-[1.875rem] tabular-nums leading-[1.05] text-gt-ink-900">
              248.600 ₽
            </div>
          </div>

          <hr className="gt-rule my-2 w-full" />

          <div>
            <div className="font-gt-mono text-[0.59375rem] font-bold uppercase tracking-[.14em] text-gt-ink-400">
              font-gt · Public Sans
            </div>
            <p className="mt-1 max-w-[52ch] text-[0.84375rem] leading-relaxed text-gt-ink-700">
              Toda la interfaz —botones, formularios, filas de tabla, cuerpo de una denuncia— va en Public
              Sans. Es la voz administrativa: legible y sin opinión.
            </p>
          </div>

          <hr className="gt-rule my-2 w-full" />

          <div>
            <div className="font-gt-mono text-[0.59375rem] font-bold uppercase tracking-[.14em] text-gt-ink-400">
              font-gt-mono · Space Mono
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 font-gt-mono text-[0.6875rem] uppercase tracking-[.12em] text-gt-ink-600">
              <span>EXP-0042</span>
              <span>M-2210</span>
              <span>B-07</span>
              <span>Placa I-014</span>
              <span>Hora oficial</span>
            </div>
          </div>
        </Sample>

        <Sample
          title="La regla de la cifra"
          code="font-gt-display + tabular-nums"
          app="gt"
          note="Toda cifra grande es Baskerville con `tabular-nums`, nunca la sans. Es un gobierno: las columnas de dinero tienen que cuadrar unas sobre otras, y una cifra grabada pesa más que una cifra impresa."
        >
          <div className="flex gap-8">
            {[
              ["248.600 ₽", "Tesorería"],
              ["27", "Parcelas"],
              ["4", "Buscados"],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="font-gt-display text-[1.875rem] leading-[1.05] tabular-nums text-gt-ink-900">{v}</div>
                <div className="mt-1 font-gt-mono text-[0.59375rem] font-bold uppercase tracking-[.14em] text-gt-ink-400">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </Sample>
      </Section>

      <Section
        id="gt-geometria"
        kicker="Gobierno de Teras"
        title="Geometría y grabado"
        lead="Radios cortos y cuatro utilidades que Tailwind no sabe decir. Ninguna es decorativa: cada una es una convención de un documento impreso."
      >
        <Sample title="Superficies" code="rounded-gt-sm 5px · rounded-gt 8px" app="gt" grid>
          <div className="rounded-gt border border-gt-line bg-gt-paper-0 p-4 shadow-gt">
            <div className="font-gt-display text-[0.9375rem] text-gt-ink-900">Card</div>
            <p className="mt-1 text-[0.78125rem] text-gt-ink-500">Papel levantado. Toda ficha del registro.</p>
          </div>
          <div className="rounded-gt border border-gt-line bg-gt-paper-1 p-4">
            <div className="font-gt-display text-[0.9375rem] text-gt-ink-900">Panel</div>
            <p className="mt-1 text-[0.78125rem] text-gt-ink-500">Papel de fondo. Agrupa, no destaca.</p>
          </div>
        </Sample>

        <Sample
          title="El grabado"
          code="gt-edge-gold · gt-spine · gt-rule"
          app="gt"
          col
          note="`gt-edge-gold` es el filo grabado de una ficha oficial. `gt-spine` es la franja del departamento — su color llega como `--gt-dep` en un `style` en línea, porque es un dato, no una clase. `gt-rule` es el doble filete que separa las secciones de un documento."
        >
          <div className="gt-edge-gold w-full rounded-gt border border-gt-line bg-gt-paper-0 p-4 shadow-gt">
            <div className="font-gt-mono text-[0.59375rem] font-bold uppercase tracking-[.18em] text-gt-ink-400">
              Documento oficial
            </div>
            <div className="mt-1 font-gt-display text-[1.0625rem] text-gt-ink-900">Filo de oro grabado</div>
          </div>

          <div
            className="gt-spine w-full rounded-gt border border-gt-line bg-gt-paper-0 p-4 shadow-gt-sm"
            style={{ ["--gt-dep" as string]: "rgb(var(--gt-dep-justicia))" }}
          >
            <div className="font-gt-display text-[0.9375rem] text-gt-ink-900">Franja de departamento</div>
            <p className="mt-1 text-[0.78125rem] text-gt-ink-500">Justicia · burdeos</p>
          </div>

          <hr className="gt-rule w-full" />
        </Sample>

        <Sample
          title="El sello"
          code="animate-gt-seal"
          app="gt"
          note="La leyenda circular gira una vez cada 90 s: lo bastante lento para leerse como un grabado que se mueve y no como un spinner. `motion-reduce` la detiene en seco."
        >
          <div className="flex items-center gap-6">
            <GtSealSpecimen size={88} />
            <GtSealSpecimen size={48} />
            <GtSealSpecimen size={26} ring={false} />
          </div>
        </Sample>
      </Section>
    </>
  )
}

// The showcase re-declares the seal rather than importing the app's, so a chapter never
// depends on a route's private tree.
function GtSealSpecimen({ size, ring = true }: { size: number; ring?: boolean }) {
  const id = React.useId().replace(/:/g, "")
  const textR = 41
  const ringCol = "rgb(var(--gt-gold-600))"
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Sello del Gobierno de Teras">
      <defs>
        <path
          id={`sc-seal-${id}`}
          d={`M50,50 m-${textR},0 a${textR},${textR} 0 1,1 ${textR * 2},0 a${textR},${textR} 0 1,1 -${textR * 2},0`}
        />
      </defs>
      <circle cx="50" cy="50" r="50" fill="rgb(var(--gt-paper-0))" stroke={ringCol} strokeWidth="1.4" />
      <circle cx="50" cy="50" r="46.5" fill="none" stroke={ringCol} strokeWidth="0.7" opacity="0.55" />
      <circle cx="50" cy="50" r="29" fill="none" stroke={ringCol} strokeWidth="0.7" opacity="0.5" />
      {ring && (
        <g className="origin-center animate-gt-seal motion-reduce:animate-none" style={{ transformBox: "fill-box" }}>
          <text fontFamily="'Libre Baskerville', serif" fontSize="6.4" fontWeight="700" letterSpacing="1.6" fill={ringCol}>
            <textPath href={`#sc-seal-${id}`} startOffset="0%">
              ★ GOBIERNO DE TERAS ★ REGIÓN AUTÓNOMA DE TERAS
            </textPath>
          </text>
        </g>
      )}
      <g fill="none" stroke="rgb(var(--gt-civic))" strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round">
        <path d="M37 44 L50 36 L63 44 Z" fill="rgb(var(--gt-civic-tint))" />
        <line x1="34" y1="44" x2="66" y2="44" />
        <line x1="40" y1="46" x2="40" y2="58" />
        <line x1="46.6" y1="46" x2="46.6" y2="58" />
        <line x1="53.4" y1="46" x2="53.4" y2="58" />
        <line x1="60" y1="46" x2="60" y2="58" />
        <line x1="34" y1="60" x2="66" y2="60" strokeWidth="2.6" />
      </g>
      <circle cx="50" cy="40.5" r="1.5" fill="rgb(var(--gt-gold-600))" />
    </svg>
  )
}
