import { type CSSProperties, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ModalShell } from "@/components/smartrotom/behavior/ModalShell";
import { useResolvedTheme } from "../../_hooks/useResolvedTheme";
import { Icon, type IconName } from "./Icon";
import { IconButton } from "./IconButton";

type Props = {
  title: ReactNode;
  icon?: IconName;
  wide?: boolean;
  onClose: () => void;
  foot?: ReactNode;
  children: ReactNode;
  /** Dim the scrim harder (image viewer). */
  scrimClassName?: string;
  /** Render children flush (no head/body chrome) — used by the image viewer. */
  bare?: boolean;
};

/** The `.ca-app` scope-root classes, for the shared `ModalShell`'s portal. */
export const CA_SCOPE = "ca-app font-ca text-ca-50";

/**
 * Centered dialog over a scrim — a skin over the shared `ModalShell` (portal + Escape +
 * scrim-click dismiss + scroll lock + focus trap/restore + dialog semantics all come
 * from there).
 *
 * The accent is a runtime CSS var (`--ca-accent`), not part of the static scope, so it
 * rides an inner wrapper here rather than the shared layer's `scope` string.
 */
export function Modal({ title, icon, wide, onClose, foot, children, scrimClassName, bare }: Props) {
  const t = useTranslations("chatapp");
  const { accentTriplet } = useResolvedTheme();

  return (
    <ModalShell
      onClose={onClose}
      label={typeof title === "string" && title ? title : "Diálogo"}
      scope={CA_SCOPE}
      scrimClassName={cn("z-50 grid animate-ca-fade place-items-center bg-black/50 p-6", scrimClassName)}
      className={
        bare
          ? undefined
          : cn(
              "flex max-h-full flex-col overflow-hidden rounded-[14px] border border-ca-800 bg-ca-panel shadow-ca-modal animate-ca-modal-in",
              wide ? "w-[640px]" : "w-[460px]",
              "max-w-full",
            )
      }
    >
      <div style={{ "--ca-accent": accentTriplet } as CSSProperties}>
        {bare ? (
          children
        ) : (
          <>
            <div className="flex items-center gap-2.5 bg-ca-header px-[18px] py-4">
              <div className="flex items-center gap-2 text-[17px] font-semibold text-ca-50">
                {icon && <Icon name={icon} size={20} className="text-ca-accent-soft" />}
                {title}
              </div>
              <IconButton icon="x" className="ml-auto" onClick={onClose} title={t("common.close")} />
            </div>
            <div className="ca-scroll min-h-0 overflow-y-auto px-[18px] py-4">{children}</div>
            {foot}
          </>
        )}
      </div>
    </ModalShell>
  );
}

/** Footer action bar for a Modal (right-aligned). */
export function ModalFoot({ children }: { children: ReactNode }) {
  return <div className="flex justify-end gap-2.5 border-t border-ca-800 px-[18px] py-3.5">{children}</div>;
}
