import { ToastStack } from "@boffmedia/ui"

import { Shell } from "./components/Shell"
import { UpdateBanner } from "./components/UpdateBanner"
import { Logs } from "./screens/Logs"
import { PackDetail } from "./screens/PackDetail"
import { Packs } from "./screens/Packs"
import { Settings } from "./screens/Settings"
import { SignIn } from "./screens/SignIn"
import { LauncherProvider, useLauncher } from "./state/launcher"

// No router library: six screens behind one union, and Tauri serves from a
// custom protocol where history-based routing is more trouble than it solves.

function Router() {
  const { account, view } = useLauncher()

  // Everything is gated on an account — the pack list is filtered per UUID
  // server-side (§7.2), so there is nothing to render before sign-in.
  if (!account) return <SignIn />

  return (
    <Shell>
      {view === "packs" && <Packs />}
      {view === "pack" && <PackDetail />}
      {view === "logs" && <Logs />}
      {view === "settings" && <Settings />}
    </Shell>
  )
}

export function App() {
  return (
    <LauncherProvider>
      <div className="flex h-full flex-col bg-base text-txt">
        {/* Above the router on purpose: an update is worth showing on the
            sign-in screen too, and the check never blocks it. */}
        <UpdateBanner />
        <div className="min-h-0 flex-1">
          <Router />
        </div>
      </div>
      <ToastStack />
    </LauncherProvider>
  )
}
