import { rotomPOST } from "@/services/boffAPI";
import { useEffect, useState } from "react";
import { ActiveTeam as ActiveTeamType } from "@/types/Pokemon";

export function useCurrentTeam(uuid: string) {
    const [currentTeam, setCurrentTeam] = useState<ActiveTeamType>();

    useEffect(() => {
        rotomPOST('/team',{uuid}).then((res)=>{
            setCurrentTeam(res)
          })
    }, [])

    return { currentTeam, setCurrentTeam }

}