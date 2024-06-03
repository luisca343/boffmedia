import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import axios from 'axios';
import { MisionesService } from './misiones.service';
import e from 'express';

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
    dialogId: number;
    
    rewards: IQuestReward[];
}


@Controller('/smartrotom/misiones')
export class MisionesController {
    constructor(private readonly misionesService: MisionesService) {}

    private quests = null as QuestData[]
    private dialogs = null as IDialogue[]
    private categories = null as IQuestCategory[]
    private npcs = null as {name: string, dialogId: number, skin: string}[]
    
    private lastUpdate = 0

    

    @Get()
    async getAllQuests(@Query('force') force: number) {
        if(!this.npcs){
          const newNPCs = await axios.get('http://148.251.3.244:34370/updateNPCs')
          this.npcs = newNPCs.data.npcs
          this.npcs[0] = {name: "Rotom", dialogId: 0, skin: "rotom"}
        } 
        if(!this.quests && !force) return this.getAllQuests(1)
        if(this.quests && Date.now() - this.lastUpdate < 4 * 60 * 60 * 1000 && !force) {
            return {quests: this.quests, dialogs: this.dialogs, categories: this.categories, npcs: this.npcs}
        }
        try{
            const patata = await axios.get('http://148.251.3.244:34370/quests')
            const data = patata.data
            this.quests = data.quests
            this.dialogs = data.dialogs
            this.categories = data.categories

            this.lastUpdate = Date.now()
            return patata.data
        } catch (e) {
            
        }
  
        return {error: "error"}
    }

