"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Bar,
  Button,
  Chip,
  Divider,
  Doodle,
  Field,
  Flourish,
  Icon,
  InkBlot,
  Inkwell,
  Label,
  Nail,
  Paper,
  Polaroid,
  PostIt,
  QuillPen,
  Ribbon,
  SearchField,
  Select,
  Shield,
  Sparkles,
  Stamp,
  TACK_GOLD,
  TACK_RED,
  Thumbtack,
  WaxSeal,
} from "@/app/smartrotom/misiones/_components/ui"
import { SEAL_STATUSES, STATUS_LABEL_KEY } from "@/app/smartrotom/misiones/_utils/status"
import { Sample, Section } from "../showcase-shared"

// The same little nav from `SideRail`, worn as six different skins. Leather
// (no attribute) is the default; the rest are unlocked by a `data-tabstyle`
// on the ancestor wrapping the <nav> — never a class on `.ms-tab` itself.
const NAV_ITEMS = [
  { glyph: "❦", label: "El Tablón" },
  { glyph: "✶", label: "La Trama" },
  { glyph: "✦", label: "Mapa" },
  { glyph: "◆", label: "Mochila" },
] as const

const TAB_STYLES = [
  { value: undefined, name: "Cuero" },
  { value: "placa", name: "Placa de madera" },
  { value: "sello", name: "Sello de cera" },
  { value: "grabado", name: "Grabado en latón" },
  { value: "estandarte", name: "Estandarte" },
  { value: "manuscrito", name: "Manuscrito" },
] as const

// The five `data-palette` themes on `.ms-app`. Pergamino needs no attribute —
// it's the token block declared on the bare class.
const PALETTES = [
  { value: undefined, name: "Pergamino" },
  { value: "grimdark", name: "Grimdark" },
  { value: "royal", name: "Real" },
  { value: "forest", name: "Bosque" },
  { value: "nocturno", name: "Nocturno" },
] as const

// Same rule as `MsBasesChapter`: never `bg-ms-seal-${status}`, always a literal
// class from a map.
const SEAL_SWATCHES = [
  ["bg-ms-seal-active", "Vigente"],
  ["bg-ms-seal-available", "Disponible"],
  ["bg-ms-seal-completed", "Completada"],
  ["bg-ms-seal-failed", "Fallida"],
  ["bg-ms-seal-locked", "Sellada"],
] as const

