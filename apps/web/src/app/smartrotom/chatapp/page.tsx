"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { getSmartRotomUser } from "@/lib/utils";
import { useGuardedSubmit } from "@/components/smartrotom/behavior/useGuardedSubmit";
import { useSocket } from "@/services/useSocket";
import { ChatAppService } from "@/services/api/smartrotom/chatAppService";
import useChatAppGetChats from "./_hooks/useGetChats";
import { Sidebar } from "./_components/Sidebar";
import { Conversation } from "./_components/Conversation";
import { InfoPanel } from "./_components/InfoPanel";
import { EmptySidebar, ErrorState, SkeletonConv, SkeletonSidebar } from "./_components/states";
import { SettingsModal } from "./_components/modals/SettingsModal";
import { CreateGroupModal } from "./_components/modals/CreateGroupModal";
import { SearchModal } from "./_components/modals/SearchModal";
import { MediaModal } from "./_components/modals/MediaModal";
import { ImageViewer } from "./_components/modals/ImageViewer";
import { Icon } from "./_components/ui";
import { parseImage } from "./_utils/messageContent";
import type { ImageMessageData } from "./_types/Chat";
import type { ChatMessageVM, ChatVM } from "./_types/view";

type ModalKind = "create" | "search" | "media" | "settings" | null;

