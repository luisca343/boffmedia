"use client"

import MenuWrapper from "../_components/MenuWrapper"
import { rotomPOST } from "@/services/boffAPI"
import { isMinecraft, mcefQuery } from "@/services/mcefHelper"
import Image from "next/image"
import { toast } from 'react-toastify';
import { useGetUnclaimedRewards } from "../_hooks/useGetUnclaimedRewards"

export default function Reclamar(){
    const {session, unclaimed, setUnclaimed} = useGetUnclaimedRewards()

    async function claimReward(){
        
        if(!session) return
        if(!await isMinecraft()) {
            toast.error('No estas en Minecraft')
        }
        // Convert unclaimet to array

        let unclaimedArray = []
        for (const key in unclaimed) {
            unclaimedArray.push({
                id: key,
                cantidad: unclaimed[key]
            })
        }

        try {
            const res = await mcefQuery('darCaja', {query: "darCaja", objetos: unclaimedArray});
            rotomPOST('/mine/claim/', {uuid: session.user.smartRotomUser.uuid}).then(res => {
                toast.success('Recompensas reclamadas')
                window.location.reload()
            })
        } catch (error) {
            toast.error('Error al reclamar recompensas')
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