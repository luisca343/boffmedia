"use client"
import '../mina.css'
import Image from "next/image";
import MenuWrapper from "../_components/MenuWrapper";
import useGetMineHistory from "../_hooks/useGetMineHistory";

export default function History(){
    const {mineHistory, setMineHistory} = useGetMineHistory();
    
    return(
        <MenuWrapper className={` bg-main-900 text-main-50 flex flex-wrap items-start justify-evenly`}>
            {Object.values(mineHistory).reverse()?.map((game: any, i: number) => {
                return (
                    <div key={i} className="p-4 border rounded shadow  w-auto flex flex-col items-center m-2  bg-main-900 bg-opacity-80">
                        <div className=" flex flex-row">
                            {game.map((reward: any, index: number) => {
                                return (
                                    <div key={reward.id+ "-" +index} className="flex flex-col m-2 justify-between items-center pb-2 h-full">
                                        <Image alt={reward.itemId} width={64} height={64} 
                                            src={`/smartrotom/img/apps/mina/recompensas/${reward.itemId?.split(':')[1]}.png`}
                                            style={{imageRendering: "pixelated"}}
                                        />
                                        <p className="text-main-400">{reward.objeto}</p>
                                    </div>
                                )
                            })}
                        </div>
                            <p className="text-main-400">{new Date(game[0].date).toLocaleString()}</p>
                    </div>
                )
            })}
        </MenuWrapper>
    )
}