import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"
import "./index.css"
import { revealWindow } from "./runtime"

// No configureUi() call. @boffmedia/ui's defaults already do the right thing
// here: Link falls back to a plain anchor and useT() echoes its key. When the
// launcher grows real translations, this is the one place that changes.

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
