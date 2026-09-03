"use client";

import { useState, type ReactNode } from "react";

export function Tooltip({
  label,
  children,
  side = "bottom",
}: {
  label: string;
  children: ReactNode;
  side?: "bottom" | "top";
}) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className={`pointer-events-none absolute left-1/2 z-[300] -translate-x-1/2 whitespace-nowrap rounded-[7px] border border-nt-border-2 bg-nt-elevated px-[0.5625rem] py-1 text-[0.71875rem] text-nt-fg shadow-[0_18px_50px_-12px_rgba(0,0,0,.7)] ${
            side === "bottom" ? "top-[115%]" : "bottom-[115%]"
          }`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
