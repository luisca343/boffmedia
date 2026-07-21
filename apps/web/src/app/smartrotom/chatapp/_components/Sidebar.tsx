import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Chip, Icon, IconButton, SearchBox, type IconName } from "./ui";
import { ContactRow } from "./ContactRow";
import type { ChatVM } from "../_types/view";
import { isGroupLike } from "../_utils/chat";

type Category = "all" | "unread" | "direct" | "groups" | "favorites";

function SectionHead({ icon, children }: { icon?: IconName; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-4 pb-1.5 pt-3.5 text-[13px] font-semibold text-ca-accent-soft">
      {icon && <Icon name={icon} size={12} />}
      {children}
    </div>
  );
}

export function Sidebar({
  chats,
  activeId,
  myUuid,
  typingChatIds,
  className,
  onSelect,
  onNew,
  onOpenSearch,
  onOpenSettings,
}: {
  chats: ChatVM[];
  activeId: number | null;
  myUuid: string;
  typingChatIds?: Set<number>;
  className?: string;
  onSelect: (id: number) => void;
  onNew: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}) {
  const t = useTranslations("chatapp");
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");

  const CATEGORIES: { id: Category; label: string }[] = [
    { id: "all", label: t("sidebar.categories.all") },
    { id: "unread", label: t("sidebar.categories.unread") },
    { id: "direct", label: t("sidebar.categories.direct") },
    { id: "groups", label: t("sidebar.categories.groups") },
    { id: "favorites", label: t("sidebar.categories.favorites") },
  ];

  const filtered = useMemo(() => {
    let list = chats;
    if (category === "unread") list = list.filter((c) => c.unread > 0);
    else if (category === "direct") list = list.filter((c) => !isGroupLike(c.type));
    else if (category === "groups") list = list.filter((c) => isGroupLike(c.type));
    else if (category === "favorites") list = list.filter((c) => c.pinned);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.messages.some((m) => typeof m.content === "string" && m.content.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [chats, category, query]);

  const pinned = filtered.filter((c) => c.pinned);
  const rest = filtered.filter((c) => !c.pinned);
  const unreadCount = chats.filter((c) => c.unread > 0).length;

  const renderRow = (c: ChatVM) => (
    <ContactRow key={c.id} chat={c} active={c.id === activeId} myUuid={myUuid} typing={typingChatIds?.has(c.id)} onClick={() => onSelect(c.id)} />
  );

  return (
    <aside className={cn("flex min-h-0 w-[360px] flex-none flex-col border-r border-ca-800 bg-ca-panel", className)}>
      <div className="flex flex-col bg-ca-panel">
        <div className="flex h-[60px] items-center gap-2.5 bg-ca-header px-4">
          <div className="flex min-w-0 items-center gap-[11px]">
            <div className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full bg-ca-accent">
              <Icon name="message" size={18} className="text-ca-on-accent" />
            </div>
            <div className="text-[17px] font-bold leading-[1.1] tracking-[-.01em] text-ca-50">
              {t("sidebar.title")}
              <small className="mt-px block text-[11px] font-medium tracking-[.02em] text-ca-400">{t("sidebar.subtitle")}</small>
            </div>
          </div>
          <div className="ml-auto flex gap-0.5">
            <IconButton icon="search" onClick={onOpenSearch} title={t("common.search")} />
            <IconButton icon="edit" iconSize={18} onClick={onNew} title={t("common.newChat")} />
            <IconButton icon="settings" onClick={onOpenSettings} title={t("common.settings")} />
          </div>
        </div>
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder={t("sidebar.searchPlaceholder")}
          className="mx-3 mb-1.5 mt-2"
          right={
            query ? (
              <button type="button" onClick={() => setQuery("")} aria-label={t("sidebar.clearSearch")}>
                <Icon name="x" size={15} className="text-ca-500" />
              </button>
            ) : (
              <span className="rounded-[5px] border border-ca-700 px-[5px] py-px font-ca-mono text-[10px] text-ca-500">⌘K</span>
            )
          }
        />
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-ca-800 px-3.5 pb-2.5 pt-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            active={category === c.id}
            onClick={() => setCategory(c.id)}
            badge={c.id === "unread" && unreadCount > 0 ? unreadCount : undefined}
          >
            {c.label}
          </Chip>
        ))}
      </div>

      <div className="ca-scroll flex min-h-0 flex-1 flex-col overflow-y-auto bg-ca-panel">
        {pinned.length > 0 && (
          <>
            <SectionHead icon="pin">{t("sidebar.pinned")}</SectionHead>
            {pinned.map(renderRow)}
          </>
        )}
        {rest.length > 0 && pinned.length > 0 && <SectionHead>{t("sidebar.allChats")}</SectionHead>}
        {rest.map(renderRow)}
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-ca-500">
            <Icon name="search" size={30} className="mx-auto opacity-50" />
            <p className="mt-3 text-[13.5px]">{t("sidebar.noResults")}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
