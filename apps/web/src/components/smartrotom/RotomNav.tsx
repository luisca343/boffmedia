"use client";
import { Hora } from "@/components/ui/Hora";
import { useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import BreadcrumbNav from "@/components/smartrotom/BreadcrumbNav";
import FicusAI from "@/features/ficusai/components/FicusAI";
import { usePathname } from "next/navigation";
import { getSmartRotomUser } from "@/lib/utils";
import { Bell, Check, X } from "lucide-react";
import { SettingsPage } from "@/components/smartrotom/Settings";
import { Popover, PopoverTrigger } from "@/components/ui/primitives/popover";
import { PopoverContent } from "@radix-ui/react-popover";
import { useBoffSession } from "@/services/useBoffSession";
import { MinecraftFunctions } from "@/components/smartrotom/MinecraftFunctions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/primitives/tooltip";
import { SettingsButton, AIButton, NextButton, NotificationButton, PrevButton, ReloadButton } from "@/components/ui/navigation/NavButton";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/primitives/sheet";
import useSocketStore from "@/stores/useSocketStore";
import LanguageSwitcher from "@/components/ui/navigation/LanguageSwitcher";
import { SmartRotomBadge } from "@/components/smartrotom/ui/badge";
import { SmartRotomButton } from "@/components/smartrotom/ui/button";
import { NotificationsService } from "@/services/api/smartrotom/notificationsService";
import type { NotificationResponseDto } from "@boffmedia/shared";
import { useTranslations } from "next-intl";

export function RotomNav({
  setTema,
}: {
  setTema: (tema: string) => void;
}) {
  const { socket, connect } = useSocketStore();
  const { session } = useBoffSession();
  const t = useTranslations("nav.notifications");

  const [notifications, setNotifications] = useState<NotificationResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter((n) => n.isRead === 0).length;

  const loadNotifications = useCallback(async () => {
    if (!session) return;
    const uuid = getSmartRotomUser(session).uuid;
    setIsLoading(true);
    try {
      const res = await NotificationsService.getNotifications(uuid);
      if (res.data) setNotifications(res.data.items);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const pathname = usePathname();

  useEffect(() => {
    if (!socket && session) {
      connect(getSmartRotomUser(session));
      return;
    }
  }, [socket, connect, session]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!socket) return;
    const handler = (notification: NotificationResponseDto) => {
      setNotifications((prev) => [notification, ...prev]);
    };
    socket.on("notification:new", handler);
    return () => {
      socket.off("notification:new", handler);
    };
  }, [socket]);

  useEffect(() => {}, [pathname]);

  async function handleMarkRead(id: number) {
    if (!session) return;
    const uuid = getSmartRotomUser(session).uuid;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: 1 } : n))
    );
    await NotificationsService.markNotificationRead(id, uuid);
  }

  async function handleMarkAllRead() {
    if (!session) return;
    const uuid = getSmartRotomUser(session).uuid;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
    await NotificationsService.markAllNotificationsRead(uuid);
  }

  function Notifications() {
    return (
      <div className="w-80 bg-layer-2 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <header className="bg-layer-3 border-b-2 border-black p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="text-ink" size={18} />
            <h2 className="text-ink font-bold text-sm uppercase tracking-wide">
              {t("title")}
            </h2>
          </div>
          {unreadCount > 0 && (
            <SmartRotomBadge variant="default">{unreadCount}</SmartRotomBadge>
          )}
        </header>
        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
          {isLoading && (
            <p className="text-ink-muted text-xs text-center py-4">{t("loading")}</p>
          )}
          {!isLoading && notifications.length === 0 && (
            <p className="text-ink-muted text-xs text-center py-4">{t("emptyState")}</p>
          )}
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-2 rounded-none border-2 border-black text-sm flex flex-col gap-1 ${
                notif.isRead
                  ? "bg-layer-3 text-ink-muted"
                  : "bg-layer-3 text-ink"
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-grow">
                  <p className="font-bold text-xs">{notif.title}</p>
                  <p className="text-xs mt-0.5">{notif.body}</p>
                </div>
                {!notif.isRead && (
                  <span className="bg-primary border-2 border-black w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" />
                )}
              </div>
              {!notif.isRead && (
                <div className="flex justify-end">
                  <SmartRotomButton
                    variant="noShadow"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleMarkRead(notif.id)}
                    aria-label={t("markRead")}
                  >
                    <Check size={12} className="mr-1" />
                    {t("markRead")}
                  </SmartRotomButton>
                </div>
              )}
            </div>
          ))}
        </div>
        {notifications.length > 0 && (
          <footer className="bg-layer-3 border-t-2 border-black p-2 flex justify-end">
            <SmartRotomButton
              variant="neutral"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={handleMarkAllRead}
            >
              <Check size={12} className="mr-1" />
              {t("markAllRead")}
            </SmartRotomButton>
          </footer>
        )}
      </div>
    );
  }

  return (
    <nav
      className={`h-12 z-20 flex items-center px-2 fixed w-full ${
        pathname.includes("pokedex") ? "bg-base" : "bg-layer-2"
      }`}
    >
      <PrevButton />
      <NextButton />
      <ReloadButton />
      <BreadcrumbNav className="flex-1 mx-1 invisible w-0 sm:w-auto sm:visible " />
      <Sheet>
        <SheetTrigger>
          <SettingsButton />
        </SheetTrigger>
        <SheetContent
          side="top"
          className="bg-layer-2 text-ink border-none max-h-[80vh] overflow-y-auto"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="text-ink text-lg">Ajustes</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <SettingsPage setTema={setTema} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-primary-hover">🌐</span>
                <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">Idioma</h3>
              </div>
              <div className="bg-layer-3/50 border-2 border-edge p-4 rounded-lg">
                <LanguageSwitcher variant="mobile" />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet>
        <SheetTrigger>
          <AIButton />
        </SheetTrigger>
        <SheetContent
          side="right"
          className="bg-layer-2 text-ink border-none flex flex-col p-0 max-w-3xl"
        >
          <SheetClose className="absolute right-4 top-4 rounded-md opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary z-10">
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </SheetClose>
          <SheetDescription className="h-full overflow-hidden">
            <FicusAI />
          </SheetDescription>
        </SheetContent>
      </Sheet>
      <Popover>
        <PopoverTrigger className="relative">
          <NotificationButton />
          {unreadCount > 0 && (
            <SmartRotomBadge
              variant="button"
              className="z-50 px-1.5 -bottom-2 -right-2 absolute"
            >
              {unreadCount}
            </SmartRotomBadge>
          )}
        </PopoverTrigger>
        <PopoverContent className="z-50">
          <Notifications />
        </PopoverContent>
      </Popover>
      <Hora className="text-ink text-3xl mx-1 text-shadow-border2" />
      <SocketStatus socket={socket} />
      <MinecraftFunctions />
    </nav>
  );
}

function NavButton({
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
      className="rounded-lg border-0 h-8 w-8 mx-2 bg-base flex items-center justify-center"
      onClick={onClick}
    >
      <Icono
        strokeWidth={strokeWidth}
        height={28}
        width={28}
        className="text-primary"
      />
    </button>
  );
}

function SocketStatus({ socket }: { socket: Socket | null }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="cursor-pointer text-ink h-10 text-xl flex items-center">
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
