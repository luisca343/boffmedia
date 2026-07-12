"use client";

import { useState, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Portal({ children }: { children: ReactNode }) {
  const [el] = useState(() => (typeof document !== "undefined" ? document.createElement("div") : null));
  useEffect(() => {
    if (!el) return;
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [el]);
  if (!el) return null;
  return createPortal(children, el);
}
