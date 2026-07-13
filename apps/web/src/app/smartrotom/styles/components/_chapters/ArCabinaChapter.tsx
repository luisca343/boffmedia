"use client"

import * as React from "react"
import { CabinetCard } from "@/app/smartrotom/arcade/_components/CabinetCard"
import {
  Button,
  ClaimCelebration,
  CoinCounter,
  Icon,
  Panel,
  PixelArt,
  Tag,
} from "@/app/smartrotom/arcade/_components/ui"
import { GAMES } from "@/app/smartrotom/arcade/_data/games"
import { RARITY, RARITY_ORDER } from "@/app/smartrotom/arcade/_utils/rarity"
import { Sample, Section } from "../showcase-shared"

function CelebrationDemo() {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button variant="amber" icon={<Icon.Sparkle s={14} />} onClick={() => setOpen(true)}>
        Ver el momento
      </Button>
      {open && (
        <ClaimCelebration
          reward={{ name: "Caja de Entrenador", rarity: "legendary", amount: null, art: "◈" }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

export function ArCabinaChapter() {
  return (
    <>
      <Section
        id="ar-rarezas"
        kicker="Arcade"
        title="Rarezas"
        lead="La escalera de rareza es un conjunto de color guiado por datos, así que vive como un mapa JS (`_utils/rarity.ts`) y se aplica en línea — nunca como una clase interpolada (`bg-` + la rareza), que la JIT de Tailwind no vería nunca."
      >
        <Sample
          title="Escalera"
          code="RARITY · raritySkin(r)"
          app="ar"
          note="La API sólo llega hasta `legendary`: las cinco primeras son reales, `mythic` es de diseño y ninguna tabla de botín puede producirla. La rareza de un objeto de caja no viene dada — se deriva de su `weight`, porque la probabilidad ES la rareza."
        >
          {RARITY_ORDER.map((r) => {
            const skin = RARITY[r]
            return (
              <div
                key={r}
                className="grid h-[92px] w-[92px] place-items-center rounded-xl text-center"
                style={{
                  background: `linear-gradient(180deg, ${skin.bg}, rgba(0,0,0,0.4))`,
                  border: `1px solid ${skin.bd}`,
                  boxShadow: `inset 0 0 22px ${skin.bd}`,
                }}
              >
                <span className="font-ar-display text-[18px]" style={{ color: skin.fg }}>
                  ◈
                </span>
                <span
                  className="font-ar-mono text-[9px] uppercase tracking-[0.12em]"
                  style={{ color: skin.fg }}
                >
                  {skin.name}
                </span>
              </div>
            )
          })}
        </Sample>
      </Section>

      <Section
        id="ar-cabinas"
        kicker="Arcade"
        title="Cabinas"
        lead="Un juego se dibuja como una máquina recreativa: la marquesina encima, un CRT con el sprite en medio, el panel de control debajo. Al pasar por encima la máquina se enciende —el sprite flota y brilla, el título desalinea sus cañones, «INSERT COIN» parpadea—."
      >
        <Sample
          title="Tarjeta cabina"
          code="<CabinetCard game />"
          app="ar"
          note="El acento del juego tiñe la marquesina, el resplandor del CRT, el brillo del sprite y la flecha de JUGAR. Todo mapa de clases literal: cinco acentos, cinco entradas."
          grid
        >
          {GAMES.slice(0, 2).map((game) => (
            <CabinetCard key={game.id} game={game} />
          ))}
        </Sample>

        <Sample
          title="Sprites"
          code="<PixelArt sprite scale />"
          app="ar"
          note="Arte original de 16×16, un carácter por píxel y una leyenda de color. Todas las filas deben medir lo mismo: `PixelArt` dimensiona la rejilla a partir de la fila 0, así que una fila corta descuadra el sprite en silencio."
        >
          {GAMES.map((game) => (
            <PixelArt key={game.id} sprite={game.art} scale={4} />
          ))}
        </Sample>
      </Section>

      <Section
        id="ar-recompensa"
        kicker="Arcade"
        title="Recompensa"
        lead="El momento al que apunta todo lo demás. La tarjeta entra con un pop, un anillo de choque sale de ella, dieciséis partículas se abren en círculo y la cifra sube contando. Con el movimiento reducido, todo eso desaparece y queda la tarjeta."
      >
        <Sample
          title="Celebración"
          code="<ClaimCelebration reward onClose />"
          app="ar"
          note="Se renderiza en línea, no en un portal: un portal saldría de `.ar-app` y las variables CSS dejarían de resolver (SMARTROTOM_V3.md §2). La capa fija cubre igual toda la ventana."
        >
          <CelebrationDemo />
        </Sample>

        <Sample title="Día de racha" code="Panel + Tag + ItemImage" app="ar">
          <Panel tone="cyan" tight className="w-[200px] text-center">
            <div className="font-ar-display text-[8px] uppercase tracking-[0.18em] text-ar-cyan">Día 04</div>
            <div className="mx-auto my-2 grid h-[60px] w-[60px] place-items-center rounded-xl border border-ar-cyan/40 bg-ar-cyan/10 font-ar-display text-[20px] text-ar-cyan motion-reduce:animate-none animate-ar-float">
              ★
            </div>
            <div className="font-ar-mono text-[10px] text-ar-ink">500 monedas</div>
          </Panel>
          <Panel tone="deep" tight className="w-[200px] text-center opacity-70">
            <div className="font-ar-display text-[8px] uppercase tracking-[0.18em] text-ar-ink-muted">Día 02</div>
            <div className="mx-auto my-2 grid h-[60px] w-[60px] place-items-center rounded-xl border border-white/10 font-ar-display text-[20px] text-ar-lime">
              ✓
            </div>
            <div className="font-ar-mono text-[10px] text-ar-ink-dim">Reclamado</div>
          </Panel>
        </Sample>
      </Section>

      <Section
        id="ar-diferido"
        kicker="Arcade"
        title="Diferido"
        lead="Lo que el handoff dibuja y la API no puede sostener. Está construido y vive aquí, pero ninguna pantalla lo monta: pintar estos números sería inventárselos (SMARTROTOM_V3.md §9). El catálogo completo está en docs/smartrotom/deferred/arcade.md."
      >
        <Sample
          title="Contador de monedas"
          code="<CoinCounter value />"
          app="ar"
          note="El arcade no tiene saldo. `rotom_inventory` guarda objetos, y las recompensas diarias de tipo `coins`/`money` no se persisten nunca — ningún endpoint sabe responder «cuántas estrellas tengo». Espera un endpoint de saldo."
        >
          <CoinCounter value={1284} />
          <Tag tone="ghost">Sin endpoint de saldo</Tag>
        </Sample>

        <Sample
          title="Sin nivel, sin XP, sin misiones, sin temporada"
          code="—"
          app="ar"
          note="El HUD del handoff lleva nivel, XP y multiplicador diario; el menú lleva Misiones y Temporada. No existe ninguna tabla, columna ni endpoint para nada de eso, así que el HUD muestra la racha real y esas dos rutas no se han creado."
        >
          <Tag tone="ghost">Nivel / XP</Tag>
          <Tag tone="ghost">Multiplicador diario</Tag>
          <Tag tone="ghost">Congelaciones de racha</Tag>
          <Tag tone="ghost">Partidas jugadas</Tag>
          <Tag tone="ghost">Misiones</Tag>
          <Tag tone="ghost">Temporada / pase</Tag>
        </Sample>
      </Section>
    </>
  )
}
