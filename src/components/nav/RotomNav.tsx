"use client"
import { Hora } from "../Hora";
import { ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import {BellAlertIcon} from '@heroicons/react/24/solid'
import BreadcrumbNav from "./BreadbrumbNav";
import { BotonAjustes, BotonIA, BotonNext, BotonNotification, BotonPrev, BotonReload } from "./BotonNav";
import useSocketStore from "@/app/useSocketStore";
import { use, useEffect, useState } from "react";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Socket } from "socket.io-client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Popover, PopoverTrigger } from "../ui/popover";
import { PopoverContent } from "@radix-ui/react-popover";


import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import FicusAI from "../smartrotom/FicusAI";
import Ajustes from "@/app/smartrotom/settings/page";


export default function RotomNav({setTema} : {setTema: (tema: string) => void}){
    const { socket, connect } = useSocketStore();
    const pathname = usePathname()
    useEffect(() => {
        if(!socket) {
          connect();
          return
        }

        socket.on('patata', () => console.log('Patata'));
        socket.on('connection', () => console.log('Connected'));
        socket.emit('patata', null);
      }, [socket, connect]);


    return (
        <nav className={`h-12 bg-zinc-900 flex items-center px-2`}>
            <BotonPrev />
            <BotonNext />
            <BotonReload />
            <BreadcrumbNav className="flex-1 mx-1"/>
            <BotonNotification />
            <Sheet>
                <SheetTrigger>
                    <BotonAjustes />
                </SheetTrigger>
                <SheetContent side="top" className="bg-zinc-900 text-white border-none" parentId="smartrotom">
                    <SheetHeader>
                        <SheetTitle className="text-white">Ajustes</SheetTitle>
                        <SheetDescription>
                            <Ajustes setTema={setTema} />
                        </SheetDescription>
                     </SheetHeader>
                    </SheetContent>
            </Sheet>

            <Sheet>
                <SheetTrigger>
                    <BotonIA />
                </SheetTrigger>
                <SheetContent side="right" className="bg-zinc-900 text-white border-none flex flex-col w-max" parentId="smartrotom">
                    <SheetHeader>
                        <SheetTitle className="text-white text-2xl font-bold">FicusAI</SheetTitle>
                    </SheetHeader>
                        <SheetDescription className="h-full overflow-hidden">
                            <FicusAI />
                        </SheetDescription>
                    </SheetContent>
            </Sheet>
            <Hora className="text-white text-3xl mx-1" />
            <SocketStatus socket={socket}/>
           
        </nav>
    )
}

function BotonNav({Icono, strokeWidth = 5, onClick = null} : {onClick?:any,strokeWidth?: number, Icono: React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>>>}){
    return (
        <button className="rounded-lg border-0 h-8 w-8 mx-2 bg-white flex items-center justify-center" onClick={onClick}>
            <Icono strokeWidth={strokeWidth} height={28} width={28} className="text-rotom-500"/>
        </button>
    )
}


function SocketStatus ({socket}: {socket: Socket | null}){
    return (
        <Tooltip>
            <TooltipTrigger>
                <div className='cursor-pointer text-white h-10 text-xl flex items-center'>
                    <span >{socket && socket.connected ? '🟢' : '🔴'}</span>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                {socket && socket.connected ? `Conectado con id ${socket.id}` : 'No conectado'}
            </TooltipContent>
        </Tooltip>
    )
}