import { ToastStack } from "@boffmedia/ui"

import { Shell } from "./components/Shell"
import { Titlebar } from "./components/Titlebar"
import { UpdateBanner } from "./components/UpdateBanner"
import { AccountPicker } from "./screens/AccountPicker"
import { Logs } from "./screens/Logs"
import { PackDetail } from "./screens/PackDetail"
import { Packs } from "./screens/Packs"
import { Settings } from "./screens/Settings"
import { BoffSignIn } from "./screens/BoffSignIn"
import { SignIn } from "./screens/SignIn"
import { Splash } from "./screens/Splash"
import { LauncherProvider, useLauncher } from "./state/launcher"

// No router library: six screens behind one union, and Tauri serves from a
// custom protocol where history-based routing is more trouble than it solves.

function Router() {
  const { account, accounts, boffAccount, booting, bootStep, signingIn, view } = useLauncher()

  // Before anything else: while the silent restore is in flight we do not yet
  // know whether this player is signed in, and guessing "no" is what put
  // "Entrar con Microsoft" in front of people who had a valid session.
  if (booting) return <Splash step={bootStep} />

  // A sign-in IN PROGRESS owns the screen, even when someone is already signed
  // in. "Añadir cuenta" in the switcher calls signIn() while `account` is still
  // set, so this used to fall through to the shell below: the device code was
  // fetched and rendered nowhere, and the button looked dead. SignIn is the
  // only screen that renders the code, so reaching it cannot be conditional on
  // being signed out.
  if (signingIn) return <SignIn />

  // Everything is gated on the BOFFMEDIA account: the pack list is filtered by
  // that account's entitlements. Minecraft is NOT a prerequisite for the shell
  // — an emulator pack never needs it, and gating on it meant a paid Minecraft
  // account was required to open a GBA pack.
  if (!boffAccount) return <BoffSignIn />

  // Known Minecraft accounts but no live session: offer the faces rather than
  // the Microsoft button. Reachable from the shell, never blocking it.
  if (!account && accounts.length > 0) return <AccountPicker />

  return (
    <Shell>
      {view === "packs" && <Packs />}
      {view === "pack" && <PackDetail />}
      {view === "logs" && <Logs />}
      {view === "settings" && <Settings />}
    </Shell>
  )
}

function BootAwareUpdateBanner() {
  const { booting } = useLauncher()
  return booting ? null : <UpdateBanner />
}

export function App() {
  return (
    <LauncherProvider>
      <div className="flex h-full flex-col bg-base text-txt">
        {/* Above everything, always: with native decorations off, this bar is
            the only drag region and the only close button — the splash and
            sign-in screens need it as much as the shell does. */}
        <Titlebar />
        {/* Above the router on purpose: an update is worth showing on the
            sign-in screen too, and the check never blocks it. Suppressed only
            during boot, where it would push the splash off-centre. */}
        <BootAwareUpdateBanner />
        <div className="min-h-0 flex-1">
          <Router />
        </div>
      </div>
      <ToastStack />
    </LauncherProvider>
  )
}
