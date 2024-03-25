"use client"
import { BoffSession } from '@/components/smartrotom/AppWrapper';
import { rotomGET } from '@/services/boffAPI';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

type Energy = {
    energy: number;
    maxEnergy: number;
    lastCharge: string;
}

export function BarraEnergia() {
    const {data: session} = useSession() as {data: BoffSession | null}
    const [energy, setEnergy] = useState(0)
    const [maxEnergy, setMaxEnergy] = useState(0)
    const [ultimaRecarga, setUltimaRecarga] = useState<Date>(new Date())
    const [diff, setDiff] = useState(0)
    

    useEffect(() => {
        getEnergy()
    }, [session])

    function getEnergy() {
        if(session){
            rotomGET(`/mine/energy/${session.user?.smartRotomUser.uuid}`).then((res:Energy) => {
                setMaxEnergy(res.maxEnergy)
                setEnergy(res.energy)

                let date = new Date(Date.parse(res.lastCharge))
                setUltimaRecarga(date)

                const diff = date?.getTime() - new Date().getTime() + 3600000;
                setDiff(diff)
            })
    }}

    useEffect(() => {
        const interval = setInterval(() => {
            let dif = diff - 1000;
            setDiff(diff - 1000)
            if(dif <= 0 && energy < maxEnergy) {
                getEnergy()
            }
        }, 1000)



        return () => clearInterval(interval)
    }, [diff, energy, maxEnergy])
    

    function getHour() {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    return (
        <div className='flex flex-col w-full ml-auto mt-auto text-gray-100 text-shadow-border1  text-xl '>
        {energy >= maxEnergy ? 
            <></> : 
            <div className='mx-auto '>Siguiente recarga en: {getHour()}</div>
        }
        <motion.div className=" ml-auto px-1 w-full flex  rounded-lg border-2 border-gray-900 bg-gray-900 flex-wrap items-start justify-start">
            <AnimatePresence>
                {[...Array(maxEnergy)].map((_, i) => {
                    let color;
                    let num = i + 1;
                    const sobrecarga = i + maxEnergy < energy ? 1 : 0;

                    if (i < energy) {
                        color = sobrecarga ? 'orange' : 'rgb(22 163 74)';
                    } else {
                        color = 'rgb(75 85 99)';
                    }
                    sobrecarga ? num+=maxEnergy : num;
                    return <motion.div
                        key={i}
                        style={{ width: `${100 / 10 }%` }}
                        className={` rounded-lg h-20 border-y-4 border-x-2 border-gray-900 text-center flex items-center justify-center`}
                        initial={{ backgroundColor: 'rgb(75 85 99)', scaleY: 1 }}
                        animate={{ backgroundColor: color, scaleY: 1 }}
                        transition={{ delay: i * 0.1 }}
                    >{num}</motion.div>
                })}
            </AnimatePresence>
        </motion.div>

        </div>
    );
}
