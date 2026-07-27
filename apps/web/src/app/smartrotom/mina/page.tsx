import { getTranslations } from 'next-intl/server';

import './mina.css'
import { BarraEnergia } from './_components/BarraEnergia';
import MenuWrapper from './_components/MenuWrapper';
import { LinkMina } from './_components/LinkMina';

export default async function Mina(){
    const t = await getTranslations('mina');
    return (
            <MenuWrapper>
                <div className={`p-4 h-full w-full lg:w-3/5 ml-auto mr-5 flex flex-col`}>
                <div className={`text-2xl xl:text-8xl font-custom margin-2 text-right text-ink text-shadow-border3 `}>{t('menu.title')}</div>
                <LinkMina className='mt-12' href='mina/jugar'>{t('menu.play')}</LinkMina>
                <LinkMina href='mina/historial'>{t('menu.history')}</LinkMina>
                <LinkMina href='mina/ranking'>{t('menu.ranking')}</LinkMina>
                <LinkMina href='mina/drops'>{t('menu.drops')}</LinkMina>
                <LinkMina href='mina/reclamar'>{t('menu.claim')}</LinkMina>
                <LinkMina href=''>{t('menu.exit')}</LinkMina>
                <div className=' w-1/2 ml-auto mt-auto'><BarraEnergia /></div>
            </div>
        </MenuWrapper>
    )
}

