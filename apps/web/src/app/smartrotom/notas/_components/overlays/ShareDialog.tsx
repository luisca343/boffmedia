"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Overlay, MODAL_PANEL, Icon, Avatar } from "../ui";
import { hashColor, COLOR_RGB } from "../../_utils/colors";
import type { NoteVM } from "../../_types";

// Note: a full user-directory picker needs a users search endpoint; for now we
// manage shares by UUID and toggle public visibility. [deferred: user search]
export function ShareDialog({
  note,
  onClose,
  onShare,
  onUnshare,
  onTogglePublic,
}: {
  note: NoteVM;
  onClose: () => void;
  onShare: (uuid: string) => void;
  onUnshare: (uuid: string) => void;
  onTogglePublic: (isPublic: boolean) => void;
}) {
  const t = useTranslations("notas");
  const [uuid, setUuid] = useState("");

  return (
    <Overlay onClose={onClose} align="center">
      <div className={`${MODAL_PANEL} w-[460px] max-w-[92vw]`}>
        <div className="flex items-center gap-2.5 border-b border-nt-border px-[18px] py-4">
          <Icon name="share" size={17} className="text-nt-accent-fg" />
          <h3 className="m-0 flex-1 truncate text-[16px] font-[650] text-nt-fg">
            {t("share.title")} «{note.title}»
          </h3>
          <button onClick={onClose} aria-label={t("common.close")} className="text-nt-fg-subtle hover:text-nt-fg">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="p-[18px]">
          <div className="mb-4 flex items-center gap-2">
            <input
              value={uuid}
              onChange={(e) => setUuid(e.target.value)}
              placeholder={t("share.trainerUuid")}
              className="h-9 flex-1 rounded-nt-md border border-nt-border bg-nt-bg-2 px-3 text-[13px] text-nt-fg outline-none placeholder:text-nt-fg-subtle focus:border-nt-accent"
            />
            <button
              disabled={!uuid.trim()}
              onClick={() => {
                onShare(uuid.trim());
                setUuid("");
              }}
              className="inline-flex h-9 items-center gap-2 rounded-nt-md bg-gradient-to-b from-nt-500 to-nt-600 px-3.5 text-[13px] font-[550] text-white disabled:opacity-50 hover:enabled:brightness-[1.06]"
            >
              <Icon name="plus" size={14} /> {t("share.add")}
            </button>
          </div>

          <div className="mb-2 font-nt-display text-[10px] font-semibold uppercase tracking-[.12em] text-nt-fg-subtle">
            {t("share.shareWith")}
          </div>
          {note.sharedWith.length ? (
            <div className="flex flex-col gap-1">
              {note.sharedWith.map((u) => (
                <div key={u} className="flex items-center gap-2.5 rounded-nt-md px-1.5 py-2 hover:bg-nt-hover">
                  <Avatar name={u} color={`rgb(${COLOR_RGB[hashColor(u)]})`} size={30} />
                  <span className="flex-1 truncate text-[13px] text-nt-fg">{u}</span>
                  <button
                    onClick={() => onUnshare(u)}
                    className="text-nt-fg-subtle hover:text-nt-c-error"
                    aria-label={t("share.removeAccess")}
                  >
                    <Icon name="x" size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 text-[13px] text-nt-fg-subtle">{t("share.onlyYou")}</p>
          )}

          <button
            onClick={() => onTogglePublic(!note.public)}
            className="mt-4 flex w-full items-center gap-2.5 rounded-nt-md border border-nt-border bg-nt-bg-1 px-3 py-2.5 text-left transition-colors hover:bg-nt-hover"
          >
            <Icon name={note.public ? "globe" : "lock"} size={16} className="text-nt-accent-fg" />
            <span className="flex-1">
              <span className="block text-[13px] font-medium text-nt-fg">
                {note.public ? t("share.public") : t("share.private")}
              </span>
              <span className="block text-[11.5px] text-nt-fg-muted">
                {note.public ? t("share.publicDesc") : t("share.privateDesc")}
              </span>
            </span>
            <span
              className={`relative h-5 w-9 flex-none rounded-full transition-colors ${
                note.public ? "bg-nt-accent" : "bg-nt-hover-strong"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                  note.public ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
          </button>
        </div>
      </div>
    </Overlay>
  );
}
