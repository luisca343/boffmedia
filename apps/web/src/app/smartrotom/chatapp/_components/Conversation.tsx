"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getSmartRotomUser } from "@/lib/utils";
import useSocketStore from "@/stores/useSocketStore";
import { Avatar, Dots, Icon, IconButton } from "./ui";
import { MessageRow } from "./messages/MessageRow";
import { Composer } from "./Composer";
import { GalleryPicker } from "./pickers/GalleryPicker";
import { WaypointPicker } from "./pickers/LocationPicker";
import { DocumentPicker } from "./pickers/NotePicker";
import type { ChatMessageVM, ChatVM } from "../_types/view";
import { isDirect, isGroupLike, isSaved } from "../_utils/chat";
import { dayKey, dayLabel } from "../_utils/format";
import { useSendMessage } from "../_hooks/useSendMessage";

function useStatus(chat: ChatVM, typing: boolean | undefined, t: ReturnType<typeof useTranslations<"chatapp">>) {
  if (typing) return { txt: t("status.typing"), live: true, game: false };
  if (isGroupLike(chat.type)) return { txt: t("status.members", { count: chat.members.length }), live: false, game: false };
  if (isSaved(chat.type)) return { txt: t("status.onlyYou"), live: false, game: false };
  if (chat.presence === "ingame") return { txt: t("status.playing"), live: true, game: true };
  if (chat.presence === "online") return { txt: t("status.online"), live: true, game: false };
  return { txt: t("status.offline"), live: false, game: false };
}

