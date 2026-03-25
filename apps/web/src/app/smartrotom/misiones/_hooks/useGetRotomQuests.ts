import { useEffect, useState } from "react"
import { useBoffSession } from "@/services/useBoffSession"
import { useGetQuestsForUser } from "@/hooks/misiones/useGetQuestsForUser";
import { IDialogue, IQuestCategory, QuestData } from "@/types/misiones";

export function useGetRotomQuests() {
  const { session } = useBoffSession();
  const [quests, setQuests] = useState<QuestData[]>([])
  const [categories, setCategories] = useState<any>({})
  const [dialogs, setDialogs] = useState<IDialogue[]>([])
  const [npcs, setNpcs] = useState<any[]>([])

  const uuid = session?.user?.smartRotomUser?.uuid!
  const { userQuests, error, isLoading } = useGetQuestsForUser(uuid)

  useEffect(() => {
    if (userQuests) {
      setQuests(userQuests.quests || [])
      setCategories(userQuests.categories || {})
      setDialogs(userQuests.dialogs || [])
      setNpcs(userQuests.npcs || [])
    }
  }, [userQuests])

  return { 
    quests, 
    categories, 
    dialogs, 
    npcs, 
    isLoading, 
    error 
  }
}