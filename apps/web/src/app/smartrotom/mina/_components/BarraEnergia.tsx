"use client"
import { useGetEnergy } from '@/hooks/mina/useGetEnergy';
import { useBoffSession } from '@/services/useBoffSession';
import { AnimatePresence, motion } from 'framer-motion';

export function BarraEnergia() {
    const { session } = useBoffSession();
    const { energy, maxEnergy, diff } = useGetEnergy(session.user?.smartRotomUser?.uuid!)
    
    function getHour() {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    
    return (
        <div className='flex flex-col w-full ml-auto mt-auto text-ink text-shadow-border1 tex-lg  xl:text-xl '>
        {energy >= maxEnergy ? 
            <></> : 
            <div className='mx-auto '>Siguiente recarga en: {getHour()}</div>
        }
        <motion.div className=" ml-auto px-1 w-full flex  rounded-lg border-2 border-edge-strong bg-layer-1 flex-wrap items-start justify-start">
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
            className={` rounded-lg h-12 xl:h-20 border-y-4 border-x-2 border-edge-strong text-center flex items-center justify-center`}
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
