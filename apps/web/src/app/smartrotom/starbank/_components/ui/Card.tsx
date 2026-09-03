import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, flat = false, children, ...rest }: React.HTMLAttributes<HTMLDivElement> & { flat?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-sb-lg border border-sb-border bg-sb-surface",
        flat ? "shadow-none" : "shadow-sb-1",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionHead({ title, eyebrow, action, className }: { title: React.ReactNode; eyebrow?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-5 pb-1.5 pt-[1.125rem]", className)}>
      <div className="min-w-0">
        {eyebrow ? <div className="mb-0.5 text-[0.6875rem] uppercase tracking-[0.1em] text-sb-fg-subtle">{eyebrow}</div> : null}
        <h3 className="m-0 truncate font-sb-display text-[0.9375rem] font-semibold tracking-[-0.005em] text-sb-fg">{title}</h3>
      </div>
      {action ?? null}
    </div>
  );
}

export function CardBody({ className, noPad = false, children }: { className?: string; noPad?: boolean; children: React.ReactNode }) {
  return <div className={cn("flex flex-1 flex-col gap-3.5", noPad ? "p-0" : "px-5 pb-5 pt-3.5", className)}>{children}</div>;
}
