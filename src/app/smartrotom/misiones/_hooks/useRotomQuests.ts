import { getSmartRotomUser } from "@/lib/utils"
import { rotomPOST } from "@/services/boffAPI"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { IDialogue, IQuestCategory, QuestData } from "../_types/Quest"

export function useRotomQuests(){
    const { data: session} = useSession()
    const [quests, setMisiones] = useState([] as QuestData[])
    const [categories, setCategories] = useState({} as {[key: string]: IQuestCategory})
    const [dialogs, setDialogs] = useState([] as IDialogue[])
    const [npcs, setNpcs] = useState([] as any[])


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

    return { quests, categories, dialogs, npcs }
}