export function Conversation({
  chat,
  myUuid,
  session,
  typing,
  onSent,
  onReact,
  onBack,
  onOpenInfo,
  onOpenImage,
  onOpenSearch,
  onStartCall,
  callBusy,
}: {
  chat: ChatVM;
  myUuid: string;
  session: unknown;
  typing?: boolean;
  onSent: (m: ChatMessageVM) => void;
  onReact?: (m: ChatMessageVM, emoji: string) => void;
  onBack: () => void;
  onOpenInfo: () => void;
  onOpenImage: (m: ChatMessageVM) => void;
  onOpenSearch: () => void;
  onStartCall: (kind: "voice" | "video") => void;
  callBusy?: boolean;
}) {
  const t = useTranslations("chatapp");
  const locale = useLocale();
  const scroller = useRef<HTMLDivElement>(null);
  const [reply, setReply] = useState<ChatMessageVM | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [waypointOpen, setWaypointOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);

  const { socket } = useSocketStore();
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isGroup = isGroupLike(chat.type);
  const st = useStatus(chat, typing, t);
  const send = useSendMessage(chat.id, session, (m) => { onSent(m); setReply(null); });

  useEffect(() => { setReply(null); setSummaryOpen(true); }, [chat.id]);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages.length, chat.id]);

  const handleTyping = useCallback(() => {
    if (!socket) return;
    const u = getSmartRotomUser(session);
    socket.emit("chat:typing:start", { chatId: chat.id, uuid: u.uuid, username: u.username });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit("chat:typing:stop", { chatId: chat.id, uuid: u.uuid }), 2000);
  }, [socket, chat.id, session]);

  // Oldest → newest for display (API returns newest-first).
  const ordered = useMemo(() => [...chat.messages].reverse(), [chat.messages]);
  const rows: React.ReactNode[] = [];
  ordered.forEach((m, i) => {
    const prev = ordered[i - 1];
    if (!prev || dayKey(prev.createdAt) !== dayKey(m.createdAt)) {
      rows.push(
        <div key={`d${m.id}`} className="my-2.5 self-center rounded-ca-md bg-ca-header px-3.5 py-1.5 text-[12.5px] font-medium uppercase tracking-[.02em] text-ca-300 shadow-[0_1px_1px_rgba(0,0,0,.08)]">
          {dayLabel(m.createdAt, t, locale)}
        </div>,
      );
    }
    rows.push(
      <MessageRow
        key={m.id}
        message={m}
        prev={prev}
        next={ordered[i + 1]}
        chat={chat}
        isGroup={isGroup}
        myUuid={myUuid}
        onReact={onReact}
        onReply={setReply}
        onOpenImage={onOpenImage}
        onCallback={() => onStartCall("voice")}
        callBusy={callBusy}
      />,
    );
  });

  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-ca-wallpaper">
      <div className="ca-doodle pointer-events-none absolute inset-0" />

      <header className="relative z-[2] flex h-[60px] flex-none items-center gap-3.5 border-b border-ca-800 bg-ca-header pl-4 pr-3.5">
        <IconButton icon="arrowleft" iconSize={20} className="md:hidden" onClick={onBack} title={t("common.back")} />
        <button onClick={onOpenInfo} className="flex min-w-0 items-center gap-3.5" aria-label={t("conversation.viewInfo")}>
          <Avatar src={chat.image} size={42} presence={isDirect(chat.type) && !isSaved(chat.type) ? chat.presence : undefined} />
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5 text-[16px] font-semibold text-ca-50">
              {chat.name}
              {chat.muted && <Icon name="belloff" size={14} className="text-ca-500" />}
            </div>
            <div className={cn("flex items-center gap-1.5 text-[12.5px]", st.live ? "text-ca-accent-soft" : "text-ca-400")}>
              {st.game && <Icon name="cube" size={12} />}
              {typing && <Dots sm className="text-ca-accent-soft" />}
              {st.txt}
            </div>
          </div>
        </button>
        <div className="ml-auto flex gap-0.5">
          <IconButton icon="search" onClick={onOpenSearch} title={t("conversation.searchChat")} />
          <IconButton icon="video" iconSize={20} onClick={() => onStartCall("video")} disabled={callBusy} title={t("conversation.videoCall")} />
          <IconButton icon="phone" iconSize={18} onClick={() => onStartCall("voice")} disabled={callBusy} title={t("actions.call")} />
          <IconButton icon="info" onClick={onOpenInfo} title={t("info.groupInfo")} />
        </div>
      </header>

      {/* [deferred] AI chat summary — no summary API yet; renders only if present */}
      {chat.summary && summaryOpen && (
        <div className="relative z-[2] mx-auto mt-2.5 flex w-[calc(100%-52px)] max-w-[560px] items-start gap-[11px] rounded-[10px] border-l-4 border-ca-accent bg-ca-bubble-in px-[13px] py-[11px] shadow-ca-bubble">
          <div className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full bg-ca-accent/[.16] text-ca-accent-soft">
            <Icon name="sparkles" size={17} />
          </div>
          <div className="flex-1">
            <h5 className="mb-[3px] text-[12px] font-bold text-ca-accent-soft">{t("conversation.summaryTitle")}</h5>
            <p className="text-[13.5px] leading-[1.5] text-ca-200">{chat.summary}</p>
          </div>
          <IconButton icon="x" iconSize={16} className="h-[30px] w-[30px]" onClick={() => setSummaryOpen(false)} title={t("common.close")} />
        </div>
      )}

      <div ref={scroller} className="ca-scroll relative z-[1] flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-[6%] pb-2 pt-3">
        {rows}
        {typing && (
          <div className="mt-1.5 flex w-full justify-start gap-2">
            {isGroup && <div className="h-7 w-7 flex-none overflow-hidden rounded-full" />}
            <div className="rounded-ca-md bg-ca-bubble-in px-3.5 py-[11px] shadow-ca-bubble">
              <Dots className="text-ca-accent-soft" />
            </div>
          </div>
        )}
      </div>

      <Composer
        reply={reply}
        session={session}
        onSendText={send.sendText}
        onSendSticker={send.sendSticker}
        onOpenPhoto={() => setPhotoOpen(true)}
        onOpenWaypoint={() => setWaypointOpen(true)}
        onOpenDocument={() => setDocOpen(true)}
        onTyping={handleTyping}
        clearReply={() => setReply(null)}
        busy={send.isSending}
      />

      <GalleryPicker open={photoOpen} onOpenChange={setPhotoOpen} onSendImage={send.sendImage} />
      <WaypointPicker open={waypointOpen} onOpenChange={setWaypointOpen} onWaypointSelect={send.sendWaypoint} />
      <DocumentPicker open={docOpen} onOpenChange={setDocOpen} onDocumentSelect={send.sendDocument} />
    </section>
  );
}
