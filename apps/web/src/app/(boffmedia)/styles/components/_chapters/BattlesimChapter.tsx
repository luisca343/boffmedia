"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import { Icon } from "@boffmedia/ui"
import {
  BxBench,
  BxBoost,
  BxCat,
  BxField,
  BxHp,
  BxKbdHint,
  BxKey,
  BxOrder,
  BxPlan,
  BxPlate,
  BxRing,
  BxScore,
  BxSlot,
  BxSpark,
  BxSprite,
  BxStatus,
  BxTera,
  BxTeraBtn,
  BxTick,
  BxType,
  BsimTab,
  TbSpBar,
} from "@boffmedia/tools-battlesim"
import { tyColor, TYPE_ES } from "@boffmedia/tools-battlesim"
import { DEX, STAT_ES, bxMon, finalStat } from "./battlesim-demo"

function PlateDemo() {
  const [ghost, setGhost] = React.useState(true)
  const foe = bxMon("dragonite", { hp: 62 })
  return (
    <div className="grid w-[min(300px,100%)] gap-[10px]">
      <BxPlate mon={foe} foe slotTag="R1" ghost={ghost ? { min: 28, max: 41, ko: null } : null} />
      <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px]/none font-medium text-txt-dim">
        <input type="checkbox" checked={ghost} onChange={(e) => setGhost(e.target.checked)} /> previsión de daño (ghost)
      </label>
    </div>
  )
}

function KeyDemo() {
  const [sel, setSel] = React.useState(0)
  const mon = bxMon("garchomp")
  const target = bxMon("miraidon")
  return (
    <div className="grid w-[min(380px,100%)] gap-[7px]">
      {(mon.moves || []).slice(0, 3).map((m, i) => (
        <BxKey key={m.name} move={m} hotkey={String(i + 1)} target={target} selected={sel === i} onClick={() => setSel(i)} />
      ))}
    </div>
  )
}

function RingDemo() {
  const [sec, setSec] = React.useState(37)
  React.useEffect(() => {
    const iv = setInterval(() => setSec((s) => (s <= 0 ? 45 : s - 1)), 1000)
    return () => clearInterval(iv)
  }, [])
  return <BxRing sec={sec} max={45} />
}

function TeraDemo() {
  const [armed, setArmed] = React.useState(false)
  return <BxTeraBtn type="Steel" armed={armed} hotkey="T" onToggle={() => setArmed((v) => !v)} />
}

/**
 * The real `TbSpBar`, not a mock of it.
 *
 * The budget is SHARED across the three rows on purpose. Spending in one
 * visibly puts the others' remaining pills out of reach, and that interaction
 * between rows is the part of the design a static screenshot cannot show — it
 * is also the reason the bar bothers to distinguish "not taken" from "not
 * takeable" at all.
 */
function TabDemo() {
  const [sel, setSel] = React.useState("replay")
  const [open, setOpen] = React.useState(["replay", "pvp"])
  return (
    <div className="flex w-[min(520px,100%)] flex-wrap items-center gap-1 border border-solid border-line bg-base-2 p-2">
      <BsimTab icon="home" label="Lobby" selected={sel === "home"} onSelect={() => setSel("home")} />
      <BsimTab icon="layers" label="Equipos" selected={sel === "teams"} onSelect={() => setSel("teams")} />
      {open.includes("replay") && (
        <BsimTab
          icon="play"
          label="Repetición"
          sub="98CB4F…"
          tone="dim"
          stateLabel="terminada"
          selected={sel === "replay"}
          onSelect={() => setSel("replay")}
          onClose={() => setOpen((o) => o.filter((k) => k !== "replay"))}
          closeLabel="Cerrar Repetición"
        />
      )}
      {open.includes("pvp") && (
        <BsimTab
          icon="sword"
          label="PvP"
          sub="Kaito"
          tone="ok"
          stateLabel="en curso"
          selected={sel === "pvp"}
          onSelect={() => setSel("pvp")}
          onClose={() => setOpen((o) => o.filter((k) => k !== "pvp"))}
          closeLabel="Cerrar PvP"
        />
      )}
      {open.length < 2 && (
        <button
          type="button"
          onClick={() => setOpen(["replay", "pvp"])}
          className="h-8 border border-dashed border-line px-3 font-mono text-[10px]/none uppercase tracking-[0.08em] text-txt-dim hover:text-txt"
        >
          restaurar
        </button>
      )}
    </div>
  )
}

