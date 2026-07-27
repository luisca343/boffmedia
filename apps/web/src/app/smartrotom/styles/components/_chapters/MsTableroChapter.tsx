"use client"

import * as React from "react"
import { QuestChain } from "@/app/smartrotom/misiones/_components/QuestChain"
import { QuestPaper } from "@/app/smartrotom/misiones/_components/QuestPaper"
import { RewardCard } from "@/app/smartrotom/misiones/_components/RewardCard"
import { SatchelSlot } from "@/app/smartrotom/misiones/_components/SatchelSlot"
import { TrackedQuestPaper } from "@/app/smartrotom/misiones/_components/TrackedQuestPaper"
import { Chip, SearchField, Select } from "@/app/smartrotom/misiones/_components/ui"
import { buildSatchel } from "@/app/smartrotom/misiones/_utils/items"
import { buildRegions } from "@/app/smartrotom/misiones/_utils/regions"
import { STATUS_LABEL } from "@/app/smartrotom/misiones/_utils/status"
import { Sample, Section } from "../showcase-shared"
import { MS_NPCS, MS_QUESTS } from "./ms-demo"

// Las piezas del tablón, con datos con la MISMA forma que devuelve la API de
// misiones — ni un campo de más: no hay xp, ni rareza, ni nivel de jugador que
// enseñar, porque el juego no los tiene.
const REGIONS = buildRegions(MS_QUESTS)
const [ACTIVE_QUEST, AVAILABLE_QUEST, COMPLETED_QUEST] = MS_QUESTS
const SATCHEL = buildSatchel(MS_QUESTS)

const npcOf = (quest: (typeof MS_QUESTS)[number]) => MS_NPCS.find((npc) => npc.dialogId === quest.dialogId)
const regionOf = (quest: (typeof MS_QUESTS)[number]) => REGIONS.find((region) => region.id === quest.category)