export function MsPrimitivasChapter() {
  const t = useTranslations("misiones")
  const [chip, setChip] = React.useState("ACTIVE")

  return (
    <>
      <Section
        id="ms-sellos"
        kicker="Misiones · ms-*"
        title="Sellos y chinchetas"
        lead="El estado de un encargo se lee en la cera, no en el color de un texto. Un sello dorado es una misión en curso; uno rojo, una que puedes tomar."
      >
        <Sample app="ms" title="Sello de cera" code="<WaxSeal status />" note="El glifo y el color salen del estado; el color entra como fill de SVG, nunca como clase dinámica.">
          {SEAL_STATUSES.map((status) => (
            <div key={status} className="flex flex-col items-center gap-2">
              <WaxSeal status={status} size={58} />
              <Label>{t(STATUS_LABEL_KEY[status])}</Label>
            </div>
          ))}
        </Sample>
        <Sample app="ms" title="Chinchetas y clavos" code="<Thumbtack /> · <Nail />" note="Oro = la misión que sigues · rojo = disponible · clavo = todo lo demás.">
          <Thumbtack size={22} color={TACK_GOLD} />
          <Thumbtack size={22} color={TACK_RED} />
          <Nail size={20} />
        </Sample>
        <Sample app="ms" title="Estampa" code="<Stamp />" note="Cae una sola vez, al revelarse la misión — y no cae en absoluto si el sistema pide menos movimiento.">
          <div className="relative h-[5.625rem] w-[12.5rem]">
            <Stamp kind="completed">Completada</Stamp>
          </div>
          <div className="relative h-[5.625rem] w-[12.5rem]">
            <Stamp kind="failed">Fallida</Stamp>
          </div>
        </Sample>
      </Section>

      <Section id="ms-ornamento" kicker="Misiones · ms-*" title="Ornamento" lead="Lo que convierte una hoja en un manuscrito iluminado.">
        <Sample app="ms" title="Filigrana" code="<Flourish /> · <FlourishCorners />">
          <span className="text-ms-gold-3">
            <Flourish orientation="tl" size={60} />
          </span>
          <span className="text-ms-ink-2">
            <Flourish orientation="br" size={60} />
          </span>
        </Sample>
        <Sample app="ms" title="Divisor" code="<Divider glyph />" col>
          <Divider glyph="❦" />
          <Divider glyph="⚜" />
          <Divider glyph="✦" />
        </Sample>
        <Sample app="ms" title="Cinta heráldica" code="<Ribbon />">
          <Ribbon width={260} height={48}>
            Disponible
          </Ribbon>
        </Sample>
        <Sample app="ms" title="Escudo" code="<Shield />" note="Lleva la única cifra que el juego sí concede: los encargos cerrados.">
          <Shield size={56}>7</Shield>
        </Sample>
      </Section>

      <Section id="ms-controles" kicker="Misiones · ms-*" title="Controles" lead="Botones troquelados del mismo papel, fichas de pergamino y campos hundidos en la hoja.">
        <Sample app="ms" title="Botones" code="<Button variant />">
          <Button>
            <Icon.Map size={13} /> Ir al mapa
          </Button>
          <Button variant="primary">
            <Icon.Quill size={13} /> Continuar
          </Button>
          <Button variant="dark">
            <Icon.X size={13} /> Cerrar
          </Button>
          <Button variant="ghost" sm>
            <Icon.Info size={11} /> Detalle
          </Button>
        </Sample>
        <Sample app="ms" title="Fichas" code="<Chip active />">
          {SEAL_STATUSES.map((status) => (
            <Chip key={status} active={chip === status} onClick={() => setChip(status)}>
              {t(STATUS_LABEL_KEY[status])}
            </Chip>
          ))}
        </Sample>
        <Sample app="ms" title="Campos" code="<Field /> · <SearchField /> · <Select />" col>
          <Field placeholder="Nombre del encargo…" />
          <SearchField placeholder="Buscar misión, NPC, reino…" />
          <Select defaultValue="status">
            <option value="status">Orden: por sello</option>
            <option value="level">Orden: por nivel</option>
          </Select>
        </Sample>
        <Sample app="ms" title="Progreso" code="<Bar /> · <Bar gold />" col>
          <Bar value={40} />
          <Bar value={72} gold />
        </Sample>
        <Sample app="ms" title="Chispas" code="<Sparkles />" note="Sólo sobre lo que está en curso.">
          <Paper className="relative h-[6.875rem] w-[12.5rem]">
            <Sparkles count={7} />
          </Paper>
        </Sample>
      </Section>

      <Section
        id="ms-recortes"
        kicker="Misiones · ms-*"
        title="Recortes del corcho"
        lead="Lo demás que hay clavado en un tablón real. Decoración pura: aria-hidden, sin eventos, y jamás portando una cifra."
      >
        <Sample app="ms" title="Nota y recorte" code="<PostIt /> · <NewspaperClipping />">
          <PostIt size={150} footer="— Oak">
            Si encuentras a <strong>Mew</strong>, ¡tráelo al laboratorio!
          </PostIt>
          <Polaroid caption="Ruta 1 — primer Pidgey" />
        </Sample>
        <Sample app="ms" title="Garabatos y tinta" code="<Doodle /> · <InkBlot />">
          <Doodle kind="arrow" size={110} />
          <Doodle kind="star" size={90} />
          <Doodle kind="check" size={90} />
          <Doodle kind="skull" size={90} />
          <InkBlot size={54} tilt={20} />
        </Sample>
        <Sample app="ms" title="El escritorio" code="<Inkwell /> · <QuillPen />" note="Sólo aparecen alrededor de la carta abierta.">
          <Inkwell size={64} />
          <QuillPen size={120} tilt={24} />
        </Sample>
      </Section>

      <Section
        id="ms-navegacion"
        kicker="Misiones · ms-*"
        title="Navegación · estilos de pestaña"
        lead={
          <>
            El mismo nav del SideRail, vestido con seis pieles. El cuero es la piel por defecto — sin atributo; las
            demás se activan con un <code>data-tabstyle</code> en el contenedor que envuelve el nav, nunca en el
            propio <code>.ms-tab</code>.
          </>
        }
      >
        {TAB_STYLES.map((style) => (
          <Sample
            key={style.name}
            app="ms"
            title={style.name}
            code={style.value ? `data-tabstyle="${style.value}"` : "(sin data-tabstyle)"}
            note={
              style.value === "sello"
                ? "El glifo se vuelve un medallón de cera — el mismo patrón que <WaxSeal />."
                : style.value === "manuscrito"
                  ? "Cinzel Decorative, sin versalitas forzadas; la pestaña activa se subraya en oro, sin fondo."
                  : undefined
            }
          >
            <div className="ms-wood w-[12.5rem] p-2" data-tabstyle={style.value}>
              <nav className="flex flex-col gap-0.5">
                {NAV_ITEMS.map((item, i) => {
                  const current = i === 2
                  return (
                    <a
                      key={item.label}
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      aria-current={current ? "page" : undefined}
                      className="ms-tab relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ms-gold-2"
                    >
                      <span className="text-base opacity-70">{item.glyph}</span>
                      <span className="flex-1">{item.label}</span>
                      {current && <span className="absolute right-2.5 text-[0.5625rem] text-ms-gold-2">▶</span>}
                    </a>
                  )
                })}
              </nav>
            </div>
          </Sample>
        ))}
      </Section>

      <Section
        id="ms-paletas"
        kicker="Misiones · ms-*"
        title="Paletas · temas del tablón"
        lead={
          <>
            «Pergamino» es la piel por defecto del tablón. Un <code>data-palette</code> en <code>.ms-app</code>{" "}
            cambia las nueve rampas de color a la vez — corcho, pergamino, tinta, oro y cera — nunca una utilidad
            suelta.
          </>
        }
      >
        {PALETTES.map((palette) => (
          <Sample
            key={palette.name}
            app="ms"
            canvas={false}
            title={palette.name}
            code={palette.value ? `data-palette="${palette.value}"` : "(por defecto)"}
          >
            <div
              className="ms-app ms-tavern w-[13.75rem] rounded-sm border border-black/40 p-4 font-ms text-ms-ink-1 antialiased"
              data-palette={palette.value}
            >
              <div className="ms-paper p-3">
                <p className="ms-drop-cap text-sm leading-snug">
                  Un mensajero clava la nota en el corcho, junto a las demás cartas del reino.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-ms-gold-3 bg-ms-gold-4/30 px-2.5 py-1 font-ms-uppercase text-[0.625rem] uppercase tracking-wider text-ms-gold-1">
                  ✦ Vigente
                </span>
              </div>
              <div className="mt-3 flex gap-1.5">
                {SEAL_SWATCHES.map(([cls, label]) => (
                  <span key={cls} title={label} className={`h-4 w-4 rounded-full border border-black/30 ${cls}`} />
                ))}
              </div>
            </div>
          </Sample>
        ))}
      </Section>
    </>
  )
}
