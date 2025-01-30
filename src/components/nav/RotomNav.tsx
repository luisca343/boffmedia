"use client";
import { Hora } from "../Hora";
import { useEffect } from "react";
import { Badge } from "../ui/badge";
import { Socket } from "socket.io-client";
import BreadcrumbNav from "./BreadbrumbNav";
import FicusAI from "../smartrotom/FicusAI";
import { usePathname } from "next/navigation";
import { getSmartRotomUser } from "@/lib/utils";
import { Bell, Check, Trash2, X } from "lucide-react";
import { SettingsPage } from "../smartrotom/Settings";
import { Popover, PopoverTrigger } from "../ui/popover";
import { PopoverContent } from "@radix-ui/react-popover";
import { useBoffSession } from "@/services/useBoffSession";
import { MinecraftFunctions } from "../smartrotom/MinecraftFunctions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNotificationCenter } from "react-toastify/addons/use-notification-center";
import { BotonAjustes, BotonIA, BotonNext, BotonNotification, BotonPrev, BotonReload } from "./BotonNav";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import useSocketStore from "@/stores/useSocketStore";

export default function RotomNav({
  setTema,
}: {
  setTema: (tema: string) => void;
}) {
  const { socket, connect } = useSocketStore();
  const { session } = useBoffSession();

  const {
    notifications,
    clear,
    markAllAsRead,
    markAsRead,
    remove,
    unreadCount,
  } = useNotificationCenter();

  const pathname = usePathname();

  useEffect(() => {
    if (!socket && session) {
      connect(getSmartRotomUser(session));
      return;
    }

    /*
        socket.on('patata', () => console.log('Patata'));
        socket.on('connection', () => console.log('Connected'));
        socket.emit('patata', null);*/
  }, [socket, connect, session]);

  useEffect(() => {}, [pathname]);

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

  function Notifications() {
    return (
      <div className="w-80 bg-surface-800 rounded-lg shadow-lg overflow-hidden">
        <header className="bg-surface-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="text-surface-300" size={20} />
            <h2 className="text-surface-100 font-semibold">Notificaciones</h2>
          </div>
          <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
            {unreadCount}
          </span>
        </header>
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded text-sm flex flex-col ${
                notif.read
                  ? "bg-surface-700 text-surface-400"
                  : "bg-surface-600 text-surface-200"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="flex-grow">{notif.content?.toString()}</span>
                {!notif.read && (
                  <span className="bg-blue-500 w-2 h-2 rounded-full flex-shrink-0 ml-2 mt-1"></span>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="text-surface-400 hover:text-white"
                    aria-label="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  onClick={() => remove(notif.id)}
                  className="text-surface-400 hover:text-white"
                  aria-label="Delete notification"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <footer className="bg-surface-700 p-2 flex justify-between">
          <button
            onClick={clear}
            className="flex items-center space-x-1 text-surface-300 hover:text-white text-sm"
          >
            <Trash2 size={16} />
            <span>Limpiar</span>
          </button>
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-1 text-surface-300 hover:text-white text-sm"
          >
            <Check size={16} />
            <span>Marcar todas como leídas</span>
          </button>
        </footer>
      </div>
    );
  }

  return (
    <nav
      className={`h-12 z-20 flex items-center px-2 fixed w-full ${
        pathname.includes("pokedex") ? "bg-surface-950" : "bg-surface-800"
      }`}
    >
      <BotonPrev />
      <BotonNext />
      <BotonReload />
      <BreadcrumbNav className="flex-1 mx-1 invisible w-0 sm:w-auto sm:visible " />
      <Sheet>
        <SheetTrigger>
          <BotonAjustes />
        </SheetTrigger>
        <SheetContent
          side="top"
          className="bg-surface-800 text-surface-50 border-none"
        >
          <SheetHeader>
            <SheetTitle className="text-surface-50">Ajustes</SheetTitle>
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
        <SheetContent
          side="right"
          className="bg-surface-800 text-surface-50 border-none flex flex-col w-max"
        >
          <SheetHeader>
            <SheetTitle className="text-surface-50 text-2xl font-bold">
              FicusAI
            </SheetTitle>
          </SheetHeader>
          <SheetDescription className="h-full overflow-hidden">
            <FicusAI />
          </SheetDescription>
        </SheetContent>
      </Sheet>
      <Popover>
        <PopoverTrigger className="relative">
          <BotonNotification />
          {notifications.length > 0 && (
            <Badge className="z-50 px-2 -bottom-2 -right-2 absolute bg-primary-400 text-black hover:bg-primary-400">
              {unreadCount}
            </Badge>
          )}
        </PopoverTrigger>
        <PopoverContent className="z-50">
          <Notifications />
        </PopoverContent>
      </Popover>
      <Hora className="text-surface-50 text-3xl mx-1" />
      <SocketStatus socket={socket} />
      <MinecraftFunctions />
    </nav>
  );
}

function BotonNav({
  Icono,
  strokeWidth = 5,
  onClick = null,
}: {
  onClick?: any;
  strokeWidth?: number;
  Icono: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>>
  >;
}) {
  return (
    <button
      className="rounded-lg border-0 h-8 w-8 mx-2 bg-surface-50 flex items-center justify-center"
      onClick={onClick}
    >
      <Icono
        strokeWidth={strokeWidth}
        height={28}
        width={28}
        className="text-primary-500"
      />
    </button>
  );
}

function SocketStatus({ socket }: { socket: Socket | null }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="cursor-pointer text-surface-50 h-10 text-xl flex items-center">
          <span>{socket && socket.connected ? "🟢" : "🔴"}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {socket && socket.connected
          ? `Conectado con id ${socket.id}`
          : "No conectado"}
      </TooltipContent>
    </Tooltip>
  );
}
