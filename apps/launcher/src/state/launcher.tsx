import * as React from "react"

import {
  MOCK_ACCOUNT,
  MOCK_DEVICE_CODE,
  MOCK_SETTINGS,
  mockLogs,
  mockPackEntries,
} from "../services/mock"
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
  | { type: "packs/load"; packs: PackEntry[] }
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
      return { ...s, account: null, packs: [], view: "packs", selectedPackId: null }
    case "packs/load":
      return { ...s, packs: a.packs }
    case "view":
      return { ...s, view: a.view, selectedPackId: a.packId ?? s.selectedPackId }
    case "install/progress":
      return {
        ...s,
        packs: s.packs.map((p) =>
          p.pack.id !== a.packId
            ? p
            : {
                ...p,
                state: {
                  kind: "installing",
                  progress: {
                    phase: a.phase,
                    fraction: a.fraction,
                    currentFile: a.file,
                    downloadedBytes: Math.round(a.fraction * p.latest.files.length * 1_400_000),
                    totalBytes: p.latest.files.length * 1_400_000,
                  },
                },
              },
        ),
      }
    case "install/done":
      return {
        ...s,
        packs: s.packs.map((p) =>
          p.pack.id !== a.packId
            ? p
            : {
                ...p,
                state: {
                  kind: "installed",
                  versionId: p.latest.id,
                  sizeBytes: p.latest.files.length * 1_400_000,
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
  // Guards the install/play simulations against double-invocation; also the
  // hook the real implementation uses to abort in-flight work on unmount.
  const busy = React.useRef<Set<string>>(new Set())

  const log = React.useCallback((line: Omit<LogLine, "ts">) => {
    dispatch({ type: "log", line: { ...line, ts: Date.now() } })
  }, [])

  // TODO(rust): `msa_begin` → returns the device code; `msa_poll` → resolves
  // once the user finishes in the browser. portablemc::msa backs both. The
  // refresh token goes to the OS keychain (§5.7) and NEVER to the renderer.
  const signIn = React.useCallback(async () => {
    dispatch({ type: "signin/start" })
    await sleep(400)
    dispatch({ type: "signin/code", code: MOCK_DEVICE_CODE })
    await sleep(2600)
    dispatch({ type: "signin/done", account: MOCK_ACCOUNT })
    log({ level: "info", source: "launcher", text: `Sesión iniciada como ${MOCK_ACCOUNT.username}` })
  }, [log])

  // Packs arrive only once there is an account: the server filters by UUID, so
  // there is nothing meaningful to fetch while signed out.
  // TODO(rust): `list_packs`.
  const accountUuid = state.account?.uuid ?? null
  React.useEffect(() => {
    if (!accountUuid) return
    dispatch({ type: "packs/load", packs: mockPackEntries() })
  }, [accountUuid])

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
    signOut: () => dispatch({ type: "signout" }),
    go: (view, packId) => dispatch({ type: "view", view, packId }),
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
