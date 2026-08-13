import { ToastStack } from "@boffmedia/ui"

import { Shell } from "./components/Shell"
import { Titlebar } from "./components/Titlebar"
import { UpdateBanner } from "./components/UpdateBanner"
import { Logs } from "./screens/Logs"
import { PackDetail } from "./screens/PackDetail"
import { Packs } from "./screens/Packs"
import { Settings } from "./screens/Settings"
import { Tools, ToolView } from "./screens/Tools"
import { BoffSignIn } from "./screens/BoffSignIn"
import { SignIn } from "./screens/SignIn"
import { Splash } from "./screens/Splash"
import { LauncherProvider, useLauncher } from "./state/launcher"

// No router library: six screens behind one union, and Tauri serves from a
// custom protocol where history-based routing is more trouble than it solves.

function Router() {
  const { boffSigningIn, booting, bootStep, signingIn, view } = useLauncher()

  // Before anything else: while the silent restore is in flight we do not yet
  // know whether this player is signed in, and guessing "no" is what put
  // "Entrar con Microsoft" in front of people who had a valid session.
  if (booting) return <Splash step={bootStep} />

  // A Minecraft sign-in IN PROGRESS owns the screen. It is prompted when a
  // Minecraft pack needs an MSA session at install/launch time (play/install),
  // so reaching the code screen cannot be gated on being signed out — the shell
  // was already showing. SignIn is the only screen that renders the code.
  if (signingIn) return <SignIn />

  // NOTHING here is gated on being signed in any more. This is Boffmedia's own
  // application, not a paid product behind a door: it opens, the rail is there,
  // and every section works to the extent it can without an account. Play used
  // to be replaced wholesale by the sign-in panel, which meant a player with
  // packs sitting on their own disk was shown a login wall to reach them.
  //
  // What an account actually buys is CONTENT, not entry: server packs are
  // filtered by that account's entitlements, so a signed-out library shows the
  // local packs plus a call to action for the rest (see Packs). Minecraft is a
  // separate credential again, asked for at launch time.
  //
  // A Boffmedia device flow IN PROGRESS still takes the content area whatever
  // section you are in, including when someone is already signed in: "Add
  // account" starts one while the session is still set, and BoffSignIn is the
  // only screen that renders the code. That is a flow the player chose, not a
  // wall put in front of them.
  return (
    <Shell>
      {boffSigningIn ? (
        <BoffSignIn />
      ) : (
        <>
          {view === "packs" && <Packs />}
          {view === "pack" && <PackDetail />}
          {view === "logs" && <Logs />}
          {view === "settings" && <Settings />}
          {view === "tools" && <Tools />}
          {view === "tool" && <ToolView />}
        </>
      )}
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
