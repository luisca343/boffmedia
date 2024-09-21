import { rotomGET } from "@/services/boffAPI"
import { useBoffSession } from "@/services/useBoffSession";
import { useEffect, useState } from "react"

export interface UnclaimedRewards {
    name: string
    type: string
    amount: number
    itemId: string
}

export function useGetUnclaimedRewards(){
    const { session } = useBoffSession();
    const [unclaimed, setUnclaimed] = useState<UnclaimedRewards[]>([])

    useEffect(() => {
        if(session){
            rotomGET('/mine/unclaimed/' + session.user.smartRotomUser.uuid).then(res => {
                setUnclaimed(res)
            })
        }
    }, [session])

    return { session, unclaimed, setUnclaimed, getBoxes }

    function getBoxes() {
        return Math.ceil(unclaimed.length / 27)
    }
    
}