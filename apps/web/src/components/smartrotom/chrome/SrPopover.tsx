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

// Must match the data-[state=closed] duration below.
const EXIT_MS = 150

export function SrPopoverContent({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const { open } = usePopoverCtx()

  // Deferred unmount so the closed-state animation can play.
  const [present, setPresent] = useState(open)
  useEffect(() => {
    if (open) {
      setPresent(true)
      return
    }
    const t = setTimeout(() => setPresent(false), EXIT_MS)
    return () => clearTimeout(t)
  }, [open])

  if (!present) return null
  return (
    <div
      role="dialog"
      data-state={open ? "open" : "closed"}
      className={cn(
        "absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 outline-none",
        "animate-in fade-in-0 zoom-in-95 duration-150 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150 data-[state=closed]:pointer-events-none",
        className,
      )}
    >
      {children}
    </div>
  )
}