const SP_FORMAT = "gen9championsvgc2026regma"
const SP_TOTAL = 66

function SpBarDemo() {
  const [sp, setSp] = React.useState<Record<string, number>>({ atk: 20, spe: 12, spa: 4 })
  const spent = Object.values(sp).reduce((a, b) => a + b, 0)
  // Adamant boosts Atq, so only that row has bumps (at 10, 20 and 30). Vel and
  // AtE are there to show the contrast: with no boost there is nothing to mark.
  const rows: [string, string, number][] = [["atk", "Atq", 130], ["spe", "Vel", 102], ["spa", "AtE", 80]]
  return (
    <div className="grid w-[min(440px,100%)] gap-[10px]">
      {rows.map(([key, label, base]) => (
        <div key={key} className="grid grid-cols-[34px_1fr_34px] items-center gap-[10px]">
          <span className="font-mono text-[9px]/none font-semibold uppercase tracking-[0.06em] text-accent-bright">{label}</span>
          <TbSpBar
            stat={key}
            currentSp={sp[key]}
            remainingBudget={SP_TOTAL - spent}
            nature="Adamant"
            base={base}
            format={SP_FORMAT}
            onChange={(v) => setSp((prev) => ({ ...prev, [key]: v }))}
            ariaLabel={`SP ${label}`}
            valueText={(n) => `${n} de 32 SP en ${label}`}
            bumpHint={(n) => `${n} saltos de +2`}
          />
          <span className="text-right font-mono text-[12px]/none font-bold text-txt">{sp[key]}</span>
        </div>
      ))}
      <p className="m-0 font-mono text-[10px]/none text-txt-dim">
        {spent} / {SP_TOTAL} SP · {SP_TOTAL - spent} restantes
      </p>
    </div>
  )
}

const TERA_TYPES = ["Fire", "Water", "Steel", "Fairy", "Dragon", "Ghost"]
const EV_ROWS: [string, number, number][] = [["atk", 130, 252], ["spe", 102, 84], ["hp", 108, 0]]
const COVERAGE: [string, number][] = [["Fire", 2], ["Water", 1], ["Steel", 0.5], ["Dragon", 2], ["Fairy", 2], ["Grass", 0.5]]

