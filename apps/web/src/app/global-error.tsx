"use client"

// Root error boundary — the one Next.js mounts when a crash happens ABOVE every
// segment-level error.tsx, i.e. inside a root provider itself (i18n, session,
// UiRuntimeClient in app/layout.tsx). Two hard constraints from the framework,
// not a choice made here:
//   1. It REPLACES the root layout, so it must render its own <html>/<body> —
//      there is no surrounding shell left to supply them.
//   2. Because the crash may be in a root provider, this file cannot assume any
//      provider rendered successfully. Concretely: no `useTranslations()` — a
//      broken NextIntlClientProvider is exactly the kind of crash this catches,
//      so calling into next-intl here could throw again and blank the page we're
//      trying to show. The usual "every string goes through i18n" rule is
//      suspended for this one file; strings are hardcoded ES + EN together so
//      every visitor can read them regardless of which locale failed to load.
// `globals.css` / the tailwind base are plain stylesheet imports (not a
// provider), so the design tokens (bg-panel, text-danger, ...) used by the
// segment-level error.tsx files still resolve here.
import "./globals.css"
import "@boffmedia/tailwind-config/base.css"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-panel via-base to-panel flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6">
              <div className="p-4 rounded-full bg-gradient-to-r from-danger to-warning inline-block mb-4">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-danger-hover to-warning-hover mb-2">
                Algo salió muy mal / Something went badly wrong
              </h1>
              <p className="text-txt">
                La aplicación no pudo continuar y necesita reiniciarse.
                <br />
                The application could not continue and needs to restart.
              </p>
            </div>

            <div className="mb-6 p-4 bg-panel-2/30 rounded-lg border border-line/50 backdrop-blur-sm text-left">
              <div className="mb-3">
                <span className="text-xs font-medium text-txt-muted uppercase tracking-wide">
                  Mensaje / Message
                </span>
                <p className="mt-1 text-sm text-txt font-mono leading-relaxed break-words">
                  {error.message || "Error desconocido / Unknown error"}
                </p>
              </div>

              {error.digest && (
                <div>
                  <span className="text-xs font-medium text-txt-muted uppercase tracking-wide">
                    ID de seguimiento / Tracking ID
                  </span>
                  <p className="mt-1 text-xs text-txt font-mono">{error.digest}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-center mb-6">
              <button
                type="button"
                onClick={reset}
                className="roboto-medium inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 text-white bg-gradient-to-br from-primary-active via-primary-active to-primary-hover hover:from-primary-soft hover:via-primary-active hover:to-primary shadow-md hover:shadow-lg active:shadow-sm transition-colors duration-200"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar / Retry
              </button>

              <a
                href="/"
                className="roboto-medium inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 border border-line bg-transparent text-txt hover:bg-panel-2/40 shadow-sm hover:shadow-md transition-colors duration-200"
              >
                <Home className="mr-2 h-4 w-4" />
                Inicio / Home
              </a>
            </div>

            <p className="text-xs text-txt-muted">
              Si el problema persiste / If the problem persists{" "}
              <a
                href="https://discord.com/invite/R7MEDDSM5C"
                className="text-accent-bright hover:text-accent-bright underline"
              >
                Discord
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
