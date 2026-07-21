"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useBoffSession } from "@/services/useBoffSession";
import { useGetNotes } from "@/hooks/documents/useGetNotes";
import { getSmartRotomUser } from "@/lib/utils";
import { Icon, Modal, SearchBox } from "../ui";

type Note = { id: number | string; title: string; content?: string };

export function DocumentPicker({
  open,
  onOpenChange,
  onDocumentSelect,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDocumentSelect: (doc: { id: string; title: string; content: string }) => void;
}) {
  const t = useTranslations("chatapp");
  const { session } = useBoffSession();
  const { notes, isLoading } = useGetNotes(getSmartRotomUser(session)?.uuid as string);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => ((notes as Note[]) ?? []).filter((n) => n.title?.toLowerCase().includes(query.toLowerCase())),
    [notes, query],
  );

  if (!open) return null;
  const close = () => onOpenChange?.(false);

  return (
    <Modal title={t("notePicker.title")} icon="file" onClose={close}>
      <SearchBox value={query} onChange={setQuery} placeholder={t("notePicker.searchPlaceholder")} className="mb-3" />
      {isLoading ? (
        <div className="py-10 text-center text-[13.5px] text-ca-500">{t("notePicker.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-[13.5px] text-ca-500">{t("notePicker.noResults")}</div>
      ) : (
        <div className="flex flex-col gap-1">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => { onDocumentSelect({ id: String(n.id), title: n.title, content: n.content ?? "" }); close(); }}
              className="flex w-full items-center gap-3 rounded-ca-md p-2 text-left transition-colors hover:bg-ca-500/10"
            >
              <span className="grid h-10 w-10 flex-none place-items-center rounded-ca-md bg-ca-info/20 text-ca-info">
                <Icon name="file" size={20} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-semibold text-ca-50">{n.title || t("notePicker.untitled")}</span>
                {n.content && <span className="block truncate text-[12.5px] text-ca-400">{n.content}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
