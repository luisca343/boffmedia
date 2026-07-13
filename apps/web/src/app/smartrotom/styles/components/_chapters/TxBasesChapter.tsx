"use client"

import * as React from "react"
import { MONO_LABEL, Sample, Section, Swatches } from "../showcase-shared"

// Constant across themes — the blue ramp encodes STRUCTURE (pins, the player, the route
// beam), so it must read the same whether the canvas is dark or light.
const BLUE = [
  ["bg-tx-blue-300", "300"],
  ["bg-tx-blue-400", "400"],
  ["bg-tx-blue-500", "500"],
  ["bg-tx-blue-600", "600"],
  ["bg-tx-blue-700", "700"],
  ["bg-tx-blue-ink", "Ink"],
] as const

const SURFACES = [
  ["bg-tx-bg", "Fondo"],
  ["bg-tx-bg-1", "Fondo 1"],
  ["bg-tx-field", "Mapa"],
  ["bg-tx-surface", "Superficie"],
  ["bg-tx-surface-2", "Superficie 2"],
  ["bg-tx-surface-solid", "Sólida"],
  ["bg-tx-surface-raise", "Elevada"],
  ["bg-tx-line", "Línea"],
  ["bg-tx-line-2", "Línea 2"],
] as const

const INK = [
  ["bg-tx-txt", "Texto"],
  ["bg-tx-txt-2", "Atenuado"],
  ["bg-tx-txt-3", "Sutil"],
] as const

const MONEY = [
  ["bg-tx-accent", "Acento"],
  ["bg-tx-accent-deep", "Acento hondo"],
  ["bg-tx-accent-soft", "Acento suave"],
  ["bg-tx-money", "Dinero"],
  ["bg-tx-on-accent", "Sobre acento"],
] as const

const STATUS = [
  ["bg-tx-ok", "OK"],
  ["bg-tx-ok-soft", "OK suave"],
  ["bg-tx-no", "Error"],
  ["bg-tx-no-soft", "Error suave"],
] as const

const RADII = [
  ["rounded-tx-xs", "xs · 8px"],
  ["rounded-tx-sm", "sm · 11px"],
  ["rounded-tx-md", "md · 14px"],
  ["rounded-tx-lg", "lg · 18px"],
  ["rounded-tx-xl", "xl · 24px"],
  ["rounded-tx-pill", "pill"],
] as const

