"use client"

import { BoffSession } from "@/components/smartrotom/AppWrapper"
import { useSession } from "next-auth/react"
import MenuWrapper from "../_components/MenuWrapper"
import { useEffect, useState } from "react"
import { rotomGET } from "@/services/boffAPI"
import { isMinecraft, mcefQuery } from "@/services/mcefHelper"
import Image from "next/image"
import { toast } from 'react-toastify';

export default function Reclamar(){
    const {data: session} = useSession() as {data: BoffSession | null}
    const [unclaimed, setUnclaimed] = useState<{[key: string]: number}>()

    useEffect(() => {
        if(session){
            rotomGET('/mine/unclaimed/' + session.user.smartRotomUser.uuid).then(res => {
                setUnclaimed(res)
            })
        }
    }, [session])
    

    async function claimReward(){
        if(!session) return
        if(!await isMinecraft()) {
            toast.error('No estas en Minecraft')
        }
        try {
            await mcefQuery('claimRewards', {query: "claimRewards", unclaimed});
            console.log('Promise resolved successfully');
        } catch (error) {
            console.error('Promise rejected with error', error);
        }
    }

    return(
    <MenuWrapper>
        <div>
        {
            unclaimed ? 
            Object.keys(unclaimed).map((key, i) => {
                return (
                    <div key={i} className="relative inline-block">
                        <Image width={128} height={128} src={`/smartrotom/img/apps/mina/recompensas/${key.split(':')[1]}.png`} 
                            alt="Reward" className=" object-cover relative" style={{imageRendering: "pixelated"}}
                            />
                        <span className="absolute bottom-0 right-0 bg-primary-400 text-main-50 text-md rounded-full h-8 w-8 flex items-center justify-center">
                            {unclaimed[key]}
                        </span>
                    </div>
                )
            })
            : <h2>Nada para reclamar</h2>
        }
        <button onClick={() => claimReward()} className="bg-primary-400 text-main-50 rounded-md p-2 mt-4">Reclamar</button>
        </div>
    </MenuWrapper>
    )
}