"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { MONO_LABEL, Sample, Section, Swatches } from "../showcase-shared"

// El tablón es un sistema de MATERIALES antes que de colores: madera y corcho
// (el fondo), pergamino (la superficie), tinta (el texto), oro (el realce) y
// cera (el estado). Cada rampa existe para uno de esos materiales.
const BOARD = [
  ["bg-ms-board-1", "Corcho 1"],
  ["bg-ms-board-2", "Corcho 2"],
  ["bg-ms-board-3", "Corcho 3"],
  ["bg-ms-board-frame", "Marco"],
  ["bg-ms-board-frame-hi", "Marco claro"],
] as const

const PAPER = [
  ["bg-ms-paper-1", "Pergamino 1"],
  ["bg-ms-paper-2", "Pergamino 2"],
  ["bg-ms-paper-3", "Pergamino 3"],
  ["bg-ms-paper-edge", "Borde"],
] as const

const INK = [
  ["bg-ms-ink-1", "Tinta 1"],
  ["bg-ms-ink-2", "Tinta 2"],
  ["bg-ms-ink-3", "Tinta 3"],
  ["bg-ms-ink-4", "Tinta 4"],
] as const

const GOLD = [
  ["bg-ms-gold-1", "Oro 1"],
  ["bg-ms-gold-2", "Oro 2"],
  ["bg-ms-gold-3", "Oro 3"],
  ["bg-ms-gold-4", "Oro 4"],
] as const

// Los cinco sellos de cera. NUNCA se aplican como `bg-ms-seal-${status}`: se leen
// de un mapa de clases literales (SEAL_TEXT) o como `fill` de un SVG (SEAL_FILL).
const SEALS = [
  ["bg-ms-seal-active", "Vigente"],
  ["bg-ms-seal-available", "Disponible"],
  ["bg-ms-seal-completed", "Completada"],
  ["bg-ms-seal-failed", "Fallida"],
  ["bg-ms-seal-locked", "Sellada"],
] as const

export function MsBasesChapter() {
  return (
    <>
      <Section id="ms-color" kicker="Misiones · ms-*" title="Color" lead="Una sola paleta —«Pergamino»—, en modo oscuro siempre. Misiones ignora el selector de tema, como Pokédex y Arcade: el tablón de una taberna no tiene modo claro.">
        <Sample app="ms" title="Corcho y madera" code="bg-ms-board-*" canvas={false}>
          <Swatches tokens={BOARD} />
        </Sample>
        <Sample app="ms" title="Pergamino" code="bg-ms-paper-*" canvas={false}>
          <Swatches tokens={PAPER} />
        </Sample>
        <Sample app="ms" title="Tinta" code="text-ms-ink-*" canvas={false}>
          <Swatches tokens={INK} />
        </Sample>
        <Sample app="ms" title="Oro" code="text-ms-gold-*" canvas={false}>
          <Swatches tokens={GOLD} />
        </Sample>
        <Sample
          app="ms"
          title="Cera — el estado de un encargo"
          code="SEAL_FILL / SEAL_TEXT"
          note="El color del sello es dato, no clase: se aplica como fill de SVG o desde un mapa de clases literales. Un bg-ms-seal-${status} no compilaría nunca (§4)."
          canvas={false}
        >
          <Swatches tokens={SEALS} />
        </Sample>
      </Section>

      <Section id="ms-tipografia" kicker="Misiones · ms-*" title="Tipografía" lead="Cinco caras, todas con serifa o manuscritas: el tablón no tiene una sola letra de palo seco.">
        <Sample app="ms" title="Display · Cinzel Decorative" code="font-ms-display" col>
          <div className="font-ms-display text-[34px] leading-tight text-ms-ink-1">El Tablón</div>
          <div className={cn(MONO_LABEL, "text-ms-ink-3")}>Títulos, nombres de misión, cifras heráldicas</div>
        </Sample>
        <Sample app="ms" title="Cuerpo · EB Garamond" code="font-ms" col>
          <p className="max-w-[52ch] font-ms text-base leading-[1.7] text-ms-ink-1">
            Usa las Poké Ball que te dio el Prof. Oak para capturar a un Pokémon salvaje. Cruza al norte hacia la Ruta 1
            y debilita al objetivo antes de lanzar.
          </p>
          <div className={cn(MONO_LABEL, "text-ms-ink-3")}>Texto largo — el manuscrito</div>
        </Sample>
        <Sample app="ms" title="Versalitas · IM Fell English SC" code="font-ms-uppercase" col>
          <div className="font-ms-uppercase text-[13px] uppercase tracking-[.16em] text-ms-ink-2">
            Recompensa · Objetivos · Vigente
          </div>
          <div className={cn(MONO_LABEL, "text-ms-ink-3")}>Todas las etiquetas del sistema</div>
        </Sample>
        <Sample app="ms" title="Cifras · IM Fell DW Pica" code="font-ms-mono" col>
          <div className="font-ms-mono text-lg text-ms-ink-1">2/5 · ×3 · Nv. 12</div>
          <div className={cn(MONO_LABEL, "text-ms-ink-3")}>Progreso y cantidades</div>
        </Sample>
        <Sample app="ms" title="Mano · Patrick Hand" code="font-ms-hand" col>
          <div className="font-ms-hand text-lg text-ms-ink-1">¡No olvides la Súper Poción!</div>
          <div className={cn(MONO_LABEL, "text-ms-ink-3")}>Sólo las notas clavadas en el corcho</div>
        </Sample>
      </Section>

      <Section
        id="ms-materiales"
        kicker="Misiones · ms-*"
        title="Materiales"
        lead="Las texturas viven en tailwind.config como clases de componente, porque son degradados apilados y ruido SVG que Tailwind no sabe expresar. Todo lo demás son utilidades sobre JSX."
      >
        <Sample app="ms" title="Pergamino" code=".ms-paper" note="Grano por turbulencia + esquinas quemadas. Es la superficie de toda tarjeta.">
          <div className="ms-paper h-[120px] w-[220px]" />
          <div className="ms-paper ms-torn h-[120px] w-[220px]" />
        </Sample>
        <Sample app="ms" title="Corcho y madera" code=".ms-cork · .ms-wood" canvas={false}>
          <div className="ms-cork h-[120px] w-[220px]" />
          <div className="ms-wood h-[120px] w-[220px]" />
        </Sample>
        <Sample app="ms" title="Escritorio" code=".ms-desk" note="El fondo sobre el que se lee una carta abierta." canvas={false}>
          <div className="ms-desk h-[120px] w-full" />
        </Sample>
      </Section>
    </>
  )
}
