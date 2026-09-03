"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getSmartRotomUser } from "@/lib/utils";
import { Icon, IconButton, MiniButton, Toggle, type IconName } from "./ui";
import type { ImageMessageData } from "../_types/Chat";
import type { ChatVM } from "../_types/view";
import { isGroupLike, isSaved, memberName } from "../_utils/chat";
import { sharedImages, sharedWaypoints } from "../_utils/media";

function statusLine(chat: ChatVM, t: ReturnType<typeof useTranslations<"chatapp">>): string {
  if (isGroupLike(chat.type)) return t("status.members", { count: chat.members.length });
  if (isSaved(chat.type)) return t("status.onlyYou");
  if (chat.presence === "ingame") return t("status.playing");
  if (chat.presence === "online") return t("status.online");
  return t("status.offline");
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-2.5 bg-ca-panel px-[1.125rem] py-3.5">
      <h6 className="mb-2.5 text-[0.8125rem] font-semibold text-ca-accent-soft">{title}</h6>
      {children}
    </div>
  );
}

export function InfoPanel({
  chat,
  session,
  overlay,
  onClose,
  onStartCall,
  callBusy,
  onOpenSearch,
  onOpenImage,
  onOpenMedia,
  onTogglePin,
  onToggleMute,
}: {
  chat: ChatVM;
  session: unknown;
  overlay?: boolean;
  onClose: () => void;
  onStartCall: (kind: "voice" | "video") => void;
  callBusy?: boolean;
  onOpenSearch: () => void;
  onOpenImage: (data: ImageMessageData) => void;
  onOpenMedia: () => void;
  onTogglePin: (pinned: boolean) => void;
  onToggleMute: (muted: boolean) => void;
}) {
  const t = useTranslations("chatapp");
  const isGroup = isGroupLike(chat.type);
  const muted = !!chat.muted;
  const [enc, setEnc] = useState(true);
  const media = sharedImages(chat).slice(0, 6);
  const waypoints = sharedWaypoints(chat).slice(0, 2);
  const myUuid = getSmartRotomUser(session)?.uuid;

  const Quick = ({ icon, label, onClick, disabled }: { icon: IconName; label: string; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} className="flex flex-1 flex-col items-center gap-1.5 rounded-ca-lg py-[0.6875rem] text-[0.75rem] text-ca-accent-soft transition-colors hover:bg-ca-accent/10 disabled:opacity-60">
      <Icon name={icon} size={19} />
      {label}
    </button>
  );

  return (
    <aside className={cn("flex min-h-0 flex-col border-l border-ca-800 bg-ca-panel animate-ca-slide-in", overlay ? "absolute inset-0 z-[45] w-full" : "w-[21.25rem] flex-none")}>
      <div className="flex h-[3.75rem] flex-none items-center gap-3.5 border-b border-ca-800 bg-ca-header px-4 text-[1rem] font-semibold text-ca-50">
        <IconButton icon="x" onClick={onClose} title={t("common.close")} />
        {isGroup ? t("info.groupInfo") : t("info.contactInfo")}
      </div>

      <div className="ca-scroll min-h-0 flex-1 overflow-y-auto bg-ca-800/40">
        <div className="flex flex-col items-center gap-2 bg-ca-panel px-5 pb-5 pt-[1.625rem] text-center">
          <img src={chat.image} alt="" className={cn("h-[12.5rem] w-[12.5rem] max-w-[60%] object-cover [image-rendering:pixelated]", isGroup ? "rounded-[24px]" : "rounded-full")} />
          <div>
            <div className="text-[1.1875rem] font-semibold text-ca-50">{chat.name}</div>
            <div className="text-[0.875rem] text-ca-400">{statusLine(chat, t)}</div>
          </div>
        </div>

        <div className="flex gap-2 bg-ca-panel px-4 py-3.5">
          <Quick icon="phone" label={t("actions.call")} onClick={() => onStartCall("voice")} disabled={callBusy} />
          <Quick icon="video" label={t("actions.video")} onClick={() => onStartCall("video")} disabled={callBusy} />
          <Quick icon="search" label={t("common.search")} onClick={onOpenSearch} />
          <Quick icon={muted ? "belloff" : "bell"} label={muted ? t("actions.mute") : t("actions.unmute")} onClick={() => onToggleMute(!muted)} />
        </div>

        {media.length > 0 && (
          <Section title={t("info.sharedMedia")}>
            <div className="grid grid-cols-3 gap-[0.3125rem]">
              {media.map((img) => (
                <button key={img.messageId} onClick={() => onOpenImage(img)} className="aspect-square overflow-hidden rounded-ca-md bg-ca-800">
                  <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <MiniButton grow={false} onClick={onOpenMedia} className="mt-2 w-full bg-ca-800">{t("media.viewAll")}</MiniButton>
          </Section>
        )}

        {isGroup && (
          <Section title={t("info.members", { count: chat.members.length })}>
            {chat.members.map((m) => (
              <div key={m.uuid} className="flex items-center gap-3 py-2">
                <img src={`https://mc-heads.net/avatar/${m.uuid}`} alt="" className="h-9 w-9 rounded-full [image-rendering:pixelated]" />
                <div className="text-[0.9375rem] font-medium text-ca-50">{m.uuid === myUuid ? t("info.you") : memberName(chat, m.uuid)}</div>
              </div>
            ))}
          </Section>
        )}

        {waypoints.length > 0 && (
          <Section title={t("info.sharedWaypoints")}>
            {waypoints.map((w) => (
              <div key={`${w.name}-${w.x}`} className="flex items-center gap-3 py-2">
                <div className="grid h-[2.125rem] w-[2.125rem] flex-none place-items-center rounded-ca-md" style={{ background: `${w.color || "#f97316"}33`, color: w.color || "#f97316" }}>
                  <Icon name="mappin" size={17} />
                </div>
                <div className="min-w-0">
                  <div className="text-[0.9375rem] font-medium text-ca-50">{w.name}</div>
                  <div className="font-ca-mono text-[0.6875rem] text-ca-400">X {w.x} · Z {w.z}</div>
                </div>
              </div>
            ))}
          </Section>
        )}

        <Section title={t("info.privacy")}>
          <div className="flex items-center gap-3 py-2.5 text-[0.90625rem] text-ca-100">
            <Icon name="lock" size={17} className="text-ca-highlight" /> {t("info.e2eEncryption")}
            <Toggle on={enc} onClick={() => setEnc((v) => !v)} className="ml-auto" />
          </div>
          <div className="flex items-center gap-3 py-2.5 text-[0.90625rem] text-ca-100">
            <Icon name="belloff" size={17} /> {t("info.muteNotifications")}
            <Toggle on={muted} onClick={() => onToggleMute(!muted)} className="ml-auto" />
          </div>
          <div className="flex items-center gap-3 py-2.5 text-[0.90625rem] text-ca-100">
            <Icon name="pin" size={17} /> {t("info.pinChat")}
            <Toggle on={!!chat.pinned} onClick={() => onTogglePin(!chat.pinned)} className="ml-auto" />
          </div>
          <div className="pt-1">
            <MiniButton grow={false} className="w-full bg-transparent text-ca-error hover:bg-ca-error/10"><Icon name="trash" size={17} /> {t("info.clearChat")}</MiniButton>
          </div>
        </Section>
      </div>
    </aside>
  );
}
