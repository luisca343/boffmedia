"use client"
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { rotomGET, rotomPOST } from "@/services/boffAPI";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import '../mina.css'
import Image from "next/image";
import MenuWrapper from "../_components/MenuWrapper";

export default function Historial(){
    const {data: session} = useSession() as {data: BoffSession | null}
    const [historial, setHistorial] = useState([]);

    useEffect(() => {
        const datos = rotomGET(`/mina/historial/${session?.user.smartRotomUser.uuid}`).then(res => {
            setHistorial(res);
        })

    }, [session]);

    return(
        <MenuWrapper className={` bg-gray-900 text-white flex flex-wrap items-start justify-evenly`}>
            {Object.values(historial).reverse().map((partida: any, i: number) => {
                return (
                    <div key={i} className="p-4 border rounded shadow  w-auto flex flex-col items-center m-2  bg-gray-900 bg-opacity-80">
                        <div className=" flex flex-row">
                            {partida.map((recompensa: any, index: number) => {
                                return (
                                    <div key={recompensa.id+ "-" +index} className="flex flex-col m-2 justify-between items-center pb-2 h-full">
                                        <Image width={64} height={64} src={`/smartrotom/img/mina/recompensas/${recompensa.idObjeto.split(':')[1]}.png`} alt={recompensa.objeto}/>
                                        <p className="text-gray-400">{recompensa.objeto}</p>
                                    </div>
                                )
                            })}
                        </div>
                            <p className="text-gray-400">{new Date(partida[0].date).toLocaleString()}</p>
                    </div>
                )
            })}
        </MenuWrapper>
    )
}