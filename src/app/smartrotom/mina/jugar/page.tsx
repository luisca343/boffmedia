/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState } from "react"
import { Reward, generateGame, getMineMap, jugar } from "../utils"
import {motion, useAnimation}     from 'framer-motion'
import { AlertDialog, AlertDialogContent, AlertDialogHeader } from "@/components/ui/alert-dialog"
import { BarraEnergia } from "../_components/BarraEnergia"
import { useRouter } from 'next/navigation';
import { BoffSession } from "@/components/smartrotom/AppWrapper"
import { Button } from "@/components/ui/button"
import { rotomPOST } from "@/services/boffAPI"
import { useBoffSession } from "@/services/useBoffSession"

enum Tool {
    PICKAXE = 1,
    HAMMER = 0
}

export default function Jugar(){
    const { session } = useBoffSession();
    const [index, setIndex] = useState(0)
    const [mineMap, setMap] = useState<Array<Array<any>>>([])
    const [rewards, setRewards] = useState<{ reward: Reward; x: number; y: number; }[]>([]) 
    const [obtainedRewards, setObtainedRewards] = useState<{ reward: Reward; x: number; y: number; }[]>([]) 
    const [tool, setTool] = useState(0)
    const [damage, setDamage] = useState(0)
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const shakeAnim = useAnimation()

    const rowNum = 10
    const colNum = 18

    async function generateMap(){
        let tempMap = []
        for(let i = 0; i < rowNum; i++){
            let row = []
            for(let j = 0; j < colNum; j++){
                row.push(0)
            }
            tempMap.push(row)
        }
        
        const {map, positions} = await generateGame(rowNum, colNum)

        await setMap(map)
        await setRewards(positions as { reward: Reward; x: number; y: number; }[])
        await setObtainedRewards([])
        await setDamage(0)
    }

    useEffect(() => {
        setOpen(true)
        //generarMapa()
    }, [])

    useEffect(() => {
       if(damage > 49){
        setDamage(49)
        gameOver()
       }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [damage])

    async function click (fila: number , columna: number) {
        let copy = [...mineMap];
        for (let i = fila - 1; i <= fila + 1; i++) {
            for (let j = columna - 1; j <= columna + 1; j++) {
                hit(copy, fila, columna, i, j, tool);
            }
        }
    
        if(tool === Tool.PICKAXE) setDamage(damage + 1);
        if(tool === Tool.HAMMER) setDamage(damage + 2);
    
        setMap(copy);
        sound(tool);
        await checkRewards();
    }

      function hit (map: any, fila:number, columna:number, i:number, j:number, tool: Tool) {
        if (i < 0 || j < 0 || i >= rowNum || j >= colNum) return map
        // Hit cells always lose 2 points
        if (fila === i && columna === j) {
            map[i][j].estado -= 2
        } else if (fila - i !== 0 && columna - j !== 0) {
          if (tool === Tool.HAMMER) map[i][j].estado--
        } else {
          if (tool === Tool.HAMMER) map[i][j].estado -= 2
          if (tool === Tool.PICKAXE) map[i][j].estado--
        }
        if (map[i][j].estado < 0)map[i][j].estado = 0
        //animate()
        return map
      }

      function sound(herramienta: number) {
        let audio;
        if (herramienta === 1) {
            audio = document.getElementById('pick')?.cloneNode() as HTMLAudioElement;
        } else {
            audio = document.getElementById('hammer')?.cloneNode() as HTMLAudioElement;
        }
    
        if (audio) {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            } else {
                audio.play();
            }
        }
    }

    function playSound(sound: string) {
        let audio = document.getElementById(sound)?.cloneNode() as HTMLAudioElement
        if (audio) {
            if (!audio.paused) {
                audio.pause()
                audio.currentTime = 0
            } else {
                audio.play()
            }
        }
    }

    function shake(){
        shakeAnim.start({
            margin: [-.5, -.5, -.5, -.5, -.5],
            x: [0, -10, 10, -10, 0],
            y: [0, -10, 10, -10, 0]
        })
    }

    async function checkRewards() {
        for (let i = 0; i < rewards.length; i++) {
            const reward = rewards[i]
            // Check if reward is already obtained
            if (obtainedRewards.includes(reward)) continue
            // Check if reward is mined
            let mined = true
            for (let i = reward.y; i < reward.y + reward.reward.height; i++) {
                for (let j = reward.x; j < reward.x + reward.reward.width; j++) {
                    if (mineMap[i][j].estado !== 0) {
                        mined = false
                        break
                    }
                }
            }

            if (mined) {
                setObtainedRewards([...obtainedRewards, reward])
                playSound('item')
            }
        }
    }

    async function gameOver() {
        if(open) return
        setOpen(true)
        let obtained = obtainedRewards.map(reward => ({id: reward.reward.id, value: reward.reward.value}))
        await rotomPOST('/mine/endgame', {uuid: session?.user.smartRotomUser.uuid, rewards: obtained})
        await setIndex(index + 1)
    }

    return (
        <div className="bg-cover bg-repeat  overflow-hidden" style={{backgroundImage: 'url(/smartrotom/img/apps/mina/gui/fondo.png)'}}>
            <AlertDialog open={open}>
                <AlertDialogContent className='bg-surface-900 border-surface-950'>
                    {obtainedRewards.length === 0 ?  <></> : <div className="w-full text-surface-50 text-center text-2xl">Recompensas obtenidas</div>}
                    <div className="flex flex-row justify-center items-center">
                    {obtainedRewards.map((reward, i) => {
                        return (
                            <div key={i} className="flex flex-col flex-wrap w-ful justify-center items-center m-2">
                                <img src={`/smartrotom/img/apps/mina/recompensas/${reward.reward.itemId.split(':')[1]}.png`} alt="" 
                                    className="w-12 h-12"
                                    style={{imageRendering: "pixelated"}}
                                    
                                    />
                                <div className="text-surface-50">{reward.reward.name}</div>
                            </div>
                    )})}
                    </div>
                    <BarraEnergia/>
                    <div className="flex justify-evenly">
                        <Button 
                            className="text-surface-50 border border-surface-50 hover:bg-surface-600"
                            onClick={async () => {
                                jugar(session, router, "/smartrotom/mina")
                                setOpen(false)
                                generateMap()
                            }}>
                            {index === 0 ? 'Jugar' : 'Volver a Jugar'}</Button>
                        <Button className="text-surface-50 border border-surface-50 hover:bg-surface-600" onClick={() => router.replace('/smartrotom/mina')}>Cerrar</Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
       
        <motion.div className="flex w-full h-full"
        
        >
            <audio id='pick' src='/smartrotom/audio/apps/mina/pick.ogg'></audio>
            <audio id='hammer' src='/smartrotom/audio/apps/mina/hammer.mp3'></audio>
            <audio id='item' src='/smartrotom/audio/apps/mina/item.mp3'></audio>

            <div className="h-full flex-1 flex flex-col ">
                <div className="bg-red-400 h-[10vh]" >
                    <img className="h-full w-full m-auto" src={`/smartrotom/img/apps/mina/barra/barra${damage}.png`} alt="" />
                </div>
                <div className="relative w-full h-full flex-col overflow-auto">
                <div id="rewards" className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
                    {rewards.map((reward, i) => {
                        return (
                            <motion.div key={i} className="absolute z-0"
                            animate={shakeAnim} style={{
                                top: `calc(${(reward.y - 1) * 100 / rowNum}% + ${100 / rowNum}%)`, 
                                left: `calc(${(reward.x -1) * 100 / colNum}% + ${100 / colNum}%)`, 
                                width: `${reward.reward.width * 100 / colNum}%`, 
                                height: `${reward.reward.height * 100 / rowNum}%`
                            }}>
                                <img src={`/smartrotom/img/apps/mina/recompensas/${reward.reward.itemId.split(':')[1]}.png`} 
                                alt="" 
                                className="w-full h-full z-0"
                                style={{imageRendering: "pixelated"}}
                                
                                />
                            </motion.div>
                        )
                    })}
                </div>
                <div id='game' className="h-full z-10  overflow-auto">
                    {mineMap.map((row, i) => {
                        return (
                            <div key={i} className={`flex `} style={{height:`${100/rowNum}%`}}> 
                                {row.map((cell, j) => {
                                    return (
                                        <motion.div key={j} className={`flex-1 hover:cursor-pointer z-10 `}
                                        animate={shakeAnim}
                                        
                                        onClick={() => {
                                            click(i, j)
                                            shake()
                                        }}
                                        >
                                        <img className="hover:brightness-110 h-full w-full z-10 select-none no-drag " src={`/smartrotom/img/apps/mina/gui/muro${cell.estado}.png`} alt="" />
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
                </div >
            </div>
            <div className="bg-blue-400 h-full w-[15%] flex flex-col items-center justify-end pt-72  bg-no-repeat bg-cover" style={{backgroundImage:`url(/smartrotom/img/apps/mina/gui/barraHerramientas.png)`}}>
                <img onClick={() => setTool(Tool.PICKAXE)} className="m-auto w-full  p-2lg:p-6" src={`/smartrotom/img/apps/mina/gui/btn_azul${tool === Tool.PICKAXE ? '1': '0'}.png`} alt="" />
                <img onClick={() => setTool(Tool.HAMMER)} className="m-auto  w-full p-2 lg:p-6" src={`/smartrotom/img/apps/mina/gui/btn_rojo${tool === Tool.HAMMER ? '1': '0'}.png`} alt="" />
            </div>
        </motion.div>
        </div>
    )
}