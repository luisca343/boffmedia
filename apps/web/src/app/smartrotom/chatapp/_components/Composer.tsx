"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn, getSmartRotomUser } from "@/lib/utils";
import { Icon, IconButton, Popover, PopItem } from "./ui";
import { EMOJI_SET, STICKERS } from "../_data/pickers";
import type { ChatMessageVM } from "../_types/view";

type AttachTone = "accent" | "info" | "highlight";
const TONE: Record<AttachTone, string> = {
  accent: "bg-ca-accent/[.18] text-ca-accent",
  info: "bg-ca-info/[.18] text-ca-info",
  highlight: "bg-ca-highlight/[.18] text-ca-highlight",
};

export function Composer({
  reply,
  session,
  onSendText,
  onSendSticker,
  onOpenPhoto,
  onOpenWaypoint,
  onOpenDocument,
  onTyping,
  clearReply,
}: {
  reply: ChatMessageVM | null;
  session: unknown;
  onSendText: (text: string) => void;
  onSendSticker: (path: string) => void;
  onOpenPhoto: () => void;
  onOpenWaypoint: () => void;
  onOpenDocument: () => void;
  onTyping: () => void;
  clearReply: () => void;
}) {
  const t = useTranslations("chatapp");
  const [text, setText] = useState("");
  const [menu, setMenu] = useState<"attach" | "emoji" | null>(null);
  const [tab, setTab] = useState<"emoji" | "sticker">("emoji");
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (reply) ta.current?.focus();
  }, [reply]);

  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };
  const send = () => {
    const v = text.trim();
    if (!v) return;
    onSendText(v);
    setText("");
    if (ta.current) ta.current.style.height = "auto";
  };

  const attach: { icon: "image" | "camera" | "file" | "mappin"; label: string; sub: string; tone: AttachTone; action: () => void }[] = [
    { icon: "image", label: t("composer.attachment.photos"), sub: t("composer.attachment.photosSub"), tone: "accent", action: onOpenPhoto },
    { icon: "camera", label: t("composer.attachment.camera"), sub: t("composer.attachment.cameraSub"), tone: "info", action: onOpenPhoto },
    { icon: "file", label: t("composer.attachment.document"), sub: t("composer.attachment.documentSub"), tone: "info", action: onOpenDocument },
    { icon: "mappin", label: t("composer.attachment.location"), sub: t("composer.attachment.locationSub"), tone: "highlight", action: onOpenWaypoint },
  ];

  return (
    <div className="relative z-[2] bg-ca-header px-4 pb-2.5 pt-2">
      {reply && (
        <div className="mb-2 flex items-center gap-2.5 rounded-ca-md border-l-4 border-ca-accent bg-ca-search-bg px-3 py-2">
          <Icon name="reply" size={16} className="flex-none text-ca-accent-soft" />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-bold text-ca-accent-soft">
              {t("composer.replyingTo", { user: reply.uuid === getSmartRotomUser(session).uuid ? t("composer.yourself") : reply.uuid.slice(0, 8) })}
            </div>
            <div className="truncate text-[13px] text-ca-400">{typeof reply.content === "string" ? reply.content : t("conversation.attached")}</div>
          </div>
          <IconButton icon="x" className="h-8 w-8" iconSize={16} onClick={clearReply} title={t("composer.cancelReply")} />
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="relative flex-none">
          <IconButton icon="paperclip" iconSize={20} active={menu === "attach"} title={t("composer.attach")} onClick={() => setMenu(menu === "attach" ? null : "attach")} />
          {menu === "attach" && (
            <Popover className="left-0 min-w-[232px]" onMouseLeave={() => setMenu(null)}>
              {attach.map((a) => (
                <PopItem key={a.label} onClick={() => { a.action(); setMenu(null); }}>
                  <span className={cn("grid h-10 w-10 flex-none place-items-center rounded-full", TONE[a.tone])}>
                    <Icon name={a.icon} size={18} />
                  </span>
                  <span>
                    <span className="block text-[14px] font-medium text-ca-50">{a.label}</span>
                    <span className="text-[11.5px] text-ca-400">{a.sub}</span>
                  </span>
                </PopItem>
              ))}
            </Popover>
          )}
        </div>

        <div className="flex flex-1 items-end gap-1.5 rounded-ca-md border border-transparent bg-ca-input-bg py-1 pl-2.5 pr-1.5 shadow-[inset_0_0_0_1px_rgb(var(--ca-700)/.4)] focus-within:shadow-[inset_0_0_0_1px_rgb(var(--ca-accent)/.5)]">
          <textarea
            ref={ta}
            rows={1}
            value={text}
            placeholder={t("composer.placeholder")}
            onChange={(e) => { setText(e.target.value); grow(e.target); onTyping(); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            className="max-h-[120px] min-w-0 flex-1 resize-none bg-transparent px-1 py-[9px] text-[15px] leading-[1.4] text-ca-50 outline-none placeholder:text-ca-500"
          />
          <div className="relative flex-none self-end">
            <IconButton icon="smile" iconSize={20} className="h-[38px] w-[38px]" title={t("composer.emoji")} onClick={() => setMenu(menu === "emoji" ? null : "emoji")} />
            {menu === "emoji" && (
              <Popover className="right-0 w-[300px]" onMouseLeave={() => setMenu(null)}>
                <div className="flex gap-1 border-b border-ca-700 px-1 pb-2 pt-0.5">
                  {(["emoji", "sticker"] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => setTab(k)}
                      className={cn("rounded-ca-md px-[11px] py-[5px] text-[12.5px] font-semibold", tab === k ? "bg-ca-accent text-ca-on-accent" : "text-ca-300")}
                    >
                      {t(`composer.tabs.${k}`)}
                    </button>
                  ))}
                </div>
                {tab === "emoji" ? (
                  <div className="ca-scroll grid max-h-[210px] grid-cols-7 gap-0.5 overflow-y-auto p-1.5">
                    {EMOJI_SET.map((e) => (
                      <button key={e} onClick={() => { setText((prev) => prev + e); ta.current?.focus(); }} className="rounded-ca-md p-[5px] text-[21px] hover:bg-ca-700">
                        {e}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="ca-scroll grid max-h-[210px] grid-cols-4 gap-1.5 overflow-y-auto p-2">
                    {STICKERS.map((s) => (
                      <button key={s.path} onClick={() => { onSendSticker(s.path); setMenu(null); }} className="rounded-[10px] bg-ca-900 p-1.5 hover:bg-ca-700">
                        <img src={s.path} alt={s.name} className="w-full [image-rendering:pixelated]" />
                      </button>
                    ))}
                  </div>
                )}
              </Popover>
            )}
          </div>
        </div>

        {text.trim() ? (
          <button onClick={send} title={t("composer.send")} className="grid h-[46px] w-[46px] flex-none place-items-center rounded-full bg-ca-accent text-ca-on-accent transition-[transform,filter] hover:brightness-[1.06] active:scale-90">
            <Icon name="send" size={19} />
          </button>
        ) : (
          // [deferred] voice notes have no API yet — demo-safe placeholder
          <button title={t("composer.voiceNote")} onClick={() => import("react-toastify").then((m) => m.toast.info(t("composer.voiceNoteSoon")))} className="grid h-[46px] w-[46px] flex-none place-items-center rounded-full bg-ca-accent text-ca-on-accent transition-[transform,filter] hover:brightness-[1.06] active:scale-90">
            <Icon name="mic" size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
