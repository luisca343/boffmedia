import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import axios from 'axios';
import { MisionesService } from './misiones.service';

enum QuestStatus {
  ACTIVE= "ACTIVE",
  COMPLETED= "COMPLETED",
  FAILED = "FAILED",
  AVAILABLE = "AVAILABLE",
  LOCKED = "LOCKED",
}

interface IDialogue {
  id: number;
  name: string;
  text: string;
  questId: number;
  requirements: IQuestRequirements;
}

interface IQuestCategory {
  quests: number[];
}

interface IQuestObjective {
  name: string;
  progress: number;
  total: number;
}

interface IQuestReward {
  item: string;
  count: number;
}

interface ScoreboardRequirements {
  scoreboardObjective: string;
  scoreboardType: string;
  scoreboardValue: number;
  
}

interface FactionRequirements {
  factionId: number;
  factionAvailable: string;
  factionStance: string;
}

interface IQuestRequirements {
  available: boolean;
  requiredQuests: number[];
  requiredDialogs: number[];
  requiredLevel: number;
  requiredTime: number;
  factionRequirements: FactionRequirements[];
  scoreboardRequirements: ScoreboardRequirements[];
}

export type QuestData = {
    id: number;
    name: string;
    logText: string;
    completeText: string;
    repeatable: boolean;
    type: number;
    nextQuest: number;
    category: string;
    status: QuestStatus;
    objectives: IQuestObjective[];
    requirements: IQuestRequirements;
    
    rewards: IQuestReward[];
}


@Controller('/smartrotom/misiones')
export class MisionesController {
  
    constructor(private readonly misionesService: MisionesService) {}

    private customNpcsData = null as {quests: QuestData[], dialogs: {[key: number]: IDialogue}, categories: {[key: string]: IQuestCategory}}
    private lastUpdate = 0

    

    @Get()
    async getAllQuests(@Query('force') force: number) {
      console.log("Fetching quests")
      console.log(force)
      if(this.customNpcsData && Date.now() - this.lastUpdate < 4 * 60 * 60 * 1000 && !force) {
        return this.customNpcsData
      }
      try{
        const patata = await axios.get('http://148.251.3.244:34370/quests')
        this.customNpcsData = patata.data 
        this.lastUpdate = Date.now()
        return patata.data
      } catch (e) {
        
      }
  
      return {error: "error"}
    }

    @Post()
    async getQuestsForUser(@Body() body: {uuid: string}) {
      const currentData = await this.getAllQuests(0)
      try{
        const userQuestData = await axios.post('http://148.251.3.244:34370/quests', body)
        const dialogsToLoad = []

        const questsData = Object.keys(currentData.quests).map(questId => {
          const savedQuest = currentData.quests[questId] as QuestData
          const userQuest = userQuestData.data.quests[questId]

          savedQuest.requirements.requiredDialogs.forEach(dialogId => {
            if(!dialogsToLoad.includes(dialogId)) {
              dialogsToLoad.push(dialogId)
            }
          })

          
          if(userQuest) {
            return {...savedQuest, ...userQuest}
          }

          return savedQuest
        })

        return {quests: questsData, dialogs: dialogsToLoad.map(dialogId => currentData.dialogs[dialogId]), categories: currentData.categories}
        /*
        const questsData = this.customNpcsData.quests.map(quest => {
          console.log("IN")
          const userQuest = userQuestData.data.quests[quest.id]
          if(userQuest) {
            return {...quest, ...userQuest}
          }
          return quest
        })*/

        console.log("OUT")
        return userQuestData.data
       
        
      } catch (e) {
        
      }
      return {quests:[
          {
              name: 'Mision 1',
              logText: 'TEST: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
              completeText: 'Completada la Misión 1',
              repeatable: false,
              type: 0,
              nextQuest: -1,
              category: 'Test #1',
              id: 2,
              status: 'ACTIVE',
              objectives: [],
              rewards: [],
              requirements: {
                requiredQuests: [],
                requiredDialogues: [],
                requiredLevel: 0,
                requiredTime: 0,
                factionRequirements: [],
                scoreboardRequirements: []


              }
          },
          {
              name: 'Arceus',
              logText: 'Ah pues vale',
              completeText: 'Hola,  esto es otra misión, tal y cual y eso y lo otro',
              repeatable: false,
              type: 5,
              nextQuest: -1,
              category: 'Test #1',
              id: 3,
              status: 'COMPLETED',
              objectives: [],
              rewards: [],
              requirements: {
                requiredQuests: [],
                requiredDialogues: [],
                requiredLevel: 0,
                requiredTime: 0,
                factionRequirements: [],
                scoreboardRequirements: []
              }
          },
          {
              name: 'La región de Teras',
              logText: '¡Bienvenido a la región de Teras! En esta región encontrarás cosas maravillosas, como Luiscaína, comunismo y a veces incluso Pokémon.',
              completeText: '*música de victoria de final fantasy por la puta cara*',
              repeatable: false,
              type: 0,
              nextQuest: 6,
              category: 'Historia',
              id: 5,
              status: 'NOT_STARTED',
              objectives: [],
              rewards: [],
              requirements: {
                requiredQuests: [],
                requiredDialogues: [],
                requiredLevel: 0,
                requiredTime: 0,
                factionRequirements: [],
                scoreboardRequirements: []
              }
          },
          {
              name: 'Mi primer compañero',
              logText: 'He recibido una carta del Profesor Ficus que me indicaba que fuera a su laboratorio para recoger a mi primer Pokémon... Espero que no sea una maldita pera...',
              completeText: 'Era una puta pera...',
              repeatable: false,
              type: 5,
              nextQuest: -1,
              category: 'Historia',
              id: 6,
              status: 'LOCKED',
              objectives: [],
              rewards: [],
              requirements: {
                requiredQuests: [5],
                requiredDialogues: [],
                requiredLevel: 0,
                requiredTime: 0,
                factionRequirements: [],
                scoreboardRequirements: []
              }
          }
      ] , dialogs: [], categories: []
    }
    }
  

}