export function BattlesimChapter() {
  const chomp = bxMon("garchomp", { hp: 78, boosts: { atk: 2 } })
  const flutter = bxMon("fluttermane", { tera: true, teraType: "Fairy" })
  const hands = bxMon("ironhands", { hp: 44, status: "par" })
  const koMon = bxMon("torkoal", { hp: 0, fnt: true })

  return (
    <>
      <Section
        id="bxidentidad"
        kicker="Battlesim"
        title="Identidad de combate"
        lead={<>Las piezas mínimas del simulador: sprite animado con reserva, tipo en color canónico, categoría del movimiento, condición de estado, escalón de stat y cristal de teracristalización.</>}
      >
        <Sample title="Sprite animado" code="<BxSprite mon>" note="Sprites del CDN de Showdown con <code>image-rendering: pixelated</code> y reserva tipográfica si el recurso falla.">
          <BxSprite mon={bxMon("garchomp")} size={52} />
          <BxSprite mon={bxMon("fluttermane")} size={52} />
          <BxSprite mon={bxMon("rillaboom")} size={52} />
        </Sample>
        <Sample title="Tipos y categoría" code="<BxType> <BxCat>">
          <BxType type="Dragon" />
          <BxType type="Fire" ghost />
          <BxType type="Fairy" small ghost />
          <span className="inline-flex gap-3">
            <BxCat cat="phys" />
            <BxCat cat="spec" />
            <BxCat cat="status" />
          </span>
        </Sample>
        <Sample title="Estado, boost y tera" code="<BxStatus> <BxBoost> <BxTera>">
          <BxStatus status="par" />
          <BxStatus status="brn" />
          <BxStatus status="slp" />
          <BxBoost stat="atk" value={2} />
          <BxBoost stat="spe" value={-1} />
          <BxTera type="Steel" size="1.3em" />
          <BxTera type="Fairy" size="1.3em" />
        </Sample>
      </Section>

      <Section
        id="bxplacas"
        kicker="Battlesim"
        title="Placas y salud"
        lead={<>La placa de combatiente concentra identidad, PS, estado y la previsión de daño «fantasma» que aparece al apuntar un movimiento: franjas rayadas para el rango posible y sólidas para el daño seguro.</>}
      >
        <Sample title="Barra de PS con previsión" code="<BxHp pct ghost>" col>
          <div className="grid w-[min(280px,100%)] gap-3">
            <BxHp pct={100} />
            <BxHp pct={62} ghost={{ min: 24, max: 38 }} />
            <BxHp pct={18} />
          </div>
        </Sample>
        <Sample title="Placa aliada" code="<BxPlate mon slotTag>" col>
          <div className="grid w-[min(300px,100%)] gap-2">
            <BxPlate mon={chomp} slotTag="A1" active />
            <BxPlate mon={hands} slotTag="A2" />
          </div>
        </Sample>
        <Sample title="Placa rival con previsión" code="<BxPlate foe ghost>" col note="El fantasma se pinta en vivo mientras el cursor está sobre un movimiento; el sello ámbar/rojo resume la probabilidad de KO.">
          <PlateDemo />
        </Sample>
        <Sample title="Teracristalizado y debilitado" code="<BxPlate>" col>
          <div className="grid w-[min(300px,100%)] gap-2">
            <BxPlate mon={flutter} slotTag="A1" />
            <BxPlate mon={koMon} foe slotTag="R2" />
          </div>
        </Sample>
      </Section>

      <Section
        id="bxmando"
        kicker="Battlesim"
        title="Consola de mando"
        lead={<>El puesto de pilotaje del turno: teclas de movimiento con PP, eficacia y atajo; banquillo con salud; botón de teracristalización armable y chips de plan que resumen las órdenes encoladas.</>}
      >
        <Sample title="Teclas de movimiento" code="<BxKey move target hotkey>" col note="La etiqueta de eficacia se calcula contra el objetivo actual (aquí, Miraidon). ÁREA marca movimientos de daño múltiple; +N la prioridad.">
          <KeyDemo />
        </Sample>
        <Sample title="Banquillo" code="<BxBench mon hotkey>" col>
          <div className="grid w-[min(320px,100%)] gap-[7px]">
            <BxBench mon={bxMon("amoonguss")} hotkey="5" />
            <BxBench mon={bxMon("rillaboom", { hp: 0, fnt: true })} hotkey="6" />
          </div>
        </Sample>
        <Sample title="Teracristalización" code="<BxTeraBtn type armed>">
          <TeraDemo />
          <BxTeraBtn type="Fire" used />
        </Sample>
        <Sample title="Chips de plan" code="<BxPlan tag action>">
          <div className="flex flex-wrap gap-2">
            <BxPlan tag="A1" action={{ kind: "move", move: { name: "Terremoto", type: "Ground" }, target: { spread: "all" } }} onClear={() => {}} />
            <BxPlan tag="A2" action={{ kind: "switch", toName: "Amoonguss" }} onClear={() => {}} />
            <BxPlan tag="A2" action={null} />
          </div>
        </Sample>
        <Sample title="Orden previsto" code="<BxOrder slots>" col note="Ordenado por velocidad efectiva (la parálisis la reduce a la mitad); la prioridad se resuelve al ejecutar.">
          <BxOrder
            slots={[
              { side: "ally", idx: 0, mon: chomp },
              { side: "ally", idx: 1, mon: hands },
              { side: "foe", idx: 0, mon: bxMon("miraidon") },
              { side: "foe", idx: 1, mon: bxMon("kingambit") },
            ]}
          />
        </Sample>
      </Section>

      <Section
        id="bxmarcador"
        kicker="Battlesim"
        title="Marcador y ritmo"
        lead={<>El marco del combate: placas de jugador con los seis rombos del equipo, cuenta atrás del turno, probabilidad de victoria turno a turno y condiciones de campo.</>}
      >
        <Sample title="Placa de jugador" code="<BxScore team right>" col>
          <div className="grid w-[min(340px,100%)] gap-3">
            <BxScore name="Alex" handle="@rotomchef" rating={1607} av="AX" tag="tú" team={[chomp, flutter, bxMon("gholdengo"), hands]} />
            <BxScore right name="Kaito" handle="@kaito_vgc" rating={1689} av="KT" team={[bxMon("dragonite", { hp: 62 }), bxMon("miraidon"), koMon, bxMon("kingambit", { hp: 30 })]} />
          </div>
        </Sample>
        <Sample title="Temporizador de turno" code="<BxRing sec max>" note="Bajo 10 segundos el aro pasa a rojo y el número parpadea. Al agotarse, el simulador envía órdenes automáticas.">
          <RingDemo />
          <BxRing sec={7} max={45} />
        </Sample>
        <Sample title="Probabilidad de victoria" code="<BxSpark data>" col>
          <div className="w-[min(300px,100%)]">
            <BxSpark data={[50, 54, 47, 61, 58, 72, 66, 79]} />
          </div>
        </Sample>
        <Sample title="Condición de campo" code="<BxField name turns>">
          <BxField icon="sun" name="Sol" turns={3} tone="#f7d02c" />
          <BxField icon="shield" name="Trampa Rocas" tone="#b6a136" />
          <BxField icon="target" name="Polvo Ira" tone="#a6b91a" />
        </Sample>
      </Section>

      <Section
        id="bxregistro"
        kicker="Battlesim"
        title="Registro y equipo"
        lead={<>La telemetría del combate: líneas de registro con barra de tipo, sello de daño y eficacia; cabeceras de turno; y el hueco de equipo que comparten el Team Builder y la previa.</>}
      >
        <Sample title="Registro del combate" code="<BxTick ev>" col note="Cada acción hereda el color de su tipo en la barra izquierda; las líneas de sistema van en cursiva y las críticas se lavan en ámbar.">
          <div className="grid w-[min(420px,100%)] gap-[2px]">
            <BxTick ev={{ turn: 7 }} />
            <BxTick ev={{ who: "ally", type: "Ground", txt: "<b>Garchomp</b> usó Terremoto sobre Kingambit.", dmg: "−38%", eff: "super" }} />
            <BxTick ev={{ who: "foe", type: "Dragon", txt: "<b>Miraidon</b> usó Dracometeoro sobre Garchomp.", dmg: "−52%", crit: true }} />
            <BxTick ev={{ kind: "sys", txt: "¡Un golpe crítico!" }} />
            <BxTick ev={{ who: "foe", kind: "switch", txt: "Kaito envió a <b>Kingambit</b>." }} />
          </div>
        </Sample>
        <Sample title="Hueco de equipo" code="<BxSlot mon order>" col>
          <div className="grid w-[min(280px,100%)] gap-2">
            <BxSlot mon={DEX.garchomp} order={1} onClick={() => {}} />
            <BxSlot mon={null} onClick={() => {}} />
          </div>
        </Sample>
        <Sample title="Leyenda de atajos" code="<BxKbdHint k label>" note="Los atajos están siempre a un <code>?</code> de distancia; el tweak «Atajos visibles» oculta todas las pistas para pantallas limpias.">
          <BxKbdHint k="1–4" label="movimiento" />
          <BxKbdHint k="Tab" label="slot" />
          <BxKbdHint k="T" label="tera" />
          <BxKbdHint k="↵" label="ejecutar" />
        </Sample>
      </Section>

      <Section
        id="bxmenu"
        kicker="Battlesim"
        title="Menú de juego y constructor"
        lead={<>El rediseño «cliente en vivo»: la consola de juego del lobby y las piezas del Team Builder — píldoras de modo, botón de batalla, accesos rápidos, selector de equipo, cristal de teratipo, control de EVs y celdas de cobertura del análisis.</>}
      >
        <Sample title="Píldoras de modo" code=".bx-modepill" col note="Selector de modo de la consola del lobby: icono, etiqueta y coletilla en una sola línea alineada.">
          <div className="grid w-[min(440px,100%)] grid-cols-2 gap-2">
            <button type="button" className="flex min-w-0 items-center gap-[9px] border border-solid border-accent bg-accent-soft px-3 py-[11px] text-left text-txt cut-tag cut-tag-edge [--cut-line:var(--accent)] [--cut-tag:8px]">
              <Icon name="target" size={17} className="flex-none text-accent-bright" />
              <span className="grid min-w-0 gap-[2px]">
                <b className="font-display text-[12.5px]/none font-bold uppercase tracking-[0.03em]">Entrenamiento</b>
                <small className="truncate font-mono text-[9px]/[1.2] text-txt-dim">Contra la IA</small>
              </span>
            </button>
            <button type="button" className="flex min-w-0 items-center gap-[9px] border border-solid border-line bg-base px-3 py-[11px] text-left text-txt-muted transition-[color,border-color] hover:border-line-2 hover:text-txt cut-tag cut-tag-edge hover:[--cut-line:var(--line-2)] [--cut-line:var(--line)] [--cut-tag:8px]">
              <Icon name="sword" size={17} className="flex-none text-txt-dim" />
              <span className="grid min-w-0 gap-[2px]">
                <b className="font-display text-[12.5px]/none font-bold uppercase tracking-[0.03em]">Clasificatoria</b>
                <small className="truncate font-mono text-[9px]/[1.2] text-txt-dim">Emparejamiento PvP</small>
              </span>
            </button>
          </div>
        </Sample>
        <Sample title="Botón de batalla y accesos" code=".bx-gobtn · .bx-tile" col note="La acción primaria del lobby es un botón a todo lo ancho con el formato como subtítulo; los accesos llevan a Team Builder y Repeticiones.">
          <div className="grid w-[min(440px,100%)] gap-[10px]">
            <button type="button" className="relative flex w-full items-center justify-center gap-3 overflow-hidden border-0 bg-accent p-4 text-accent-ink transition-[background,transform] hover:-translate-y-px hover:bg-accent-bright cut-tag [--cut-tag:12px]">
              <Icon name="sword" size={22} />
              <b className="font-display text-[19px]/none font-extrabold italic uppercase tracking-[0.05em]">Batallar</b>
              <small className="font-mono text-[10px]/none font-semibold uppercase tracking-[0.08em] opacity-70">Dobles VGC</small>
            </button>
            <div className="grid grid-cols-2 gap-[10px]">
              {([["layers", "Team Builder", "2 equipos"], ["play", "Repeticiones", "6 guardadas"]] as const).map(([ic, tit, sub]) => (
                <button key={tit} type="button" className="grid min-w-0 justify-items-start gap-[5px] border border-solid border-line bg-panel px-4 py-[15px] text-left text-txt-muted transition-[color,border-color,transform] hover:-translate-y-[2px] hover:border-accent-line hover:text-txt cut-tag cut-tag-edge hover:[--cut-line:var(--accent-line)] [--cut-line:var(--line)] [--cut-tag:10px]">
                  <Icon name={ic} size={20} className="text-accent-bright" />
                  <b className="font-display text-[14px]/none font-bold uppercase tracking-[0.03em]">{tit}</b>
                  <small className="font-mono text-[10px]/[1.2] text-txt-dim">{sub}</small>
                </button>
              ))}
            </div>
          </div>
        </Sample>
        <Sample title="Cristal de teratipo" code=".bx-terachip" col note="Rejilla de los 18 tipos del editor de set; el seleccionado adopta el color canónico del tipo.">
          <div className="grid w-[min(340px,100%)] grid-cols-3 gap-[5px]">
            {TERA_TYPES.map((t) => {
              const on = t === "Steel"
              return (
                <button
                  key={t}
                  type="button"
                  style={{ ["--tyc" as string]: tyColor(t) }}
                  className={
                    "flex min-w-0 items-center gap-[5px] border border-solid px-[7px] py-[6px] font-mono text-[9.5px]/none font-semibold tracking-[0.02em] transition-[color,border-color,background] " +
                    (on
                      ? "border-[var(--tyc)] text-txt [background:color-mix(in_srgb,var(--tyc)_14%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--tyc)_45%,transparent)]"
                      : "border-line bg-base text-txt-muted hover:border-[color-mix(in_srgb,var(--tyc)_55%,var(--line))] hover:text-txt")
                  }
                >
                  <BxTera type={t} size=".82em" />
                  <span className="truncate">{TYPE_ES[t]}</span>
                </button>
              )
            })}
          </div>
        </Sample>
        <Sample title="Control de EVs" code=".bx-ev" col note="Reparto nivel 50 con tope de 508 puntos; el valor final se recalcula en vivo junto a cada barra.">
          <div className="grid w-[min(380px,100%)] gap-[5px]">
            {EV_ROWS.map(([k, base, ev]) => (
              <div key={k} className="grid grid-cols-[30px_26px_1fr_46px_30px] items-center gap-2">
                <span className={"font-mono text-[9px]/none font-semibold uppercase tracking-[0.06em] " + (ev > 0 ? "text-accent-bright" : "text-txt-dim")}>{STAT_ES[k]}</span>
                <span className="text-right font-mono text-[9.5px]/none text-txt-dim">{base}</span>
                <input className="h-1 w-full accent-accent" type="range" min={0} max={252} step={4} defaultValue={ev} readOnly aria-label={"EVs " + k} />
                <input className="w-full border border-solid border-line bg-base px-[5px] py-1 text-center font-mono text-[10px]/none text-txt focus:border-accent-line focus:outline-none" type="number" defaultValue={ev} readOnly aria-label={"EVs " + k + " número"} />
                <span className="text-right font-mono text-[12px]/none font-bold text-txt">{finalStat(base, k, { [k]: ev })}</span>
              </div>
            ))}
          </div>
        </Sample>
        <Sample
          title="Pestaña de sala"
          code="<BsimTab icon label sub tone onClose>"
          col
          note={
            <>
              Una sola pieza: chasis, etiqueta y cierre. Antes eran <b>dos</b> cajas con borde propio pegadas con <code>-ml-px</code>, así que
              una pestaña cerrable se leía como una pestaña con un botón enganchado al lado — y el estado seleccionado solo encendía la mitad
              izquierda, justo cuando más importaba. Ahora el chasis lleva el borde, el chaflán, el fondo y el hover, y las dos zonas de
              pulsación van transparentes dentro.
              <br />
              Siguen siendo <b>dos botones</b>, y eso no es negociable: un botón dentro de otro es HTML inválido e inalcanzable por teclado.
              Son hermanos, el cierre conserva su propio tabulador y su propio nombre accesible, y cada uno lleva anillo de foco{" "}
              <i>interior</i> — un contorno normal lo recortaría el chaflán. Sin <code>onClose</code> la pestaña no se puede cerrar, que es
              como se declaran las tres secciones fijas.
            </>
          }
        >
          <TabDemo />
        </Sample>

        <Sample
          title="Reparto de SP (Champions)"
          code="<TbSpBar stat currentSp nature base>"
          col
          note={
            <>
              Los formatos Champions no gastan EVs sino Puntos de Estadística: 32 por característica, 66 en total, en pasos de 1. Cada
              píldora es un punto y las píldoras <b>son</b> el control — clic, arrastre y teclado (flechas, Inicio/Fin, RePág/AvPág).
              <br />
              El contraste principal se gasta en tres estados: <b>tomado</b> (degradado de acento con su propio borde), <b>libre</b> (zócalo
              perfilado en <code>--line-2</code>) y <b>fuera de presupuesto</b> (zócalo apagado, perfilado en <code>--line</code>). El
              presupuesto es común a las tres filas, así que al gastar en una las píldoras libres de las otras pasan a estar fuera de alcance.
              <br />
              Encima de eso, y solo como nota al pie, la franja inferior marca un <b>salto</b>: con naturaleza potenciada (×110/100 truncado a
              16 bits) ese punto sube +2 en vez de +1, y conviene pararse justo ahí. Por eso Atq (Adamant) lleva marcas en el 10, el 20 y el 30
              mientras que Vel y AtE no llevan ninguna. La franja se ve igual esté el punto tomado o no, porque describe el paso y no el reparto.
              Los puntos que <i>no</i> suben nada (naturaleza reducida) no se marcan: bastan dos marcas distintas en una píldora de 8 px para
              que la barra deje de leerse, y eso ya lo dice la columna del valor final al no moverse.
            </>
          }
        >
          <SpBarDemo />
        </Sample>
        <Sample title="Celdas de cobertura" code=".bx-covcell" col note="Del panel de análisis: mejor eficacia ofensiva del equipo contra cada tipo defensor.">
          <div className="grid w-[min(440px,100%)] grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-1">
            {COVERAGE.map(([t, m]) => (
              <span
                key={t}
                style={{ ["--tyc" as string]: tyColor(t) }}
                className={
                  "flex min-w-0 items-center gap-[5px] border border-solid bg-base px-[7px] py-[5px] " +
                  (m >= 2 ? "border-[color-mix(in_srgb,var(--ok)_45%,transparent)] bg-ok-soft" : m < 1 ? "border-line opacity-80" : "border-line")
                }
              >
                <i className="h-[6px] w-[6px] flex-none bg-[var(--tyc)]" />
                <b className="min-w-0 flex-1 truncate font-body text-[9.5px]/none text-txt-muted">{TYPE_ES[t]}</b>
                <em className={"flex-none font-mono text-[10px]/none font-bold not-italic " + (m >= 2 ? "text-ok" : m < 1 ? "text-warn" : "text-txt-dim")}>{m >= 2 ? "2×" : m < 1 ? "½" : "1×"}</em>
              </span>
            ))}
          </div>
        </Sample>
      </Section>
    </>
  )
}
