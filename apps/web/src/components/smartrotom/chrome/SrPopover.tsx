"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils"

interface SrPopoverCtx {
  open: boolean
  setOpen: (open: boolean) => void
}

const Ctx = createContext<SrPopoverCtx | null>(null)

function usePopoverCtx() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("SrPopover.* must be used within <SrPopover>")
  return ctx
}

/**
 * The sr-* chrome's own popover: controlled open state, outside-click + Escape
 * dismissal, absolutely positioned panel under the trigger. Replaces the Radix
 * popover the chrome borrowed from Boffmedia — same open/close contract, no portal.
 */
export function SrPopover({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <Ctx.Provider value={{ open, setOpen }}>
      <div ref={rootRef} className="relative inline-flex">
        {children}
      </div>
    </Ctx.Provider>
  )
}

export function SrPopoverTrigger({
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = usePopoverCtx()
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="dialog"
      className={cn("relative", className)}
      onClick={() => setOpen(!open)}
      {...rest}
    >
      {children}
    </button>
  )
}

export function SrPopoverContent({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const { open } = usePopoverCtx()
  if (!open) return null
  return (
    <div
      role="dialog"
      className={cn(
        "absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 outline-none",
        className,
      )}
    >
      {children}
    </div>
  )
}
