import * as React from "react"

import { MOCK_ACCOUNT, MOCK_DEVICE_CODE, MOCK_SETTINGS, mockLogs } from "../services/mock"
import { loadPackEntries } from "../services/packs"
import { authBegin, authAwait, authLogout, authRestore, isDesktop } from "../runtime"
import type {
  Account,
  DeviceCode,
  GameState,
  InstallPhase,
  LogLine,
  PackEntry,
  Settings,
} from "../services/types"

// One store for the whole app. A reducer rather than scattered useState because
// install and launch are state MACHINES — "installing" and "running" must be
// mutually exclusive, and expressing that as independent booleans is how you
// get a launcher that offers Play mid-download.

export type View = "packs" | "pack" | "logs" | "settings"

type State = {
  account: Account | null
  deviceCode: DeviceCode | null
  signingIn: boolean
  view: View
  selectedPackId: string | null
  packs: PackEntry[]
  packsLoading: boolean
  /** Set when the registry could not be reached or refused us. Distinct from an
   *  empty list, which legitimately means "no packs for this UUID". */
  packsError: string | null
  game: GameState
  logs: LogLine[]
  settings: Settings
}

type Action =
  | { type: "signin/start" }
  | { type: "signin/code"; code: DeviceCode }
  | { type: "signin/done"; account: Account }
  | { type: "signin/cancel" }
  | { type: "signout" }
  | { type: "packs/loading" }
  | { type: "packs/load"; packs: PackEntry[] }
  | { type: "packs/error"; message: string }
  | { type: "view"; view: View; packId?: string }
  | { type: "install/progress"; packId: string; phase: InstallPhase; fraction: number; file: string }
  | { type: "install/done"; packId: string }
  | { type: "game/state"; game: GameState }
  | { type: "log"; line: LogLine }
  | { type: "logs/clear" }
  | { type: "settings"; patch: Partial<Settings> }

const PHASE_ORDER: InstallPhase[] = [
  "resolving",
  "java",
  "libraries",
  "assets",
  "loader",
  "mods",
  "overrides",
  "verifying",
]

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "signin/start":
      return { ...s, signingIn: true, deviceCode: null }
    case "signin/code":
      return { ...s, deviceCode: a.code }
    case "signin/done":
      return { ...s, account: a.account, signingIn: false, deviceCode: null }
    case "signin/cancel":
      return { ...s, signingIn: false, deviceCode: null }
    case "signout":
      // Never keep packs across accounts: entitlements are per-UUID (§7.2) and
      // showing the previous user's list would leak pack names.
      return {
        ...s,
        account: null,
        packs: [],
        packsError: null,
        packsLoading: false,
        view: "packs",
        selectedPackId: null,
      }
    case "packs/loading":
      return { ...s, packsLoading: true, packsError: null }
    case "packs/load":
      return { ...s, packs: a.packs, packsLoading: false, packsError: null }
    case "packs/error":
      // Keep whatever list is already on screen: a failed REFRESH should not
      // empty a library the player was just looking at.
      return { ...s, packsLoading: false, packsError: a.message }
    case "view":
      return { ...s, view: a.view, selectedPackId: a.packId ?? s.selectedPackId }
    case "install/progress":
      return {
        ...s,
        packs: s.packs.map((p) => {
          if (p.pack.id !== a.packId) return p
          // Byte totals are still an estimate from the file COUNT: real sizes
          // live in the manifest, which §6 fetches when the install starts.
          const total = (p.latest?.fileCount ?? 0) * 1_400_000
          return {
            ...p,
            state: {
              kind: "installing",
              progress: {
                phase: a.phase,
                fraction: a.fraction,
                currentFile: a.file,
                downloadedBytes: Math.round(a.fraction * total),
                totalBytes: total,
              },
            },
          }
        }),
      }
    case "install/done":
      return {
        ...s,
        packs: s.packs.map((p) =>
          p.pack.id !== a.packId || !p.latest
            ? p
            : {
                ...p,
                state: {
                  kind: "installed",
                  versionId: p.latest.id,
                  sizeBytes: p.latest.fileCount * 1_400_000,
                },
              },
        ),
      }
    case "game/state":
      return { ...s, game: a.game }
    case "log":
      // Bounded: the game is a firehose and an unbounded array is a slow leak.
      return { ...s, logs: [...s.logs, a.line].slice(-2000) }
    case "logs/clear":
      return { ...s, logs: [] }
    case "settings":
      return { ...s, settings: { ...s.settings, ...a.patch } }
    default:
      return s
  }
}

