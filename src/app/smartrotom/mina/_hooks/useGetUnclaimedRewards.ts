import { rotomGET } from "@/services/boffAPI"
import { BoffSession } from "@/types"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export function useUnclaimedRewards(){
    const {data: session} = useSession() as {data: BoffSession | null}
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