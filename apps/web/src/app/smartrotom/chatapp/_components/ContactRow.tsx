import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Avatar, CountBadge, Dots, Icon } from "./ui";
import type { ChatVM } from "../_types/view";
import { isDirect, isSaved, lastMessage } from "../_utils/chat";
import { previewOf } from "../_utils/preview";
import { timeOf } from "../_utils/format";

export function ContactRow({
  chat,
  active,
  myUuid,
  typing,
  onClick,
}: {
  chat: ChatVM;
  active: boolean;
  myUuid: string;
  typing?: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("chatapp");
  const p = previewOf(chat, myUuid, t);
  const unread = chat.unread > 0;
  const last = lastMessage(chat);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick())}
      className={cn(
        "relative flex cursor-pointer items-center gap-[13px] px-[14px] py-[11px] transition-colors duration-[120ms] hover:bg-ca-500/[.08]",
        active && "bg-ca-500/[.14]",
      )}
    >
      <span className="pointer-events-none absolute bottom-0 left-[76px] right-0 h-px bg-ca-800" />
      <Avatar src={chat.image} size={49} presence={isDirect(chat.type) && !isSaved(chat.type) ? chat.presence : undefined} />

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center gap-1.5">
          {isSaved(chat.type) && <Icon name="archive" size={14} className="flex-none text-ca-accent-soft" />}
          <span className="truncate text-[16px] font-medium text-ca-50">{chat.name}</span>
          <span className={cn("ml-auto flex-none text-[12px]", unread ? "text-ca-accent-soft" : "text-ca-400")}>
            {timeOf(last?.createdAt)}
          </span>
        </div>

        <div className="mt-[3px] flex items-center gap-1.5">
          <span className={cn("flex min-w-0 flex-1 items-center gap-[5px] text-[14px]", unread ? "text-ca-300" : "text-ca-400")}>
            {typing ? (
              <span className="flex items-center gap-1.5 text-ca-accent-soft">
                <Dots sm /> {t("status.typing")}
              </span>
            ) : (
              <>
                {p.icon && <Icon name={p.icon} size={14} className="flex-none text-ca-500" />}
                <span className="truncate">{p.text}</span>
              </>
            )}
          </span>
          {chat.muted && <Icon name="belloff" size={14} className="flex-none text-ca-500" />}
          {chat.pinned && !unread && <Icon name="pin" size={13} className="flex-none rotate-45 text-ca-500" />}
          {unread && <CountBadge count={chat.unread} />}
        </div>
      </div>
    </div>
  );
}