export function TxBasesChapter() {
  return (
    <>
      <Section
        id="tx-color"
        kicker="Taxi · tx-*"
        title="Azul estructura, ámbar dinero"
        lead={
          <>
            La regla que gobierna todo el sistema: el <b>azul</b> es estructura (la chincheta, el jugador, la
            ruta, un filtro) y el <b>ámbar</b> es dinero. Por eso sólo hay <b>un</b> botón ámbar por pantalla —
            el que cobra. Un segundo ámbar se lee como un segundo cargo.
          </>
        }
      >
        <Sample
          title="Azul estructural"
          code="bg-tx-blue-*"
          app="tx"
          canvas={false}
          note={
            <>
              Idéntico en claro y oscuro: si el azul cambiara al invertir el lienzo, una chincheta significaría
              cosas distintas según el tema.
            </>
          }
        >
          <Swatches tokens={BLUE} />
        </Sample>

        <Sample
          title="Dinero"
          code="bg-tx-accent · bg-tx-money"
          app="tx"
          canvas={false}
          note={
            <>
              <code>--tx-accent</code> es un triplete RGB, así que <code>accent-soft</code>, <code>accent-glow</code>{" "}
              y <code>accent-deep</code> se derivan de él. En claro, el ámbar sobre blanco no pasa contraste:{" "}
              <code>tx-money</code> baja a ámbar quemado, mientras el acento sigue brillando como <i>relleno</i>.
            </>
          }
        >
          <Swatches tokens={MONEY} />
        </Sample>

        <Sample title="Superficies · oscuro" code='.tx-app' app="tx" theme="dark" canvas={false}>
          <Swatches tokens={SURFACES} />
        </Sample>
        <Sample title="Superficies · claro" code='.tx-app[data-theme="light"]' app="tx" theme="light" canvas={false}>
          <Swatches tokens={SURFACES} />
        </Sample>

        <Sample title="Tinta" code="bg-tx-txt-*" app="tx" canvas={false}>
          <Swatches tokens={INK} />
        </Sample>
        <Sample
          title="Estado"
          code="bg-tx-ok · bg-tx-no"
          app="tx"
          canvas={false}
          note="El color nunca va solo: una tarifa que no puedes pagar es roja Y mantiene su cifra; un movimiento lleva su signo (§11)."
        >
          <Swatches tokens={STATUS} />
        </Sample>
      </Section>

      <Section
        id="tx-tipografia"
        kicker="Tipografía"
        title="Tres familias, una regla"
        lead={
          <>
            Plus Jakarta Sans para la interfaz, Orbitron sólo para la marca, y JetBrains Mono para{" "}
            <b>toda cifra</b> — tarifas, coordenadas, distancias. Las tres se sirven en local (§5).
          </>
        }
      >
        <Sample title="Familias" code="font-tx · font-tx-display · font-tx-mono" app="tx" col>
          <div className="font-tx-display text-2xl font-bold tracking-[0.6px] text-tx-txt">SmartRotom</div>
          <div className={MONO_LABEL}>font-tx-display · Orbitron · sólo la marca</div>

          <div className="mt-4 font-tx text-lg font-extrabold text-tx-txt">Viaje en grupo · 3 pasajeros</div>
          <div className="font-tx text-sm text-tx-txt-2">
            Plus Jakarta Sans lleva el peso de la interfaz: 400 a 800, variable.
          </div>
          <div className={MONO_LABEL}>font-tx · Plus Jakarta Sans</div>

          <div className="mt-4 font-tx-mono text-xl font-extrabold text-tx-money">2.956 ¥</div>
          <div className="font-tx-mono text-sm font-bold text-tx-txt-2">−1.482 ¥ · 2.764 b · 1840, −2210</div>
          <div className={MONO_LABEL}>font-tx-mono · JetBrains Mono</div>
        </Sample>

        <Sample
          title="Numerales tabulares"
          code="font-variant-numeric: tabular-nums"
          app="tx"
          col
          note={
            <>
              Está activado en la raíz <code>.tx-app</code>, no componente a componente: en una lista de tarifas
              las columnas tienen que cuadrar, y una cifra proporcional las desalinea.
            </>
          }
        >
          <div className="flex flex-col gap-1 font-tx-mono text-sm font-bold text-tx-txt">
            <span>1.111 ¥</span>
            <span>2.956 ¥</span>
            <span>11.482 ¥</span>
          </div>
        </Sample>
      </Section>

      <Section
        id="tx-geometria"
        kicker="Geometría"
        title="Radios"
        lead={
          <>
            El taxi es un sistema de radios, no de cortes: nada usa <code>cut</code> ni <code>cut-corner</code>{" "}
            (§7). Una chincheta y una píldora son redondas porque el mapa es un objeto blando.
          </>
        }
      >
        <Sample title="Escala" code="rounded-tx-*" app="tx" grid>
          {RADII.map(([cls, name]) => (
            <div key={cls} className="flex items-center gap-3">
              <i className={`block h-14 w-14 border border-solid border-tx-line-2 bg-tx-surface-2 ${cls}`} />
              <span className={MONO_LABEL}>{name}</span>
            </div>
          ))}
        </Sample>

        <Sample title="Elevación" code="shadow-tx-1 · shadow-tx-2 · shadow-tx-glow" app="tx">
          <div className="grid h-20 w-32 place-items-center rounded-tx-md bg-tx-surface-solid shadow-tx-1 text-xs font-bold text-tx-txt">
            shadow-tx-1
          </div>
          <div className="grid h-20 w-32 place-items-center rounded-tx-md bg-tx-surface-solid shadow-tx-2 text-xs font-bold text-tx-txt">
            shadow-tx-2
          </div>
          <div className="grid h-20 w-32 place-items-center rounded-tx-md bg-tx-accent shadow-tx-glow text-xs font-extrabold text-tx-on-accent">
            shadow-tx-glow
          </div>
        </Sample>
      </Section>
    </>
  )
}
