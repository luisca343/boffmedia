import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type PresenceStatus = "online" | "ingame" | "offline";

/** Presence dot (bottom-right). Ring colour defaults to the panel it sits on. */
export function Presence({ status, className }: { status: PresenceStatus; className?: string }) {
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 h-[13px] w-[13px] rounded-full border-[2.5px] border-ca-panel",
        status === "online" ? "bg-ca-online" : status === "ingame" ? "bg-ca-accent" : "bg-ca-400",
        className,
      )}
    />
  );
}

/** Single source of avatar truth: pixelated round image + optional presence dot. */
export function Avatar({
  src,
  alt = "",
  size = 49,
  presence,
  className,
  imgClassName,
  presenceClassName,
}: {
  src: string;
  alt?: string;
  size?: number;
  presence?: PresenceStatus;
  className?: string;
  imgClassName?: string;
  presenceClassName?: string;
}) {
  return (
    <div className={cn("relative flex-none", className)} style={{ width: size, height: size } as CSSProperties}>
      <img
        src={src}
        alt={alt}
        className={cn("h-full w-full rounded-full bg-ca-800 object-cover [image-rendering:pixelated]", imgClassName)}
      />
      {presence && <Presence status={presence} className={presenceClassName} />}
    </div>
  );
}
