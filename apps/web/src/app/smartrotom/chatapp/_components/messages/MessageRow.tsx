"use client";
import { useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { addWaypoint } from "@/services/mcef/mcefApi";
import { useGuardedSubmit } from "@/components/smartrotom/behavior/useGuardedSubmit";
import { Icon, MiniButton, Popover } from "../ui";
import { ImageBubble } from "./ImageBubble";
import type { ChatMessageVM, ChatVM, MessageStatus } from "../../_types/view";
import { memberName } from "../../_utils/chat";
import { timeOf } from "../../_utils/format";
import { formatDuration, parseCall, parseDocument, parseImage, parseVideo, parseWaypoint } from "../../_utils/messageContent";
import { REACTION_SET } from "../../_data/pickers";

const mcHead = (uuid: string) => `https://mc-heads.net/avatar/${uuid}`;

function Checks({ status }: { status: MessageStatus }) {
  if (status === "sent") return <Icon name="check" size={14} />;
  return <Icon name="checks" size={14} className={status === "read" ? "text-ca-tick-read" : undefined} />;
}

function MetaLine({ time, out, status }: { time: string; out: boolean; status: MessageStatus }) {
  return (
    <span className={cn("float-right ml-3 mt-[0.4375rem] inline-flex select-none items-center gap-1 text-[0.6875rem]", out ? "text-ca-bubble-out-text/60" : "text-ca-400")}>
      {time}
      {out && <Checks status={status} />}
    </span>
  );
}

function ReplyQuote({ chat, replyTo, out }: { chat: ChatVM; replyTo: number; out: boolean }) {
  const t = useTranslations("chatapp");
  const src = chat.messages.find((m) => m.id === replyTo);
  if (!src) return null;
  const who = src.uuid === chat.members[0]?.uuid ? memberName(chat, src.uuid) : memberName(chat, src.uuid);
  let preview = t("preview.message");
  if (src.type === "text" || src.type === "chat" || src.type === "emoji") preview = src.content;
  else if (src.type === "image") preview = t("preview.photo");
  else if (src.type === "sticker") preview = t("preview.sticker");
  else if (src.type === "waypoint") preview = t("preview.location");
  else if (src.type === "document") preview = t("preview.document");
  else if (src.type === "video") preview = t("preview.video");
  return (
    <div className={cn("mb-1 overflow-hidden rounded-[5px] border-l-4 border-ca-accent px-[0.5625rem] py-1 text-[0.8125rem]", out ? "bg-black/10" : "bg-ca-500/[.14]")}>
      <span className="block text-[0.78125rem] font-semibold text-ca-accent-soft">{who}</span>
      <span className="block truncate text-ca-400">{preview}</span>
    </div>
  );
}

function Reactions({ message, myUuid, onReact }: { message: ChatMessageVM; myUuid: string; onReact?: (m: ChatMessageVM, emoji: string) => void }) {
  if (!message.reactions?.length) return null;
  return (
    <div className={cn("relative z-[2] -mt-1.5 mx-0.5 mb-0.5 flex flex-wrap gap-1", message.uuid === myUuid && "justify-end")}>
      {message.reactions.map((r) => {
        const mine = r.by.includes(myUuid);
        return (
          <button
            key={r.emoji}
            onClick={() => onReact?.(message, r.emoji)}
            className={cn(
              "inline-flex items-center gap-[3px] rounded-full px-[0.4375rem] py-0.5 text-[0.75rem] leading-[1.4] shadow-ca-bubble transition-transform hover:-translate-y-px",
              mine ? "bg-ca-accent/20 shadow-[inset_0_0_0_1px_rgb(var(--ca-accent)/.45)]" : "bg-ca-bubble-in",
            )}
          >
            <span>{r.emoji}</span>
            <span className="text-[0.6875rem] font-semibold text-ca-400">{r.by.length}</span>
          </button>
        );
      })}
    </div>
  );
}

function HoverTools({ message, out, onReact, onReply }: { message: ChatMessageVM; out: boolean; onReact?: (m: ChatMessageVM, e: string) => void; onReply?: (m: ChatMessageVM) => void }) {
  const t = useTranslations("chatapp");
  const [pick, setPick] = useState(false);
  const Tool = ({ icon, title, onClick }: { icon: "smile" | "reply" | "more"; title: string; onClick?: () => void }) => (
    <button title={title} onClick={onClick} className="grid h-[1.875rem] w-[1.875rem] place-items-center rounded-full bg-ca-panel/85 text-ca-300 shadow-[0_1px_3px_rgba(0,0,0,.18)] hover:bg-ca-700 hover:text-ca-50">
      <Icon name={icon} size={16} />
    </button>
  );
  return (
    <div className={cn("relative flex items-center gap-0.5 self-center px-1 opacity-0 transition-opacity group-hover/m:opacity-100", out && "order-first")}>
      <Tool icon="smile" title={t("message.react")} onClick={() => setPick((s) => !s)} />
      <Tool icon="reply" title={t("message.reply")} onClick={() => onReply?.(message)} />
      <Tool icon="more" title={t("message.more")} />
      {pick && (
        <Popover className={cn("flex gap-0.5 bottom-auto", out ? "right-0" : "left-0")} style={{ top: "calc(100% + 6px)" }} onMouseLeave={() => setPick(false)}>
          {REACTION_SET.map((e) => (
            <button key={e} onClick={() => { onReact?.(message, e); setPick(false); }} className="rounded-ca-md p-1 text-[1.25rem] hover:bg-ca-700">
              {e}
            </button>
          ))}
        </Popover>
      )}
    </div>
  );
}

// ---- card-type inners ----
function CardShell({ out, children }: { out: boolean; children: ReactNode }) {
  return <div className={cn("w-[20rem] max-w-full overflow-hidden rounded-[10px] shadow-ca-bubble", out ? "bg-ca-bubble-out" : "bg-ca-bubble-in")}>{children}</div>;
}

function WaypointInner({ content, out, time }: { content: string; out: boolean; time: string }) {
  const t = useTranslations("chatapp");
  const w = parseWaypoint(content);
  const color = w?.color || "#f97316";
  // The hook must run before the `!w` bail-out, so the body re-checks instead.
  const { submit: add, isPending: adding } = useGuardedSubmit(
    async () => {
      if (!w) return;
      const r = await addWaypoint({ name: w.name, x: w.x, y: w.y, z: w.z, color });
      r?.success ? toast.success(t("message.waypointAdded", { name: w.name })) : toast.error(r?.error || t("message.waypointError"));
    },
    { onError: () => toast.error(t("message.waypointError")) },
  );
  if (!w) return null;
  const copy = () => { navigator.clipboard.writeText(`${w.x} ${w.y} ${w.z}`); toast.success(t("message.coordinatesCopied")); };
  return (
    <CardShell out={out}>
      <div className="flex items-start gap-3 p-3">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-[11px]" style={{ background: `${color}33`, color }}>
          <Icon name="mappin" size={22} />
        </div>
        <div className="min-w-0">
          <div className="text-[0.90625rem] font-semibold text-ca-bubble-in-text">{w.name}</div>
          <div className="mt-1 font-ca-mono text-[0.75rem] text-ca-200">X {w.x} · Y {w.y} · Z {w.z}</div>
          {w.dimension && <div className="mt-0.5 text-[0.78125rem] text-ca-400">{w.dimension}</div>}
        </div>
      </div>
      <div className="flex gap-2 px-3 pb-3">
        <MiniButton onClick={copy}><Icon name="copy" size={14} /> {t("message.copy")}</MiniButton>
        <MiniButton accent onClick={() => void add()} disabled={adding} className="disabled:opacity-60"><Icon name="plus" size={14} /> {t("message.addWaypoint")}</MiniButton>
      </div>
      <div className="px-[0.8125rem] pb-2 text-[0.65625rem] text-ca-500" style={{ textAlign: out ? "right" : "left" }}>{time}</div>
    </CardShell>
  );
}

function DocumentInner({ content, out, time }: { content: string; out: boolean; time: string }) {
  const t = useTranslations("chatapp");
  const d = parseDocument(content);
  if (!d) return null;
  return (
    <CardShell out={out}>
      <div className="flex items-start gap-3 p-3">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-[11px] bg-ca-info/20 text-ca-info">
          <Icon name="file" size={22} />
        </div>
        <div className="min-w-0">
          <div className="text-[0.90625rem] font-semibold text-ca-bubble-in-text">{d.title}</div>
          {d.content && <div className="mt-0.5 line-clamp-2 text-[0.78125rem] text-ca-400">{d.content}</div>}
          <div className="mt-1 font-ca-mono text-[0.78125rem] text-ca-400">{t("message.notes")}</div>
        </div>
      </div>
      <div className="flex gap-2 px-3 pb-3">
        <MiniButton onClick={() => toast.info(t("message.openingNote"))}><Icon name="eye" size={14} /> {t("message.openNote")}</MiniButton>
      </div>
      <div className="px-[0.8125rem] pb-2 text-[0.65625rem] text-ca-500" style={{ textAlign: out ? "right" : "left" }}>{time}</div>
    </CardShell>
  );
}

function VideoInner({ content, out, time }: { content: string; out: boolean; time: string }) {
  const t = useTranslations("chatapp");
  const v = parseVideo(content);
  if (!v) return null;
  const thumb = `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`;
  return (
    <div className="w-[21.25rem] max-w-full overflow-hidden rounded-[10px] bg-ca-bubble-in shadow-ca-bubble">
      <a href={v.url} target="_blank" rel="noreferrer" className="group relative block aspect-video bg-cover bg-center" style={{ backgroundImage: `url(${thumb})` }}>
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-[3.375rem] w-[3.375rem] place-items-center rounded-full bg-black/55 text-white shadow-[0_6px_20px_rgb(0_0_0/.5)] transition-transform group-hover:scale-105">
            <Icon name="play" size={22} fill="currentColor" />
          </span>
        </span>
      </a>
      <div className="px-3 py-[0.5625rem]">
        <div className="text-[0.84375rem] font-semibold text-ca-bubble-in-text">{v.title || t("media.youtubeVideo")}</div>
        <div className="mt-0.5 flex items-center gap-[0.3125rem] text-[0.71875rem] text-ca-400"><Icon name="play" size={11} /> YouTube</div>
      </div>
      <div className="bg-ca-800 px-3 pb-2 text-[0.65625rem] text-ca-500" style={{ textAlign: out ? "right" : "left" }}>{time}</div>
    </div>
  );
}

function CallInner({ message, out, onCallback, callBusy }: { message: ChatMessageVM; out: boolean; onCallback?: () => void; callBusy?: boolean }) {
  const t = useTranslations("chatapp");
  const c = parseCall(message.content);
  const missed = !c || c.duration <= 0;
  const title = missed ? t("message.call.missed") : out ? t("message.call.outgoing") : t("message.call.incoming");
  const sub = missed ? t("message.call.noAnswer") : t("message.call.duration", { time: formatDuration(c!.duration) });
  return (
    <div className="my-2.5 flex justify-center">
      <div className="inline-flex max-w-[min(27.5rem,86%)] items-center gap-3 rounded-ca-md bg-ca-bubble-in py-2 pl-3.5 pr-2 shadow-ca-bubble">
        <div className={cn("grid h-9 w-9 flex-none place-items-center rounded-full", missed ? "bg-ca-error/[.16] text-ca-error" : "bg-ca-online/[.16] text-ca-online")}>
          <Icon name="phone" size={17} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 whitespace-nowrap text-[0.875rem] font-semibold text-ca-50">
            <Icon name={missed ? "calldown" : out ? "callup" : "calldown"} size={13} className={missed ? "text-ca-error" : "text-ca-online"} /> {title}
          </div>
          <div className="mt-px text-[0.75rem] text-ca-400">{sub} · {timeOf(message.createdAt)}</div>
        </div>
        <button onClick={onCallback} disabled={callBusy} title={t("actions.call")} className="grid h-[2.375rem] w-[2.375rem] flex-none place-items-center rounded-full text-ca-accent-soft transition-colors hover:bg-ca-accent/[.14] active:scale-[.92] disabled:opacity-60">
          <Icon name="phone" size={17} />
        </button>
      </div>
    </div>
  );
}

export function MessageRow({
  message,
  prev,
  next,
  chat,
  isGroup,
  myUuid,
  onReact,
  onReply,
  onOpenImage,
  onCallback,
  callBusy,
}: {
  message: ChatMessageVM;
  prev?: ChatMessageVM;
  next?: ChatMessageVM;
  chat: ChatVM;
  isGroup: boolean;
  myUuid: string;
  onReact?: (m: ChatMessageVM, emoji: string) => void;
  onReply?: (m: ChatMessageVM) => void;
  onOpenImage?: (m: ChatMessageVM) => void;
  onCallback?: () => void;
  callBusy?: boolean;
}) {
  const t = useTranslations("chatapp");
  if (message.uuid === "system" || message.type === "system") {
    return <div className="my-1.5 self-center rounded-ca-md bg-ca-header px-[0.8125rem] py-[0.3125rem] text-[0.78125rem] text-ca-300 shadow-[0_1px_1px_rgba(0,0,0,.08)]">{message.content}</div>;
  }

  const out = message.uuid === myUuid;
  if (message.type === "call") return <CallInner message={message} out={out} onCallback={onCallback} callBusy={callBusy} />;

  const notFlow = (m?: ChatMessageVM) => m && m.type !== "system" && m.type !== "call";
  const samePrev = notFlow(prev) && prev!.uuid === message.uuid;
  const sameNext = notFlow(next) && next!.uuid === message.uuid;
  const isFirst = !samePrev;
  const isLast = !sameNext;
  const time = timeOf(message.createdAt);
  const status: MessageStatus = message.status ?? "sent";

  let inner: ReactNode;
  if (message.type === "image") {
    const d = parseImage(message.content);
    inner = d ? <ImageBubble data={d} out={out} time={time} onOpen={() => onOpenImage?.(message)} /> : null;
  } else if (message.type === "waypoint") inner = <WaypointInner content={message.content} out={out} time={time} />;
  else if (message.type === "document") inner = <DocumentInner content={message.content} out={out} time={time} />;
  else if (message.type === "video") inner = <VideoInner content={message.content} out={out} time={time} />;
  else if (message.type === "emoji") {
    inner = (
      <div>
        <div className="text-[3.375rem] leading-[1.1]">{message.content}</div>
        <div className={cn("mt-0.5 text-[0.65625rem] text-ca-500", out ? "text-right" : "text-left")}>{time}{out && (status === "read" ? " ✓✓" : " ✓")}</div>
      </div>
    );
  } else if (message.type === "sticker") {
    inner = (
      <div>
        <img src={message.content} alt={t("message.stickerAlt")} className="h-32 w-32 object-contain drop-shadow-[0_4px_8px_rgb(0_0_0/.25)]" />
        <div className={cn("mt-0.5 text-[0.65625rem] text-ca-500", out ? "text-right" : "text-left")}>{time}</div>
      </div>
    );
  } else {
    inner = (
      <div
        className={cn(
          "relative max-w-full overflow-hidden break-words rounded-ca-md px-[0.5625rem] pb-[0.4375rem] pt-1.5 text-[0.8875rem] leading-[1.38] shadow-ca-bubble [overflow-wrap:anywhere]",
          out ? "bg-ca-bubble-out text-ca-bubble-out-text" : "bg-ca-bubble-in text-ca-bubble-in-text",
          isFirst && (out ? "rounded-tr-none" : "rounded-tl-none"),
        )}
      >
        {isFirst && (
          <span
            className={cn("absolute top-0 h-[0.8125rem] w-2", out ? "-right-2 bg-ca-bubble-out" : "-left-2 bg-ca-bubble-in")}
            style={{ WebkitMaskImage: out ? "radial-gradient(circle at 100% 0, transparent 8px, #000 8px)" : "radial-gradient(circle at 0 0, transparent 8px, #000 8px)", maskImage: out ? "radial-gradient(circle at 100% 0, transparent 8px, #000 8px)" : "radial-gradient(circle at 0 0, transparent 8px, #000 8px)" }}
          />
        )}
        {message.replyTo != null && <ReplyQuote chat={chat} replyTo={message.replyTo} out={out} />}
        <span className="whitespace-pre-wrap">{message.content}</span>
        <MetaLine time={time} out={out} status={status} />
      </div>
    );
  }

  return (
    <div className={cn("group/m flex w-full gap-2", out ? "justify-end" : "justify-start")} style={{ marginTop: isFirst ? 7 : 1 }}>
      {!out && (
        <div className="mb-0.5 h-7 w-7 flex-none self-end overflow-hidden rounded-full">
          {isLast && isGroup && <img src={mcHead(message.uuid)} alt="" className="h-full w-full object-cover [image-rendering:pixelated]" />}
        </div>
      )}
      <div className={cn("flex min-w-0 max-w-[min(35rem,76%)] flex-col", out && "items-end")}>
        {!out && isGroup && isFirst && <div className="mx-2 my-0.5 text-[0.78125rem] font-semibold text-ca-accent-soft">{memberName(chat, message.uuid)}</div>}
        {inner}
        <Reactions message={message} myUuid={myUuid} onReact={onReact} />
      </div>
      <HoverTools message={message} out={out} onReact={onReact} onReply={onReply} />
    </div>
  );
}