    @Post("npcs")
    async updateNPCs(@Body() body: {npcs: any}) {
        this.npcs = body.npcs

      return {status: "ok"}
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

          if(!dialogsToLoad.includes(userQuest.dialogId)) {
            dialogsToLoad.push(userQuest.dialogId)
          }
          

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

        return {
            quests: questsData, 
            dialogs: dialogsToLoad.map(dialogId => currentData.dialogs[dialogId]), 
            categories: currentData.categories,
            npcs: this.npcs
        
        }
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
      return {
        "quests": [
            {
                "name": "Mision 1",
                "logText": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                "completeText": "Completada la Misión 1",
                "repeatable": true,
                "type": 0,
                "nextQuest": -1,
                "category": "Test #1",
                "requirements": {
                    "available": false,
                    "requiredQuests": [],
                    "requiredDialogs": [],
                    "requiredLevel": 0,
                    "requiredTime": 0,
                    "factionRequirements": [],
                    "scoreboardRequirements": []
                },
                "id": 2,
                "status": "ACTIVE",
                "objectives": [
                    {
                        "name": "Gold Ingot: 0/64",
                        "progress": 0,
                        "total": 64
                    },
                    {
                        "name": "Bone: 0/2",
                        "progress": 0,
                        "total": 2
                    },
                    {
                        "name": "Rare Candy: 0/8",
                        "progress": 0,
                        "total": 8
                    }
                ],
                "rewards": [
                    {
                        "item": "teras:smartrotom",
                        "count": 1
                    }
                ]
            },
            {
                "name": "Arceus",
                "logText": "La Liga Comunista, una organización obrera internacional, que en las circunstancias de la época -huelga decirlo- sólo podía ser secreta, encargó a los abajo firmantes, en el congreso celebrado en Londres en noviembre de 1847, la redacción de un detallado programa teórico y práctico, destinado a la publicidad, que sirviese de programa del partido.  Así nació el Manifiesto, que se reproduce a continuación y cuyo original se remitió a Londres para ser impreso pocas semanas antes de estallar la revolución de febrero.  Publicado primeramente en alemán, ha sido reeditado doce veces por los menos en ese idioma en Alemania, Inglaterra y Norteamérica.  La edición inglesa no vio la luz hasta 1850, y se publicó en el Red Republican de Londres, traducido por miss Elena Macfarlane, y en 1871 se editaron en Norteamérica no menos de tres traducciones distintas. La versión francesa apareció por vez primera en París poco antes de la insurrección de junio de 1848; últimamente ha vuelto a publicarse en Le Socialiste de Nueva York, y se prepara una nueva traducción.  La versión polaca apareció en Londres poco después de la primera edición alemana.  La traducción rusa vio la luz en Ginebra en el año sesenta y tantos. Al danés se tradujo a poco de publicarse.",
                "completeText": "Por mucho que durante los últimos veinticinco años hayan cambiado las circunstancias, los principios generales desarrollados en este Manifiesto siguen siendo substancialmente exactos. Sólo tendría que retocarse algún que otro detalle. Ya el propio Manifiesto advierte que la aplicación práctica de estos principios dependerá en todas partes y en todo tiempo de las circunstancias históricas existentes, razón por la que no se hace especial hincapié en las medidas revolucionarias propuestas al final del capítulo II. Si tuviésemos que formularlo hoy, este pasaje presentaría un tenor distinto en muchos respectos. Este programa ha quedado a trozos anticuado por efecto del inmenso desarrollo experimentado por la gran industria en los últimos veinticinco años, con los consiguientes progresos ocurridos en cuanto a la organización política de la clase obrera, y por el efecto de las experiencias prácticas de la revolución de febrero en primer término, y sobre todo de la Comuna de París, donde el proletariado, por vez primera, tuvo el Poder político en sus manos por espacio de dos meses. La comuna ha demostrado, principalmente, que “la clase obrera no puede limitarse a tomar posesión de la máquina del Estado en bloque, poniéndola en marcha para sus propios fines”. (V. La guerra civil en Francia, alocución del Consejo general de la Asociación Obrera Internacional, edición alemana, pág. 51, donde se desarrolla ampliamente esta idea) . Huelga, asimismo, decir que la crítica de la literatura socialista presenta hoy lagunas, ya que sólo llega hasta 1847, y, finalmente, que las indicaciones que se hacen acerca de la actitud de los comunistas para con los diversos partidos de la oposición (capítulo IV), aunque sigan siendo exactas en sus líneas generales, están también anticuadas en lo que toca al detalle, por la sencilla razón de que la situación política ha cambiado radicalmente y el progreso histórico ha venido a eliminar del mundo a la mayoría de los partidos enumerados.\n\nSin embargo, el Manifiesto es un documento histórico, que nosotros no nos creemos ya autorizados a modificar.  Tal vez una edición posterior aparezca precedida de una introducción que abarque el período que va desde 1847 hasta los tiempos actuales; la presente reimpresión nos ha sorprendido sin dejarnos tiempo para eso.",
                "repeatable": false,
                "type": 5,
                "nextQuest": -1,
                "category": "Test #1",
                "requirements": {
                    "available": false,
                    "requiredQuests": [],
                    "requiredDialogs": [
                        5,
                        3
                    ],
                    "requiredLevel": 0,
                    "requiredTime": 0,
                    "factionRequirements": [
                        {
                            "factionId": 3,
                            "factionAvailable": "Is",
                            "factionStance": "Hostile"
                        },
                        {
                            "factionId": 1,
                            "factionAvailable": "IsNot",
                            "factionStance": "Friendly"
                        }
                    ],
                    "scoreboardRequirements": [
                        {
                            "scoreboardObjective": "arceus",
                            "scoreboardType": "BIGGER",
                            "scoreboardValue": 1
                        },
                        {
                            "scoreboardObjective": "increible",
                            "scoreboardType": "SMALLER",
                            "scoreboardValue": 3000
                        }
                    ]
                },
                "id": 3,
                "status": "LOCKED",
                "objectives": [],
                "rewards": [
                    {
                        "item": "pixelmon:poke_ball",
                        "count": 1
                    },
                    {
                        "item": "pixelmon:rare_candy",
                        "count": 1
                    }
                ]
            },
            {
                "name": "La región de Teras",
                "logText": "¡Bienvenido a la región de Teras! En esta región encontrarás cosas maravillosas, como Luiscaína, comunismo y a veces incluso Pokémon.",
                "completeText": "*música de victoria de final fantasy por la puta cara*",
                "repeatable": false,
                "type": 0,
                "nextQuest": 6,
                "category": "Historia",
                "requirements": {
                    "available": false,
                    "requiredQuests": [],
                    "requiredDialogs": [],
                    "requiredLevel": 0,
                    "requiredTime": 0,
                    "factionRequirements": [],
                    "scoreboardRequirements": []
                },
                "id": 5,
                "status": "AVAILABLE",
                "objectives": [],
                "rewards": [
                    {
                        "item": "teras:smartrotom",
                        "count": 1
                    }
                ]
            },
            {
                "name": "Mi primer compañero",
                "logText": "He recibido una carta del Profesor Ficus que me indicaba que fuera a su laboratorio para recoger a mi primer Pokémon... Espero que no sea una maldita pera...",
                "completeText": "Era una puta pera...",
                "repeatable": false,
                "type": 5,
                "nextQuest": -1,
                "category": "Historia",
                "requirements": {
                    "available": false,
                    "requiredQuests": [
                        5
                    ],
                    "requiredDialogs": [],
                    "requiredLevel": 0,
                    "requiredTime": 0,
                    "factionRequirements": [],
                    "scoreboardRequirements": []
                },
                "id": 6,
                "status": "LOCKED",
                "objectives": [],
                "rewards": []
            }
        ],
        "dialogs": [
            {
                "id": 5,
                "name": "Diálogo 1",
                "text": "Hola, estaba buscando una persona que me pudiera ayudar a exterminar millonarios. ¿Tienes 5 minutos?",
                "questId": -1,
                "requirements": {
                    "available": false,
                    "requiredQuests": [
                        2
                    ],
                    "requiredDialogs": [
                        21
                    ],
                    "requiredLevel": 27,
                    "requiredTime": 1,
                    "factionRequirements": [],
                    "scoreboardRequirements": [
                        {
                            "scoreboardObjective": "diarias",
                            "scoreboardType": "EQUAL",
                            "scoreboardValue": 30
                        }
                    ]
                }
            },
            {
                "id": 3,
                "name": "Who are you",
                "text": "I'm a villager here. I have lived in this village my whole life.",
                "questId": -1,
                "requirements": {
                    "available": false,
                    "requiredQuests": [],
                    "requiredDialogs": [],
                    "requiredLevel": 0,
                    "requiredTime": 0,
                    "factionRequirements": [],
                    "scoreboardRequirements": []
                }
            }
        ],
        "categories": {
            "Test #1": [
                2,
                3
            ],
            "Historia": [
                5,
                6
            ]
        }, "npcs": [
            {
                "name": "Rotom",
                "dialogId": 0,
                "skin": "rotom"
            },
            {
                "name": "Ficus",
                "dialogId": 1,
                "skin": "ficus"
            }
        ]
    }
    }
  

}
