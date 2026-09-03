"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Avatar, Chip, Icon, Modal, SearchBox } from "../ui";
import type { ChatVM } from "../../_types/view";
import { timeOf } from "../../_utils/format";

export function SearchModal({ chats, myUuid, onClose, onJump }: { chats: ChatVM[]; myUuid: string; onClose: () => void; onJump: (id: number) => void }) {
  const t = useTranslations("chatapp");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const FILTERS = [
    { id: "all", label: t("searchModal.filters.all"), types: null as string[] | null },
    { id: "photos", label: t("searchModal.filters.photos"), types: ["image"] },
    { id: "links", label: t("searchModal.filters.links"), types: ["video"] },
    { id: "docs", label: t("searchModal.filters.docs"), types: ["document"] },
    { id: "wp", label: t("searchModal.filters.wp"), types: ["waypoint"] },
  ];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const active = FILTERS.find((f) => f.id === filter);
    const out: { chat: ChatVM; message: ChatVM["messages"][number] }[] = [];
    for (const chat of chats) {
      for (const m of chat.messages) {
        if (active?.types && !active.types.includes(m.type)) continue;
        const hay = active?.types ? true : typeof m.content === "string" && m.content.toLowerCase().includes(q);
        if (q && !hay && !chat.name.toLowerCase().includes(q)) continue;
        if (!q && !active?.types) continue;
        out.push({ chat, message: m });
        if (out.length >= 30) return out;
      }
    }
    return out;
  }, [chats, query, filter]);

  return (
    <Modal title={t("searchModal.title")} icon="search" wide onClose={onClose}>
      <SearchBox value={query} onChange={setQuery} placeholder={t("searchModal.placeholder")} className="mb-3" autoFocus iconSize={18} />
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Chip>
        ))}
      </div>
      {!query.trim() && filter === "all" ? (
        <div className="px-2.5 py-8 text-center text-ca-500">
          <Icon name="search" size={34} className="mx-auto opacity-50" />
          <p className="mt-2.5 text-[0.84375rem]">{t("searchModal.emptyHint")}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="px-2.5 py-8 text-center text-[0.84375rem] text-ca-500">{t("searchModal.noResults")}</div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {results.map(({ chat, message }, i) => (
            <button key={`${chat.id}-${message.id}-${i}`} onClick={() => onJump(chat.id)} className="flex items-center gap-3.5 rounded-ca-md px-2 py-2 text-left transition-colors hover:bg-ca-500/10">
              <Avatar src={chat.image} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[1rem] font-medium text-ca-50">{chat.name}</span>
                  <span className="ml-auto text-[0.75rem] text-ca-400">{timeOf(message.createdAt)}</span>
                </div>
                <div className="truncate text-[0.875rem] text-ca-300">
                  {message.uuid === myUuid ? `${t("preview.you")}: ` : ""}
                  {message.type === "text" || message.type === "emoji" || message.type === "chat" ? message.content : message.type}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
