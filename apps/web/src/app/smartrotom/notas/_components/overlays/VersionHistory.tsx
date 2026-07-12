"use client";

import { Overlay, MODAL_PANEL, Icon } from "../ui";
import { useRotomRequest } from "@/hooks/useRotomRequest";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
import type { NoteVersion } from "@boffmedia/shared";
import { fullDate, toMs } from "../../_utils/format";
import type { NoteVM } from "../../_types";

export function VersionHistory({
  note,
  onClose,
  onRestore,
}: {
  note: NoteVM;
  onClose: () => void;
  onRestore: (versionId: number) => void;
}) {
  const { data, isLoading } = useRotomRequest<NoteVersion[]>(DocumentsService.getVersions, note.id);
  const versions = data ?? [];

  return (
    <Overlay onClose={onClose} align="center">
      <div className={`${MODAL_PANEL} w-[460px] max-w-[92vw]`}>
        <div className="flex items-center gap-2.5 border-b border-nt-border px-[18px] py-4">
          <Icon name="history" size={17} className="text-nt-accent-fg" />
          <h3 className="m-0 flex-1 truncate text-[16px] font-[650] text-nt-fg">Historial de versiones</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-nt-fg-subtle hover:text-nt-fg">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="nt-scroll max-h-[420px] overflow-auto p-2.5">
          {isLoading ? (
            <div className="px-3 py-10 text-center text-[13px] text-nt-fg-subtle">Cargando…</div>
          ) : versions.length === 0 ? (
            <div className="px-3 py-10 text-center text-[13px] leading-[1.6] text-nt-fg-subtle">
              Aún no hay versiones guardadas.
              <br />
              Se crea una instantánea al guardar cambios importantes.
            </div>
          ) : (
            versions.map((v, i) => (
              <div key={v.id} className="group flex gap-3 rounded-nt-md px-3.5 py-3 hover:bg-nt-hover">
                <div className="flex flex-col items-center">
                  <span
                    className={`mt-1 h-[11px] w-[11px] flex-none rounded-full border-2 border-nt-accent ${
                      i === 0 ? "bg-nt-accent" : "bg-nt-bg-2"
                    }`}
                  />
                  {i < versions.length - 1 && <span className="my-1 w-0.5 flex-1 bg-nt-border-2" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-nt-fg">
                      {v.label || (i === 0 ? "Actual" : `Versión ${versions.length - i}`)}
                    </span>
                    <span className="text-[11px] tabular-nums text-nt-fg-subtle">{v.words} palabras</span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-nt-fg-subtle">{fullDate(toMs(v.createdAt))}</div>
                </div>
                {i !== 0 && (
                  <button
                    onClick={() => {
                      onRestore(v.id);
                      onClose();
                    }}
                    className="self-center rounded-nt-sm border border-nt-border bg-nt-hover px-2.5 py-1 text-[12px] text-nt-fg-muted opacity-0 transition-opacity hover:text-nt-fg group-hover:opacity-100"
                  >
                    Restaurar
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Overlay>
  );
}
