"use client";

/**
 * Paste a Showdown team. Shared by the list (new team from paste) and the
 * editor (replace this team's slots). A paste that does not parse says so,
 * inline, and keeps the text — the old modals swallowed the error and closed.
 */

import * as React from "react";
import type { PokemonSet } from "@pkmn/sim";
import { importPaste } from "@boffmedia/battle-core";
import { Banner, Button, Modal, Textarea } from "@boffmedia/ui";

import { useToolT } from "../i18n";
import { TB_NS } from "./labels";

export function ImportPasteModal({
  open,
  onClose,
  onImport,
  fields,
  note,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (sets: PokemonSet[]) => Promise<void> | void;
  /** Controls above the textarea — a format select, a name field. */
  fields?: React.ReactNode;
  note?: React.ReactNode;
}) {
  const t = useToolT(TB_NS);
  const [text, setText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setText("");
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const submit = async () => {
    let sets: PokemonSet[] | null = null;
    try {
      sets = importPaste(text);
    } catch {
      sets = null;
    }
    if (!sets || !sets.length || !sets.some((s) => s.species)) {
      setError(t("importModal.error"));
      return;
    }
    setBusy(true);
    try {
      await onImport(sets);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("importModal.title")}
      footer={
        <>
          <Button size="sm" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button size="sm" variant="pri" icon="upload" onClick={() => void submit()} disabled={!text.trim()} loading={busy}>
            {t("import")}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        {fields}
        {note && <p className="m-0 font-body text-[13px] leading-[1.45] text-txt-dim">{note}</p>}
        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          placeholder={t("importModal.placeholder")}
          aria-label={t("importModal.title")}
          aria-invalid={error ? true : undefined}
          spellCheck={false}
          className="min-h-[220px] font-mono text-[12.5px] leading-[1.5]"
        />
        {error && <Banner tone="error">{error}</Banner>}
      </div>
    </Modal>
  );
}
