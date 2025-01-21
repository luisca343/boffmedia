import { rotomPOST } from "@/services/boffAPI";
import { useEffect, useState } from "react";
import { SmartRotomAchievement } from "../_types/Achievement";

export function useGetAchievements(uuid: string) {
    const [achievements, setAchievements] = useState<SmartRotomAchievement[]>();

    useEffect(() => {
        rotomPOST('/battle-achievements',{uuid}).then((res:any)=>{
            setAchievements(res)
          })
    }, [])

    return { achievements, setAchievements } as { achievements: SmartRotomAchievement[], setAchievements: React.Dispatch<React.SetStateAction<SmartRotomAchievement[] | undefined>> }

}