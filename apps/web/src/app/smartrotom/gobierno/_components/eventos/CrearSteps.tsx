"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Badge, Button, Field, Icon, Select, TextArea } from "../ui"
import { fmtDateTime } from "../../_utils/format"
import type { Especie, EventoWeights } from "../../_types"
import { RARITY_PTS, RARITY_TIERS, RARITY_TONE, getScoreFields } from "./shared"

// ─── small form atoms ───────────────────────────────────────────────────────────

function FLabel({ children, hint, req }: { children: React.ReactNode; hint?: string; req?: boolean }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <span className="font-gt-mono text-[0.5625rem] font-bold uppercase tracking-[.12em] text-gt-ink-500">
        {children}
        {req && <span className="text-gt-danger"> *</span>}
      </span>
      {hint && <span className="font-gt-mono text-[0.59375rem] text-gt-ink-400">{hint}</span>}
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
  const t = useTranslations("gobierno")
  const opts = [
    {
      key: "construccion" as const,
      icon: "building" as const,
      title: t("eventos.retoConstruccion"),
      desc: t("eventos.retoConstruccionDesc"),
    },
    {
      key: "caza" as const,
      icon: "crosshair" as const,
      title: t("eventos.cazaBichos"),
      desc: t("eventos.cazaBichosDesc"),
    },
  ]
  return (
    <div>
      <h3 className="mb-1 font-gt-display text-[1.1875rem] text-gt-ink-900">{t("eventos.tipoEvento")}</h3>
      <p className="mb-[1.125rem] text-[0.78125rem] text-gt-ink-500">{t("eventos.tipoEventoHint")}</p>
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
                <span className="grid h-[2.875rem] w-[2.875rem] flex-none place-items-center rounded-[10px] bg-gt-accent/[.14]">
                  <Icon name={o.icon} size={22} className="text-gt-accent" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-gt-display text-base font-bold text-gt-ink-900">{o.title}</span>
                    {on && <Icon name="checkCircle" size={16} className="text-gt-accent" />}
                  </div>
                  <p className="mt-1 text-[0.78125rem] leading-relaxed text-gt-ink-600">{o.desc}</p>
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
  const t = useTranslations("gobierno")
  return (
    <div className="grid gap-4">
      <h3 className="m-0 font-gt-display text-[1.125rem] text-gt-ink-900">{t("eventos.datosReto")}</h3>
      <Field label={t("eventos.tituloReto")} value={title} onChange={setTitle} placeholder={t("eventos.tituloRetoPlaceholder")} />
      <TextArea
        label={t("eventos.briefing")}
        value={brief}
        onChange={setBrief}
        rows={4}
        placeholder={t("eventos.briefingPlaceholder")}
      />
      <Field label={t("eventos.premio")} value={prize} onChange={setPrize} placeholder={t("eventos.premioPlaceholder")} />
      <Field label={t("eventos.cuadrilla")} value={crew} onChange={setCrew} placeholder={t("eventos.cuadrillaPlaceholder")} />
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
  const t = useTranslations("gobierno")
  return (
    <div className="grid gap-4">
      <h3 className="m-0 font-gt-display text-[1.125rem] text-gt-ink-900">{t("eventos.datosCaceria")}</h3>
      <Field label={t("eventos.titulo")} value={title} onChange={setTitle} placeholder={t("eventos.tituloCazaPlaceholder")} />
      <Field label={t("eventos.zona")} value={zone} onChange={setZone} placeholder={t("eventos.zonaPlaceholder")} />
      <div className="grid grid-cols-3 gap-3">
        <Field label={t("eventos.coordX")} type="number" value={coordsX} onChange={setCoordsX} mono />
        <Field label={t("eventos.coordZ")} type="number" value={coordsZ} onChange={setCoordsZ} mono />
        <Field label={t("eventos.radio")} type="number" value={radius} onChange={setRadius} mono />
      </div>
      <div className="flex items-start gap-2 rounded-gt-sm bg-gt-paper-2 p-2.5 text-[0.71875rem] leading-relaxed text-gt-ink-500">
        <Icon name="mapPin" size={13} className="mt-0.5 flex-none text-gt-civic" />
        {t("eventos.teletransportHint")}
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
  const t = useTranslations("gobierno")
  const badDates = buildClosedAt && ratingClosesAt && !(new Date(ratingClosesAt) > new Date(buildClosedAt))
  return (
    <div className="grid gap-[1.125rem]">
      <h3 className="m-0 font-gt-display text-[1.125rem] text-gt-ink-900">{t("eventos.calendario")}</h3>
      <div className="grid gap-3">
        <Field label={t("eventos.finConstruccion")} type="datetime-local" value={buildClosedAt} onChange={setBuildClosedAt} mono />
        <Field
          label={t("eventos.finValoracion")}
          type="datetime-local"
          value={ratingClosesAt}
          onChange={setRatingClosesAt}
          mono
        />
        {badDates && (
          <div className="flex items-center gap-1.5 text-[0.71875rem] text-gt-danger">
            <Icon name="alert" size={13} /> {t("eventos.errorFechasConstruccion")}
          </div>
        )}
      </div>
      <div className="flex items-start gap-2 rounded-gt-sm bg-gt-paper-2 p-2.5 text-[0.71875rem] leading-relaxed text-gt-ink-500">
        <Icon name="star" size={13} className="mt-0.5 flex-none text-gt-gold-600" />
        {t("eventos.valoracionHint")}
      </div>
    </div>
  )
}

type ScoreField = ReturnType<typeof getScoreFields>[number]

function WeightRow({
  field,
  value,
  onChange,
}: {
  field: ScoreField
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-[5.75rem] flex-none items-center gap-1.5">
        <Icon name={field.icon} size={14} className="text-gt-civic" />
        <span className="text-[0.78125rem] font-semibold text-gt-ink-800">{field.label}</span>
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
      <span className="w-[3.25rem] flex-none text-right font-gt-mono text-xs font-bold tabular-nums text-gt-ink-900">
        {value} pts
      </span>
    </div>
  )
}

function EspecieForm({ onAdd }: { onAdd: (sp: Omit<Especie, "id" | "eventoId">) => void }) {
  const t = useTranslations("gobierno")
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
      <Field label={t("eventos.especie")} value={name} onChange={setName} placeholder={t("eventos.especiePlaceholder")} />
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <FLabel>{t("eventos.rareza")}</FLabel>
          <Select value={rarity} onChange={setRarity} options={RARITY_TIERS.map((r) => ({ value: r, label: r }))} />
        </div>
        <div>
          <FLabel>{t("eventos.aparicionLabel")}</FLabel>
          <Field type="number" value={spawnPct} onChange={setSpawnPct} mono />
        </div>
        <div>
          <FLabel>{t("eventos.shinyPct")}</FLabel>
          <Field type="number" value={shinyPct} onChange={setShinyPct} mono />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <FLabel>{t("eventos.nivelMin")}</FLabel>
            <Field type="number" value={lvlMin} onChange={setLvlMin} mono />
          </div>
          <div className="flex-1">
            <FLabel>{t("eventos.nivelMax")}</FLabel>
            <Field type="number" value={lvlMax} onChange={setLvlMax} mono />
          </div>
        </div>
      </div>
      <Button icon="plus" tone="soft" size="sm" disabled={!valid} onClick={add} className="justify-self-start">
        {t("eventos.anadirEspecie")}
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
  const t = useTranslations("gobierno")
  const scoreFields = getScoreFields(t)
  const badDates = opensAt && closesAt && !(new Date(closesAt) > new Date(opensAt))
  const weightSum = weights.tamano + weights.ivs + weights.shiny + weights.nivel + weights.especie
  const spawnSum = especies.reduce((a, b) => a + (b.spawnPct || 0), 0)

  return (
    <div className="grid gap-[1.125rem]">
      <h3 className="m-0 font-gt-display text-[1.125rem] text-gt-ink-900">{t("eventos.calendario")}</h3>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("eventos.inicio")} type="datetime-local" value={opensAt} onChange={setOpensAt} mono />
        <Field label={t("eventos.cierre")} type="datetime-local" value={closesAt} onChange={setClosesAt} mono />
      </div>
      {badDates && (
        <div className="flex items-center gap-1.5 text-[0.71875rem] text-gt-danger">
          <Icon name="alert" size={13} /> {t("eventos.errorFechasCaza")}
        </div>
      )}

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <FLabel>{t("eventos.baremoPuntuacion")}</FLabel>
          <span className="font-gt-mono text-[0.6875rem] font-bold tabular-nums text-gt-gold-600">
            {t("eventos.maxTotal", { pts: weightSum })}
          </span>
        </div>
        <div className="grid gap-2.5 rounded-gt border border-gt-line bg-gt-paper-0 p-3.5 shadow-gt">
          {scoreFields.map((f) => (
            <WeightRow
              key={f.key}
              field={f}
              value={weights[f.key]}
              onChange={(v) => setWeights({ ...weights, [f.key]: v })}
            />
          ))}
        </div>
      </div>

      <TextArea label={t("eventos.reglasPublicas")} value={rules} onChange={setRules} rows={3} />

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <FLabel req hint={t("eventos.minEspecies")}>
            {t("eventos.especiesZona")}
          </FLabel>
          {especies.length > 0 && (
            <span
              className={`font-gt-mono text-[0.6875rem] font-bold tabular-nums ${
                spawnSum === 100 ? "text-gt-ok" : "text-gt-warn"
              }`}
            >
              {t("eventos.aparicion", { pct: spawnSum })} {spawnSum === 100 ? "✓" : t("eventos.ajustaPct")}
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
                  <span className="font-gt-mono text-[0.65625rem] text-gt-ink-400">
                    {sp.spawnPct}% · Nv {sp.lvlMin}–{sp.lvlMax}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeEspecie(sp.name)}
                  aria-label={t("eventos.quitarEspecie", { name: sp.name })}
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
      <span className="flex-none font-gt-mono text-[0.5625rem] uppercase tracking-[.1em] text-gt-ink-400">{k}</span>
      <span className="text-right text-[0.78125rem] font-semibold text-gt-ink-800">{v}</span>
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
  const t = useTranslations("gobierno")
  const spawnSum = especies.reduce((a, b) => a + (b.spawnPct || 0), 0)
  return (
    <div>
      <h3 className="mb-1 font-gt-display text-[1.125rem] text-gt-ink-900">{t("eventos.revisarPublicar")}</h3>
      <p className="mb-4 text-[0.78125rem] text-gt-ink-500">{t("eventos.revisarHint")}</p>
      <div className="mb-3.5 rounded-gt border border-gt-line bg-gt-paper-0 px-4 py-1 shadow-gt">
        <RevRow k={t("eventos.tipo")} v={type === "caza" ? t("eventos.tipoCaza") : t("eventos.tipoConstruccion")} />
        <RevRow k={t("eventos.titulo")} v={title || "—"} />
        {type === "construccion" ? (
          <>
            <RevRow k={t("eventos.premio")} v={prize || "—"} />
            <RevRow k={t("eventos.finConstruccionLabel")} v={buildClosedAt ? fmtDateTime(new Date(buildClosedAt).toISOString()) : "—"} />
            <RevRow k={t("eventos.finValoracion")} v={ratingClosesAt ? fmtDateTime(new Date(ratingClosesAt).toISOString()) : "—"} />
            <RevRow k={t("eventos.participan")} v={t("eventos.ciudadesTeras")} />
          </>
        ) : (
          <>
            <RevRow k={t("eventos.zona")} v={`${zone || "—"} · X${coordsX} Z${coordsZ} r${radius}`} />
            <RevRow k={t("eventos.inicio")} v={opensAt ? fmtDateTime(new Date(opensAt).toISOString()) : "—"} />
            <RevRow k={t("eventos.cierre")} v={closesAt ? fmtDateTime(new Date(closesAt).toISOString()) : "—"} />
            <RevRow k={t("eventos.baremoMax")} v={`${weightSum} pts`} />
            <RevRow
              k={t("eventos.especiesLabel")}
              v={`${especies.length} · ${t("eventos.aparicionLabel")} ${spawnSum}%`}
            />
          </>
        )}
      </div>
      {type === "construccion" && !brief.trim() && (
        <div className="flex items-start gap-2 rounded-gt-sm bg-gt-warn/[.1] p-2.5 text-[0.71875rem] leading-relaxed text-gt-ink-600">
          <Icon name="alert" size={13} className="mt-0.5 flex-none text-gt-warn" />
          {t("eventos.faltaBriefing")}
        </div>
      )}
    </div>
  )
}
