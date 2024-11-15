import './mina.css'
import { BarraEnergia } from './_components/BarraEnergia';
import MenuWrapper from './_components/MenuWrapper';
import { LinkMina } from './_components/LinkMina';

export default function Mina(){
    return (
            <MenuWrapper>
                <div className={`p-4 h-full w-full lg:w-3/5 ml-auto mr-5 flex flex-col`}>
                <div className={`text-2xl xl:text-8xl font-custom margin-2 text-right text-surface-100 text-shadow-border3 `}>Mina 2.0</div>
                <LinkMina className='mt-12' href='/mina/jugar'>Jugar</LinkMina>
                <LinkMina href='/mina/historial'>Historial</LinkMina>
                <LinkMina href='/mina/ranking'>Ranking</LinkMina>
                <LinkMina href='/mina/drops'>Drops</LinkMina>
                <LinkMina href='/mina/reclamar'>Reclamar</LinkMina>
                <LinkMina href='/'>Salir</LinkMina>
                <div className=' w-1/2 ml-auto mt-auto'><BarraEnergia /></div>
            </div>
        </MenuWrapper>
    )
}

