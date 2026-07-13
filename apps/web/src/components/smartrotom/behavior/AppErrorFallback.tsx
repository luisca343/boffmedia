"use client"

import { useEffect } from "react"
import Link from "next/link"

/**
 * In-app crash fallback (audit P5). A per-app `error.tsx` keeps the app's
 * layout — and with it the scope root — mounted, so only the app body is
 * replaced: the app crashed, the phone is fine. Deliberately unskinned:
 * everything rides on inherited color and typography from the scope root,
 * so it reads native inside any per-app design system without importing one.
 */
export function AppErrorFallback({
  appName,
  error,
  reset,
}: {
  appName: string
  error: Error
  reset: () => void
}) {
  // Error boundaries swallow the exception; without this the crash is invisible in the console.
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 px-6 text-center text-current">
      <p className="text-xs uppercase tracking-widest opacity-60">{appName}</p>
      <h2 className="text-xl font-semibold">Esta app ha fallado</h2>
      <p className="max-w-sm text-sm opacity-70">{error.message || "Error desconocido"}</p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-current px-4 py-2 text-sm hover:opacity-80"
        >
          Reintentar
        </button>
        <Link href="/smartrotom" className="px-2 py-2 text-sm opacity-70 hover:opacity-100">
          Volver al menú
        </Link>
      </div>
    </div>
  )
}