export default function ChatAppPage() {
  const { session, chats, setChats, updateChats, refresh, isLoading, error } = useChatAppGetChats();
  const { socket } = useSocket();
  const myUuid = getSmartRotomUser(session)?.uuid ?? "";

  const [activeId, setActiveId] = useState<number | null>(null);
  const [pane, setPane] = useState<"list" | "conv">("list");
  const [narrow, setNarrow] = useState(false);
  const [typingByChat, setTypingByChat] = useState<Map<number, Set<string>>>(new Map());
  const [modal, setModal] = useState<ModalKind>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [viewer, setViewer] = useState<ImageMessageData | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (m: ChatMessageVM) => {
      updateChats(m as never, activeId);
      // Landing in the chat that's already open counts as read straight away.
      if (m.chatId === activeId && m.uuid && m.uuid !== myUuid) {
        ChatAppService.markMessageAsRead(m.id, { messageId: m.id, uuid: myUuid }).catch(() => undefined);
      }
    };
    const onStart = (d: { chatId: number; uuid: string }) =>
      setTypingByChat((prev) => {
        const n = new Map(prev);
        const s = new Set(n.get(d.chatId));
        s.add(d.uuid);
        n.set(d.chatId, s);
        return n;
      });
    const onStop = (d: { chatId: number; uuid: string }) =>
      setTypingByChat((prev) => {
        const n = new Map(prev);
        const s = new Set(n.get(d.chatId));
        s.delete(d.uuid);
        s.size ? n.set(d.chatId, s) : n.delete(d.chatId);
        return n;
      });
    const onReaction = (d: { chatId: number; messageId: number; reactions: { emoji: string; by: string[] }[] }) =>
      setChats((prev: ChatVM[] | null) =>
        prev
          ? prev.map((c) =>
              c.id !== d.chatId
                ? c
                : { ...c, messages: c.messages.map((m) => (m.id === d.messageId ? { ...m, reactions: d.reactions } : m)) },
            )
          : prev,
      );
    const onRead = (d: { messageId: number; uuid: string }) => {
      if (d.uuid === myUuid) return;
      setChats((prev: ChatVM[] | null) =>
        prev
          ? prev.map((c) => ({
              ...c,
              messages: c.messages.map((m) => (m.id === d.messageId && m.uuid === myUuid ? { ...m, status: "read" as const } : m)),
            }))
          : prev,
      );
    };
    const onReadBulk = (d: { chatId: number; messageIds: number[]; uuid: string }) => {
      if (d.uuid === myUuid) return;
      const ids = new Set(d.messageIds);
      setChats((prev: ChatVM[] | null) =>
        prev
          ? prev.map((c) =>
              c.id !== d.chatId
                ? c
                : { ...c, messages: c.messages.map((m) => (ids.has(m.id) && m.uuid === myUuid ? { ...m, status: "read" as const } : m)) },
            )
          : prev,
      );
    };
    const onPresence = (d: { uuid: string; status: "online" | "ingame" | "offline" }) =>
      setChats((prev: ChatVM[] | null) =>
        prev
          ? prev.map((c) => {
              if (c.type !== 2) return c;
              const other = c.members.find((m) => m.uuid !== myUuid);
              return other?.uuid === d.uuid ? { ...c, presence: d.status } : c;
            })
          : prev,
      );

    socket.on("chat:message", onMessage);
    socket.on("chat:typing:start", onStart);
    socket.on("chat:typing:stop", onStop);
    socket.on("chat:reaction", onReaction);
    socket.on("chat:read", onRead);
    socket.on("chat:read:bulk", onReadBulk);
    socket.on("presence:update", onPresence);
    return () => {
      socket.off("chat:message", onMessage);
      socket.off("chat:typing:start", onStart);
      socket.off("chat:typing:stop", onStop);
      socket.off("chat:reaction", onReaction);
      socket.off("chat:read", onRead);
      socket.off("chat:read:bulk", onReadBulk);
      socket.off("presence:update", onPresence);
    };
  }, [socket, activeId, myUuid, updateChats, setChats]);

  const list = (chats ?? []) as ChatVM[];
  const active = useMemo(() => list.find((c) => c.id === activeId) ?? null, [list, activeId]);

  const typingIds = useMemo(() => {
    const s = new Set<number>();
    typingByChat.forEach((users, chatId) => {
      if ([...users].some((u) => u !== myUuid)) s.add(chatId);
    });
    return s;
  }, [typingByChat, myUuid]);

  // Persist AND clear the badge. The old code only did the optimistic clear, so
  // the effect that was meant to persist always saw unread === 0 and bailed —
  // nothing ever reached the server and the count returned on every reload.
  const markChatRead = useCallback(
    (chatId: number) => {
      if (!myUuid) return;
      const previous = list.find((c) => c.id === chatId)?.unread ?? 0;
      if (previous === 0) return;

      setChats((prev: ChatVM[] | null) => (prev ? prev.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)) : prev));

      // rotomPOST resolves an envelope instead of rejecting, so a bare .catch()
      // would hide a server-side failure and we'd lie until the next reload.
      const restore = () =>
        setChats((prev: ChatVM[] | null) =>
          prev ? prev.map((c) => (c.id === chatId ? { ...c, unread: Math.max(c.unread, previous) } : c)) : prev,
        );
      ChatAppService.markChatAsRead(chatId, { uuid: myUuid }).then(
        (r) => {
          if (!r?.success) restore();
        },
        restore,
      );
    },
    [list, myUuid, setChats],
  );

  const selectChat = useCallback(
    (id: number) => {
      setActiveId(id);
      setPane("conv");
      setInfoOpen(false);
      setModal(null);
      markChatRead(id);
    },
    [markChatRead],
  );

  const appendOwn = useCallback(
    (m: ChatMessageVM) => {
      setChats((prev: ChatVM[] | null) => (prev ? prev.map((c) => (c.id === m.chatId ? { ...c, messages: [m, ...c.messages] } : c)) : prev));
    },
    [setChats],
  );

  const react = useCallback(
    (message: ChatMessageVM, emoji: string) => {
      const chatId = activeId;
      if (chatId == null) return;
      setChats((prev: ChatVM[] | null) =>
        prev
          ? prev.map((c) => {
              if (c.id !== chatId) return c;
              return {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id !== message.id) return m;
                  const reactions = (m.reactions ?? []).map((r) => ({ ...r, by: [...r.by] }));
                  const ex = reactions.find((r) => r.emoji === emoji);
                  if (ex) ex.by = ex.by.includes(myUuid) ? ex.by.filter((u) => u !== myUuid) : [...ex.by, myUuid];
                  else reactions.push({ emoji, by: [myUuid] });
                  return { ...m, reactions: reactions.filter((r) => r.by.length > 0) };
                }),
              };
            })
          : prev,
      );
      ChatAppService.reactToMessage(message.id, { uuid: myUuid, emoji }).catch(() => undefined);
    },
    [activeId, myUuid, setChats],
  );

  const togglePin = useCallback(
    (chatId: number, pinned: boolean) => {
      setChats((prev: ChatVM[] | null) => (prev ? prev.map((c) => (c.id === chatId ? { ...c, pinned } : c)) : prev));
      ChatAppService.setChatPinned(chatId, { uuid: myUuid, pinned }).catch(() => undefined);
    },
    [myUuid, setChats],
  );

  const toggleMute = useCallback(
    (chatId: number, muted: boolean) => {
      setChats((prev: ChatVM[] | null) => (prev ? prev.map((c) => (c.id === chatId ? { ...c, muted } : c)) : prev));
      ChatAppService.setChatMuted(chatId, { uuid: myUuid, muted }).catch(() => undefined);
    },
    [myUuid, setChats],
  );

  const { submit: startCall, isPending: callPending } = useGuardedSubmit(async (_kind: "voice" | "video") => {
    if (!active) return;
    const r = await ChatAppService.initiateCall(active.id, { chatId: active.id, uuid: myUuid });
    if ((r as { error?: string }).error) toast.error((r as { error?: string }).error);
  }, { onError: (e) => console.error("initiateCall failed", e) });

  const openImageFromMessage = useCallback((m: ChatMessageVM) => {
    const d = parseImage(m.content);
    if (d) setViewer(d);
  }, []);

  if (isLoading && !chats) {
    return (
      <>
        <SkeletonSidebar />
        <SkeletonConv />
      </>
    );
  }
  if (error && !chats) {
    return (
      <>
        <EmptySidebar onNew={() => setModal("create")} />
        <ErrorState onRetry={refresh} />
        {modal === "create" && <CreateGroupModal session={session} onClose={() => setModal(null)} onCreated={(id) => { refresh(); selectChat(id); }} />}
      </>
    );
  }

  const showSidebar = !narrow || pane === "list";
  const showConv = !narrow || pane === "conv";
  const empty = list.length === 0;

  return (
    <>
      {showSidebar &&
        (empty ? (
          <EmptySidebar onNew={() => setModal("create")} />
        ) : (
          <Sidebar
            chats={list}
            activeId={activeId}
            myUuid={myUuid}
            typingChatIds={typingIds}
            className={narrow ? "w-full flex-1" : undefined}
            onSelect={selectChat}
            onNew={() => setModal("create")}
            onOpenSearch={() => setModal("search")}
            onOpenSettings={() => setModal("settings")}
          />
        ))}

      {showConv &&
        (active ? (
          <Conversation
            key={active.id}
            chat={active}
            myUuid={myUuid}
            session={session}
            typing={typingIds.has(active.id)}
            onSent={appendOwn}
            onReact={react}
            onBack={() => (infoOpen ? setInfoOpen(false) : setPane("list"))}
            onOpenInfo={() => setInfoOpen(true)}
            onOpenImage={openImageFromMessage}
            onOpenSearch={() => setModal("search")}
            onStartCall={startCall}
            callBusy={callPending}
          />
        ) : (
          <EmptyConversation />
        ))}

      {infoOpen && active && (
        <InfoPanel
          chat={active}
          session={session}
          overlay={narrow}
          onClose={() => setInfoOpen(false)}
          onStartCall={startCall}
          callBusy={callPending}
          onOpenSearch={() => setModal("search")}
          onOpenImage={setViewer}
          onOpenMedia={() => setModal("media")}
          onTogglePin={(pinned) => togglePin(active.id, pinned)}
          onToggleMute={(muted) => toggleMute(active.id, muted)}
        />
      )}

      {modal === "create" && <CreateGroupModal session={session} onClose={() => setModal(null)} onCreated={(id) => { refresh(); selectChat(id); }} />}
      {modal === "search" && <SearchModal chats={list} myUuid={myUuid} onClose={() => setModal(null)} onJump={selectChat} />}
      {modal === "settings" && <SettingsModal session={session} onClose={() => setModal(null)} />}
      {modal === "media" && active && <MediaModal chat={active} onClose={() => setModal(null)} onOpenImage={setViewer} />}
      {viewer && <ImageViewer data={viewer} onClose={() => setViewer(null)} />}
    </>
  );
}

function EmptyConversation() {
  const t = useTranslations("chatapp");
  return (
    <section className="relative flex min-w-0 flex-1 flex-col bg-ca-wallpaper">
      <div className="ca-doodle pointer-events-none absolute inset-0" />
      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="grid h-[92px] w-[92px] place-items-center rounded-full bg-ca-accent/[.14] text-ca-accent-soft">
          <Icon name="message" size={42} />
        </div>
        <h3 className="text-[22px] font-semibold text-ca-50">{t("empty.noConversation")}</h3>
        <p className="max-w-[360px] text-[14.5px] leading-[1.6] text-ca-400">
          {t("empty.noConversationBody")}
        </p>
      </div>
    </section>
  );
}
