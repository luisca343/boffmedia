"use client"

import * as React from "react"
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
import { SEAL_STATUSES, STATUS_LABEL } from "@/app/smartrotom/misiones/_utils/status"
import { Sample, Section } from "../showcase-shared"

export function MsPrimitivasChapter() {
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
              <Label>{STATUS_LABEL[status]}</Label>
            </div>
          ))}
        </Sample>
        <Sample app="ms" title="Chinchetas y clavos" code="<Thumbtack /> · <Nail />" note="Oro = la misión que sigues · rojo = disponible · clavo = todo lo demás.">
          <Thumbtack size={22} color={TACK_GOLD} />
          <Thumbtack size={22} color={TACK_RED} />
          <Nail size={20} />
        </Sample>
        <Sample app="ms" title="Estampa" code="<Stamp />" note="Cae una sola vez, al revelarse la misión — y no cae en absoluto si el sistema pide menos movimiento.">
          <div className="relative h-[90px] w-[200px]">
            <Stamp kind="completed">Completada</Stamp>
          </div>
          <div className="relative h-[90px] w-[200px]">
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
              {STATUS_LABEL[status]}
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
          <Paper className="relative h-[110px] w-[200px]">
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
    </>
  )
}
