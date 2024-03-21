"use client"
import './mina.css'
import Link from "next/link";
import { useEffect, useState } from "react";
import {AnimatePresence, motion} from 'framer-motion'
import { useSession } from 'next-auth/react';
import { rotomGET, rotomPOST } from '@/services/boffAPI';
import { BoffSession } from '@/components/smartrotom/AppWrapper';
import { useRouter } from 'next/navigation';

export default function Mina(){
    const {data: session} = useSession() as {data: BoffSession | null}
    const [energia, setEnergia] = useState(0)
    const [energiaMax, setEnergiaMax] = useState(0)
    const [ultimaRecarga, setUltimaRecarga] = useState<Date>(new Date())
    const [iniciar, setIniciar] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if(session){
            rotomGET(`/mina/energia/${session.user?.smartRotomUser.uuid}`).then(res => {
                setEnergiaMax(res.energiaMax)
                
                setEnergia(res.energia)

                let date = new Date(Date.parse(res.ultimaRecarga))
                setUltimaRecarga(date)
            })
        }
    }, [session, iniciar])
    


    return (
            <div className={`relative h-full bg-cover bg-center noSelect`} style={{backgroundImage: "url('/smartrotom/img/fondoMina.avif')", fontFamily: 'Minecrafter'}}>
                <div className={`p-4 h-full w-full lg:w-3/5 ml-auto mr-5 flex flex-col`}>
                <div className={`text-6xl md:text-8xl font-custom margin-2 text-right text-gray-100 text-shadow-border3 `}>Mina 2.0</div>
                <motion.div
                whileHover={{scale: 1.1}}
                whileTap={{scale: 0.9}}
                className="text-4xl lg:text-6xl ml-auto text-gray-100 text-shadow-border3 hover:cursor-pointer mt-12 mb-2 " onClick={() => jugar()}>Jugar</motion.div>
                <LinkMina href='/smartrotom/mina/historial'>Historial</LinkMina>
                <LinkMina href='/smartrotom/mina/ranking'>Ranking</LinkMina>
                <LinkMina href='/smartrotom/mina/drops'>Drops</LinkMina>
                <LinkMina href='/smartrotom/mina/reclamar'>Reclamar</LinkMina>
                <LinkMina href='/smartrotom'>Salir</LinkMina>
                <BarraEnergia/> 
            </div>
        </div>
    )



    function jugar(){
        rotomPOST('/mina/jugar', {uuid: session?.user.smartRotomUser.uuid}).then(res => {
            if(res.error){
                alert(res.error)
            }
            router.push('/smartrotom/mina/jugar')
        }).catch(err => {
            console.error(err)
        })
    }


    function BarraEnergia() {
        const diff = ultimaRecarga?.getTime() - new Date().getTime() + 3600000;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        return (
            <div className='flex flex-col w-1/2 ml-auto mt-auto text-gray-100 text-shadow-border1  text-xl '>
            {energia === energiaMax ? 
                <></> : 
                <div className='mx-auto '>Siguiente recarga en: {`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</div>
            }
            <motion.div className=" ml-auto w-full flex  rounded-lg border-2 border-gray-900 bg-gray-900 flex-wrap items-start justify-start">
                <AnimatePresence>
                    {[...Array(energiaMax)].map((_, i) => {
                        let color = i < energia ? 'rgb(22 163 74)' : 'rgb(75 85 99)'
                        return <motion.div
                            key={i}
                            style={{ width: `${100 / 10 }%` }}
                            className={` rounded-lg h-20 border-y-4 border-x-2 border-gray-900 text-center flex items-center justify-center`}
                            initial={{ backgroundColor: 'rgb(75 85 99)', scaleY: 1 }}
                            animate={{ backgroundColor: color, scaleY: 1 }}
                            transition={{ delay: i * 0.1 }}
                        >{i+1}</motion.div>
            })}
                </AnimatePresence>
            </motion.div>

            </div>
        );
    }
}

function LinkMina({href, children} : {href: string, children: any}){
    return (
        <Link className="text-4xl lg:text-6xl ml-auto text-gray-100 text-shadow-border3 my-2" href={href}>
            <motion.div
                whileHover={{scale: 1.1}}
                whileTap={{scale: 0.9}}
            >
                {children}
            </motion.div>
        
    </Link>
)}

