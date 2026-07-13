"use client"

import * as React from "react"
import { QuestChain } from "@/app/smartrotom/misiones/_components/QuestChain"
import { QuestPaper } from "@/app/smartrotom/misiones/_components/QuestPaper"
import { RewardCard } from "@/app/smartrotom/misiones/_components/RewardCard"
import { SatchelSlot } from "@/app/smartrotom/misiones/_components/SatchelSlot"
import { TrackedQuestPaper } from "@/app/smartrotom/misiones/_components/TrackedQuestPaper"
import { buildSatchel } from "@/app/smartrotom/misiones/_utils/items"
import { buildRegions } from "@/app/smartrotom/misiones/_utils/regions"
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
    </>
  )
}
