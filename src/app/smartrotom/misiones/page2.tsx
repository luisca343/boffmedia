"use client"
import { Book, BookLink, Page, PageTitle } from "@/components/ui/book/book";
import { getSmartRotomUser } from "@/lib/utils";
import { rotomPOST } from "@/services/boffAPI";
import { useBoffSession } from "@/services/useBoffSession";
import { useEffect, useState } from "react";

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


export default function Misiones(){
    const { session } = useBoffSession();
    const [quests, setMisiones] = useState([] as QuestData[])
    const [categories, setCategories] = useState({} as {[key: string]: IQuestCategory})
    const [dialogs, setDialogs] = useState([] as IDialogue[])
    const [npcs, setNpcs] = useState([] as any[])

    const [book, setBook] = useState(null) as any


    let pageNum = 0;
    const questPages = {} as {[key: number]: number} // {questId: page}
    const dialogPages = {} as {[key: number]: number} // {dialogId: page}

    useEffect(() => {
        if(!session) return
        rotomPOST("/misiones", { uuid: getSmartRotomUser(session).uuid })
        .then((response) => {
            setMisiones(response.quests)
            setCategories(response.categories)
            setDialogs(response.dialogs)
            setNpcs(response.npcs)
        })
    }, [])

    let page = 0
    return (
        <section className=" bg-yellow-200 flex bg-center bg-no-repeat bg-fixed bg-cover">
            <Book pageColor="-purple" setBook={setBook}>
                <Page dataDensity="hard" book={book} number={page++} className="font-vinque bg-purple-800 flex  flex-col " style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero2.webp)`}}>
                    <div className="text-center text-6xl mt-4 text-yellow-200 font-bold opacity-80" style={{ mixBlendMode: 'normal' }}>MISIONES</div>
                    <img className="h-0 flex-1  opacity-80" src="/smartrotom/img/logo.webp" alt="description" style={{ mixBlendMode: 'normal' }} />
                    <div className="mb-4 text-center text-4xl  text-yellow-200 font-bold  opacity-80" style={{ mixBlendMode: 'normal' }}>Región de Teras</div>
                </Page>

                <Page book={book} number={pageNum++}>
                    <h1>Indice</h1>
                    <h3>Misiones</h3>
                    <ul>
                        {quests.map((quest) => {
                            if(!quest) return null
                            return <QuestBookLink dialogId={quest.id} key={quest.id} type='quest'/>
                        })}
                    </ul>
                    <h3>Dialogos</h3>
                    <ul>
                        {Object.values(dialogs).map((dialog) => {
                            return <QuestBookLink dialogId={dialog.id} key={dialog.id}/>
                        })}
                    </ul>
                </Page>


                <Page dataDensity="hard" book={book} number={page++}  style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero2.webp)`}}></Page>
            </Book>
        </section>
    )

    function QuestBookLink({dialogId, type='dialog'}: {dialogId: number, type?: string}){
        const classes = "text-blue-500 hover:text-blue-800 px-2 hover:cursor-pointer"
        if(type === 'quest') return <button className={classes}    onClick={() => book.flip(questPages[dialogId])} key={dialogId}>{quests.find(d => d.id === dialogId)?.name}</button>
        return <button className={classes}  onClick={() => book.flip(dialogPages[dialogId])} key={dialogId}>{dialogs.find(d => d.id === dialogId)?.name}</button>
    }

}

