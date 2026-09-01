"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import {
  Callout,
  Combobox,
  CopyButton,
  DamageBar,
  HpGauge,
  KoVerdict,
  MiniCard,
  NumberStepper,
  PillRow,
  PokemonSprite,
  RoleTag,
  StatEditor,
  TogglePill,
  TypeBadge,
  MvType,
  defaultPokemon,
  type CalcPokemon,
} from "@boffmedia/tools-pokemon"

// Demo species for the combobox (name · slug · English types). [deferred]
const CX_SPECIES = [
  { name: "Incineroar", slug: "incineroar", types: ["fire", "dark"] },
  { name: "Flutter Mane", slug: "flutter-mane", types: ["ghost", "fairy"] },
  { name: "Amoonguss", slug: "amoonguss", types: ["grass", "poison"] },
  { name: "Urshifu", slug: "urshifu", types: ["fighting", "dark"] },
  { name: "Landorus", slug: "landorus", types: ["ground", "flying"] },
  { name: "Rillaboom", slug: "rillaboom", types: ["grass"] },
]
// Flutter Mane base stats for the stat-editor demo.
const FLUTTER_BASE = { hp: 55, atk: 55, def: 55, spa: 135, spd: 135, spe: 135 }

export function CalculadoraChapter() {
  const [name, setName] = React.useState("Incineroar")
  const [bp, setBp] = React.useState(120)
  const [lvl, setLvl] = React.useState(50)
  const [weather, setWeather] = React.useState<string | null>("Sol")
  const [tr, setTr] = React.useState(true)
  const [hp, setHp] = React.useState(131)
  const [poke, setPoke] = React.useState<CalcPokemon>(() => ({
    ...defaultPokemon("Flutter Mane"),
    nature: "Modest",
    evs: { hp: 252, atk: 0, def: 0, spa: 252, spd: 4, spe: 0 },
  }))

  return (
    <>
      <Section
        id="cxentradas"
        kicker="Calculadora"
        title="Entradas de cálculo"
        lead={<>Controles densos para herramientas de datos: búsqueda con teclado, steppers numéricos con límites y píldoras de condición. Reutilizables en cualquier calculadora o planificador.</>}
      >
        <Sample title="Combobox con búsqueda" code="<Combobox>" note="↑/↓ mueve, Enter elige, Esc cierra. <code>getItems(query)</code> devuelve la lista; el render de cada opción es libre.">
          <div className="w-[260px]">
            <Combobox
              value={name}
              placeholder="Buscar Pokémon…"
              getItems={(q) => CX_SPECIES.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 10)}
              itemKey={(it) => it.name}
              onPick={(it) => setName(it.name)}
              renderItem={(it) => (
                <>
                  <PokemonSprite name={it.slug} size={26} />
                  <span className="flex-1">{it.name}</span>
                  <span className="flex gap-1">
                    {it.types.map((ty) => (
                      <TypeBadge key={ty} type={ty} small />
                    ))}
                  </span>
                </>
              )}
            />
          </div>
        </Sample>
        <Sample title="Stepper numérico" code="<NumberStepper min max step>">
          <div className="inline-flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-txt-muted">Potencia</span>
            <NumberStepper value={bp} min={0} max={250} step={5} onChange={setBp} />
          </div>
          <div className="inline-flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-txt-muted">Nivel</span>
            <NumberStepper value={lvl} min={1} max={100} onChange={setLvl} />
          </div>
        </Sample>
        <Sample title="Píldoras de condición" code="<TogglePill on tone>" note="Conmutadores con <code>aria-pressed</code>; el tono acepta cualquier token semántico (<code>--info</code>, <code>--warn</code>, <code>--ok</code>).">
          <PillRow>
            {["Sol", "Lluvia", "Arena", "Nieve"].map((x) => (
              <TogglePill key={x} on={weather === x} label={x} tone={x === "Lluvia" || x === "Nieve" ? "var(--info)" : x === "Sol" ? "var(--warn)" : undefined} onClick={() => setWeather(weather === x ? null : x)} />
            ))}
            <TogglePill on={tr} label="Tiempo Raro" tone="var(--info)" onClick={() => setTr(!tr)} />
          </PillRow>
        </Sample>
      </Section>

      <Section
        id="cxstats"
        kicker="Calculadora"
        title="Stats y salud"
        lead={<>El editor completo de un set: naturaleza marcada con ▲/▼, presupuesto de 510 EVs con estado de error, y barra de PS editable con rampa verde → ámbar → rojo.</>}
      >
        <Sample title="Editor de stats" code="<StatEditor poke baseStats onChange>" col note="Sube los EVs por encima de 510 para ver el estado de error del presupuesto.">
          <div className="w-[min(420px,100%)]">
            <StatEditor poke={poke} baseStats={FLUTTER_BASE} onChange={(patch) => setPoke((p) => ({ ...p, ...patch }))} />
          </div>
        </Sample>
        <Sample title="Barra de PS" code="<HpGauge current max>" col>
          <div className="w-[min(340px,100%)]">
            <HpGauge current={hp} max={207} label="PS del defensor" resetLabel="Restaurar" onChange={setHp} onReset={() => setHp(207)} />
          </div>
        </Sample>
      </Section>

      <Section
        id="cxresultado"
        kicker="Calculadora"
        title="Veredicto y rangos"
        lead={<>El resultado de un cálculo en tres piezas: veredicto de KO, rango numérico sobre escala 0–100 % y texto canónico copiable. Tonos de daño: rojo (OHKO), naranja, ámbar, atenuado.</>}
      >
        <Sample title="Veredicto de KO" code="<KoVerdict text tone>">
          <div className="flex flex-wrap items-baseline gap-[26px]">
            <KoVerdict text="OHKO seguro" tone="red" />
            <KoVerdict text="2HKO seguro" tone="orange" />
            <KoVerdict text="Posible 2HKO" tone="amber" />
            <KoVerdict text="No KO" tone="dim" />
          </div>
        </Sample>
        <Sample title="Rango de daño" code="<DamageBar minPct maxPct tone>" col>
          <div className="grid w-full gap-[18px]">
            <DamageBar minPct={88.2} maxPct={104.5} tone="red" />
            <DamageBar minPct={41.3} maxPct={48.9} tone="dim" />
          </div>
        </Sample>
        <Sample title="Copiar cálculo" code="<CopyButton text>">
          <CopyButton text="252 AtE Flutter Mane Poder Lunar vs. 252 PS Incineroar: 102-121 (50.7 - 60.1%)" label="Copiar cálculo" copiedLabel="Copiado" />
        </Sample>
      </Section>

      <Section
        id="cxpiezas"
        kicker="Calculadora"
        title="Piezas de Pokémon"
        lead={<>Identidad compacta: sprite con reserva tipográfica, etiqueta de tipo en color canónico, sello de rol y tarjeta mínima. La nota contextual acompaña estados vacíos y avisos.</>}
      >
        <Sample title="Sprite y tipos" code="<PokemonSprite> <TypeBadge>">
          <PokemonSprite name="incineroar" size={44} />
          <PokemonSprite name="flutter-mane" size={44} />
          <TypeBadge type="fire" />
          <TypeBadge type="dark" />
          <MvType type="ghost" small />
          <MvType type="fairy" small />
        </Sample>
        <Sample title="Sello de rol y tarjeta mínima" code="<RoleTag> <MiniCard>">
          <RoleTag color="var(--accent)">Atacante</RoleTag>
          <RoleTag color="var(--info)">Defensor</RoleTag>
          <MiniCard name="Incineroar" sub="Banda Brava" />
        </Sample>
        <Sample title="Nota contextual" code="<Callout tone>" col>
          <div className="grid w-[min(460px,100%)] gap-2.5">
            <Callout>Los rangos usan las 16 tiradas de daño del motor; el veredicto marca el peor caso.</Callout>
            <Callout tone="warn">Presupuesto de EVs excedido: el total no puede superar 510.</Callout>
          </div>
        </Sample>
      </Section>
    </>
  )
}
