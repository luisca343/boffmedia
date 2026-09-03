"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Badge, Button, Icon } from "../ui"
import { useCreateEvento, useSetEspecies } from "../../_hooks/queries"
import { useOfficer } from "../../_hooks/useOfficer"
import { GOBIERNO_ROOT } from "../../_utils/nav"
import type { Especie, Evento, EventoWeights } from "../../_types"
import { BackToEventos, EventoCard, RARITY_TONE, weightMax } from "./shared"
import { CazaDatos, CazaReglas, ConsDatos, ConsReglas, StepRevisar, StepTipo } from "./CrearSteps"

const pad2 = (n: number) => String(n).padStart(2, "0")
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
const HOUR = 3_600_000
const DAY = 24 * HOUR
const plus = (ms: number) => new Date(Date.now() + ms)

const STEP_COUNT = 4

const DEFAULT_WEIGHTS: EventoWeights = { tamano: 20, ivs: 25, shiny: 30, nivel: 15, especie: 20 }

export function CrearWizard() {
  const t = useTranslations("gobierno")
  const router = useRouter()
  const officer = useOfficer()
  const createEvento = useCreateEvento()
  const setEspeciesMut = useSetEspecies()

  const steps = [
    t("eventos.stepTipo"),
    t("eventos.stepDatos"),
    t("eventos.stepReglas"),
    t("eventos.stepRevisar"),
  ]

  const [step, setStep] = useState(0)
  const [type, setType] = useState<"construccion" | "caza" | null>(null)

  const [title, setTitle] = useState("")

  // construcción
  const [brief, setBrief] = useState("")
  const [prize, setPrize] = useState("")
  const [crew, setCrew] = useState("")
  const [buildClosedAt, setBuildClosedAt] = useState(() => toLocalInput(plus(8 * DAY)))
  const [ratingClosesAt, setRatingClosesAt] = useState(() => toLocalInput(plus(12 * DAY)))

  // caza
  const [zone, setZone] = useState("")
  const [coordsX, setCoordsX] = useState("0")
  const [coordsZ, setCoordsZ] = useState("0")
  const [radius, setRadius] = useState("100")
  const [opensAt, setOpensAt] = useState(() => toLocalInput(plus(DAY)))
  const [closesAt, setClosesAt] = useState(() => toLocalInput(plus(DAY + 6 * HOUR)))
  const [weights, setWeights] = useState<EventoWeights>(DEFAULT_WEIGHTS)
  const [rules, setRules] = useState(() => t("eventos.defaultRules"))
  const [especies, setEspeciesList] = useState<Omit<Especie, "id" | "eventoId">[]>([])

  const addEspecie = (sp: Omit<Especie, "id" | "eventoId">) =>
    setEspeciesList((arr) => (arr.find((x) => x.name === sp.name) ? arr : [...arr, sp]))
  const removeEspecie = (name: string) => setEspeciesList((arr) => arr.filter((x) => x.name !== name))

  const weightSum = weightMax(weights)
  const dep = type === "caza" ? "civic" : "urbanismo"

  const valid = useMemo(() => {
    if (step === 0) return !!type
    if (type === "construccion") {
      if (step === 1) return !!(title.trim() && brief.trim() && prize.trim())
      if (step === 2)
        return !!buildClosedAt && !!ratingClosesAt && new Date(ratingClosesAt) > new Date(buildClosedAt)
    }
    if (type === "caza") {
      if (step === 1) return !!(title.trim() && zone.trim())
      if (step === 2)
        return !!opensAt && !!closesAt && new Date(closesAt) > new Date(opensAt) && weightSum > 0 && especies.length >= 2
    }
    return true
  }, [step, type, title, brief, prize, buildClosedAt, ratingClosesAt, zone, opensAt, closesAt, weightSum, especies.length])

  const publishing = createEvento.isPending || setEspeciesMut.isPending

  const publish = async () => {
    if (!type) return
    if (type === "construccion") {
      const created = (await createEvento.mutateAsync({
        type: "construccion",
        title: title.trim(),
        brief: brief.trim(),
        prize: prize.trim(),
        crew: crew.trim() || undefined,
        buildClosedAt: new Date(buildClosedAt).toISOString(),
        ratingOpensAt: new Date(buildClosedAt).toISOString(),
        ratingClosesAt: new Date(ratingClosesAt).toISOString(),
        createdBy: officer.uuid,
      })) as Evento
      router.push(`${GOBIERNO_ROOT}/eventos/${created.id}`)
      return
    }
    const created = (await createEvento.mutateAsync({
      type: "caza",
      title: title.trim(),
      zone: zone.trim(),
      coordsX: Number(coordsX) || 0,
      coordsZ: Number(coordsZ) || 0,
      radius: Number(radius) || 0,
      opensAt: new Date(opensAt).toISOString(),
      closesAt: new Date(closesAt).toISOString(),
      weights,
      rules: rules.trim(),
      createdBy: officer.uuid,
    })) as Evento
    if (especies.length) {
      await setEspeciesMut.mutateAsync({ eventoId: created.id, especies })
    }
    router.push(`${GOBIERNO_ROOT}/eventos/${created.id}`)
  }

  const draftEv: Evento = useMemo(
    () => ({
      id: 0,
      code: "PREVIA",
      type: type ?? "construccion",
      status: "upcoming",
      title: title || (type === "caza" ? t("eventos.nuevaCazaTitulo") : t("eventos.nuevoRetoTitulo")),
      brief: brief || t("eventos.previewBrief"),
      prize: prize || null,
      crew: crew || null,
      buildClosedAt: buildClosedAt ? new Date(buildClosedAt).toISOString() : null,
      ratingOpensAt: null,
      ratingClosesAt: ratingClosesAt ? new Date(ratingClosesAt).toISOString() : null,
      winnerTown: null,
      zone: zone || null,
      coordsX: coordsX ? Number(coordsX) : null,
      coordsZ: coordsZ ? Number(coordsZ) : null,
      radius: radius ? Number(radius) : null,
      opensAt: opensAt ? new Date(opensAt).toISOString() : null,
      closesAt: closesAt ? new Date(closesAt).toISOString() : null,
      rules: rules || null,
      weights: type === "caza" ? weights : null,
      // Never sent anywhere — `EventoCard` doesn't render any of these, they only exist to
      // satisfy `Evento`'s shape for this local-only preview.
      createdBy: officer.uuid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [type, title, brief, prize, crew, buildClosedAt, ratingClosesAt, zone, coordsX, coordsZ, radius, opensAt, closesAt, rules, weights, officer.uuid],
  )

  return (
    <>
      <BackToEventos />

      <div className="gt-edge-gold overflow-hidden rounded-gt border border-gt-line-strong bg-gt-paper-0 shadow-gt-lg">
        <div className="border-b border-gt-line bg-gradient-to-b from-gt-paper-1 to-gt-paper-0 px-5 pb-3.5 pt-4">
          <div className="mb-3.5 flex items-center gap-2.5">
            <span className="grid h-[1.875rem] w-[1.875rem] flex-none place-items-center rounded-[8px] bg-gt-gold/[.14]">
              <Icon name="star" size={16} className="text-gt-gold-600" />
            </span>
            <div>
              <div className="font-gt-display text-lg font-bold leading-none text-gt-ink-900">
                {t("eventos.convocarEvento")}
              </div>
              <div className="mt-0.5 font-gt-mono text-[0.53125rem] uppercase tracking-[.14em] text-gt-ink-400">
                {t("eventos.gobiernoOrganizacion")}
              </div>
            </div>
          </div>
          <StepRail step={step} dep={dep} steps={steps} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_21.25rem]">
          <div className="gt-scroll min-h-[26.25rem] border-b border-gt-line p-5 lg:border-b-0 lg:border-r">
            {step === 0 && <StepTipo type={type} setType={setType} />}

            {step === 1 &&
              (type === "construccion" ? (
                <ConsDatos title={title} setTitle={setTitle} brief={brief} setBrief={setBrief} prize={prize} setPrize={setPrize} crew={crew} setCrew={setCrew} />
              ) : (
                <CazaDatos
                  title={title}
                  setTitle={setTitle}
                  zone={zone}
                  setZone={setZone}
                  coordsX={coordsX}
                  setCoordsX={setCoordsX}
                  coordsZ={coordsZ}
                  setCoordsZ={setCoordsZ}
                  radius={radius}
                  setRadius={setRadius}
                />
              ))}

            {step === 2 &&
              (type === "construccion" ? (
                <ConsReglas
                  buildClosedAt={buildClosedAt}
                  setBuildClosedAt={setBuildClosedAt}
                  ratingClosesAt={ratingClosesAt}
                  setRatingClosesAt={setRatingClosesAt}
                />
              ) : (
                <CazaReglas
                  opensAt={opensAt}
                  setOpensAt={setOpensAt}
                  closesAt={closesAt}
                  setClosesAt={setClosesAt}
                  weights={weights}
                  setWeights={setWeights}
                  rules={rules}
                  setRules={setRules}
                  especies={especies}
                  addEspecie={addEspecie}
                  removeEspecie={removeEspecie}
                />
              ))}

            {step === 3 && type && (
              <StepRevisar
                type={type}
                title={title}
                brief={brief}
                prize={prize}
                buildClosedAt={buildClosedAt}
                ratingClosesAt={ratingClosesAt}
                zone={zone}
                coordsX={coordsX}
                coordsZ={coordsZ}
                radius={radius}
                opensAt={opensAt}
                closesAt={closesAt}
                weightSum={weightSum}
                especies={especies}
              />
            )}
          </div>

          <div className="gt-scroll bg-gt-paper-2 p-3.5">
            <div className="mb-2.5 flex items-center gap-1.5">
              <Icon name="eye" size={13} className="text-gt-gold-600" />
              <span className="font-gt-mono text-[0.53125rem] font-bold uppercase tracking-[.12em] text-gt-ink-500">
                {t("eventos.previaEnVivo")}
              </span>
            </div>
            {!type ? (
              <div className="grid place-items-center px-4 py-10 text-center">
                <Icon name="eye" size={26} className="mb-2 text-gt-ink-300" />
                <div className="max-w-[11.25rem] font-gt-mono text-[0.6875rem] leading-relaxed text-gt-ink-400">
                  {t("eventos.previaHint")}
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                <EventoCard ev={draftEv} linkable={false} />
                {type === "caza" && especies.length > 0 && (
                  <div className="rounded-gt border border-gt-line bg-gt-paper-0 p-3 shadow-gt-sm">
                    <div className="mb-2 font-gt-mono text-[0.5rem] uppercase tracking-[.12em] text-gt-ink-400">
                      {t("eventos.especiesPublicadas", { count: especies.length })}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {especies.map((sp) => (
                        <Badge key={sp.name} tone={RARITY_TONE[sp.rarity] ?? "default"}>
                          {sp.name} {sp.spawnPct}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gt-line bg-gt-paper-1 px-5 py-3.5">
          <Button tone="ghost" icon="arrowLeft" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            {t("eventos.atras")}
          </Button>
          <div className="flex items-center gap-2.5">
            <span className="hidden font-gt-mono text-[0.65625rem] text-gt-ink-400 sm:inline">
              {t("common.stepOf", { step: step + 1, total: STEP_COUNT })}
            </span>
            {step < 3 ? (
              <Button
                tone={type === "caza" ? "primary" : "gold"}
                iconRight="arrowRight"
                disabled={!valid}
                onClick={() => setStep((s) => Math.min(3, s + 1))}
              >
                {t("eventos.siguiente")}
              </Button>
            ) : (
              <Button tone="gold" icon="send" disabled={publishing} onClick={publish}>
                {publishing ? t("common.publishing") : t("eventos.publicarEvento")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function StepRail({ step, dep, steps }: { step: number; dep: "civic" | "urbanismo"; steps: string[] }) {
  const depClass = dep === "civic" ? "bg-gt-civic" : "bg-gt-dep-urbanismo"
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const done = i < step
        const on = i === step
        return (
          <div key={s} className={`flex items-center gap-2 ${i < steps.length - 1 ? "flex-1" : "flex-none"}`}>
            <div className="flex flex-none items-center gap-2">
              <span
                className={`grid h-6 w-6 flex-none place-items-center rounded-full font-gt-mono text-[0.6875rem] font-bold ${
                  on ? `${depClass} text-white` : done ? "bg-gt-ok text-white" : "border border-gt-line-strong text-gt-ink-400"
                }`}
              >
                {done ? <Icon name="check" size={13} /> : i + 1}
              </span>
              <span className={`hidden whitespace-nowrap text-xs sm:inline ${on ? "font-bold text-gt-ink-900" : "text-gt-ink-400"}`}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-[1.5px] min-w-[0.875rem] flex-1 ${done ? "bg-gt-ok" : "bg-gt-line-strong"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
