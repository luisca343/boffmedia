"use client";
import { CabezaJugador, NPCHead } from "@/components/smartrotom/CabezaMC";
import { Book, Page } from "@/components/ui/book/book";
import { getSmartRotomUser } from "@/lib/utils";
import { GET, POST, rotomGET, rotomPOST } from "@/services/boffAPI"
import { stat } from "fs";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ItemSprite } from "../pokedex/_components/PokemonSprite";
import { Item } from "@radix-ui/react-select";


enum QuestStatus {
    ACTIVE= "ACTIVE",
    COMPLETED= "COMPLETED",
    FAILED = "FAILED",
    AVAILABLE = "AVAILABLE",
    LOCKED = "LOCKED",
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
    
    rewards: IQuestReward[];
}


const testData ={
    "quests": {
        2: {
            "id": 2,
            "name": "Mision 1",
            "logText": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
            "completeText": "Completada la Misión 1",
            "repeatable": false,
            "type": 0,
            "nextQuest": -1,
            "category": "Test #1",
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
                    "name": "Rare Candy: 1/8",
                    "progress": 1,
                    "total": 8
                }
            ],
            "rewards": []
        },
        3: {
            "id": 3,
            "name": "Arceus",
            "logText": "Ah pues vale",
            "completeText": "Hola,  esto es otra misión, tal y cual y eso y lo otro",
            "repeatable": false,
            "type": 5,
            "nextQuest": -1,
            "category": "Test #1",
            "status": "COMPLETED",
            "objectives": [],
            "rewards": [
                {
                    "item": "pixelmon:poke_ball",
                    "count": 1
                }
            ]
        },
        5: {
            "id": 5,
            "name": "La región de Teras",
            "logText": "¡Bienvenido a la región de Teras! En esta región encontrarás cosas maravillosas, como Luiscaína, comunismo y a veces incluso Pokémon.",
            "completeText": "*música de victoria de final fantasy por la puta cara*",
            "repeatable": false,
            "type": 0,
            "nextQuest": 6,
            "category": "Historia",
            "status": "AVAILABLE",
            "objectives": [],
            "rewards": [
                {
                    "item": "minecraft:dirt",
                    "count": 1
                }
            ]
        },
        6: {
            "id": 6,
            "name": "Mi primer compañero",
            "logText": "He recibido una carta del Profesor Ficus que me indicaba que fuera a su laboratorio para recoger a mi primer Pokémon... Espero que no sea una maldita pera...",
            "completeText": "Era una puta pera...",
            "repeatable": false,
            "type": 5,
            "nextQuest": -1,
            "category": "Historia",
            "status": "LOCKED",
            "objectives": [],
            "rewards": []
        }
    },
    "categories": {
        "2": "Test #1",
        "3": "Test #1",
        "5": "Historia",
        "6": "Historia"
    }
} as any

function parseTestData(jsonString: string) {
    const testData = JSON.parse(jsonString);

    const testDataAsObject = {
        quests: testData.quests,
        categories: testData.categories
    };

    return testDataAsObject;
}

const testDataAsMap = {
    quests: new Map(Object.entries(testData.quests)),
    categories: new Map(Object.entries(testData.categories))
} as unknown as {quests: Map<number, QuestData>, categories: Map<number, string>}

const testDataAsObject = {
    quests: Object.fromEntries(testDataAsMap.quests),
    categories: Object.fromEntries(testDataAsMap.categories)
} as {quests: {[key: number]: QuestData}, categories: {[key: number]: string}}

