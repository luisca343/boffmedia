import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
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

/** Centered dialog over a scrim. Click-outside + Escape close. Renders inside `.ca-app`. */
export function Modal({ title, icon, wide, onClose, foot, children, scrimClassName, bare }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className={cn("absolute inset-0 z-50 grid animate-ca-fade place-items-center bg-black/50 p-6", scrimClassName)}
      onClick={onClose}
    >
      {bare ? (
        children
      ) : (
        <div
          className={cn(
            "flex max-h-full flex-col overflow-hidden rounded-[14px] border border-ca-800 bg-ca-panel shadow-ca-modal animate-ca-modal-in",
            wide ? "w-[640px]" : "w-[460px]",
            "max-w-full",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2.5 bg-ca-header px-[18px] py-4">
            <div className="flex items-center gap-2 text-[17px] font-semibold text-ca-50">
              {icon && <Icon name={icon} size={20} className="text-ca-accent-soft" />}
              {title}
            </div>
            <IconButton icon="x" className="ml-auto" onClick={onClose} title="Cerrar" />
          </div>
          <div className="ca-scroll min-h-0 overflow-y-auto px-[18px] py-4">{children}</div>
          {foot}
        </div>
      )}
    </div>
  );
}

/** Footer action bar for a Modal (right-aligned). */
export function ModalFoot({ children }: { children: ReactNode }) {
  return <div className="flex justify-end gap-2.5 border-t border-ca-800 px-[18px] py-3.5">{children}</div>;
}
