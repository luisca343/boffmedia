"use client";
import { Hora } from "@/components/smartrotom/chrome/Hora";
import { useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import BreadcrumbNav from "@/components/smartrotom/BreadcrumbNav";
import FicusAI from "@/features/ficusai/components/FicusAI";
import { usePathname } from "next/navigation";
import { getSmartRotomUser, cn } from "@/lib/utils";
import { Bell, Check, X, Globe } from "lucide-react";
import { SettingsPage } from "@/components/smartrotom/Settings";
import { SrPopover, SrPopoverTrigger, SrPopoverContent } from "@/components/smartrotom/chrome/SrPopover";
import { useBoffSession } from "@/services/useBoffSession";
import { MinecraftFunctions } from "@/components/smartrotom/MinecraftFunctions";
import { SrTooltip } from "@/components/smartrotom/chrome/SrTooltip";
import { SettingsButton, AIButton, NextButton, NotificationButton, PrevButton, ReloadButton } from "@/components/smartrotom/chrome/NavButton";
import { SrSheet, SrSheetClose, SrSheetContent, SrSheetHeader, SrSheetTitle, SrSheetTrigger } from "@/components/smartrotom/chrome/SrSheet";
import useSocketStore from "@/stores/useSocketStore";
import LanguageSwitcher from "@/components/smartrotom/chrome/LanguageSwitcher";
import { SmartRotomBadge, SmartRotomButton, SmartRotomPanel } from "@/components/smartrotom/ui";
import { NotificationsService } from "@/services/api/smartrotom/notificationsService";
import type { NotificationResponseDto } from "@boffmedia/shared";
import { useTranslations } from "next-intl";

export function RotomNav() {
  const { socket, connect } = useSocketStore();
  const { session } = useBoffSession();
  const tNotif = useTranslations("nav.notifications");
  const t = useTranslations("smartrotom.nav");

  const [notifications, setNotifications] = useState<NotificationResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
      <SmartRotomPanel
        bodyClassName="p-0"
        className="w-80 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)]"
        title={
          <span className="flex items-center gap-2">
            <Bell className="text-sr-accent" size={15} />
            {tNotif("title")}
          </span>
        }
        aside={
          unreadCount > 0 ? (
            <SmartRotomBadge variant="default">{unreadCount}</SmartRotomBadge>
          ) : undefined
        }
      >
        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
          {isLoading && (
            <p className="text-sr-txt-muted text-xs text-center py-4">{tNotif("loading")}</p>
          )}
          {!isLoading && notifications.length === 0 && (
            <p className="text-sr-txt-muted text-xs text-center py-4">{tNotif("emptyState")}</p>
          )}
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "cut-tag cut-tag-edge [--cut-tag:9px] p-2.5 border text-sm flex flex-col gap-1 transition-colors",
                notif.isRead
                  ? "bg-sr-panel border-sr-line [--cut-line:var(--sr-line)] text-sr-txt-muted"
                  : "bg-sr-panel-2 border-sr-accent-line [--cut-line:var(--sr-accent-line)] text-sr-txt"
              )}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-grow">
                  <p className="font-display font-bold not-italic uppercase tracking-[0.04em] text-[0.6875rem] leading-tight">
                    {notif.title}
                  </p>
                  <p className="text-xs mt-1 text-sr-txt-muted normal-case">{notif.body}</p>
                </div>
                {!notif.isRead && (
                  <span className="bg-sr-accent w-2 h-2 rounded-full flex-shrink-0 mt-1" />
                )}
              </div>
              {!notif.isRead && (
                <div className="flex justify-end">
                  <SmartRotomButton
                    variant="noShadow"
                    size="sm"
                    className="!py-1 !px-2 text-[0.6875rem]"
                    onClick={() => handleMarkRead(notif.id)}
                    aria-label={tNotif("markRead")}
                  >
                    <Check size={12} className="mr-1" />
                    {tNotif("markRead")}
                  </SmartRotomButton>
                </div>
              )}
            </div>
          ))}
        </div>
        {notifications.length > 0 && (
          <footer className="border-t border-sr-line p-2 flex justify-end">
            <SmartRotomButton
              variant="ghost"
              size="sm"
              className="!py-1 !px-2 text-[0.6875rem]"
              onClick={handleMarkAllRead}
            >
              <Check size={12} className="mr-1" />
              {tNotif("markAllRead")}
            </SmartRotomButton>
          </footer>
        )}
      </SmartRotomPanel>
    );
  }

  return (
    <nav
      className={`h-12 z-20 flex items-center gap-0.5 px-2 fixed w-full border-b border-sr-line backdrop-blur-sm ${
        pathname.includes("pokedex") ? "bg-sr-bg" : "bg-sr-panel"
      }`}
    >
      <PrevButton />
      <NextButton />
      <ReloadButton />
      <BreadcrumbNav className="flex-1 mx-1 invisible w-0 sm:w-auto sm:visible " />
      <SrSheet>
        <SrSheetTrigger>
          <SettingsButton />
        </SrSheetTrigger>
        <SrSheetContent
          side="top"
          label={t("settings")}
          className="bg-sr-panel text-sr-txt border-b border-sr-line max-h-[80vh] overflow-y-auto"
        >
          <SrSheetClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 ring-offset-sr-panel focus:ring-sr-accent">
            <X className="h-4 w-4" />
            <span className="sr-only">{t("close")}</span>
          </SrSheetClose>
          <SrSheetHeader className="mb-4">
            <SrSheetTitle className="text-sr-txt font-display not-italic uppercase tracking-[0.05em] text-lg">
              {t("settings")}
            </SrSheetTitle>
          </SrSheetHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <SettingsPage />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={16} className="text-sr-accent" />
                <h3 className="font-display text-sm font-bold not-italic uppercase tracking-[0.06em] text-sr-txt">
                  {t("language")}
                </h3>
              </div>
              <div className="bg-sr-panel-2 border border-sr-line p-4 cut-corner cut-corner-edge [--cut-lg:12px] [--cut-line:var(--sr-line)]">
                <LanguageSwitcher variant="mobile" />
              </div>
            </div>
          </div>
        </SrSheetContent>
      </SrSheet>
      <SrSheet>
        <SrSheetTrigger>
          <AIButton />
        </SrSheetTrigger>
        <SrSheetContent
          side="right"
          label="Asistente IA"
          className="bg-sr-panel text-sr-txt border-l border-sr-line flex flex-col p-0 max-w-3xl"
        >
          <SrSheetClose className="absolute right-4 top-4 cut [--cut:6px] p-1.5 opacity-90 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sr-accent bg-sr-accent text-sr-accent-ink z-10">
            <X className="h-4 w-4" />
            <span className="sr-only">{t("close")}</span>
          </SrSheetClose>
          <div className="h-full overflow-hidden">
            <FicusAI />
          </div>
        </SrSheetContent>
      </SrSheet>
      <SrPopover>
        <SrPopoverTrigger>
          <NotificationButton />
          {unreadCount > 0 && (
            <SmartRotomBadge
              variant="button"
              className="z-50 px-1.5 -bottom-2 -right-2 absolute"
            >
              {unreadCount}
            </SmartRotomBadge>
          )}
        </SrPopoverTrigger>
        <SrPopoverContent>
          <Notifications />
        </SrPopoverContent>
      </SrPopover>
      <Hora className="text-sr-txt font-display text-2xl mx-1 tabular-nums tracking-tight" />
      <SocketStatus socket={socket} />
      <MinecraftFunctions />
    </nav>
  );
}

function SocketStatus({ socket }: { socket: Socket | null }) {
  const connected = Boolean(socket && socket.connected);
  const t = useTranslations("smartrotom.nav");
  return (
    <SrTooltip content={connected ? t("connected", { id: socket?.id ?? "" }) : t("disconnected")}>
      <div className="cursor-pointer h-10 flex items-center px-1.5">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            connected
              ? "bg-sr-ok shadow-[0_0_8px_var(--sr-ok)]"
              : "bg-sr-bad"
          )}
        />
      </div>
    </SrTooltip>
  );
}
