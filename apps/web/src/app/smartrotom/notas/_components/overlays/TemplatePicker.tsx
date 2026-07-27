"use client";

import { useTranslations } from "next-intl";
import { Overlay, MODAL_PANEL, Icon } from "../ui";
import { TEMPLATES } from "../../_data/templates";

export function TemplatePicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (tpl: { name: string; content: string }) => void;
}) {
  const t = useTranslations("notas");
  return (
    <Overlay onClose={onClose} align="center">
      <div className={`${MODAL_PANEL} w-[560px] max-w-[92vw]`}>
        <div className="flex items-center gap-2.5 border-b border-nt-border px-[18px] py-4">
          <Icon name="layers" size={18} className="text-nt-accent-fg" />
          <h3 className="m-0 flex-1 text-[16px] font-[650] text-nt-fg">{t("commands.fromTemplate")}</h3>
          <button onClick={onClose} aria-label={t("common.close")} className="text-nt-fg-subtle hover:text-nt-fg">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="grid gap-2 p-[18px] sm:grid-cols-2">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => {
                onPick({ name: t(tpl.nameKey), content: t(tpl.contentKey) });
                onClose();
              }}
              className="flex items-start gap-3 rounded-nt-md border border-nt-border bg-nt-bg-1 p-3 text-left transition-colors hover:border-nt-border-2 hover:bg-nt-hover"
            >
              <span className="grid h-9 w-9 flex-none place-items-center rounded-nt-md bg-nt-accent/15 text-nt-accent-fg">
                <Icon name={tpl.icon} size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-nt-fg">{t(tpl.nameKey)}</span>
                <span className="mt-0.5 block text-[12px] leading-[1.4] text-nt-fg-muted">{t(tpl.descKey)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Overlay>
  );
}