export default function Misiones(){
    const { data: session} = useSession()
    const [quests, setMisiones] = useState({} as {[key: number]: QuestData})
    const [categories, setCategories] = useState({} as {[key: number]: string})
    const [pages, setPages] = useState(0)

    useEffect(() => {
        if(!session) return
        console.log(getSmartRotomUser(session).uuid)
        rotomPOST("/patata", { uuid: getSmartRotomUser(session).uuid })
        .then((response) => {
            
            console.log(response)
            
            if(!response.quests) {
                setMisiones(testDataAsObject.quests)
                setCategories(testDataAsObject.categories)
                return
            }
            setMisiones(response.quests)
            setCategories(response.categories)
        }).catch((error) => {
            setMisiones(testDataAsObject.quests)
            setCategories(testDataAsObject.categories)
        })
    }, [])


    function getStatusStyles(status: QuestStatus){
        switch(status){
            case QuestStatus.ACTIVE:
                return "bg-green-300"
            case QuestStatus.COMPLETED:
                return "bg-blue-300"
            case QuestStatus.FAILED:
                return "bg-red-300"
            case QuestStatus.AVAILABLE:
                return "bg-yellow-300"
            case QuestStatus.LOCKED:
                return "bg-gray-300"
        }
    }

    if(!quests) return <div>Cargando...</div>
    const skins = ['abascal', 'sanchez', 'perrosanxe', 'rajoy']
    return(
        <section className=" bg-yellow-200 flex font-vinque">
          <Book pageColor="-purple">
            <Page className="bg-blue-600 flex flex-col  bg-center bg-no-repeat bg-fixed bg-cover" style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero2.webp)`}}>
              <div className="text-center text-6xl mt-4 text-yellow-200 font-bold opacity-80" style={{ mixBlendMode: 'normal' }}>Misiones</div>
              <img className="h-0 flex-1  opacity-80" src="/smartrotom/img/logo.webp" alt="description" style={{ mixBlendMode: 'normal' }} />
              <div className="mb-4 text-center text-4xl  text-yellow-200 font-bold  opacity-80" style={{ mixBlendMode: 'normal' }}>Región de Teras</div>
            </Page>

            {Object.values(quests).map((mision, index) => {
                return <Page key={mision.id} className={`p-4 bg-blue-600 flex  flex-col  bg-center bg-no-repeat bg-fixed bg-cover ${getStatusStyles(mision.status)}`}>
                    <div className="text-xl font-bold w-[60%] border-b-2 border-black">{mision.name}</div>
                    <div className="w-full text-justify p-2">
                        <div className="float-left">
                            <NPCHead width={150} npcName={skins[index]} autoRotate={false} tag={false} zoom={1} />
                        </div>
                        
                        {mision.status !== QuestStatus.LOCKED ? <div className="mt-4">
                            <p className="font-bold  w-[40%] border-b border-black overflow-hidden">Log Text</p>
                            <p>{mision.logText}</p> </div> : <p className="font-bold">Locked</p>
                        }

                    </div>
                    
                    {mision.status === QuestStatus.COMPLETED && <>
                            <p className="font-bold w-[40%] border-b border-black overflow-hidden">Complete Text</p>
                            <p>{mision.completeText}</p> </>
                        }
                        
                        {(mision.status !== QuestStatus.LOCKED  && mision.objectives.length > 0) && <>
                        <p className="font-bold w-[40%] border-b border-black overflow-hidden">Objectives</p>
                            <ul  className=" flex justify-center text-center">
                                {mision.objectives.map((objective:IQuestObjective) => (
                                    <li key={objective.name} className="mx-2">
                                        <p>{objective.name}</p>
                                        <p>{objective.progress} / {objective.total}</p>
                                        <ItemSprite name={objective.name.split(":")[0].toLowerCase().replace(" ", "_")} />
                                    </li>
                                ))}
                            </ul>
                        </>}
                        
                        {(mision.status !== QuestStatus.LOCKED && mision.rewards.length > 0) && <>
                            <p className="font-bold w-[40%] border-b border-black overflow-hidden">Rewards</p>
                            <ul>
                                {mision.rewards.map((reward:IQuestReward) => (
                                    <li key={reward.item}>
                                        <p>{reward.count} - {reward.item}</p>
                                        <ItemSprite name={reward.item.split(":")[1]} />
                                    </li>
                                ))}
                            </ul>
                        </>}
                </Page>
            })}
            
            
            <Page style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero2.webp)`}}>Page 7</Page>
          </Book>
        </section>
    )
}