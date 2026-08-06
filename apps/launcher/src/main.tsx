import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"
import "./i18n"
import "./index.css"
import { revealWindow } from "./runtime"

// Importing "./i18n" for its side effect: it calls configureUi() at module load,
// wiring @boffmedia/ui's primitives to the launcher's message store. The launcher
// screens use the same store through useT("<namespace>"). Locale is applied from
// settings.locale by the launcher store once settings load.

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
