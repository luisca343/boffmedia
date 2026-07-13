"use client"

import { useMemo, useState } from "react"
import { env } from "@/config/env.public"
import { Bar, Button, Card, Empty, Field, Icon, PageHead, Select, Skeleton, toast } from "../../_components/ui"
import { ConsolaHero } from "../../_components/admin/ConsolaHero"
import { DIR_OPTIONS, HighwaySign, ROAD_TYPES, type CartelDestinationDisplay, type CartelDestinationInput, type CartelRoadType } from "../../_components/admin/HighwaySign"
import { useCarteles, useCreateCartel, useDeleteCartel } from "../../_hooks/queries"

function buildUrl(tipo: string, highway: string, destinations: CartelDestinationDisplay[]) {
  let u = `${env.NEXT_PUBLIC_URL}/smartrotom/cartel?tipo=${tipo}&via=${encodeURIComponent(highway)}`
  destinations.forEach((d, i) => {
    if (d.dest || d.dist) {
      u += `&dest${i + 1}=${encodeURIComponent(d.dest)}&dist${i + 1}=${encodeURIComponent(d.dist)}&dir${i + 1}=${d.dir}`
    }
  })
  return u
}

export default function SenalizacionPage() {
  const { data: carteles, isLoading } = useCarteles()
  const createCartel = useCreateCartel()
  const deleteCartel = useDeleteCartel()

  const [roadType, setRoadType] = useState<CartelRoadType>("autopista")
  const [name, setName] = useState("")
  const [highway, setHighway] = useState("A-2")
  const [dests, setDests] = useState<CartelDestinationInput[]>([
    { dest: "Ciudad Carmín", dist: "300", dir: "right" },
    { dest: "Pueblo Paleta", dist: "120", dir: "recto" },
  ])
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const url = useMemo(() => buildUrl(roadType, highway, dests), [roadType, highway, dests])
  const rt = ROAD_TYPES.find((x) => x.value === roadType) ?? ROAD_TYPES[0]
  const setDest = (i: number, patch: Partial<CartelDestinationInput>) =>
    setDests((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)))

  const canSave = name.trim().length > 0 && highway.trim().length > 0 && !createCartel.isPending

  const save = () => {
    if (!canSave) return
    createCartel.mutate(
      {
        name: name.trim(),
        highway: highway.trim(),
        // dist travels as a number on the wire (CartelDestinationDto)
        destinations: dests
          .filter((d) => d.dest.trim() || d.dist.trim())
          .map((d) => ({ ...d, dist: Number(d.dist) || 0 })),
      },
      { onSuccess: () => setName("") },
    )
  }

  const copy = async (key: string, link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedKey(key)
      toast.success("Enlace copiado")
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800)
    } catch {
      toast.error("No se pudo copiar el enlace")
    }
  }

  return (
    <>
      <PageHead
        kicker="Administración · Urbanismo"
        dep="urbanismo"
        title="Señalización"
        sub="Genera carteles direccionales para las vías de Teras: autopistas, nacionales, comarcales y caminos rurales. Antes OGT Explorer / Carteles."
      />
      <ConsolaHero title="Generador de carteles" code="senalizacion" icon="hammer" dep="urbanismo" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <Bar
            icon="hammer"
            dep="urbanismo"
            right={
              dests.length < 4 ? (
                <Button size="sm" tone="ghost" icon="plus" onClick={() => setDests((d) => [...d, { dest: "", dist: "", dir: "recto" }])}>
                  Destino
                </Button>
              ) : null
            }
          >
            Configuración
          </Bar>
          <div className="p-4">
            <div className="mb-1.5 font-gt-mono text-[9px] font-bold uppercase tracking-[.12em] text-gt-ink-400">
              Tipo de vía
            </div>
            <div className="mb-4 flex w-fit gap-1 rounded-gt border border-gt-line-strong bg-gt-paper-2 p-[3px]">
              {ROAD_TYPES.map((x) => (
                <Button key={x.value} size="sm" tone={roadType === x.value ? "primary" : "plain"} onClick={() => setRoadType(x.value)}>
                  {x.label}
                </Button>
              ))}
            </div>

            <div className="mb-1.5 font-gt-mono text-[9px] font-bold uppercase tracking-[.12em] text-gt-ink-400">
              Nombre del cartel
            </div>
            <div className="mb-3.5">
              <Field value={name} onChange={setName} placeholder="Ej. A-2 hacia el norte" />
            </div>

            <div className="mb-1.5 font-gt-mono text-[9px] font-bold uppercase tracking-[.12em] text-gt-ink-400">
              Nombre de la vía
            </div>
            <div className="mb-4">
              <Field value={highway} onChange={setHighway} placeholder={rt.example} />
            </div>

            <div className="grid gap-2.5">
              {dests.map((d, i) => (
                <div key={i} className="rounded-gt-sm border border-gt-line bg-gt-paper-2 p-[11px]">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-gt-mono text-[10.5px] font-bold text-gt-ink-500">{i + 1} &gt; Destino</span>
                    <button
                      type="button"
                      onClick={() => setDests((ds) => ds.filter((_, j) => j !== i))}
                      aria-label="Quitar destino"
                      className="text-gt-danger"
                    >
                      <Icon name="minus" size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-[2fr_1fr_1.1fr] gap-[7px]">
                    <Field value={d.dest} onChange={(v) => setDest(i, { dest: v })} placeholder="Nombre" />
                    <Field type="number" mono value={d.dist} onChange={(v) => setDest(i, { dist: v })} placeholder="bq" />
                    <Select value={d.dir} onChange={(v) => setDest(i, { dir: v })} options={DIR_OPTIONS} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-gt-line pt-3.5">
              <Button icon="check" className="w-full" disabled={!canSave} onClick={save}>
                {createCartel.isPending ? "Guardando…" : "Guardar cartel"}
              </Button>
              <div className="mt-2.5 flex gap-1.5">
                <Field value={url} onChange={() => {}} mono className="text-[11px]" />
                <Button tone="ghost" icon={copiedKey === "draft" ? "check" : "fileText"} onClick={() => copy("draft", url)}>
                  {copiedKey === "draft" ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <Bar icon="eye" dep="urbanismo" right={<span className="font-gt-mono text-[9px] uppercase tracking-[.12em] text-gt-ink-400">{rt.label}</span>}>
            Vista previa
          </Bar>
          <div
            className="grid place-items-center p-6"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgb(var(--gt-paper-2)) 0 16px, rgb(var(--gt-paper-3)) 16px 32px)",
            }}
          >
            <HighwaySign type={roadType} highway={highway} destinations={dests} />
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <div className="mb-3 font-gt-mono text-[10.5px] font-bold uppercase tracking-[.14em] text-gt-ink-400">
          Carteles guardados
        </div>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
        ) : carteles?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {carteles.map((c) => {
              const link = buildUrl("autopista", c.highway, c.destinations)
              const key = `saved-${c.id}`
              return (
                <Card key={c.id} className="flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between gap-2 border-b border-gt-line px-3.5 py-2.5">
                    <span className="truncate font-gt-display text-sm font-bold text-gt-ink-900">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => deleteCartel.mutate(c.id)}
                      aria-label={`Eliminar cartel ${c.name}`}
                      disabled={deleteCartel.isPending}
                      className="flex-none text-gt-danger disabled:opacity-50"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                  <div className="flex flex-1 items-center justify-center bg-gt-paper-2 p-3">
                    <HighwaySign type="autopista" highway={c.highway} destinations={c.destinations} width={260} />
                  </div>
                  <div className="border-t border-gt-line p-2.5">
                    <Button tone="ghost" size="sm" className="w-full" icon={copiedKey === key ? "check" : "fileText"} onClick={() => copy(key, link)}>
                      {copiedKey === key ? "Copiado" : "Copiar enlace"}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Empty icon="signal" title="Sin carteles guardados" sub="Los carteles que guardes aparecerán aquí." />
        )}
      </div>
    </>
  )
}
