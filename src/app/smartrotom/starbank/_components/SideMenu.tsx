import React, { useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { BanknotesIcon, CalendarIcon, ChartBarIcon, ChevronRightIcon, ChevronUpIcon, CreditCardIcon, CurrencyYenIcon, HomeIcon, PresentationChartLineIcon, TicketIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { InternalLink } from '@/components/nav/Link';
const items = [
  {
    text: 'General',
    icon: HomeIcon,
    url: '/starbank/'
  },
  {
    text: 'Cuentas',
    icon: CreditCardIcon,
    url: '/starbank/cuentas'
  },
  {
    text: 'Transacciones',
    icon: CurrencyYenIcon,
    url: '/starbank/transacciones'
  },
  {
    text: 'Enviar Dinero',
    icon: BanknotesIcon,
    url: '/starbank/enviar'
  },
  {
    text: 'Facturas',
    icon: TicketIcon,
    url: '/starbank/facturas'
  },
  {
    text: 'Gráficas',
    icon: PresentationChartLineIcon,
    url: '/starbank/graficas'
  },
  {
    text: 'Calendario de Pagos',
    icon: CalendarIcon,
    url: '/starbank/calendario'
  }
]
const containerVariants = {
  opened: { width: '20rem' },
  closed: { width: '8rem' }
}
const menuItemVariants = {
  initial: {
    opacity: 0,
    fontSize: '0px',
    lineHeight: '0rem',
  },
  opened: {
    opacity: 1,
    fontSize: '1.4rem',
    lineHeight: '2rem',
    transition: { 
      duration: .5, 
      ease: 'easeIn'
    }
  },
  closed: {
    opacity: 0,
    fontSize: '0px',
    lineHeight: '0rem',
    transition: {
      duration: .9,
      ease: [.1, 1, .57, 1]
    }
  }
}
const menuIconVariants = {
  opened: (i: number) => ({
    x: [0, i*2.4, 0],
  }), 
  closed: (i: number) => ({
    x: [0, -i*2.4, 0],
  })
}
const MenuItem = ({ isOpened, i, item: { text, Icon, url } }: { isOpened: boolean, i: number, item: { text: string, Icon: any, url:string } }) => {
  return (
    <InternalLink href={url}>
      <motion.div 
        className="flex items-center text-blue-100  hover:text-blue-300 cursor-pointer " 
        variants={menuIconVariants}
        custom={i}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: .5 }}
      >
      <Icon strokeWidth={2} height={32} width={32} className="my-4 ml-4"/>
        <AnimatePresence>
          {isOpened && (
            <motion.div 
              initial="initial"
              variants={menuItemVariants}
              className='text-2xl font-bold ml-4'
            >
              {text}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </InternalLink>    
  );
}
export const SideMenu = () => {
  const [isOpened, setIsOpened] = useState(false);
  const controls = useAnimation();
  return (
    <div className="h-full ">
      <motion.div 
        className="mx-auto  w-full h-full  relative"
        initial="closed"
        variants={containerVariants}
        animate={isOpened ? 'opened' : 'closed'}
        transition={{ 
          duration: .8, 
          staggerChildren: .015, 
          staggerDirection: isOpened ? 1 : -1 
        }}
        onMouseOver={() => controls.start({ left: 'calc(100% - 2rem)' })}
        onMouseOut={() => !isOpened && controls.start({ left: 'calc(100% - 6rem)' })} 
      >
        <div className="h-full w-full bg-blue-950 flex flex-col  relative z-10">
          <div className="w-full bg-main-900 h-24  text-blue-100 font-bold italic pointer-events-none flex items-center justify-center rounded-b-xl">
            <div className="bg-main-50 min-w-16 h-16 rounded-full text-center text-9xl flex items-center mx-2">
              <img src="/smartrotom/img/apps/starbank.webp" alt="logo" className="h-16 w-16" />
            </div>
            <AnimatePresence>
              {isOpened && (
                <motion.div variants={menuItemVariants}>
                  <div className="text-main-50 text-4xl font-bold">StarBank</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.div 
            className="mt-6 ml-4 mr-4 py-4 min-w-32 text-main-800 text-6xl grid place-items-center grid-cols-32 auto-cols-min rounded-lg"
            transition={{ duration: .6 }}
            whileHover={{ 
              transition: { duration: .2 } 
            }}
          >
          </motion.div>
          <div className='mt-8 mx-8'>
          {items.map((item, i) => {
            if (!item.text) return (
              <motion.div 
                className="line" 
                key={i}
                animate={{ 
                  width: isOpened ? '75%' : '60%',
                  transition: { duration: .8 }
                }}
              />
            )
            return (
              <MenuItem 
                isOpened={isOpened} 
                item={{ text: item.text.toString(), Icon: item.icon, url: item.url}} 
                i={i+1}
                key={i} 
              />
            )
          })}
          </div>
        </div>
    
        <motion.div 
          className={`absolute h-14 w-14 top-28  bg-blue-950 rounded-lg transform rotate-45 text-right pt-1 pr-1.5 text-xl z-10 cursor-pointer `}
          animate={controls}
          initial={{ left: 'calc(100% - 6rem)' }}
          onClick={() => setIsOpened(!isOpened)}
        >
          <motion.div
            animate={{ rotate: isOpened ? 135 : -45, marginLeft: isOpened ? '0' : '0.5rem' }}
          ><ChevronRightIcon strokeWidth={3} height={48} width={48} className='text-blue-100'/></motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}