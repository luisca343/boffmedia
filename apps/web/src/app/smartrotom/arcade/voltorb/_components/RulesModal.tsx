"use client"

import type { ReactNode } from "react"
import { Button, Icon, Modal } from "../../_components/ui"

interface RulesModalProps {
  isOpen: boolean
  onClose: () => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5 last:mb-0">
      <h3 className="mb-2 font-ar-display text-[11px] uppercase tracking-[0.12em] text-ar-amber">
        {title}
      </h3>
      {children}
    </section>
  )
}

const LIST = "ml-4 list-disc space-y-1.5 marker:text-ar-cyan"

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      tone="cyan"
      kicker="Cómo se juega"
      title="REGLAS DE GIRA VOLTORB"
      footer={
        <Button variant="cyan" size="sm" icon={<Icon.Joystick s={12} />} onClick={onClose}>
          Entendido
        </Button>
      }
    >
      <Section title="Introducción">
        <p>
          Gira Voltorb es una mezcla entre Picross y Buscaminas. Tu objetivo es encontrar las cartas
          multiplicadoras sin voltear ningún Voltorb.
        </p>
      </Section>

      <Section title="El tablero">
        <ul className={LIST}>
          <li>El juego se desarrolla en una cuadrícula de 5x5.</li>
          <li>Bajo cada casilla se esconde un número (1, 2 o 3) o un Voltorb.</li>
          <li>Los números son multiplicadores que aumentan tus monedas.</li>
          <li>Los Voltorb hacen que pierdas todas las monedas de la ronda actual.</li>
        </ul>
      </Section>

      <Section title="Cómo jugar">
        <ol className="ml-4 list-decimal space-y-1.5 marker:font-ar-mono marker:text-ar-cyan">
          <li>Haz clic en una casilla para voltearla.</li>
          <li>Si encuentras un multiplicador (x2 o x3), tus monedas se multiplican por ese valor.</li>
          <li>Si es la primera carta que volteas, obtienes ese número de monedas.</li>
          <li>Si encuentras un Voltorb, pierdes todas las monedas de la ronda y el juego termina.</li>
          <li>
            Puedes elegir Cobrar en cualquier momento para guardar tus monedas y pasar al siguiente
            nivel.
          </li>
        </ol>
      </Section>

      <Section title="Niveles y progresión">
        <ul className={LIST}>
          <li>Hay 8 niveles en total.</li>
          <li>Ganas y avanzas de nivel encontrando todas las cartas x2 y x3.</li>
          <li>
            Los niveles más altos tienen más multiplicadores y Voltorbs, aumentando el riesgo y la
            recompensa.
          </li>
          <li>
            <b className="text-ar-ink">Regla de regresión de nivel:</b>
            <ul className="ml-4 mt-1.5 list-disc space-y-1.5 marker:text-ar-magenta-2">
              <li>Todas las cartas con números (x1, x2, x3) cuentan como cartas multiplicadoras.</li>
              <li>
                Si al terminar la ronda (ya sea por encontrar un Voltorb o por elegir Cobrar) has
                volteado menos cartas multiplicadoras que el número de tu nivel actual, bajarás de
                nivel.
              </li>
              <li>El nuevo nivel será igual al número de cartas multiplicadoras que hayas volteado.</li>
              <li>
                Ejemplo: Si estás en el nivel 5 y volteas solo 3 cartas multiplicadoras (incluyendo
                x1) antes de que termine la ronda, bajarás al nivel 3 para la siguiente ronda.
              </li>
            </ul>
          </li>
        </ul>
      </Section>

      <Section title="Nivel 8">
        <p>
          Para alcanzar el nivel 8, debes ganar 5 juegos seguidos en cualquier nivel, volteando 8 o
          más cartas multiplicadoras en cada uno de estos 5 juegos.
        </p>
      </Section>

      <Section title="Modo memo">
        <p>
          Puedes usar el modo Memo para marcar las casillas con símbolos (Voltorb, 1, 2 o 3) sin
          voltearlas. Esto te ayuda a recordar tus sospechas sobre el contenido de cada casilla.
        </p>
      </Section>

      <Section title="Consejos">
        <ul className={LIST}>
          <li>
            Usa la información de las filas y columnas para deducir la ubicación de los
            multiplicadores y Voltorbs.
          </li>
          <li>A veces es mejor cobrar y pasar al siguiente nivel que arriesgarse a perder todo.</li>
          <li>Utiliza el modo Memo para marcar tus sospechas y estrategias.</li>
          <li>Practica y desarrolla tu intuición para mejorar en el juego.</li>
        </ul>
      </Section>
    </Modal>
  )
}
