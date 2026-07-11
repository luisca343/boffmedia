"use client"

import * as React from "react"
import { Sample, Section } from "../../showcase-shared"
import { Avatar, AvatarGroup, Badge, Button, Chip, ChipGroup, IconBox, IconButton, toast } from "@/components/boffmedia/primitives"

export function BotonesChipsSections() {
  const [busy, setBusy] = React.useState(false)
  const [busy2, setBusy2] = React.useState(false)
  const [fchips, setFchips] = React.useState(["VGC", "Singles", "Clima", "Compartir"])
  const [chipG, setChipG] = React.useState("todos")
  const [chipM, setChipM] = React.useState<string[]>(["vgc", "clima"])
  return (
    <>
      <Section id="botones" kicker="Primitivas" title="Botones">
        <Sample title="Variantes" code="<Button variant size icon>">
          <Button variant="pri">Primario</Button>
          <Button>Secundario</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="danger">Peligro</Button>
          <Button variant="pri" disabled>
            Deshabilitado
          </Button>
        </Sample>
        <Sample title="Tamaños e iconos">
          <Button variant="pri" size="lg" iconRight="arrow">
            Explorar juegos
          </Button>
          <Button variant="pri" iconRight="arrow">
            Inscribirse
          </Button>
          <Button size="sm" icon="download">
            Exportar
          </Button>
          <IconButton name="search" label="Buscar" />
          <IconButton name="bell" label="Notificaciones" />
          <IconButton name="settings" label="Ajustes" />
        </Sample>
        <Sample
          title="Estado de carga"
          code="<Button loading>"
          note={
            <>
              Click → estado ocupado: el spinner sustituye la etiqueta sin cambiar el ancho, marca <code>aria-busy</code> y bloquea la interacción.
            </>
          }
        >
          <Button
            variant="pri"
            icon="download"
            loading={busy}
            onClick={() => {
              setBusy(true)
              setTimeout(() => {
                setBusy(false)
                toast({ tone: "ok", title: "Exportado", msg: "El equipo se guardó en tu perfil." })
              }, 1800)
            }}
          >
            {busy ? "Guardando…" : "Probar loading"}
          </Button>
          <Button icon="refresh" loading={busy2} onClick={() => { setBusy2(true); setTimeout(() => setBusy2(false), 1800) }}>
            {busy2 ? "Sincronizando…" : "Sincronizar"}
          </Button>
          <Button variant="pri" loading>
            Cargando
          </Button>
        </Sample>
      </Section>

      <Section id="chips" kicker="Primitivas" title="Chips y badges">
        <Sample title="Chips" code="<Chip on>" note={<>Chips filtran y etiquetan; con <code>on</code> se encienden en naranja.</>}>
          <Chip>Sincronización en vivo</Chip>
          <Chip>Multiplataforma</Chip>
          <Chip on>VGC</Chip>
          <Chip onClick={() => {}}>Minecraft</Chip>
        </Sample>
        <Sample title="Badges de estado" code="<Badge tone>">
          <Badge tone="live">En vivo</Badge>
          <Badge tone="new">Nuevo</Badge>
          <Badge>Próximo</Badge>
          <Badge tone="ok">Activo</Badge>
          <Badge tone="warn">Pendiente</Badge>
          <Badge tone="bad">Cerrado</Badge>
          <Badge tone="info">Beta</Badge>
        </Sample>
        <Sample title="Chips descartables" code="<Chip on onRemove>" note={<>Para filtros activos: la ✕ quita el chip sin disparar el chip entero.</>}>
          {fchips.map((t) => (
            <Chip key={t} on onRemove={() => setFchips((a) => a.filter((x) => x !== t))}>
              {t}
            </Chip>
          ))}
          {fchips.length === 0 && (
            <Button size="sm" variant="ghost" icon="refresh" onClick={() => setFchips(["VGC", "Singles", "Clima", "Compartir"])}>
              Restaurar filtros
            </Button>
          )}
        </Sample>
        <Sample title="Avatares" code="<Avatar> · <AvatarGroup items max>">
          <Avatar>AX</Avatar>
          <Avatar accent>NV</Avatar>
          <Avatar lg>KR</Avatar>
          <AvatarGroup items={["AX", { label: "NV", accent: true }, "KR", "JR", "MG", "CL", "ZZ"]} max={5} />
        </Sample>
        <Sample title="Caja de icono" code="<IconBox icon tone size>" note={<>El patrón «icono en caja tintada»; los tonos semánticos siguen reservados a estado.</>}>
          <IconBox icon="sword" size="lg" />
          <IconBox icon="cards" tone="info" />
          <IconBox icon="check" tone="ok" />
          <IconBox icon="alert" tone="warn" size="sm" />
          <IconBox icon="tree" tone="muted" />
        </Sample>
        <Sample
          title="Grupo de chips"
          code="<ChipGroup label value onChange options multi>"
          col
          note={<>Filtro compacto en mono: exclusivo o <code>multi</code>. Cada opción admite <code>count</code> y un punto de <code>color</code>.</>}
        >
          <div className="grid gap-4 w-full max-w-[440px]">
            <ChipGroup
              label="Formato"
              value={chipG}
              onChange={(v) => setChipG(v as string)}
              options={[
                { value: "todos", label: "Todos", count: 224 },
                { value: "vgc", label: "VGC", count: 128 },
                { value: "singles", label: "Singles", count: 64 },
                { value: "draft", label: "Draft", count: 32 },
              ]}
            />
            <ChipGroup
              label="Etiquetas (multi)"
              multi
              value={chipM}
              onChange={(v) => setChipM(v as string[])}
              options={[
                { value: "vgc", label: "VGC", color: "hsl(18 90% 55%)" },
                { value: "clima", label: "Clima", color: "hsl(200 80% 55%)" },
                { value: "tr", label: "Trick Room", color: "hsl(265 60% 66%)" },
                { value: "hyper", label: "Hyper Offense", color: "hsl(0 75% 60%)" },
              ]}
            />
          </div>
        </Sample>
      </Section>
    </>
  )
}
