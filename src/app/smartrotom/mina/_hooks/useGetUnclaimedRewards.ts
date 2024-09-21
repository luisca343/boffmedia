import { rotomGET } from "@/services/boffAPI"
import { useBoffSession } from "@/services/useBoffSession";
import { BoffSession } from "@/types"
import { useEffect, useState } from "react"

export function useGetUnclaimedRewards(){
    const { session } = useBoffSession();
    const [unclaimed, setUnclaimed] = useState<{[key: string]: number}>()

    useEffect(() => {
        if(session){
            rotomGET('/mine/unclaimed/' + session.user.smartRotomUser.uuid).then(res => {
                setUnclaimed(res)
            })
        }
    }, [session])

    return { session, unclaimed, setUnclaimed }
    
}