const initial: State = {
  account: null,
  deviceCode: null,
  signingIn: false,
  view: "packs",
  selectedPackId: null,
  packs: [],
  packsLoading: false,
  packsError: null,
  game: { kind: "idle" },
  logs: [],
  settings: MOCK_SETTINGS,
}

type Ctx = State & {
  selected: PackEntry | null
  signIn: () => Promise<void>
  cancelSignIn: () => void
  signOut: () => void
  go: (view: View, packId?: string) => void
  reloadPacks: () => void
  install: (packId: string) => Promise<void>
  play: (packId: string) => Promise<void>
  stop: () => void
  clearLogs: () => void
  patchSettings: (patch: Partial<Settings>) => void
}

const LauncherContext = React.createContext<Ctx | null>(null)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function LauncherProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, initial)
  // Bumped to re-run the load effect; a counter rather than a callback so the
  // retry path and the initial load are the exact same code.
  const [reloadToken, setReloadToken] = React.useState(0)
  // Guards the install/play simulations against double-invocation; also the
  // hook the real implementation uses to abort in-flight work on unmount.
  const busy = React.useRef<Set<string>>(new Set())
  // Survives StrictMode's double mount — see the restore effect below.
  const restoreStarted = React.useRef(false)

  const log = React.useCallback((line: Omit<LogLine, "ts">) => {
    dispatch({ type: "log", line: { ...line, ts: Date.now() } })
  }, [])

  // §5. In a browser there is no Rust side, so the mock flow runs instead —
  // that is what keeps every screen workable from `pnpm dev:renderer`.
  const signIn = React.useCallback(async () => {
    dispatch({ type: "signin/start" })

    if (!isDesktop()) {
      await sleep(400)
      dispatch({ type: "signin/code", code: MOCK_DEVICE_CODE })
      await sleep(2600)
      dispatch({ type: "signin/done", account: MOCK_ACCOUNT })
      log({ level: "info", source: "launcher", text: `Sesión simulada como ${MOCK_ACCOUNT.username}` })
      return
    }

    try {
      const code = await authBegin()
      dispatch({
        type: "signin/code",
        code: {
          userCode: code.userCode,
          verificationUri: code.verificationUri,
          expiresInSeconds: code.expiresIn,
        },
      })
      const account = await authAwait()
      dispatch({
        type: "signin/done",
        account: { ...account, avatarUrl: "", expiresAt: "" },
      })
      log({ level: "info", source: "launcher", text: `Sesión iniciada como ${account.username}` })
    } catch (err) {
      const failure = err as { message?: string }
      dispatch({ type: "signin/cancel" })
      log({
        level: "error",
        source: "launcher",
        text: failure?.message ?? "No se pudo iniciar sesión.",
      })
    }
  }, [log])

  // Silent sign-in on start. A THROW here is a real failure — a credential
  // store that could not be read, or Minecraft refusing the chain — and §5.7
  // says it must never be swallowed into "please sign in". The Rust side
  // already writes each of those as a sentence for a player, so it is logged
  // VERBATIM: wrapping it in "no se pudo leer el almacén de credenciales" was
  // how a Minecraft 429 came to be reported as a keychain problem.
  React.useEffect(() => {
    if (!isDesktop()) return
    // StrictMode mounts this effect twice in dev. Two restores in flight means
    // two runs of the four-hop chain, and Minecraft rate-limits the second.
    // The Rust side serialises them too; this just avoids the round trip.
    if (restoreStarted.current) return
    restoreStarted.current = true

    void authRestore()
      .then((account) => {
        if (!account) return
        dispatch({ type: "signin/done", account: { ...account, avatarUrl: "", expiresAt: "" } })
        log({ level: "info", source: "launcher", text: `Sesión restaurada: ${account.username}` })
      })
      .catch((err: { message?: string }) => {
        log({
          level: "error",
          source: "launcher",
          text: err?.message ?? "No se pudo restaurar la sesión.",
        })
      })
  }, [log])

  // Packs arrive only once there is an account: the server filters by UUID, so
  // there is nothing meaningful to fetch while signed out. The UUID — not the
  // account object — is the dependency, so a re-render cannot refetch.
  const accountUuid = state.account?.uuid ?? null
  React.useEffect(() => {
    if (!accountUuid) return
    let cancelled = false

    dispatch({ type: "packs/loading" })
    loadPackEntries()
      .then((packs) => {
        // A late response from the PREVIOUS account must not repopulate the
        // list after a sign-out — that is exactly the leak `signout` clears.
        if (cancelled) return
        dispatch({ type: "packs/load", packs })
      })
      .catch((err: { message?: string }) => {
        if (cancelled) return
        dispatch({
          type: "packs/error",
          message: err?.message ?? "No se pudo cargar tu biblioteca de packs.",
        })
        log({
          level: "error",
          source: "launcher",
          text: err?.message ?? "No se pudo cargar tu biblioteca de packs.",
        })
      })

    return () => {
      cancelled = true
    }
  }, [accountUuid, log, reloadToken])

  // TODO(rust): `install_pack` — portablemc resolves the version + loader and
  // downloads; pack files come from the manifest (§7.1) verified by sha512.
  // Progress arrives as Tauri events, not a return value.
  const install = React.useCallback(
    async (packId: string) => {
      if (busy.current.has(packId)) return
      busy.current.add(packId)
      try {
        for (const [i, phase] of PHASE_ORDER.entries()) {
          for (let step = 0; step < 4; step++) {
            const fraction = (i * 4 + step + 1) / (PHASE_ORDER.length * 4)
            dispatch({
              type: "install/progress",
              packId,
              phase,
              fraction,
              file: `${phase}/archivo-${step + 1}`,
            })
            await sleep(110)
          }
        }
        dispatch({ type: "install/done", packId })
        log({ level: "info", source: "launcher", text: "Instalación completada" })
      } finally {
        busy.current.delete(packId)
      }
    },
    [log],
  )

  // TODO(rust): `launch_pack` — build argv (§6.2) and spawn. Stdout streams
  // back as events; the process handle stays in Rust.
  const play = React.useCallback(
    async (packId: string) => {
      dispatch({ type: "game/state", game: { kind: "preparing" } })
      log({ level: "info", source: "launcher", text: "Preparando lanzamiento…" })
      await sleep(900)
      dispatch({ type: "game/state", game: { kind: "running", pid: 4821, since: Date.now() } })
      for (const line of mockLogs()) dispatch({ type: "log", line: { ...line, ts: Date.now() } })
      void packId
    },
    [log],
  )

  const value: Ctx = {
    ...state,
    selected: state.packs.find((p) => p.pack.id === state.selectedPackId) ?? null,
    signIn,
    cancelSignIn: () => dispatch({ type: "signin/cancel" }),
    signOut: () => {
      void authLogout()
      dispatch({ type: "signout" })
    },
    go: (view, packId) => dispatch({ type: "view", view, packId }),
    reloadPacks: () => setReloadToken((n) => n + 1),
    install,
    play,
    stop: () => {
      dispatch({ type: "game/state", game: { kind: "idle" } })
      log({ level: "warn", source: "launcher", text: "Juego detenido por el usuario" })
    },
    clearLogs: () => dispatch({ type: "logs/clear" }),
    patchSettings: (patch) => dispatch({ type: "settings", patch }),
  }

  return <LauncherContext.Provider value={value}>{children}</LauncherContext.Provider>
}

export function useLauncher(): Ctx {
  const ctx = React.useContext(LauncherContext)
  if (!ctx) throw new Error("useLauncher must be used inside <LauncherProvider>")
  return ctx
}
