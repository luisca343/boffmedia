/* eslint-disable react-hooks/exhaustive-deps */
import { getSmartRotomUser } from "@/lib/utils"
import { rotomPOST } from "@/services/boffAPI"
import { useEffect, useState } from "react"
import { IDialogue, IQuestCategory, QuestData } from "../_types/Quest"
import { useBoffSession } from "@/services/useBoffSession"

export function useGetRotomQuests(){
    const { session } = useBoffSession();
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