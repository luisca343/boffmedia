import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"
import "./i18n"
import "./index.css"
import "./tool-host"
import { revealWindow } from "./runtime"

// Importing "./i18n" for its side effect: it calls configureUi() at module load,
// wiring @boffmedia/ui's primitives to the launcher's message store. The launcher
// screens use the same store through useT("<namespace>"). Locale is applied from
// settings.locale by the launcher store once settings load.
//
// "./tool-host" is the same pattern for @boffmedia/tool-kit: it calls
// configureToolHost() (saveFile → the Rust streamed write, openUrl, storage,
// api) and registers the domain packages' tool manifests. Both must run before
// anything renders, which is why they are import-time side effects here.

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// After first paint, not before — the window is created hidden precisely so
// this is the moment it appears.
requestAnimationFrame(() => {
  void revealWindow()
})
