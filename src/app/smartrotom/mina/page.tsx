"use client"
import './mina.css'
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from 'next-auth/react';
import { rotomGET, rotomPOST } from '@/services/boffAPI';
import { BoffSession } from '@/components/smartrotom/AppWrapper';
import { useRouter } from 'next/navigation';
import { BarraEnergia } from './_components/BarraEnergia';
import { motion } from 'framer-motion';
import MenuWrapper from './_components/MenuWrapper';

export default function Mina(){
    const {data: session} = useSession() as {data: BoffSession | null}
    const [energia, setEnergia] = useState(0)
    const [energiaMax, setEnergiaMax] = useState(0)
    const [ultimaRecarga, setUltimaRecarga] = useState<Date>(new Date())
    const [iniciar, setIniciar] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if(session){
            rotomGET(`/mine/energy/${session.user?.smartRotomUser.uuid}`).then(res => {
                setEnergiaMax(res.energiaMax)
                
                setEnergia(res.energia)

                let date = new Date(Date.parse(res.ultimaRecarga))
                setUltimaRecarga(date)
            })
        }
    }, [session, iniciar])
    


    return (
            <MenuWrapper>
                <div className={`p-4 h-full w-full lg:w-3/5 ml-auto mr-5 flex flex-col`}>
                <div className={`text-2xl xl:text-8xl font-custom margin-2 text-right text-gray-100 text-shadow-border3 `}>Mina 2.0</div>
                <LinkMina className='mt-12' href='/smartrotom/mina/jugar'>Jugar</LinkMina>
                <LinkMina href='/smartrotom/mina/historial'>Historial</LinkMina>
                <LinkMina href='/smartrotom/mina/ranking'>Ranking</LinkMina>
                <LinkMina href='/smartrotom/mina/drops'>Drops</LinkMina>
                <LinkMina href='/smartrotom/mina/reclamar'>Reclamar</LinkMina>
                <LinkMina href='/smartrotom'>Salir</LinkMina>
                <div className=' w-1/2 ml-auto mt-auto'><BarraEnergia /></div>
                
            </div>
        </MenuWrapper>
    )
}

function LinkMina({href, children, className} : {href: string, children: any, className?: string}){
    return (
        <Link className={`text-xl xl:text-6xl ml-auto text-gray-100 text-shadow-border3 my-2 ${className}`} href={href}>
            <motion.div
                whileHover={{scale: 1.1}}
                whileTap={{scale: 0.9}}>
                {children}
            </motion.div>
        
    </Link>
)}

