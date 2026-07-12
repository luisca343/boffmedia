"use client";
import { useMemo, useState } from "react";
import { Avatar, Chip, Icon, Modal, SearchBox } from "../ui";
import type { ChatVM } from "../../_types/view";
import { timeOf } from "../../_utils/format";

const FILTERS = [
  { id: "all", label: "Todo", types: null as string[] | null },
  { id: "photos", label: "Fotos", types: ["image"] },
  { id: "links", label: "Enlaces", types: ["video"] },
  { id: "docs", label: "Documentos", types: ["document"] },
  { id: "wp", label: "Waypoints", types: ["waypoint"] },
];

export function SearchModal({ chats, myUuid, onClose, onJump }: { chats: ChatVM[]; myUuid: string; onClose: () => void; onJump: (id: number) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

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
    <Modal title="Buscar en todos los chats" icon="search" wide onClose={onClose}>
      <SearchBox value={query} onChange={setQuery} placeholder="Mensajes, personas, waypoints…" className="mb-3" autoFocus iconSize={18} />
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Chip>
        ))}
      </div>
      {!query.trim() && filter === "all" ? (
        <div className="px-2.5 py-8 text-center text-ca-500">
          <Icon name="search" size={34} className="mx-auto opacity-50" />
          <p className="mt-2.5 text-[13.5px]">Busca por palabra, persona o coordenadas.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="px-2.5 py-8 text-center text-[13.5px] text-ca-500">Sin resultados.</div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {results.map(({ chat, message }, i) => (
            <button key={`${chat.id}-${message.id}-${i}`} onClick={() => onJump(chat.id)} className="flex items-center gap-3.5 rounded-ca-md px-2 py-2 text-left transition-colors hover:bg-ca-500/10">
              <Avatar src={chat.image} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[16px] font-medium text-ca-50">{chat.name}</span>
                  <span className="ml-auto text-[12px] text-ca-400">{timeOf(message.createdAt)}</span>
                </div>
                <div className="truncate text-[14px] text-ca-300">
                  {message.uuid === myUuid ? "Tú: " : ""}
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
