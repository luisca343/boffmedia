/*
"use client";
import { getSmartRotomUser } from "@/lib/utils";
import { rotomPOST } from "@/services/boffAPI"
import { useBoffSession } from "@/services/useBoffSession";
import { useEffect, useState } from "react";


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
            "logText": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
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
    const { session } = useBoffSession();
    const [quests, setMisiones] = useState({} as {[key: number]: QuestData})
    const [categories, setCategories] = useState({} as {[key: number]: string})
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
                return "bg-surface-300"
        }
    }

    if(!quests) return <div>Cargando...</div>
    return(
        <div>
            <h1>Misiones</h1>
            <div className="flex flex-wrap border border-black  ">
                {Object.values(quests).map((mision) => {
                    return <div key={mision.id} className={`w-1/2 ${getStatusStyles(mision.status)}`}>
                        <h2 className="text-xl font-bold">{mision.name}</h2>

                        <p className="font-bold">Category</p>
                        <p>{mision.category}</p>

                        <p className="font-bold">Status</p>
                        <p>{mision.status}</p>

                        {mision.status !== QuestStatus.LOCKED && <>
                            <p className="font-bold">Log Text</p>
                            <p>{mision.logText}</p> </>
                        }

                        {mision.status === QuestStatus.COMPLETED && <>
                            <p className="font-bold">Complete Text</p>
                            <p>{mision.completeText}</p> </>
                        }

                        {(mision.status !== QuestStatus.LOCKED  && mision.objectives.length > 0) && <>
                        <p className="font-bold">Objectives</p>
                            <ul  className=" flex justify-center text-center">
                                {mision.objectives.map((objective:IQuestObjective) => (
                                    <li key={objective.name} className="mx-2">
                                        <p>{objective.name}</p>
                                        <p>{objective.progress} / {objective.total}</p>
                                    </li>
                                ))}
                            </ul>
                        </>}
                        
                        {(mision.status !== QuestStatus.LOCKED && mision.rewards.length > 0) && <>
                            <p className="font-bold">Rewards</p>
                            <ul>
                                {mision.rewards.map((reward:IQuestReward) => (
                                    <li key={reward.item}>
                                        <p>{reward.count} - {reward.item}</p>
                                    </li>
                                ))}
                            </ul>
                        </>}
                        

                    </div>
                })}
                
            </div>
        </div>
    )
}*/