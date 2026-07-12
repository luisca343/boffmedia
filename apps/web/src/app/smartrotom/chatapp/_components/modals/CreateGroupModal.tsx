"use client";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { getSmartRotomUser } from "@/lib/utils";
import { useGetAllUsers } from "@/hooks/users/useGetAllUsers";
import { useCreateChat } from "@/hooks/chatapp/useCreateChat";
import { Avatar, Button, Field, Icon, Modal, ModalFoot, SearchBox } from "../ui";

type Player = { uuid: string; username: string };

export function CreateGroupModal({ session, onClose, onCreated }: { session: unknown; onClose: () => void; onCreated: (chatId: number) => void }) {
  const myUuid = getSmartRotomUser(session)?.uuid;
  const { users } = useGetAllUsers();
  const { createChat, isLoading } = useCreateChat();
  const [sel, setSel] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");

  const list = useMemo(
    () => ((users as Player[]) ?? []).filter((u) => u.uuid !== myUuid && u.username.toLowerCase().includes(query.toLowerCase())),
    [users, myUuid, query],
  );
  const toggle = (u: Player) => setSel((s) => (s.find((x) => x.uuid === u.uuid) ? s.filter((x) => x.uuid !== u.uuid) : [...s, u]));

  const placeholder = sel.length > 1 ? "Nombre del grupo" : sel.length === 1 ? sel[0].username : "Mensajes guardados";
  const canCreate = sel.length === 1 || (sel.length > 1 && name.trim().length > 0);

  const create = async () => {
    if (!canCreate || !myUuid) return;
    try {
      const res = (await createChat({ player: myUuid, users: sel.map((u) => u.uuid), name: name.trim() || placeholder })) as {
        data?: { chatId?: number; id?: number };
      };
      const id = res.data?.chatId ?? res.data?.id;
      if (id != null) onCreated(id);
      onClose();
    } catch {
      toast.error("No se pudo crear el chat");
    }
  };

  return (
    <Modal
      title="Nuevo chat"
      icon="users"
      onClose={onClose}
      foot={
        <ModalFoot>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={create} disabled={!canCreate || isLoading}>Crear chat</Button>
        </ModalFoot>
      }
    >
      {sel.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {sel.map((u) => (
            <span key={u.uuid} className="inline-flex items-center gap-1.5 rounded-full bg-ca-800 py-0.5 pl-0.5 pr-1.5 text-[12.5px] text-ca-100">
              <Avatar src={`https://mc-heads.net/avatar/${u.uuid}`} size={22} />
              {u.username}
              <button onClick={() => toggle(u)} aria-label="Quitar"><Icon name="x" size={13} /></button>
            </span>
          ))}
        </div>
      )}

      <SearchBox value={query} onChange={setQuery} placeholder="Buscar jugadores…" className="mb-3" />

      <div className="ca-scroll flex max-h-[240px] flex-col gap-0.5 overflow-y-auto">
        {list.map((u) => {
          const on = !!sel.find((x) => x.uuid === u.uuid);
          return (
            <button key={u.uuid} onClick={() => toggle(u)} className={cn("flex items-center gap-3 rounded-ca-lg p-2 text-left transition-colors hover:bg-ca-500/10", on && "bg-ca-500/[.08]")}>
              <Avatar src={`https://mc-heads.net/avatar/${u.uuid}`} size={38} />
              <span className="flex-1 text-[14px] font-semibold text-ca-50">{u.username}</span>
              <span className={cn("grid h-[22px] w-[22px] place-items-center rounded-full border-2", on ? "border-ca-accent bg-ca-accent text-ca-on-accent" : "border-ca-500")}>
                {on && <Icon name="check" size={15} />}
              </span>
            </button>
          );
        })}
        {list.length === 0 && <div className="py-8 text-center text-[13.5px] text-ca-500">No hay jugadores.</div>}
      </div>

      {sel.length > 1 && <Field className="mt-3" placeholder={placeholder} value={name} onChange={(e) => setName(e.target.value)} />}
    </Modal>
  );
}
