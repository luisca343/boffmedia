"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { getSmartRotomUser } from "@/lib/utils";
import { useGetAllUsers } from "@/hooks/users/useGetAllUsers";
import { useCreateChat } from "@/hooks/chatapp/useCreateChat";
import { useGuardedSubmit } from "@/components/smartrotom/behavior/useGuardedSubmit";
import { Avatar, Button, Field, Icon, Modal, ModalFoot, SearchBox } from "../ui";

type Player = { uuid: string; username: string };

export function CreateGroupModal({ session, onClose, onCreated }: { session: unknown; onClose: () => void; onCreated: (chatId: number) => void }) {
  const t = useTranslations("chatapp");
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

  const placeholder = sel.length > 1 ? t("createGroup.groupName") : sel.length === 1 ? sel[0].username : t("createGroup.savedMessages");
  const canCreate = sel.length === 1 || (sel.length > 1 && name.trim().length > 0);

  const { submit: create, isPending: creating } = useGuardedSubmit(async () => {
    if (!canCreate || !myUuid) return;
    try {
      const res = (await createChat({ player: myUuid, users: sel.map((u) => u.uuid), name: name.trim() || placeholder })) as {
        success?: boolean;
        userMessage?: string;
        data?: { chatId?: number; id?: number };
      };
      // An HTTP failure resolves rather than throws, so without this the modal would close
      // as if the chat had been created.
      const id = res.success ? res.data?.chatId ?? res.data?.id : undefined;
      if (id == null) {
        toast.error(res.userMessage ?? t("createGroup.createFailed"));
        return;
      }
      onCreated(id);
      onClose();
    } catch {
      toast.error(t("createGroup.createFailed"));
    }
  });

  return (
    <Modal
      title={t("createGroup.title")}
      icon="users"
      onClose={onClose}
      foot={
        <ModalFoot>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={() => void create()} disabled={!canCreate || isLoading || creating}>{t("createGroup.createChat")}</Button>
        </ModalFoot>
      }
    >
      {sel.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {sel.map((u) => (
            <span key={u.uuid} className="inline-flex items-center gap-1.5 rounded-full bg-ca-800 py-0.5 pl-0.5 pr-1.5 text-[0.78125rem] text-ca-100">
              <Avatar src={`https://mc-heads.net/avatar/${u.uuid}`} size={22} />
              {u.username}
              <button onClick={() => toggle(u)} aria-label={t("createGroup.remove")}><Icon name="x" size={13} /></button>
            </span>
          ))}
        </div>
      )}

      <SearchBox value={query} onChange={setQuery} placeholder={t("createGroup.searchPlayers")} className="mb-3" />

      <div className="ca-scroll flex max-h-[15rem] flex-col gap-0.5 overflow-y-auto">
        {list.map((u) => {
          const on = !!sel.find((x) => x.uuid === u.uuid);
          return (
            <button key={u.uuid} onClick={() => toggle(u)} className={cn("flex items-center gap-3 rounded-ca-lg p-2 text-left transition-colors hover:bg-ca-500/10", on && "bg-ca-500/[.08]")}>
              <Avatar src={`https://mc-heads.net/avatar/${u.uuid}`} size={38} />
              <span className="flex-1 text-[0.875rem] font-semibold text-ca-50">{u.username}</span>
              <span className={cn("grid h-[1.375rem] w-[1.375rem] place-items-center rounded-full border-2", on ? "border-ca-accent bg-ca-accent text-ca-on-accent" : "border-ca-500")}>
                {on && <Icon name="check" size={15} />}
              </span>
            </button>
          );
        })}
        {list.length === 0 && <div className="py-8 text-center text-[0.84375rem] text-ca-500">{t("createGroup.noPlayers")}</div>}
      </div>

      {sel.length > 1 && <Field className="mt-3" placeholder={placeholder} value={name} onChange={(e) => setName(e.target.value)} />}
    </Modal>
  );
}
