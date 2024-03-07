"use client"
import { Hora } from "../Hora";
import { ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import {BellAlertIcon} from '@heroicons/react/24/solid'
import BreadcrumbNav from "./BreadbrumbNav";
import { BotonNext, BotonNotification, BotonPrev, BotonReload } from "./BotonNav";
import useSocketStore from "@/app/useSocketStore";
import { use, useEffect } from "react";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Socket } from "socket.io-client";

import { signIn, signOut } from "next-auth/react";



export default function RotomNav(){
    const { socket, connect } = useSocketStore();
    useEffect(() => {
        if(!socket) {
          connect();
          return
        }
        console.log('Socket connected');
        console.log(socket);
        socket.on('patata', () => console.log('Patata'));
        socket.on('connection', () => console.log('Connected'));
        socket.emit('patata', null);
      }, [socket, connect]);


    return (
        <nav className="h-12 bg-zinc-900 flex items-center">
        <button className="text-white mx-1" onClick={() => signIn('google')}>Sign in</button>
        <button className="text-white mx-1" onClick={() => signOut()}>Sign out</button>
            <BotonPrev />
            <BotonNext />
            <BotonReload />
            <BreadcrumbNav className="flex-1"/>
            <BotonNotification />
            <Hora className="text-white text-3xl mr-2" />
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