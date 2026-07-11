import type { ReactNode } from "react"

// Luckiest Guy + Shantell Sans back the Mewgenics showcase specimen only (the sole
// consumer of `--mwf-disp`/`--mwf-hand`), so the Google Fonts load is scoped to this
// route instead of the root layout — no external font request on real product pages.
// The rest of the type system is self-hosted in `styles/fonts.css`.
export default function ComponentsShowcaseLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Shantell+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
      />
      {children}
    </>
  )
}
