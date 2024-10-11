"use client"

import React, { useState, useMemo } from "react"
import { useGetRotomQuests } from "./_hooks/useGetRotomQuests"
import { QuestData, IDialogue, INPC, ICategories, QuestStatus } from "./_types/questTypes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { getStatusStyles, QuestDetails, DialogItem } from "./_utils/questLogUtils"
import { Scroll, Book, MessageSquare, Search, MapPin, ListFilter } from "lucide-react"
import Fuse from 'fuse.js'

const statusOrder: { [key in QuestStatus]: number } = {
  [QuestStatus.ACTIVE]: 1,
  [QuestStatus.AVAILABLE]: 2,
  [QuestStatus.COMPLETED]: 3,
  [QuestStatus.FAILED]: 4,
  [QuestStatus.LOCKED]: 5,
}

export default function QuestLog() {
  const { quests, categories, dialogs, npcs } = useGetRotomQuests()
  const [selectedQuest, setSelectedQuest] = useState<QuestData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const fuse = useMemo(() => new Fuse(quests || [], {
    keys: ['name', 'logText'],
    threshold: 0.4,
  }), [quests])

  const filteredQuests = useMemo(() => {
    if (!searchTerm) return quests
    return fuse.search(searchTerm).map(result => result.item)
  }, [searchTerm, fuse, quests])

  const sortedQuests = useMemo(() => {
    return [...filteredQuests].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
  }, [filteredQuests])

  const filteredCategories = useMemo(() => {
    const result: ICategories = {}
    Object.entries(categories).forEach(([category, questIds]) => {
      const filteredIds = questIds.filter(id => 
        sortedQuests.some(quest => quest.id === id)
      )
      if (filteredIds.length > 0) {
        result[category] = filteredIds
      }
    })
    return result
  }, [categories, sortedQuests])

  if (!quests) return <div className="min-h-screen flex items-center justify-center bg-stone-900 text-amber-400">Cargando tu aventura...</div>

  return (
    <div className="quests w-full h-full bg-[url('/smartrotom/img/apps/misiones/fantasy-bg.jpg')] bg-cover bg-center flex items-center justify-center">
      <div className="w-full h-full bg-stone-900/90 overflow-hidden backdrop-blur-sm relative flex flex-col">
        <div className="relative z-10 flex-grow flex flex-col overflow-hidden p-4">
          <h1 className="text-5xl font-bold text-center mb-8 text-amber-400 font-rpg">Registro de Misiones</h1>
          <Tabs defaultValue="quests" className="flex-grow flex flex-col overflow-hidden">
            <TabsList className="flex w-full bg-stone-800 p-2 rounded-t-lg border-b-2 border-amber-500">
              <TabsTrigger 
                value="quests" 
                className="flex-1 py-2 px-4 rounded-t-lg data-[state=active]:bg-amber-500 data-[state=active]:text-stone-900 transition-all text-amber-400 font-rpg"
              >
                <Scroll className="w-5 h-5 mr-2 inline" />
                Misiones
              </TabsTrigger>
              <TabsTrigger 
                value="dialogs" 
                className="flex-1 py-2 px-4 rounded-t-lg data-[state=active]:bg-amber-500 data-[state=active]:text-stone-900 transition-all text-amber-400 font-rpg"
              >
                <MessageSquare className="w-5 h-5 mr-2 inline" />
                Diálogos
              </TabsTrigger>
            </TabsList>
            <div className="bg-stone-800/50 p-4 flex-grow flex flex-col overflow-hidden rounded-b-lg">
              <TabsContent value="dialogs" className="mb-4 overflow-auto flex-grow">
                <div className="space-y-4">
                  {dialogs.map((dialog) => (
                    <DialogItem key={dialog.id} dialog={dialog} npcs={npcs} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="quests" className="flex-grow flex flex-col overflow-hidden">
                <div className="mb-4 relative">
                  <Input
                    type="text"
                    placeholder="Buscar misiones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-stone-700 border-amber-500 text-stone-100 placeholder-stone-400"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-5 h-5" />
                </div>
                <div className="grid grid-cols-4 gap-6 flex-grow overflow-hidden">
                  <div className="col-span-1 bg-stone-800 rounded-lg p-4 overflow-auto">
                    <h2 className="text-xl font-bold text-amber-400 mb-4 font-rpg">Categorías</h2>
                    <ul className="space-y-2">
                      <li 
                        className={`cursor-pointer p-2 rounded-md transition-colors ${
                          selectedCategory === null ? 'bg-amber-500 text-stone-900' : 'text-stone-100 hover:bg-stone-700'
                        }`}
                        onClick={() => setSelectedCategory(null)}
                      >
                        <ListFilter className="w-4 h-4 inline mr-2" />
                        Todas
                      </li>
                      {Object.entries(filteredCategories).map(([category, questIds]) => (
                        <li 
                          key={category}
                          className={`cursor-pointer p-2 rounded-md transition-colors ${
                            selectedCategory === category ? 'bg-amber-500 text-stone-900' : 'text-stone-100 hover:bg-stone-700'
                          }`}
                          onClick={() => setSelectedCategory(category)}
                        >
                          <MapPin className="w-4 h-4 inline mr-2" />
                          {category}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="col-span-1 bg-stone-800 rounded-lg p-4 overflow-auto">
                    <h2 className="text-xl font-bold text-amber-400 mb-4 font-rpg">Misiones</h2>
                    <ul className="space-y-2">
                      {sortedQuests
                        .filter(quest => !selectedCategory || categories[selectedCategory].includes(quest.id))
                        .map((quest) => (
                          <li
                            key={quest.id}
                            className={`cursor-pointer p-2 rounded-md transition-colors ${
                              selectedQuest?.id === quest.id ? 'bg-amber-500 text-stone-900' : 'text-stone-100 hover:bg-stone-700'
                            }`}
                            onClick={() => setSelectedQuest(quest)}
                          >
                            <div className="flex items-center justify-between">
                              <span>{quest.name}</span>
                              <span className={`${getStatusStyles(quest.status)} text-xs px-2 py-1 rounded-full`}>
                                {quest.status}
                              </span>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div className="col-span-2 overflow-auto rounded-lg border-2 shadow-lg border-amber-500">
                    {selectedQuest ? (
                      <QuestDetails quest={selectedQuest} dialogs={dialogs} npcs={npcs} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-amber-400">
                        <Book className="w-16 h-16 mb-4" />
                        <p className="text-xl font-rpg">Selecciona una misión para ver sus detalles</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}