export function MsTableroChapter() {
  return (
    <>
      <Section
        id="ms-papeles"
        kicker="Misiones · ms-*"
        title="Papeles"
        lead="Un encargo es una hoja clavada al corcho. El sello dice en qué estado está, la chincheta dice si es tuya, y la estampa cae cuando se cierra."
      >
        <Sample
          app="ms"
          title="Papel de misión"
          code="<QuestPaper />"
          note="Donde el handoff imprimía XP y un «tipo» de misión, van los datos que sí existen: el sello, el nivel requerido y los sprites reales de la recompensa."
          grid
        >
          <QuestPaper quest={ACTIVE_QUEST} npc={npcOf(ACTIVE_QUEST)} region={regionOf(ACTIVE_QUEST)} onOpen={() => {}} />
          <QuestPaper
            quest={AVAILABLE_QUEST}
            npc={npcOf(AVAILABLE_QUEST)}
            region={regionOf(AVAILABLE_QUEST)}
            onOpen={() => {}}
          />
          <QuestPaper
            quest={COMPLETED_QUEST}
            npc={npcOf(COMPLETED_QUEST)}
            region={regionOf(COMPLETED_QUEST)}
            onOpen={() => {}}
          />
        </Sample>

        <Sample
          app="ms"
          title="Misión rastreada"
          code="<TrackedQuestPaper />"
          note="La pieza central del tablón. «Rastrear» es una elección local: el juego no guarda ninguna misión rastreada."
          col
        >
          <TrackedQuestPaper
            quest={ACTIVE_QUEST}
            npc={npcOf(ACTIVE_QUEST)}
            region={regionOf(ACTIVE_QUEST)}
            onOpen={() => {}}
          />
        </Sample>
      </Section>

      <Section
        id="ms-botin"
        kicker="Misiones · ms-*"
        title="Botín"
        lead="Una recompensa es un id de objeto y una cantidad. No hay rareza en la API, así que no hay estrellas, ni aro de color, ni brillo: sólo el sprite real del juego."
      >
        <Sample app="ms" title="Recompensa" code="<RewardCard />" grid>
          {(ACTIVE_QUEST.rewards ?? []).map((reward) => (
            <RewardCard key={reward.item} reward={reward} />
          ))}
        </Sample>
        <Sample app="ms" title="Hueco de mochila" code="<SatchelSlot />" note="Lo no obtenido guarda el misterio: gris y con una interrogación.">
          {SATCHEL.slice(0, 5).map((item) => (
            <div key={item.item} className="w-[96px]">
              <SatchelSlot item={item} />
            </div>
          ))}
        </Sample>
      </Section>

      <Section
        id="ms-cadena"
        kicker="Misiones · ms-*"
        title="Cadena"
        lead="La cuerda que ata un encargo con el siguiente. La cadena es real: el juego la guarda como quest.nextQuest hacia delante y requirements.requiredQuests hacia atrás."
      >
        <Sample app="ms" title="Cadena de misiones" code="<QuestChain />" col padded={false}>
          <div className="p-[26px]">
            <QuestChain quest={ACTIVE_QUEST} quests={MS_QUESTS} onSelect={() => {}} />
          </div>
        </Sample>
      </Section>

      <Section
        id="ms-superficie"
        kicker="Misiones · ms-*"
        title="Superficie"
        lead="El tablón no es un fondo plano: el filtro es pergamino con tinta encima, el corcho cuelga dentro de un marco de madera, y el rail lateral se separa del corcho con un realce — las tres cajas que envuelven al resto de piezas."
      >
        <Sample
          app="ms"
          title="Panel de filtros"
          code=".ms-filters"
          note="La misma caja que usa <BoardFilters />. Sus chips, su campo de búsqueda y su selector ya nacieron en tinta sobre pergamino (Controls.tsx); lo único que cambió fue la caja que los envuelve — antes madera oscura, ahora pergamino."
        >
          <div className="ms-filters flex w-full flex-wrap items-center gap-3">
            <SearchField className="max-w-[240px] flex-[1_1_200px]" placeholder="Buscar encargo…" aria-label="Buscar encargo" />
            <div className="flex flex-wrap gap-1.5">
              <Chip active>
                {STATUS_LABEL.ACTIVE} <span className="opacity-65">(2)</span>
              </Chip>
              <Chip>
                {STATUS_LABEL.AVAILABLE} <span className="opacity-65">(1)</span>
              </Chip>
              <Chip>
                {STATUS_LABEL.COMPLETED} <span className="opacity-65">(1)</span>
              </Chip>
            </div>
            <div className="flex-1" />
            <Select defaultValue="status" aria-label="Ordenar">
              <option value="status">Por estado</option>
              <option value="level">Por nivel</option>
            </Select>
          </div>
        </Sample>

        <Sample
          app="ms"
          title="Corcho enmarcado"
          code=".ms-board-frame > .ms-cork"
          note="El marco de madera envuelve el corcho — igual que en /smartrotom/misiones, donde antes el corcho colgaba sin borde."
          padded={false}
        >
          <div className="p-[26px]">
            <div className="ms-board-frame">
              <div className="ms-cork flex flex-wrap gap-6 p-6">
                <QuestPaper
                  quest={AVAILABLE_QUEST}
                  npc={npcOf(AVAILABLE_QUEST)}
                  region={regionOf(AVAILABLE_QUEST)}
                  onOpen={() => {}}
                />
                <QuestPaper
                  quest={COMPLETED_QUEST}
                  npc={npcOf(COMPLETED_QUEST)}
                  region={regionOf(COMPLETED_QUEST)}
                  onOpen={() => {}}
                />
              </div>
            </div>
          </div>
        </Sample>

        <Sample app="ms" title="Rail lateral — panel realzado" code=".ms-wood.ms-side-rail" note="La franja de navegación del tablón: el realce la separa del corcho, igual que un panel clavado sobre la madera.">
          <div className="ms-wood ms-side-rail flex h-[140px] w-[160px] flex-col items-center justify-center gap-1 border-r-[3px] border-[#050201] p-3 text-center font-ms-uppercase text-[10px] uppercase tracking-[.16em] text-ms-gold-1">
            El Tablón
          </div>
        </Sample>

        <Sample
          app="ms"
          canvas={false}
          title="Texturas del tablón"
          code="[data-surface] .ms-tavern::after"
          note="Un data-surface en un ancestro cambia la textura de .ms-tavern::after — madera (por defecto, sin atributo) es la que usa el rail real; las otras cuatro quedan a mano para variantes futuras."
        >
          <div className="grid w-full grid-cols-5 gap-3">
            {[
              { attr: undefined, label: "Madera" },
              { attr: "corcho", label: "Corcho" },
              { attr: "cuero", label: "Cuero" },
              { attr: "fieltro", label: "Fieltro" },
              { attr: "piedra", label: "Piedra" },
            ].map(({ attr, label }) => (
              <div key={label} data-surface={attr} className="text-center">
                <div className="ms-app ms-tavern h-20 w-full rounded-sm border border-black/40" />
                <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-wider text-sr-txt-muted">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </Sample>
      </Section>
    </>
  )
}
