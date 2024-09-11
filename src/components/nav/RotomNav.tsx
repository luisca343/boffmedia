"use client"
import { Hora } from "../Hora";
import BreadcrumbNav from "./BreadbrumbNav";
import { BotonAjustes, BotonIA, BotonNext, BotonNotification, BotonPrev, BotonReload } from "./BotonNav";
import useSocketStore from "@/app/useSocketStore";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Socket } from "socket.io-client";
import { usePathname } from "next/navigation";
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
import { useNotificationCenter } from "react-toastify/addons/use-notification-center";
import { Badge } from "../ui/badge";
import { MinecraftFunctions } from "../smartrotom/MinecraftFunctions";
import { SettingsPage } from "../smartrotom/Settings";
import { useSession } from "next-auth/react";
import { getSmartRotomUser } from "@/lib/utils";


export default function RotomNav({setTema} : {setTema: (tema: string) => void}){
    const { socket, connect } = useSocketStore();
    const {data: session} = useSession()


    const {
      notifications,
      clear,
      markAllAsRead,
      markAsRead,
      remove,
      unreadCount
    } = useNotificationCenter();
  
    const pathname = usePathname()
    
    useEffect(() => {
        console.log('RotomNav');
        if(!socket && session) {
          connect(getSmartRotomUser(session));
          return
        }
        
        /*
        socket.on('patata', () => console.log('Patata'));
        socket.on('connection', () => console.log('Connected'));
        socket.emit('patata', null);*/
      }, [socket, connect, session]);

      useEffect(() => {

      }, [pathname])

    
    useEffect(() => {
        /*
        const handleKeyDown = (event: KeyboardEvent) => {
            toast('Tecla pulsada: ' + event.key);
        };
    
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };*/
    }, []);

      
    function Notifications(){
        return(
            <div className="flex flex-col bg-main-300 w-[33vw] rounded-md z-50 bg-pri">
                <header className="flex justify-between items-center bg-main-800 p-4">
                    <h2 className="text-main-50">Notificaciones</h2>
                    <button onClick={clear} className="text-main-50">Limpiar</button>
                    <button onClick={markAllAsRead} className="text-main-50">Marcar todas como leídas</button>
                    <span className="text-main-50">{unreadCount}</span>
                </header>
                <div className="flex flex-col bg-main-300 p-4">
                    {notifications.map((notif, i) => <div key={i} className="text-main-50 bg-main-500 p-2 m-2">{notif.content?.toString()}</div>)}
                </div>

        </div>
        )
    }

    return (
        <nav className={`h-12  flex items-center px-2 ${pathname.includes('pokedex') ? 'bg-main-950' : 'bg-main-900'}`}>
            <BotonPrev />
            <BotonNext />
            <BotonReload />
            <BreadcrumbNav className="flex-1 mx-1 invisible w-0 sm:w-auto sm:visible "/>
            <Sheet>
                <SheetTrigger>
                    <BotonAjustes />
                </SheetTrigger>
                <SheetContent side="top" className="bg-main-900 text-main-50 border-none" parentId="smartrotom">
                    <SheetHeader>
                        <SheetTitle className="text-main-50">Ajustes</SheetTitle>
                        <SheetDescription>
                            <SettingsPage setTema={setTema} />
                        </SheetDescription>
                     </SheetHeader>
                    </SheetContent>
            </Sheet>
            <Sheet>
                <SheetTrigger>
                    <BotonIA />
                </SheetTrigger>
                <SheetContent side="right" className="bg-main-900 text-main-50 border-none flex flex-col w-max" parentId="smartrotom">
                    <SheetHeader>
                        <SheetTitle className="text-main-50 text-2xl font-bold">FicusAI</SheetTitle>
                    </SheetHeader>
                        <SheetDescription className="h-full overflow-hidden">
                            <FicusAI />
                        </SheetDescription>
                    </SheetContent>
            </Sheet>
            <Popover>
                <PopoverTrigger className="relative">
                    <BotonNotification />
                    {
                        notifications.length > 0 && <Badge className="z-50 px-2 -bottom-2 -right-2 absolute bg-primary-400 text-black hover:bg-primary-400">{unreadCount}</Badge>
                    }
                </PopoverTrigger>
                <PopoverContent className="z-50">
                    <Notifications />
                </PopoverContent>
            </Popover>
            <Hora className="text-main-50 text-3xl mx-1" />
            <SocketStatus socket={socket}/>
            <MinecraftFunctions />
        </nav>
    )
}


function BotonNav({Icono, strokeWidth = 5, onClick = null} : {onClick?:any,strokeWidth?: number, Icono: React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>>>}){
    return (
        <button className="rounded-lg border-0 h-8 w-8 mx-2 bg-main-50 flex items-center justify-center" onClick={onClick}>
            <Icono strokeWidth={strokeWidth} height={28} width={28} className="text-primary-500"/>
        </button>
    )
}


function SocketStatus ({socket}: {socket: Socket | null}){
    return (
        <Tooltip>
            <TooltipTrigger>
                <div className='cursor-pointer text-main-50 h-10 text-xl flex items-center'>
                    <span >{socket && socket.connected ? '🟢' : '🔴'}</span>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                {socket && socket.connected ? `Conectado con id ${socket.id}` : 'No conectado'}
            </TooltipContent>
        </Tooltip>
    )
}
