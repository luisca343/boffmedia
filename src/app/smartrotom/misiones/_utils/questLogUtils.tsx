import React from 'react'
import { QuestData, IDialogue, IQuestObjective, IQuestReward, QuestStatus, INPC } from "../_types/questTypes"
import { Progress } from "@/components/ui/progress"
import { Scroll, Target, Gift, MapPin, User } from 'lucide-react'
import NpcSkin from "@/components/smartrotom/MinecraftSkin"
import { ItemSprite } from "../../pokedex/_components/PokemonSprite"

export function getStatusStyles(status: QuestStatus) {
  switch (status) {
    case QuestStatus.ACTIVE:
      return "bg-emerald-700 text-emerald-100"
    case QuestStatus.COMPLETED:
      return "bg-blue-700 text-blue-100"
    case QuestStatus.FAILED:
      return "bg-red-700 text-red-100"
    case QuestStatus.AVAILABLE:
      return "bg-yellow-700 text-yellow-100"
    case QuestStatus.LOCKED:
      return "bg-surface-3 text-text-primary"
  }
}

export function getSkin(npcs: INPC[], dialogId: number) {
  const npc = npcs?.find(npc => npc.dialogId === dialogId)
  return npc ? npc.skin : "steve"
}

export function getNPCName(npcs: INPC[], dialogId: number) {
  const npc = npcs.find(npc => npc.dialogId === dialogId)
  return npc ? npc.name : "Steve"
}

export function QuestDetails({ quest, dialogs, npcs }: { quest: QuestData; dialogs: IDialogue[]; npcs: INPC[] }) {
  return (
    <div className="bg-stone-800 text-stone-100 p-6 min-h-full w-full">
        <div className='flex justify-between'>
            <h2 className="text-3xl font-bold text-amber-400 mb-4 font-rpg">{quest.name}</h2>
            <div className="flex items-center justify-start mb-4 space-x-2">
                <span className={`${getStatusStyles(quest.status)} px-3 py-1 rounded-full text-sm font-bold`}>
                {quest.status}
                </span>
                {quest.repeatable && (
                <span className="bg-purple-700 text-purple-100 px-3 py-1 rounded-full text-sm font-bold">
                    Repetible
                </span>
                )}
            </div>
        </div>
      <div className="mb-6">
        <h3 className="flex items-center text-xl font-bold text-amber-400 mb-2">
          <Scroll className="w-5 h-5 mr-2" />
          Descripción
        </h3>
        <p className="text-stone-300">{quest.logText}</p>
      </div>
      {quest.objectives && quest.objectives.length > 0 && (
        <div className="mb-6">
          <h3 className="flex items-center text-xl font-bold text-amber-400 mb-2">
            <Target className="w-5 h-5 mr-2" />
            Objetivos
          </h3>
          <ul className="space-y-4">
            {quest.objectives.map((objective: IQuestObjective) => (
              <li key={objective.name} className="bg-stone-700 p-4 rounded-lg flex items-center">
                <div className="mr-4">
                  <ItemSprite name={objective.name.split(":")[0].toLowerCase().replace(" ", "_")} />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-stone-100">{objective.name}</span>
                    <span className="text-stone-400">
                      {objective.progress} / {objective.total}
                    </span>
                  </div>
                  <Progress value={(objective.progress / objective.total) * 100} className="h-2 bg-stone-600" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {quest.rewards && quest.rewards.length > 0 && (
        <div>
          <h3 className="flex items-center text-xl font-bold text-amber-400 mb-2">
            <Gift className="w-5 h-5 mr-2" />
            Recompensas
          </h3>
          <ul className="grid grid-cols-2 gap-4">
            {quest.rewards.map((reward: IQuestReward) => (
              <li key={reward.item} className="bg-stone-700 p-4 rounded-lg flex items-center space-x-3">
                <div className="bg-stone-600 p-2 rounded-full">
                  <ItemSprite name={reward.item.split(":")[1]} />
                </div>
                <div>
                  <p className="font-bold text-stone-100">
                    {reward.item.split(":")[1].split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </p>
                  <p className="text-sm text-stone-400">Cantidad: {reward.count}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function DialogItem({ dialog, npcs }: { dialog: IDialogue; npcs: INPC[] }) {
  return (
    <div className="bg-stone-800 text-stone-100 p-4 rounded-lg border-2 border-amber-500 shadow-lg mb-4">
      <h3 className="flex items-center text-xl font-bold text-amber-400 mb-2">
        <MapPin className="w-5 h-5 mr-2" />
        {dialog.name}
      </h3>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <React.Suspense fallback={<div className="w-16 h-16 bg-stone-700 rounded-full animate-pulse"></div>}>
            <NpcSkin npcName={getSkin(npcs, dialog.id)} />
          </React.Suspense>
        </div>
        <div>
          <p className="font-bold text-amber-400 mb-1">{getNPCName(npcs, dialog.id)}</p>
          <p className="text-stone-300">{dialog.text}</p>
        </div>
      </div>
    </div>
  )
}