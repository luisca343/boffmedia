"use client"

import { useState } from "react"
import { Badge, Button, Field, Icon, Select, TextArea } from "../ui"
import { fmtDateTime } from "../../_utils/format"
import type { Especie, EventoWeights } from "../../_types"
import { RARITY_PTS, RARITY_TIERS, RARITY_TONE, SCORE_FIELDS } from "./shared"

// ─── small form atoms ───────────────────────────────────────────────────────────

function FLabel({ children, hint, req }: { children: React.ReactNode; hint?: string; req?: boolean }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <span className="font-gt-mono text-[9px] font-bold uppercase tracking-[.12em] text-gt-ink-500">
        {children}
        {req && <span className="text-gt-danger"> *</span>}
      </span>
      {hint && <span className="font-gt-mono text-[9.5px] text-gt-ink-400">{hint}</span>}
    </div>
  )
}

// ─── STEP 0 · tipo ───────────────────────────────────────────────────────────────

export function StepTipo({
  type,
  setType,
}: {
  type: "construccion" | "caza" | null
  setType: (t: "construccion" | "caza") => void
}) {
  const opts = [
    {
      key: "construccion" as const,
      icon: "building" as const,
      title: "Reto de construcción",
      desc: "Cada ciudad levanta una obra a partir de un briefing. Después, los jugadores de otras ciudades la valoran.",
    },
    {
      key: "caza" as const,
      icon: "crosshair" as const,
      title: "Caza de bichos",
      desc: "Todos cazan en una zona. Parámetros públicos; sin revelar capturas. Cada jugador decide si conserva o sigue cazando.",
    },
  ]
  return (
    <div>
      <h3 className="mb-1 font-gt-display text-[19px] text-gt-ink-900">¿Qué tipo de evento?</h3>
      <p className="mb-[18px] text-[12.5px] text-gt-ink-500">
        Elige el formato. Los campos del asistente se adaptan a tu elección.
      </p>
      <div className="grid gap-3">
        {opts.map((o) => {
          const on = type === o.key
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => setType(o.key)}
              className={`rounded-gt border p-4 text-left transition-colors ${
                on ? "border-[1.5px] border-gt-accent bg-gt-accent-tint" : "border-gt-line bg-gt-paper-0 hover:bg-gt-paper-1"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[10px] bg-gt-accent/[.14]">
                  <Icon name={o.icon} size={22} className="text-gt-accent" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-gt-display text-base font-bold text-gt-ink-900">{o.title}</span>
                    {on && <Icon name="checkCircle" size={16} className="text-gt-accent" />}
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-gt-ink-600">{o.desc}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── STEP 1 · datos ───────────────────────────────────────────────────────────────

export function ConsDatos({
  title,
  setTitle,
  brief,
  setBrief,
  prize,
  setPrize,
  crew,
  setCrew,
}: {
  title: string
  setTitle: (v: string) => void
  brief: string
  setBrief: (v: string) => void
  prize: string
  setPrize: (v: string) => void
  crew: string
  setCrew: (v: string) => void
}) {
  return (
    <div className="grid gap-4">
      <h3 className="m-0 font-gt-display text-[18px] text-gt-ink-900">Datos del reto</h3>
      <Field label="Título del reto" value={title} onChange={setTitle} placeholder="Ej. El Monumento de la Ciudad" />
      <TextArea
        label="Briefing"
        value={brief}
        onChange={setBrief}
        rows={4}
        placeholder="Describe qué deben construir las ciudades, el tema, el volumen máximo y las condiciones…"
      />
      <Field label="Premio" value={prize} onChange={setPrize} placeholder="Ej. 40.000 ₽ y réplica permanente en el Spawn" />
      <Field label="Cuadrilla (opcional)" value={crew} onChange={setCrew} placeholder="Ej. Una cuadrilla por ciudad" />
    </div>
  )
}

export function CazaDatos({
  title,
  setTitle,
  zone,
  setZone,
  coordsX,
  setCoordsX,
  coordsZ,
  setCoordsZ,
  radius,
  setRadius,
}: {
  title: string
  setTitle: (v: string) => void
  zone: string
  setZone: (v: string) => void
  coordsX: string
  setCoordsX: (v: string) => void
  coordsZ: string
  setCoordsZ: (v: string) => void
  radius: string
  setRadius: (v: string) => void
}) {
  return (
    <div className="grid gap-4">
      <h3 className="m-0 font-gt-display text-[18px] text-gt-ink-900">Datos de la cacería</h3>
      <Field label="Título" value={title} onChange={setTitle} placeholder="Ej. Gran Cacería de Bichos" />
      <Field label="Zona" value={zone} onChange={setZone} placeholder="Ej. Bosque de Pueblo Lavanda" />
      <div className="grid grid-cols-3 gap-3">
        <Field label="Coord. X" type="number" value={coordsX} onChange={setCoordsX} mono />
        <Field label="Coord. Z" type="number" value={coordsZ} onChange={setCoordsZ} mono />
        <Field label="Radio" type="number" value={radius} onChange={setRadius} mono />
      </div>
      <div className="flex items-start gap-2 rounded-gt-sm bg-gt-paper-2 p-2.5 text-[11.5px] leading-relaxed text-gt-ink-500">
        <Icon name="mapPin" size={13} className="mt-0.5 flex-none text-gt-civic" />
        Los jugadores serán teletransportados a esta zona al comenzar.
      </div>
    </div>
  )
}

// ─── STEP 2 · reglas ───────────────────────────────────────────────────────────────

export function ConsReglas({
  buildClosedAt,
  setBuildClosedAt,
  ratingClosesAt,
  setRatingClosesAt,
}: {
  buildClosedAt: string
  setBuildClosedAt: (v: string) => void
  ratingClosesAt: string
  setRatingClosesAt: (v: string) => void
}) {
  const badDates = buildClosedAt && ratingClosesAt && !(new Date(ratingClosesAt) > new Date(buildClosedAt))
  return (
    <div className="grid gap-[18px]">
      <h3 className="m-0 font-gt-display text-[18px] text-gt-ink-900">Calendario</h3>
      <div className="grid gap-3">
        <Field label="Fin de construcción" type="datetime-local" value={buildClosedAt} onChange={setBuildClosedAt} mono />
        <Field
          label="Fin de valoración"
          type="datetime-local"
          value={ratingClosesAt}
          onChange={setRatingClosesAt}
          mono
        />
        {badDates && (
          <div className="flex items-center gap-1.5 text-[11.5px] text-gt-danger">
            <Icon name="alert" size={13} /> El fin de valoración debe ser posterior al fin de construcción.
          </div>
        )}
      </div>
      <div className="flex items-start gap-2 rounded-gt-sm bg-gt-paper-2 p-2.5 text-[11.5px] leading-relaxed text-gt-ink-500">
        <Icon name="star" size={13} className="mt-0.5 flex-none text-gt-gold-600" />
        La valoración abrirá automáticamente en cuanto se cierre la construcción.
      </div>
    </div>
  )
}

function WeightRow({
  field,
  value,
  onChange,
}: {
  field: (typeof SCORE_FIELDS)[number]
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-[92px] flex-none items-center gap-1.5">
        <Icon name={field.icon} size={14} className="text-gt-civic" />
        <span className="text-[12.5px] font-semibold text-gt-ink-800">{field.label}</span>
      </span>
      <input
        type="range"
        min={0}
        max={50}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 cursor-pointer"
        style={{ accentColor: "rgb(var(--gt-civic))" }}
      />
      <span className="w-[52px] flex-none text-right font-gt-mono text-xs font-bold tabular-nums text-gt-ink-900">
        {value} pts
      </span>
    </div>
  )
}

function EspecieForm({ onAdd }: { onAdd: (sp: Omit<Especie, "id" | "eventoId">) => void }) {
  const [name, setName] = useState("")
  const [rarity, setRarity] = useState<string>(RARITY_TIERS[0])
  const [spawnPct, setSpawnPct] = useState("10")
  const [shinyPct, setShinyPct] = useState("0.05")
  const [lvlMin, setLvlMin] = useState("5")
  const [lvlMax, setLvlMax] = useState("15")

  const valid = name.trim().length > 0

  const add = () => {
    if (!valid) return
    onAdd({
      name: name.trim(),
      rarity,
      rarityPts: RARITY_PTS[rarity] ?? 4,
      spawnPct: Number(spawnPct) || 0,
      shinyPct: Number(shinyPct) || 0,
      lvlMin: Number(lvlMin) || 1,
      lvlMax: Number(lvlMax) || 1,
    })
    setName("")
  }

  return (
    <div className="grid gap-2.5 rounded-gt border border-dashed border-gt-line-strong bg-gt-paper-1 p-3">
      <Field label="Especie" value={name} onChange={setName} placeholder="Ej. Scyther" />
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <FLabel>Rareza</FLabel>
          <Select value={rarity} onChange={setRarity} options={RARITY_TIERS.map((r) => ({ value: r, label: r }))} />
        </div>
        <div>
          <FLabel>Aparición</FLabel>
          <Field type="number" value={spawnPct} onChange={setSpawnPct} mono />
        </div>
        <div>
          <FLabel>Shiny %</FLabel>
          <Field type="number" value={shinyPct} onChange={setShinyPct} mono />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <FLabel>Nivel min.</FLabel>
            <Field type="number" value={lvlMin} onChange={setLvlMin} mono />
          </div>
          <div className="flex-1">
            <FLabel>Nivel máx.</FLabel>
            <Field type="number" value={lvlMax} onChange={setLvlMax} mono />
          </div>
        </div>
      </div>
      <Button icon="plus" tone="soft" size="sm" disabled={!valid} onClick={add} className="justify-self-start">
        Añadir especie
      </Button>
    </div>
  )
}

export function CazaReglas({
  opensAt,
  setOpensAt,
  closesAt,
  setClosesAt,
  weights,
  setWeights,
  rules,
  setRules,
  especies,
  addEspecie,
  removeEspecie,
}: {
  opensAt: string
  setOpensAt: (v: string) => void
  closesAt: string
  setClosesAt: (v: string) => void
  weights: EventoWeights
  setWeights: (w: EventoWeights) => void
  rules: string
  setRules: (v: string) => void
  especies: Omit<Especie, "id" | "eventoId">[]
  addEspecie: (sp: Omit<Especie, "id" | "eventoId">) => void
  removeEspecie: (name: string) => void
}) {
  const badDates = opensAt && closesAt && !(new Date(closesAt) > new Date(opensAt))
  const weightSum = weights.tamano + weights.ivs + weights.shiny + weights.nivel + weights.especie
  const spawnSum = especies.reduce((a, b) => a + (b.spawnPct || 0), 0)

  return (
    <div className="grid gap-[18px]">
      <h3 className="m-0 font-gt-display text-[18px] text-gt-ink-900">Calendario</h3>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Inicio" type="datetime-local" value={opensAt} onChange={setOpensAt} mono />
        <Field label="Cierre" type="datetime-local" value={closesAt} onChange={setClosesAt} mono />
      </div>
      {badDates && (
        <div className="flex items-center gap-1.5 text-[11.5px] text-gt-danger">
          <Icon name="alert" size={13} /> El cierre debe ser posterior al inicio.
        </div>
      )}

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <FLabel>Baremo de puntuación</FLabel>
          <span className="font-gt-mono text-[11px] font-bold tabular-nums text-gt-gold-600">
            Máx total {weightSum} pts
          </span>
        </div>
        <div className="grid gap-2.5 rounded-gt border border-gt-line bg-gt-paper-0 p-3.5 shadow-gt">
          {SCORE_FIELDS.map((f) => (
            <WeightRow
              key={f.key}
              field={f}
              value={weights[f.key]}
              onChange={(v) => setWeights({ ...weights, [f.key]: v })}
            />
          ))}
        </div>
      </div>

      <TextArea label="Reglas públicas" value={rules} onChange={setRules} rows={3} />

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <FLabel req hint="mín. 2 especies">
            Especies de la zona
          </FLabel>
          {especies.length > 0 && (
            <span
              className={`font-gt-mono text-[11px] font-bold tabular-nums ${
                spawnSum === 100 ? "text-gt-ok" : "text-gt-warn"
              }`}
            >
              Aparición {spawnSum}% {spawnSum === 100 ? "✓" : "· ajusta a 100%"}
            </span>
          )}
        </div>

        {especies.length > 0 && (
          <div className="mb-3 grid gap-1.5">
            {especies.map((sp) => (
              <div
                key={sp.name}
                className="flex items-center justify-between gap-2 rounded-gt-sm border border-gt-line bg-gt-paper-0 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="font-gt-display text-sm font-bold text-gt-ink-900">{sp.name}</span>
                  <Badge tone={RARITY_TONE[sp.rarity] ?? "default"}>{sp.rarity}</Badge>
                  <span className="font-gt-mono text-[10.5px] text-gt-ink-400">
                    {sp.spawnPct}% · Nv {sp.lvlMin}–{sp.lvlMax}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeEspecie(sp.name)}
                  aria-label={`Quitar ${sp.name}`}
                  className="flex-none text-gt-ink-400 transition-colors hover:text-gt-danger"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <EspecieForm onAdd={addEspecie} />
      </div>
    </div>
  )
}

// ─── STEP 3 · revisar ───────────────────────────────────────────────────────────────

function RevRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gt-line-soft py-2 last:border-b-0">
      <span className="flex-none font-gt-mono text-[9px] uppercase tracking-[.1em] text-gt-ink-400">{k}</span>
      <span className="text-right text-[12.5px] font-semibold text-gt-ink-800">{v}</span>
    </div>
  )
}

export function StepRevisar({
  type,
  title,
  brief,
  prize,
  buildClosedAt,
  ratingClosesAt,
  zone,
  coordsX,
  coordsZ,
  radius,
  opensAt,
  closesAt,
  weightSum,
  especies,
}: {
  type: "construccion" | "caza"
  title: string
  brief: string
  prize: string
  buildClosedAt: string
  ratingClosesAt: string
  zone: string
  coordsX: string
  coordsZ: string
  radius: string
  opensAt: string
  closesAt: string
  weightSum: number
  especies: Omit<Especie, "id" | "eventoId">[]
}) {
  return (
    <div>
      <h3 className="mb-1 font-gt-display text-[18px] text-gt-ink-900">Revisar y publicar</h3>
      <p className="mb-4 text-[12.5px] text-gt-ink-500">Comprueba los datos antes de convocar el evento.</p>
      <div className="mb-3.5 rounded-gt border border-gt-line bg-gt-paper-0 px-4 py-1 shadow-gt">
        <RevRow k="Tipo" v={type === "caza" ? "Caza de bichos" : "Reto de construcción"} />
        <RevRow k="Título" v={title || "—"} />
        {type === "construccion" ? (
          <>
            <RevRow k="Premio" v={prize || "—"} />
            <RevRow k="Fin construcción" v={buildClosedAt ? fmtDateTime(new Date(buildClosedAt).toISOString()) : "—"} />
            <RevRow k="Fin valoración" v={ratingClosesAt ? fmtDateTime(new Date(ratingClosesAt).toISOString()) : "—"} />
            <RevRow k="Participan" v="Ciudades de Teras" />
          </>
        ) : (
          <>
            <RevRow k="Zona" v={`${zone || "—"} · X${coordsX} Z${coordsZ} r${radius}`} />
            <RevRow k="Inicio" v={opensAt ? fmtDateTime(new Date(opensAt).toISOString()) : "—"} />
            <RevRow k="Cierre" v={closesAt ? fmtDateTime(new Date(closesAt).toISOString()) : "—"} />
            <RevRow k="Baremo máx." v={`${weightSum} pts`} />
            <RevRow
              k="Especies"
              v={`${especies.length} · aparición ${especies.reduce((a, b) => a + (b.spawnPct || 0), 0)}%`}
            />
          </>
        )}
      </div>
      {type === "construccion" && !brief.trim() && (
        <div className="flex items-start gap-2 rounded-gt-sm bg-gt-warn/[.1] p-2.5 text-[11.5px] leading-relaxed text-gt-ink-600">
          <Icon name="alert" size={13} className="mt-0.5 flex-none text-gt-warn" />
          Falta el briefing — vuelve al paso «Datos» antes de publicar.
        </div>
      )}
    </div>
  )
}
