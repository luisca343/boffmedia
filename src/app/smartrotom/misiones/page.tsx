"use client";
import { CabezaJugador, NPCHead } from "@/components/smartrotom/CabezaMC";
import { Book, Page } from "@/components/ui/book/book";
import { getSmartRotomUser } from "@/lib/utils";
import { GET, POST, rotomGET, rotomPOST } from "@/services/boffAPI"
import { stat } from "fs";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { ItemSprite } from "../pokedex/_components/PokemonSprite";
import { Item } from "@radix-ui/react-select";
import Link from "next/link";
import { Button } from "@/components/ui/button";
const NpcSkin = React.lazy(() => import("@/components/smartrotom/MinecraftSkin"));


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

function parseTestData(jsonString: string) {
    const testData = JSON.parse(jsonString);
    
    const testDataAsObject = {
        quests: testData.quests,
        categories: testData.categories
    };
    
    return testDataAsObject;
}

export default function Misiones(){
    const { data: session} = useSession()
    const [quests, setMisiones] = useState([] as QuestData[])
    const [categories, setCategories] = useState({} as {[key: string]: IQuestCategory})
    const [dialogs, setDialogs] = useState([] as IDialogue[])

    const [book, setBook] = useState(null) as any


    let pageNum = 0;
    const questPages = {} as {[key: number]: number} // {questId: page}
    const dialogPages = {} as {[key: number]: number} // {dialogId: page}

    useEffect(() => {
        if(!session) return
        rotomPOST("/misiones", { uuid: getSmartRotomUser(session).uuid })
        .then((response) => {
            console.log(response)
            setMisiones(response.quests)
            setCategories(response.categories)
            setDialogs(response.dialogs)
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
    const skins = ['abascal', 'perrosanxe', 'sanchez', 'rajoy']
    return(
        <section className=" bg-yellow-200 flex font-vinque  bg-center bg-no-repeat bg-fixed bg-cover" style={{backgroundImage: `url(https://images.hdqwalls.com/wallpapers/2020-pokemon-mystery-dungeon-4k-o8.jpg)`}}>
          <Book pageColor="-purple" setBook={(e) => setBook(e)}>
            <Page number={pageNum++} className="bg-blue-600 flex flex-col  bg-center bg-no-repeat bg-fixed bg-cover" style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero2.webp)`}}>
              <div className="text-center text-6xl mt-4 text-yellow-200 font-bold opacity-80" style={{ mixBlendMode: 'normal' }}>Misiones</div>
              <img className="h-0 flex-1  opacity-80" src="/smartrotom/img/logo.webp" alt="description" style={{ mixBlendMode: 'normal' }} />
              <div className="mb-4 text-center text-4xl  text-yellow-200 font-bold  opacity-80" style={{ mixBlendMode: 'normal' }}>Región de Teras</div>
            </Page>

            <Page number={pageNum++}>
                <h1>Indice</h1>
                <h3>Misiones</h3>
                <ul>
                    {quests.map((quest) => {
                        if(!quest) return null
                        return <Button key={quest.id} onClick={() => book.flip(questPages[quest.id])}>{quest.name}</Button>
                    })}
                </ul>
                <h3>Dialogos</h3>
                <ul>
                    {Object.values(dialogs).map((dialog) => {
                        return <Button key={dialog.id} onClick={() => book.flip(dialogPages[dialog.id])}>{dialog.name}</Button>
                    })}
                </ul>
            </Page>

            {Object.values(quests).map((mision, index) => {
                return <RenderQuestPage key={mision.id} mision={mision} index={index}  number={pageNum++}/>
            })}
            
            {Object.values(dialogs).map((dialog, index) => {
                return <RenderDialogPage key={dialog.id} dialog={dialog} index={index}  number={pageNum++}/>
            })}

            
            <Page  number={pageNum++} style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero2.webp)`}}>Page 7</Page>
          </Book>
        </section>
    )

    function RenderDialogPage({dialog, index, number}: {dialog: IDialogue, index: number, number: number}){
        dialogPages[dialog.id] = number
        return <Page  number={number} className="bg-blue-600 flex flex-col  bg-center bg-no-repeat bg-fixed bg-cover" >
        <div className="flex text-xl font-bold w-[60%] border-b-2 border-black">{dialog.name}</div>
        <BookSection className="w-full text-justify p-2" title="Texto" size={2}>
            <div className="float-left">
            <React.Suspense fallback={<div>Loading...</div>}>
                <NpcSkin npcName={skins[index % skins.length]} />
            </React.Suspense>
            </div>
            <p>{dialog.text}</p>
        </BookSection>
    </Page>
    }
    
    function RenderQuestPage({mision, index, number}: {mision: QuestData, index: number, number: number}){
        questPages[mision.id] = number
        console.log(questPages)
        const randomId = Math.random().toString(36).substring(7)
        return <Page  number={number} key={randomId} className={`p-4 bg-blue-600 flex  flex-col  bg-center bg-no-repeat bg-fixed bg-cover ${getStatusStyles(mision.status)}`}>
        <div className="flex text-xl font-bold w-[60%] border-b-2 border-black">{mision.name} 
        <StatusBadge status={mision.status}>{mision.status}</StatusBadge>
        {mision.repeatable && <StatusBadge status={QuestStatus.AVAILABLE}>REPETIBLE</StatusBadge>}
        </div>
        {mision.status !== QuestStatus.LOCKED && <BookSection className="w-full text-justify p-2" title="Description" size={2}>
            <div className="float-left">
            <React.Suspense fallback={<div>Loading...</div>}>
                <NpcSkin npcName={skins[index % skins.length]} />
            </React.Suspense>
            </div>
            <p>DIALOGO: {dialogs.find(d => d.id === mision.dialogId)?.text}</p>
            <p>LOG:{mision.logText}</p>
        </BookSection>
        }
            {mision.status === QuestStatus.COMPLETED && 
                <BookSection title="Complete Text" size={2}>
                    <div className="flex-1 overflow-auto">{mision.completeText}</div>  
                </BookSection>
            }
       
            {(mision.status !== QuestStatus.LOCKED  && mision.objectives?.length > 0) && <BookSection title="Objectives">
                <ul  className=" flex justify-center text-center">
                    {mision.objectives.map((objective:IQuestObjective) => (
                        <li key={objective.name + randomId} className="mx-2 flex flex-col justify-center items-center">
                            <ItemSprite name={objective.name.split(":")[0].toLowerCase().replace(" ", "_")} />
                            <p>{objective.name}</p>
                            <p>{objective.progress} / {objective.total}</p>
                        </li>
                    ))}
                </ul>
            </BookSection>
            }
            
            {(mision.status !== QuestStatus.LOCKED && mision.rewards?.length > 0) && <BookSection title="Rewards">
                <ul  className=" flex justify-center text-center">
                    {mision.rewards.map((reward:IQuestReward) => (
                        <li key={reward.item + randomId} className="mx-2 flex flex-col justify-center items-center">
                            <ItemSprite name={reward.item.split(":")[1]} />
                            <p>{reward.count} - {reward.item.split(":")[1].split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</p>
                        </li>
                    ))}
                </ul>
            </BookSection>
            }

            {mision.status === QuestStatus.LOCKED && <BookSection title="Locked" size={2}>
                <Requirements quest={mision} />
            </BookSection>
            }
            
    </Page>
    }

    function Requirements({quest}: {quest: QuestData}){
        const requirements = quest?.requirements

        console.log(requirements)
        return <div className="flex flex-col">
            {requirements.requiredQuests?.length > 0 && <div className="flex flex-col">
                <p className="font-bold">Misiones Necesarias:</p>
                <ul>
                    {requirements.requiredQuests.map((questId) => <li key={questId}>{quests.find(q => q.id === questId)?.name}</li>)}
                </ul>
            </div>}

            {requirements.requiredDialogs?.length > 0 && <div className="flex flex-col">
                <p className="font-bold">Dialogos Necesarios:</p>
                <ul>
                    {requirements.requiredDialogs.map((dialogId) => {
                        console.log(dialogId)
                        console.log(dialogs)
                        return <Button onClick={() => book.flip(dialogPages[dialogId])} key={dialogId}>{dialogs.find(d => d.id === dialogId)?.name}</Button>
                    }
                    )}
                </ul>
            </div>}

            {requirements.requiredLevel > 0 && <div className="flex flex-col">
                <p className="font-bold">Nivel Necesario:</p>
                <p>{requirements.requiredLevel}</p>
            </div>}

            {requirements.requiredTime > 0 && <div className="flex flex-col">
                <p className="font-bold">Tiempo Necesario:</p>
                <p>{requirements.requiredTime}</p>
            </div>}

            {requirements.factionRequirements.length > 0 && <div className="flex flex-col">
                <p className="font-bold">Requisitos de Facción:</p>
                <ul>
                    {requirements.factionRequirements.map((faction) => <li key={faction.factionId}>{faction.factionId}: {faction.factionAvailable} - {faction.factionStance}</li>)}
                </ul>
            </div>}

            {requirements.scoreboardRequirements.length > 0 && <div className="flex flex-col">
                <p className="font-bold">Requisitos de Scoreboard:</p>
                <ul>
                    {requirements.scoreboardRequirements.map((scoreboard) => <li key={scoreboard.scoreboardObjective}>{scoreboard.scoreboardObjective}: {scoreboard.scoreboardValue}</li>)}
                </ul>
            </div>}


        </div>
    }

    function BookSection({children, title, className='', size= 1, ...props}: {children: React.ReactNode, props?: React.HTMLProps<HTMLDivElement>, className?: string, title?: string, size?: number}){
        return <section className={`h-fit max-h-[33%] flex flex-col  overflow-hidden my-2`} >
        <p className="font-bold  w-[40%] border-b border-black overflow-hidden">{title}</p>
            <div className="h-full  overflow-auto" >
                {children} 
            </div>
        </section>
    }

    function StatusBadge({status, children}: {status: QuestStatus, children: React.ReactNode}){
        return <div className={`flex items-center font-thin px-1 text-xs ml-2 my-1  rounded-lg ${getStatusStyles(status)}`}>{children}</div>
    }
    
}

