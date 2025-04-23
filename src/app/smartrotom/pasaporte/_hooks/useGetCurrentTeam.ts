import { rotomPOST } from "@/services/boffAPI";
import { useEffect, useState } from "react";
import { ActiveTeam as ActiveTeamType } from "@/types/Pokemon";

export function useGetCurrentTeam(uuid: string) {
    const [currentTeam, setCurrentTeam] = useState<ActiveTeamType>();

    useEffect(() => {
        rotomPOST('/team',{uuid}).then((res:any)=>{
            console.log(res.data)
            setCurrentTeam(res.data)
          })
    }, [])

    return { currentTeam, setCurrentTeam }

}