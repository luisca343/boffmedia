import * as React from "react"

import { MOCK_ACCOUNT, MOCK_DEVICE_CODE, MOCK_SETTINGS } from "../services/mock"
import { loadPackEntries } from "../services/packs"
import {
  authBegin,
  authAwait,
  authLogout,
  authRestore,
  installPack,
  instanceScan,
  isDesktop,
  launchPack,
  onGameLog,
  onGameState,
  onInstallDone,
  onInstallProgress,
  packManifest,
  settingsGet,
  settingsSet,
  stopGame,
  type ScannedInstallState,
} from "../runtime"
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
  | { type: "install/start"; packId: string }
  | {
      type: "install/progress"
      packId: string
      phase: InstallPhase
      fraction: number
      file: string
      downloadedBytes: number
      totalBytes: number
    }
  | { type: "install/state"; packId: string; state: ScannedInstallState }
  | { type: "game/state"; game: GameState }
  | { type: "log"; line: LogLine }
  | { type: "logs/clear" }
  | { type: "settings"; settings: Settings }

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
    case "install/start":
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
                    phase: "resolving",
                    fraction: 0,
                    currentFile: "",
                    downloadedBytes: 0,
                    totalBytes: 0,
                  },
                },
              },
        ),
      }
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
                    downloadedBytes: a.downloadedBytes,
                    totalBytes: a.totalBytes,
                  },
                },
              },
        ),
      }
    case "install/state":
      return {
        ...s,
        packs: s.packs.map((p) => (p.pack.id !== a.packId ? p : { ...p, state: a.state })),
      }
    case "game/state":
      return { ...s, game: a.game }
    case "log":
      // Bounded: the game is a firehose and an unbounded array is a slow leak.
      return { ...s, logs: [...s.logs, a.line].slice(-2000) }
    case "logs/clear":
      return { ...s, logs: [] }
    case "settings":
      return { ...s, settings: a.settings }
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
  const settingsLoaded = React.useRef(false)
  // Which pack the running game belongs to; `stop_game` is keyed on it and the
  // Stop button has no pack in hand.
  const runningPackId = React.useRef<string | null>(null)
  const stopping = React.useRef(false)
  // Read inside callbacks that must not re-create on every list change.
  const packsRef = React.useRef<PackEntry[]>(state.packs)
  packsRef.current = state.packs
  const settingsRef = React.useRef<Settings>(state.settings)
  settingsRef.current = state.settings
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const log = React.useCallback((line: Omit<LogLine, "ts">) => {
    dispatch({ type: "log", line: { ...line, ts: Date.now() } })
  }, [])

  /** Re-read what is on disk for one pack. Cheap, and the only way the UI
   *  learns that an install left the pack outdated or broken. */
  const refreshInstallState = React.useCallback(async (packId: string) => {
    const entry = packsRef.current.find((p) => p.pack.id === packId)
    if (!entry) return
    try {
      const state = await instanceScan(entry.pack.slug, entry.latest?.id ?? null)
      dispatch({ type: "install/state", packId, state })
    } catch {
      /* the listing stays as it was rather than flickering to not-installed */
    }
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

  // Shell events. Every one of these is a fire-and-forget stream from Rust, so
  // the reducer is the only thing that has to be correct here — and the
  // unsubscribes make StrictMode's second mount a no-op rather than a doubled
  // log line.
  React.useEffect(() => {
    const offs = [
      onInstallProgress((e) =>
        dispatch({
          type: "install/progress",
          packId: e.packId,
          phase: e.phase,
          fraction: e.fraction,
          file: e.file,
          downloadedBytes: e.downloadedBytes,
          totalBytes: e.totalBytes,
        }),
      ),
      onInstallDone(() =>
        log({ level: "info", source: "launcher", text: "Instalación completada" }),
      ),
      onGameLog((line) => dispatch({ type: "log", line })),
      onGameState((game) => {
        // A killed process exits non-zero, so the Rust watcher reports the
        // player's own "stop" as a crash. Only the renderer knows it was
        // deliberate.
        if (game.kind === "crashed" && stopping.current) {
          stopping.current = false
          dispatch({ type: "game/state", game: { kind: "idle" } })
          return
        }
        if (game.kind !== "running") stopping.current = false
        dispatch({ type: "game/state", game })
        if (game.kind === "crashed") {
          log({
            level: "error",
            source: "launcher",
            text: `El juego se cerró con el código ${game.exitCode}.`,
          })
        }
      }),
    ]
    return () => {
      for (const off of offs) off()
    }
  }, [log])

  // §6. The manifest is fetched here rather than in Rust because the password
  // path (§7.1) is a UI decision; install_pack re-validates whatever it gets.
  const manifestFor = React.useCallback(async (packId: string) => {
    if (!isDesktop()) return null
    return packManifest(packId)
  }, [])

  const install = React.useCallback(
    async (packId: string) => {
      // The Rust side refuses a concurrent install of the same pack too; this
      // just avoids the round trip and the "ya se está instalando" toast that a
      // StrictMode double-invoke would otherwise produce.
      if (busy.current.has(packId)) return
      busy.current.add(packId)
      dispatch({ type: "install/start", packId })
      try {
        const state = await installPack(packId, await manifestFor(packId))
        dispatch({ type: "install/state", packId, state })
      } catch (err) {
        const message = (err as { message?: string })?.message ?? "No se pudo instalar el pack."
        // Broken, not not-installed: files may already be on disk, and hiding
        // that would offer a fresh install over a half-written instance.
        dispatch({ type: "install/state", packId, state: { kind: "broken", reason: message } })
        log({ level: "error", source: "launcher", text: message })
      } finally {
        busy.current.delete(packId)
      }
    },
    [log, manifestFor],
  )

  const play = React.useCallback(
    async (packId: string) => {
      if (busy.current.has(packId)) return
      busy.current.add(packId)
      dispatch({ type: "game/state", game: { kind: "preparing" } })
      log({ level: "info", source: "launcher", text: "Preparando lanzamiento…" })
      try {
        // A launch re-verifies, so it emits install progress as well; the pack
        // card shows that until `game://state` flips to running.
        // The pid is already on its way as a `game://state` running event, and
        // that event is authoritative — a crash can beat this resolve, and
        // dispatching "running" here would paper over it.
        await launchPack(packId, await manifestFor(packId))
        runningPackId.current = packId
        void refreshInstallState(packId)
      } catch (err) {
        const message = (err as { message?: string })?.message ?? "No se pudo iniciar el juego."
        dispatch({ type: "game/state", game: { kind: "idle" } })
        log({ level: "error", source: "launcher", text: message })
      } finally {
        busy.current.delete(packId)
      }
    },
    [log, manifestFor, refreshInstallState],
  )

  // Preferences live in a JSON file on the Rust side; the mock defaults only
  // ever stand in for the first paint and for browser mode.
  React.useEffect(() => {
    if (settingsLoaded.current) return
    settingsLoaded.current = true
    void settingsGet()
      .then((settings) => dispatch({ type: "settings", settings }))
      .catch(() => {
        /* defaults are a working launcher; a read failure is not fatal */
      })
  }, [])

  // Debounced because the memory slider fires per pixel and each save is a file
  // write. The in-memory state updates immediately either way.
  const patchSettings = React.useCallback(
    (patch: Partial<Settings>) => {
      const next = { ...settingsRef.current, ...patch }
      settingsRef.current = next
      dispatch({ type: "settings", settings: next })
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        void settingsSet(next).catch((err: { message?: string }) => {
          log({
            level: "error",
            source: "launcher",
            text: err?.message ?? "No se pudieron guardar los ajustes.",
          })
        })
      }, 300)
    },
    [log],
  )

  React.useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    },
    [],
  )

  const stop = React.useCallback(() => {
    const packId = runningPackId.current
    stopping.current = true
    log({ level: "warn", source: "launcher", text: "Juego detenido por el usuario" })
    if (!packId) {
      dispatch({ type: "game/state", game: { kind: "idle" } })
      return
    }
    void stopGame(packId)
      .catch(() => {
        /* idempotent by contract; the state event still lands */
      })
      .finally(() => {
        runningPackId.current = null
      })
  }, [log])

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
    stop,
    clearLogs: () => dispatch({ type: "logs/clear" }),
    patchSettings,
  }

  return <LauncherContext.Provider value={value}>{children}</LauncherContext.Provider>
}

export function useLauncher(): Ctx {
  const ctx = React.useContext(LauncherContext)
  if (!ctx) throw new Error("useLauncher must be used inside <LauncherProvider>")
  return ctx
}
