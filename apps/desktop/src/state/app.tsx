import * as React from "react";

import { toast } from "@boffmedia/ui";

import { setLocale, translate } from "../i18n";
import {
  MOCK_ACCOUNT,
  MOCK_DEVICE_CODE,
  MOCK_SETTINGS,
  mockLocalPacks,
} from "../services/mock";
import { loadPackEntries } from "../services/packs";
import {
  type AccountEntry,
  type BoffAccount,
  type BoffAccountEntry,
  type BoffDeviceCode,
  authAccounts,
  authBegin,
  boffAccounts,
  boffDeviceCancel,
  boffDevicePoll,
  boffDeviceStart,
  boffOffline,
  boffRevalidate,
  boffSessionRestore,
  boffSignOut,
  boffSwitch,
  authAwait,
  authLogout,
  authOffline,
  authRemove,
  authRestore,
  authSwitch,
  installPack,
  applyUiScale,
  instanceModGraph,
  instanceScan,
  isDesktop,
  launchPack,
  localPackGet,
  onGameLog,
  onGameState,
  onInstallDone,
  onInstallProgress,
  packManifest,
  packManifestCached,
  repairInstance,
  serverHealth,
  setIconFailureSink,
  settingsGet,
  settingsSet,
  stopGame,
  type ScannedInstallState,
} from "../runtime";
import type {
  Account,
  DeviceCode,
  GameState,
  InstallPhase,
  LogLine,
  PackEntry,
  Settings,
} from "../services/types";
import type { SystemId } from "../services/systems";

// One store for the whole app. A reducer rather than scattered useState because
// install and launch are state MACHINES — "installing" and "running" must be
// mutually exclusive, and expressing that as independent booleans is how you
// get a launcher that offers Play mid-download.

// "tools" is the registry-driven hub, "tool" one tool full-screen. Both are
// reachable WITHOUT a Boffmedia session and offline — the tools are public on
// the web, so gating them behind sign-in here would take that away.
export type View = "packs" | "pack" | "logs" | "settings" | "tools" | "tool";

/** The unit the rail highlights. Views map onto sections, which is what makes
 *  the rail stay lit at depth — `pack` is still Play, `tool` is still Tools.
 *  Logs and Settings are UTILITIES, not sections: they live at the foot of the
 *  rail and deliberately light no section button. */
export type Section = "play" | "tools" | null;

export function sectionOfView(view: View): Section {
  if (view === "packs" || view === "pack") return "play";
  if (view === "tools" || view === "tool") return "tools";
  return null;
}

type State = {
  /** The BOFFMEDIA account the launcher is signed in as. This is the principal:
   *  the pack list, entitlement and downloads all key on it, and the shell is
   *  gated on it. */
  boffAccount: BoffAccount | null;
  boffDeviceCode: BoffDeviceCode | null;
  boffSigningIn: boolean;
  boffError: string | null;
  /** The MINECRAFT account, when one is signed in. Needed to launch Minecraft
   *  and nothing else — an emulator pack never asks for it. */
  account: Account | null;
  deviceCode: DeviceCode | null;
  signingIn: boolean;
  /** Boot gates. The splash stays up until BOTH are true — rendering SignIn
   *  while the silent restore is still in flight is what made a signed-in
   *  player see "Entrar con Microsoft" every launch. Two flags rather than one
   *  counter so a failure in either path can flip only its own gate. */
  bootAuthDone: boolean;
  bootSettingsDone: boolean;
  bootPacksDone: boolean;
  /** True when the session was restored from the roster with no network. The
   *  player is who they say they are (they signed in here before) but nothing
   *  server-side is available: no managed packs, no installs, no updates. */
  offline: boolean;
  /** What the splash says it is doing. */
  bootStep: string;
  /** Why a stored session did not come back. `needsSignin` separates "your
   *  session expired, sign in again" from "we could not reach Microsoft" —
   *  telling a player to re-authenticate over a network blip sends them into a
   *  loop that cannot succeed. */
  restoreError: { message: string; needsSignin: boolean } | null;
  /** Why the BOFFMEDIA session did not come back on boot. `code === "store_error"`
   *  means the credential store itself failed (offline mode cannot help — the
   *  token cannot be read either); `needsSignin` separates an expired session
   *  from a plain network blip, which offline mode IS for. Rendered on
   *  BoffSignIn so a player is never dropped there with no explanation. */
  boffRestoreError: {
    message: string;
    needsSignin: boolean;
    code?: string;
  } | null;
  view: View;
  selectedPackId: string | null;
  /** Which registry tool the "tool" view is showing. */
  selectedToolId: string | null;
  /** One-shot: set when navigation asked the pack detail to open its edit form
   *  straight away (the library card's "Edit" action). The detail consumes and
   *  clears it on mount, so it never re-fires on a later plain visit. */
  editIntent: boolean;
  packs: PackEntry[];
  packsLoading: boolean;
  /** Set when the registry could not be reached or refused us. Distinct from an
   *  empty list, which legitimately means "no packs for this UUID". */
  packsError: string | null;
  /** The managed half failed but local packs loaded. A PARTIAL library — the
   *  list on screen is real, it is just not all of it. */
  packsPartial: string | null;
  game: GameState;
  logs: LogLine[];
  settings: Settings;
  /** Currently selected system filter. "All" shows all packs, or a specific SystemId. */
  selectedSystem: SystemId | "All";
  /** Whether the BACKEND is answering, independent of whether anyone is signed
   *  in. Its own axis on purpose: `offline` means "we fell back to a stored
   *  identity", `packsError` means "this one request failed", and neither of
   *  them can say "the server is down" — which is the thing a player most needs
   *  told, because otherwise they go looking for the fault in their own
   *  install. `unknown` is pre-probe; `checking` is a probe in flight. */
  backendStatus: BackendStatus;
  /** The transport detail behind a non-ok {@link backendStatus}, for the log. */
  backendDetail: string | null;
  /** The player closed the outage banner. Sticky for the WHOLE outage, not just
   *  the render — a banner that reopens on the next navigation or the next
   *  30-second poll is not dismissible, it is nagging. Re-armed only when the
   *  backend comes back, so the NEXT outage is announced once more. */
  backendNoticeDismissed: boolean;
};

/** `unreachable` — nothing answered, and we cannot tell whose network is at
 *  fault. `down` — the server answered 5xx, which is unambiguously theirs. */
export type BackendStatus =
  | "unknown"
  | "checking"
  | "ok"
  | "unreachable"
  | "down";

type Action =
  | { type: "boff/start" }
  | { type: "boff/code"; code: BoffDeviceCode }
  | { type: "boff/done"; account: BoffAccount }
  | { type: "boff/switched"; account: BoffAccount }
  | { type: "boff/offline"; account: BoffAccount }
  | {
      type: "boff/restore-failed";
      message: string;
      needsSignin: boolean;
      code?: string;
    }
  | { type: "boff/cancel"; message?: string }
  | { type: "boff/signout" }
  | { type: "boot/step"; step: string }
  | { type: "boot/done"; part: "auth" | "settings" | "packs" }
  | { type: "signin/restore-failed"; message: string; needsSignin: boolean }
  | { type: "signin/offline"; account: Account }
  | { type: "signin/start" }
  | { type: "signin/code"; code: DeviceCode }
  | { type: "signin/done"; account: Account }
  | { type: "signin/cancel" }
  | { type: "signout" }
  | { type: "account/switched"; account: Account }
  | { type: "packs/loading" }
  | { type: "packs/load"; packs: PackEntry[]; registryError: string | null }
  | { type: "packs/error"; message: string }
  | {
      type: "view";
      view: View;
      packId?: string;
      edit?: boolean;
      toolId?: string;
    }
  | { type: "editIntent/clear" }
  | { type: "install/start"; packId: string }
  | {
      type: "install/progress";
      packId: string;
      phase: InstallPhase;
      fraction: number;
      file: string;
      downloadedBytes: number;
      totalBytes: number;
    }
  | { type: "install/state"; packId: string; state: ScannedInstallState }
  | { type: "pack/played"; packId: string; at: string }
  | { type: "game/state"; game: GameState }
  | { type: "log"; line: LogLine }
  | { type: "logs/clear" }
  | { type: "settings"; settings: Settings }
  | { type: "system/select"; system: SystemId | "All" }
  | { type: "backend/status"; status: BackendStatus; detail?: string | null }
  | { type: "backend/dismiss" };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "boff/start":
      return {
        ...s,
        boffSigningIn: true,
        boffDeviceCode: null,
        boffError: null,
        boffRestoreError: null,
      };
    case "boff/code":
      return { ...s, boffDeviceCode: a.code };
    case "boff/done":
      return {
        ...s,
        boffAccount: a.account,
        boffSigningIn: false,
        boffDeviceCode: null,
        boffError: null,
        boffRestoreError: null,
      };
    case "boff/switched":
      // A different Boffmedia account: its entitlements differ, so the library
      // is dropped and reloaded (the packs effect keys on boffAccount.id) —
      // never show one account another's pack names. The Minecraft session, the
      // logs and any running-game state belonged to the departing account too
      // (Rust clears the MSA session on switch), so they are dropped with it.
      return {
        ...s,
        boffAccount: a.account,
        account: null,
        boffSigningIn: false,
        boffDeviceCode: null,
        boffError: null,
        boffRestoreError: null,
        restoreError: null,
        offline: false,
        packs: [],
        packsError: null,
        packsPartial: null,
        packsLoading: false,
        logs: [],
        game: { kind: "idle" },
        // Only a view that the NEW account cannot honour is reset. `pack`
        // pointed at a pack listed for the departing account's entitlements, so
        // it goes; everything else (the library itself, Tools, Logs, Settings)
        // is just as valid under the new principal, and bouncing someone out of
        // an open tool because they switched account is a lost-place bug.
        view: s.view === "pack" ? "packs" : s.view,
        selectedPackId: null,
      };
    case "boff/offline":
      // Offline Boffmedia principal: the stored token proved a prior sign-in,
      // but nothing server-side is reachable. The shell opens on installed packs
      // only; `offline` is what keeps install/update buttons hidden.
      return {
        ...s,
        boffAccount: a.account,
        offline: true,
        boffSigningIn: false,
        boffDeviceCode: null,
        boffError: null,
        boffRestoreError: null,
      };
    case "boff/restore-failed":
      return {
        ...s,
        boffRestoreError: {
          message: a.message,
          needsSignin: a.needsSignin,
          code: a.code,
        },
      };
    case "boff/cancel":
      return {
        ...s,
        boffSigningIn: false,
        boffDeviceCode: null,
        boffError: a.message ?? null,
      };
    case "boff/signout":
      // Signing out of Boffmedia empties the library too: every managed pack in
      // it was listed for THAT account's entitlements. The Minecraft session,
      // logs and game state went with it (Rust clears the MSA session on
      // sign-out), and offline mode ends — the next account proves itself fresh.
      return {
        ...s,
        boffAccount: null,
        account: null,
        boffDeviceCode: null,
        boffSigningIn: false,
        boffRestoreError: null,
        restoreError: null,
        offline: false,
        packs: [],
        packsError: null,
        packsPartial: null,
        packsLoading: false,
        logs: [],
        game: { kind: "idle" },
        // Play is NOT gated, so signing out does not evict anyone from it:
        // the library still lists this machine's local packs and they are still
        // playable. Only `pack` goes, and only because the pack it pointed at
        // was a managed one listed under the departing account.
        view: s.view === "pack" ? "packs" : s.view,
        selectedPackId: null,
      };
    case "boot/step":
      return { ...s, bootStep: a.step };
    case "boot/done":
      if (a.part === "auth") return { ...s, bootAuthDone: true };
      if (a.part === "packs") return { ...s, bootPacksDone: true };
      return { ...s, bootSettingsDone: true };
    case "signin/restore-failed":
      return {
        ...s,
        restoreError: { message: a.message, needsSignin: a.needsSignin },
      };
    case "signin/start":
      // Clearing the banner here is what stops "tu sesión caducó" from sitting
      // above the device code the player is already typing in.
      return { ...s, signingIn: true, deviceCode: null, restoreError: null };
    case "signin/code":
      return { ...s, deviceCode: a.code };
    case "signin/done":
      // A real sign-in always clears offline: we demonstrably have a network.
      return {
        ...s,
        account: a.account,
        signingIn: false,
        deviceCode: null,
        restoreError: null,
        offline: false,
      };
    case "signin/offline":
      return {
        ...s,
        account: a.account,
        offline: true,
        signingIn: false,
        deviceCode: null,
      };
    case "signin/cancel":
      return { ...s, signingIn: false, deviceCode: null };
    // A switch is a signout and a signin at once. It gets its own case rather
    // than dispatching both because the pair would blank the shell for a frame
    // and bounce the player back to the packs list; the ONE thing that must
    // still happen is dropping the packs, for the same reason as below.
    case "account/switched":
      return {
        ...s,
        account: a.account,
        packs: [],
        packsError: null,
        packsPartial: null,
        // A switch runs the full refresh chain, so reaching this action at all
        // proves the network is back.
        offline: false,
        packsLoading: false,
        selectedPackId: null,
      };
    case "signout":
      // Never keep packs across accounts: entitlements are per-UUID and
      // showing the previous user's list would leak pack names.
      return {
        ...s,
        account: null,
        packs: [],
        packsError: null,
        packsPartial: null,
        packsLoading: false,
        // Signing out ends offline mode: the next account has to prove itself
        // through the real chain, and a stale flag would tell the shell to keep
        // hiding install buttons for a player who is fully online.
        offline: false,
        // The BOFFMEDIA principal is untouched here — only the Minecraft
        // sub-credential went — so the section the player is in stays valid.
        // Only `pack` is dropped, along with the id it pointed at.
        view: s.view === "pack" ? "packs" : s.view,
        selectedPackId: null,
      };
    case "packs/loading":
      return { ...s, packsLoading: true, packsError: null };
    case "packs/load":
      return {
        ...s,
        packs: a.packs,
        packsLoading: false,
        packsError: null,
        packsPartial: a.registryError,
      };
    case "packs/error":
      // Keep whatever list is already on screen: a failed REFRESH should not
      // empty a library the player was just looking at.
      return { ...s, packsLoading: false, packsError: a.message };
    case "view":
      return {
        ...s,
        view: a.view,
        selectedPackId: a.packId ?? s.selectedPackId,
        selectedToolId: a.toolId ?? s.selectedToolId,
        editIntent: a.edit ?? false,
      };
    case "editIntent/clear":
      return { ...s, editIntent: false };
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
      };
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
      };
    case "install/state":
      return {
        ...s,
        packs: s.packs.map((p) =>
          p.pack.id !== a.packId ? p : { ...p, state: a.state },
        ),
      };
    case "pack/played":
      // Mirrors what Rust just wrote to plays.json, so the card stops saying
      // "Nunca jugado" without a full re-listing.
      return {
        ...s,
        packs: s.packs.map((p) =>
          p.pack.id !== a.packId ? p : { ...p, lastPlayed: a.at },
        ),
      };
    case "game/state":
      return { ...s, game: a.game };
    case "log":
      // Bounded: the game is a firehose and an unbounded array is a slow leak.
      return { ...s, logs: [...s.logs, a.line].slice(-2000) };
    case "logs/clear":
      return { ...s, logs: [] };
    case "settings":
      return { ...s, settings: a.settings };
    case "system/select":
      // Persist selection to localStorage
      try {
        localStorage.setItem("app:selectedSystem", a.system);
      } catch {
        /* storage error is non-fatal */
      }
      return { ...s, selectedSystem: a.system };
    case "backend/status":
      return {
        ...s,
        backendStatus: a.status,
        backendDetail: a.detail ?? null,
        // Recovery re-arms the banner; a `checking` tick in the middle of an
        // outage must NOT, or every poll would resurrect what was dismissed.
        backendNoticeDismissed:
          a.status === "ok" ? false : s.backendNoticeDismissed,
      };
    case "backend/dismiss":
      return { ...s, backendNoticeDismissed: true };
    default:
      return s;
  }
}

const initial: State = {
  boffAccount: null,
  boffDeviceCode: null,
  boffSigningIn: false,
  boffError: null,
  account: null,
  deviceCode: null,
  signingIn: false,
  bootAuthDone: false,
  bootSettingsDone: false,
  bootPacksDone: false,
  bootStep: "Iniciando…",
  restoreError: null,
  boffRestoreError: null,
  offline: false,
  view: "packs",
  selectedPackId: null,
  selectedToolId: null,
  editIntent: false,
  packs: [],
  packsLoading: false,
  packsError: null,
  packsPartial: null,
  game: { kind: "idle" },
  logs: [],
  settings: MOCK_SETTINGS,
  selectedSystem: "All",
  backendStatus: "unknown",
  backendDetail: null,
  backendNoticeDismissed: false,
};

type Ctx = State & {
  /** True until every boot gate is open. While it is, render the splash and
   *  NOTHING else — this flag is what stops SignIn flashing on the way in. */
  booting: boolean;
  /** Enter offline mode as the last Minecraft account. Resolves to false when
   *  this machine has no account that ever completed a real sign-in. */
  goOffline: () => Promise<boolean>;
  /** Enter offline mode as the last BOFFMEDIA account: opens the shell on
   *  installed packs when the network is gone but a stored session proves a
   *  prior sign-in here. Resolves to false when there is nothing to fall back
   *  to (no stored session, or the credential store is unreadable). */
  goBoffOffline: () => Promise<boolean>;
  /** True while an install is downloading or a game is live. Account switching
   *  and sign-out are refused in this window: the process-global session token
   *  is what those operations authenticate with, and swapping it mid-flight
   *  re-authenticates their remaining requests as somebody else (C1). */
  sessionBusy: boolean;
  selected: PackEntry | null;
  /** Authorize this launcher against a Boffmedia account (device flow). Also the
   *  "add account" action — it keys tokens by account id, so a fresh device flow
   *  ADDS an account beside the ones already signed in. */
  boffSignIn: () => Promise<void>;
  cancelBoffSignIn: () => void;
  /** Sign out of the ACTIVE Boffmedia account. Promotes another signed-in
   *  account when one remains; otherwise lands on BoffSignIn. */
  boffSignOut: () => Promise<void>;
  /** Every signed-in Boffmedia account, active one flagged. */
  boffAccountList: BoffAccountEntry[];
  /** Make a known Boffmedia account active. */
  switchBoffAccount: (id: number) => Promise<void>;
  /** True while a Boffmedia switch/sign-out is resolving. */
  switchingBoffAccount: boolean;
  /** Sign in to MINECRAFT. Resolves true once an MSA session is live. Only
   *  needed to install or launch a Minecraft pack; the shell, the library and
   *  every emulator pack work without it. */
  signIn: () => Promise<boolean>;
  cancelSignIn: () => void;
  signOut: () => void;
  /** Every account the launcher knows, active one flagged. */
  accounts: AccountEntry[];
  switchAccount: (uuid: string) => Promise<void>;
  removeAccount: (uuid: string) => Promise<void>;
  /** True while a switch is resolving — it runs the full refresh chain and is
   *  as slow as a silent sign-in. */
  switchingAccount: boolean;
  /** Force a re-mint of the CURRENT session (refresh tokens + new launcher JWT),
   *  for when the stored token went stale mid-session. */
  revalidate: () => Promise<void>;
  /** True while {@link revalidate} runs — same cost as a silent sign-in. */
  revalidating: boolean;
  /** The rail's highlight, derived from {@link View}. See {@link sectionOfView}. */
  section: Section;
  /** True once the launcher has a Boffmedia principal to act as — a live one or
   *  an offline-restored one. NOTHING is gated on it any more: it decides what
   *  the library can CONTAIN (server packs are entitlement-filtered, so they
   *  need an account) and whether the sign-in call to action is shown. */
  hasSession: boolean;
  /** Re-probe the backend. Resolves to the status it found. */
  checkBackend: () => Promise<BackendStatus>;
  /** Re-probe AND reload the library — what the "Retry" button does. */
  retryBackend: () => void;
  /** Close the outage banner for the rest of this outage. The rail keeps a
   *  permanent, one-icon indicator, so nothing is actually lost by closing it. */
  dismissBackendNotice: () => void;
  go: (
    view: View,
    packId?: string,
    opts?: { edit?: boolean; toolId?: string },
  ) => void;
  /** True when the pack detail was opened with a request to edit immediately.
   *  Read once, then cleared via {@link clearEditIntent}. */
  editIntent: boolean;
  clearEditIntent: () => void;
  reloadPacks: () => void;
  /** Select a system filter. Dispatches system/select action; persists to localStorage. */
  selectSystem: (system: SystemId | "All") => void;
  install: (packId: string) => Promise<void>;
  repair: (packId: string) => Promise<void>;
  /** Re-scan one pack's on-disk state (missing user files, randomizer gate). */
  refreshInstallState: (packId: string) => Promise<void>;
  play: (packId: string) => Promise<void>;
  stop: () => void;
  clearLogs: () => void;
  patchSettings: (patch: Partial<Settings>) => void;
};

const AppContext = React.createContext<Ctx | null>(null);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Floor on how long the boot splash stays up. See the restore effect. */
const MIN_SPLASH_MS = 650;

/** Ceiling. The splash waits on the network (the auth chain, then the pack
 *  registry), and a server that accepts a connection and then says nothing
 *  would hold it there forever — a launcher that never finishes starting, with
 *  no way for the player to do anything about it. Past this point boot is
 *  declared over regardless: whatever is still in flight keeps running and
 *  lands in the UI when it lands, where each screen already has its own loading
 *  and error states. A late splash is a worse failure than a late pack list. */
const MAX_BOOT_MS = 10_000;

/** Rust error codes (api.rs `ApiError`) that mean the fault is the BACKEND's,
 *  mapped onto the status the shell shows for each. Any other code — a dead
 *  session, a revoked entitlement, an unreadable keychain — says nothing about
 *  the server and deliberately has no entry here. */
const BACKEND_FAULT: Record<string, BackendStatus | undefined> = {
  server_unreachable: "unreachable",
  server_down: "down",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, initial);
  // Bumped to re-run the load effect; a counter rather than a callback so the
  // retry path and the initial load are the exact same code.
  const [reloadToken, setReloadToken] = React.useState(0);
  // Guards the install/play simulations against double-invocation; also the
  // hook the real implementation uses to abort in-flight work on unmount.
  const busy = React.useRef<Set<string>>(new Set());
  // Survives StrictMode's double mount — see the restore effect below.
  const restoreStarted = React.useRef(false);
  const settingsLoaded = React.useRef(false);
  // Which pack the running game belongs to; `stop_game` is keyed on it and the
  // Stop button has no pack in hand.
  const runningPackId = React.useRef<string | null>(null);
  const stopping = React.useRef(false);
  // Read inside callbacks that must not re-create on every list change.
  const packsRef = React.useRef<PackEntry[]>(state.packs);
  packsRef.current = state.packs;
  // Read inside install/repair, which must refuse while offline. A ref rather
  // than a dependency so the callbacks do not re-create when the flag flips.
  const offlineRef = React.useRef(state.offline);
  offlineRef.current = state.offline;
  // An install or a live game holds the process-global session token. Switching
  // account under them re-authenticates their remaining requests as somebody
  // else (C1), so the switcher disables itself and the callbacks refuse.
  const sessionBusy =
    state.game.kind === "running" ||
    state.game.kind === "preparing" ||
    state.packs.some((p) => p.state?.kind === "installing");
  const sessionBusyRef = React.useRef(sessionBusy);
  sessionBusyRef.current = sessionBusy;
  const settingsRef = React.useRef<Settings>(state.settings);
  settingsRef.current = state.settings;
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const log = React.useCallback((line: Omit<LogLine, "ts">) => {
    dispatch({ type: "log", line: { ...line, ts: Date.now() } });
  }, []);

  /** Re-read what is on disk for one pack. Cheap, and the only way the UI
   *  learns that an install left the pack outdated or broken. */
  const refreshInstallState = React.useCallback(async (packId: string) => {
    const entry = packsRef.current.find((p) => p.pack.id === packId);
    if (!entry) return;
    try {
      const state = await instanceScan(
        entry.pack.slug,
        entry.latest?.id ?? null,
      );
      dispatch({ type: "install/state", packId, state });
    } catch {
      /* the listing stays as it was rather than flickering to not-installed */
    }
  }, []);

  // The launcher's own sign-in: a short code, approved on the website where the
  // player is already logged in. Polling lives here rather than in Rust so the
  // cadence is the renderer's and no worker sleeps for ten minutes.
  const boffCancelled = React.useRef(false);
  // Re-entrancy guard: "Add account" and a stray double-click both call this.
  // A second flow would share the one cancel token and race the first's poll,
  // committing whichever approval lands — so only one runs at a time.
  const boffFlowActive = React.useRef(false);
  // Whether a flow is an ADD (someone already signed in) — its failure banner
  // lives on BoffSignIn, which an add-account flow returns away from, so the
  // error would vanish unseen. A toast is the only surface that survives.
  const boffAccountRef = React.useRef<BoffAccount | null>(state.boffAccount);
  boffAccountRef.current = state.boffAccount;

  const boffSignIn = React.useCallback(async () => {
    if (boffFlowActive.current) return;
    boffFlowActive.current = true;
    const adding = boffAccountRef.current != null;
    const surfaceFailure = (message: string) => {
      dispatch({ type: "boff/cancel", message });
      if (adding) toast.error(message);
    };
    boffCancelled.current = false;
    dispatch({ type: "boff/start" });
    try {
      const code = await boffDeviceStart();
      dispatch({ type: "boff/code", code });

      const intervalMs = Math.max(2, code.intervalSeconds) * 1000;
      const deadline = Date.now() + code.expiresIn * 1000;
      for (;;) {
        if (boffCancelled.current) return;
        if (Date.now() > deadline) {
          surfaceFailure("El código ha caducado.");
          return;
        }
        await sleep(intervalMs);
        if (boffCancelled.current) return;

        const poll = await boffDevicePoll();
        // The poll can take a full interval; a cancel that landed while it was
        // in flight must win, or a just-approved session gets committed after
        // the player already backed out.
        if (boffCancelled.current) return;
        if (poll.status === "approved" && poll.user) {
          // `boff/switched` rather than `boff/done`: this path is reached by the
          // first sign-in AND by "add account", and the latter must drop the
          // previous account's library instead of showing it under the new one.
          dispatch({ type: "boff/switched", account: poll.user });
          log({
            level: "info",
            source: "app",
            text: `App autorizada como ${poll.user.username}`,
          });
          return;
        }
        if (poll.status === "denied") {
          surfaceFailure("Has rechazado la autorización.");
          return;
        }
        if (poll.status === "expired") {
          surfaceFailure("El código ha caducado.");
          return;
        }
      }
    } catch (err) {
      const failure = err as { message?: string };
      const message = failure?.message ?? "No se pudo autorizar la app.";
      surfaceFailure(message);
      log({ level: "error", source: "app", text: message });
    } finally {
      boffFlowActive.current = false;
    }
  }, [log]);

  const cancelBoffSignIn = React.useCallback(() => {
    boffCancelled.current = true;
    // Drop the pending authorization server-side too, so a late approval can
    // never be committed by a stray in-flight poll resolving after this.
    void boffDeviceCancel();
    dispatch({ type: "boff/cancel" });
  }, []);

  // Boffmedia account roster: outside the reducer, exactly like the Minecraft
  // one — it is what Rust has on disk, not derived state, and changes on
  // sign-in, switch and sign-out, each of which reloads it explicitly.
  const [boffAccountList, setBoffAccountList] = React.useState<
    BoffAccountEntry[]
  >([]);
  const [switchingBoffAccount, setSwitchingBoffAccount] = React.useState(false);

  const reloadBoffAccounts = React.useCallback(() => {
    void boffAccounts()
      .then(setBoffAccountList)
      .catch(() => undefined);
  }, []);

  const boffSignOutFn = React.useCallback(async () => {
    // The backing token is mid-use while an install runs or a game is live;
    // Rust refuses the sign-out, but disabling it here is the real guard.
    if (sessionBusyRef.current) return;
    setSwitchingBoffAccount(true);
    try {
      const next = await boffSignOut();
      runningPackId.current = null;
      busy.current.clear();
      if (next) {
        // Another account was promoted in place of the one signed out.
        dispatch({ type: "boff/switched", account: next });
        log({
          level: "info",
          source: "app",
          text: `Cuenta activa: ${next.username}`,
        });
      } else {
        dispatch({ type: "boff/signout" });
      }
    } catch (err) {
      // Even on error the local dispatch clears the session: the alternative
      // traps the player signed in to a session that is already gone.
      dispatch({ type: "boff/signout" });
      log({
        level: "error",
        source: "app",
        text:
          (err as { message?: string })?.message ??
          "No se pudo cerrar la sesión.",
      });
    } finally {
      setSwitchingBoffAccount(false);
      reloadBoffAccounts();
    }
  }, [log, reloadBoffAccounts]);

  const switchBoffAccount = React.useCallback(
    async (id: number) => {
      if (
        id === state.boffAccount?.id ||
        switchingBoffAccount ||
        sessionBusyRef.current
      )
        return;
      setSwitchingBoffAccount(true);
      try {
        const account = await boffSwitch(id);
        runningPackId.current = null;
        busy.current.clear();
        dispatch({ type: "boff/switched", account });
        log({
          level: "info",
          source: "app",
          text: `Cuenta activa: ${account.username}`,
        });
      } catch (err) {
        const message =
          (err as { message?: string })?.message ??
          "No se pudo cambiar de cuenta.";
        log({ level: "error", source: "app", text: message });
        // Rust prunes an account whose token is gone; re-read drops the dead row.
        reloadBoffAccounts();
      } finally {
        setSwitchingBoffAccount(false);
      }
    },
    [state.boffAccount?.id, switchingBoffAccount, log, reloadBoffAccounts],
  );

  // Re-read the roster whenever the active Boffmedia account changes: covers the
  // restore on launch, every device-flow sign-in, and every switch, without any
  // of them having to remember to.
  const boffAccountId = state.boffAccount?.id ?? null;
  React.useEffect(() => {
    reloadBoffAccounts();
  }, [boffAccountId, reloadBoffAccounts]);

  // In a browser there is no Rust side, so the mock flow runs instead —
  // that is what keeps every screen workable from `pnpm dev:renderer`.
  const signIn = React.useCallback(async (): Promise<boolean> => {
    dispatch({ type: "signin/start" });

    if (!isDesktop()) {
      await sleep(400);
      dispatch({ type: "signin/code", code: MOCK_DEVICE_CODE });
      await sleep(2600);
      dispatch({ type: "signin/done", account: MOCK_ACCOUNT });
      log({
        level: "info",
        source: "app",
        text: `Sesión simulada como ${MOCK_ACCOUNT.username}`,
      });
      return true;
    }

    try {
      const code = await authBegin();
      dispatch({
        type: "signin/code",
        code: {
          userCode: code.userCode,
          verificationUri: code.verificationUri,
          expiresInSeconds: code.expiresIn,
        },
      });
      const account = await authAwait();
      dispatch({
        type: "signin/done",
        account,
      });
      log({
        level: "info",
        source: "app",
        text: `Sesión iniciada como ${account.username}`,
      });
      return true;
    } catch (err) {
      const failure = err as { message?: string };
      dispatch({ type: "signin/cancel" });
      log({
        level: "error",
        source: "app",
        text: failure?.message ?? "No se pudo iniciar sesión.",
      });
      return false;
    }
  }, [log]);

  // Icon failures land in the Logs screen. Rate-limited to the first few: a
  // browse grid asks for ~50 icons at once, and if the cache is broken it is
  // broken for all of them — fifty identical lines would bury the log rather
  // than explain it.
  React.useEffect(() => {
    let reported = 0;
    setIconFailureSink((message) => {
      if (reported >= 3) return;
      reported += 1;
      log({
        level: "error",
        source: "app",
        text:
          reported === 3
            ? `${message} (no se registrarán más fallos de iconos)`
            : message,
      });
    });
    return () => setIconFailureSink(null);
  }, [log]);

  // The boot ceiling. Runs once, independent of every other gate — its whole
  // job is to be the thing that cannot itself get stuck.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: "boot/done", part: "auth" });
      dispatch({ type: "boot/done", part: "settings" });
      dispatch({ type: "boot/done", part: "packs" });
    }, MAX_BOOT_MS);
    return () => clearTimeout(timer);
  }, []);

  // ── Server availability ─────────────────────────────────────────────────
  //
  // Probed as its own thing rather than inferred from whichever request
  // happened to fail. A player whose library is empty cannot tell "you own no
  // packs" from "the registry is down", and a spinner tells them nothing at
  // all; the probe is what lets the shell say which it is. It is
  // unauthenticated, so it answers for a signed-out player too — the case the
  // launcher now has to handle.
  const backendStatusRef = React.useRef<BackendStatus>(state.backendStatus);
  backendStatusRef.current = state.backendStatus;

  const checkBackend = React.useCallback(async (): Promise<BackendStatus> => {
    dispatch({ type: "backend/status", status: "checking" });
    const health = await serverHealth();
    const status: BackendStatus =
      health.status === "ok"
        ? "ok"
        : health.status === "down"
          ? "down"
          : "unreachable";
    dispatch({ type: "backend/status", status, detail: health.detail });
    return status;
  }, []);

  // On boot, then on a cadence only while it is BAD. Polling a healthy server
  // every half minute forever would be traffic spent to learn nothing: a
  // server that goes down mid-session announces itself through the next real
  // request, and this loop exists to notice it coming BACK.
  React.useEffect(() => {
    void checkBackend();
  }, [checkBackend]);

  React.useEffect(() => {
    if (state.backendStatus !== "unreachable" && state.backendStatus !== "down")
      return;
    const timer = setInterval(() => {
      // A probe already in flight must not be stacked on by the timer.
      if (backendStatusRef.current === "checking") return;
      void checkBackend().then((status) => {
        // Recovered on its own: pull the library in rather than leaving the
        // player looking at a banner that has stopped being true.
        if (status === "ok") setReloadToken((n) => n + 1);
      });
    }, 30_000);
    return () => clearInterval(timer);
  }, [state.backendStatus, checkBackend]);

  /** The banner's retry: re-probe, and reload the library on the same click —
   *  the two are one action to a player, who is asking for the thing they
   *  cannot see, not for a diagnostic. */
  const retryBackend = React.useCallback(() => {
    void checkBackend().finally(() => setReloadToken((n) => n + 1));
  }, [checkBackend]);

  // Falling back to the roster when the network is gone. Returns whether it
  // worked, so the caller can decide between "you are in, offline" and leaving
  // the player on the sign-in screen.
  const goOffline = React.useCallback(async () => {
    try {
      const account = await authOffline();
      dispatch({ type: "signin/offline", account });
      log({
        level: "warn",
        source: "app",
        text: `Modo sin conexión como ${account.username}. Solo packs ya instalados.`,
      });
      return true;
    } catch (err) {
      // Expected on a machine that has never signed in — there is simply no
      // account to fall back to, and the sign-in screen is the right answer.
      log({
        level: "info",
        source: "app",
        text:
          (err as { message?: string })?.message ??
          "No hay ninguna cuenta guardada.",
      });
      return false;
    }
  }, [log]);

  // The BOFFMEDIA equivalent: open the shell on installed packs when the network
  // is gone but a stored session proves a prior sign-in here. Fails closed when
  // there is nothing to fall back to (no session, or an unreadable keychain),
  // which leaves the player on BoffSignIn with the restore error still shown.
  const goBoffOffline = React.useCallback(async () => {
    try {
      const account = await boffOffline();
      dispatch({ type: "boff/offline", account });
      log({
        level: "warn",
        source: "app",
        text: `Modo sin conexión como ${account.username}. Solo packs ya instalados.`,
      });
      return true;
    } catch (err) {
      log({
        level: "info",
        source: "app",
        text:
          (err as { message?: string })?.message ??
          "No hay ninguna cuenta de Boffmedia guardada.",
      });
      return false;
    }
  }, [log]);

  // Silent sign-in on start. A THROW here is a real failure — a credential
  // store that could not be read, or Minecraft refusing the chain — and it
  // must never be swallowed into "please sign in". The Rust side already
  // writes each of those as a sentence for a player, so it is logged VERBATIM;
  // wrapping it in "no se pudo leer el almacén de credenciales" reports a
  // Minecraft 429 as a keychain problem.
  React.useEffect(() => {
    // StrictMode mounts this effect twice in dev. Two restores in flight means
    // two runs of the four-hop chain, and Minecraft rate-limits the second.
    // The Rust side serialises them too; this just avoids the round trip.
    if (restoreStarted.current) return;
    restoreStarted.current = true;

    // A splash that appears and vanishes in 40ms reads as a glitch, so the gate
    // never opens before MIN_SPLASH_MS. It costs nothing on the slow path —
    // the restore chain is far longer than this — and only smooths the case
    // where there is no stored session at all.
    const startedAt = Date.now();
    const openGate = () => {
      const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - startedAt));
      setTimeout(() => dispatch({ type: "boot/done", part: "auth" }), wait);
    };

    // In a browser there is no Rust side and nothing to restore; the gate still
    // goes through the same path so dev:renderer shows the real splash.
    if (!isDesktop()) {
      openGate();
      return;
    }

    dispatch({ type: "boot/step", step: "Restaurando tu sesión…" });

    // The Boffmedia session first: it gates the shell, and it is the one the
    // pack list needs. A missing Minecraft session is NOT a reason to keep the
    // launcher shut — it is only needed to launch Minecraft itself.
    void boffSessionRestore()
      .then((account) => {
        if (!account) return;
        dispatch({ type: "boff/done", account });
        log({
          level: "info",
          source: "app",
          text: `App autorizada como ${account.username}`,
        });
      })
      .catch(
        async (err: {
          message?: string;
          needsSignin?: boolean;
          code?: string;
        }) => {
          // Surfaced on BoffSignIn, not just logged: a player dropped there must
          // know why. `code === "store_error"` means the keychain itself failed —
          // offline mode cannot help (it reads the same token). A dead session
          // (needsSignin) genuinely needs re-authorising. Anything else is a
          // network blip, which is exactly what offline mode is for.
          const message =
            err?.message ?? "No se pudo restaurar la sesión del launcher.";
          const needsSignin = err?.needsSignin ?? false;
          const code = err?.code;
          dispatch({ type: "boff/restore-failed", message, needsSignin, code });
          log({ level: "error", source: "app", text: message });

          if (needsSignin || code === "store_error") return;
          dispatch({
            type: "boot/step",
            step: "Sin conexión — usando tu cuenta guardada…",
          });
          await goBoffOffline();
        },
      );

    void authRestore()
      .then((account) => {
        if (!account) return;
        dispatch({ type: "signin/done", account });
        log({
          level: "info",
          source: "app",
          text: `Sesión restaurada: ${account.username}`,
        });
      })
      .catch(async (err: { message?: string; needsSignin?: boolean }) => {
        // Surfaced on the sign-in screen as well as the log: a player must
        // never be dropped at "Entrar con Microsoft" with no idea why the
        // launcher forgot them.
        const message = err?.message ?? "No se pudo restaurar la sesión.";
        const needsSignin = err?.needsSignin ?? true;
        dispatch({ type: "signin/restore-failed", message, needsSignin });
        log({ level: "error", source: "app", text: message });

        // A DEAD TOKEN is not something offline mode can paper over — the
        // player genuinely has to sign in again, and dropping them into a
        // half-working launcher instead would just delay that. But a network
        // failure is exactly what offline mode is for, and this is the moment
        // to use it: the player asked to launch a game, not to be told about
        // our connectivity.
        if (needsSignin) return;
        dispatch({
          type: "boot/step",
          step: "Sin conexión — usando tu cuenta guardada…",
        });
        await goOffline();
      })
      .finally(openGate);
  }, [log, goOffline, goBoffOffline]);

  // The MANAGED half of the library needs a Boffmedia account (the server
  // filters by that account's entitlements); the local half never did. So the
  // load runs either way now that the launcher opens without an account —
  // `authenticated` decides whether the registry is asked at all, rather than
  // the whole library being skipped. `boffAccountId` (declared above for the
  // roster reload) is the id, not the account object, so a re-render cannot
  // refetch.
  const bootAuthDone = state.bootAuthDone;
  React.useEffect(() => {
    // Waiting for the silent restore first: kicking off a signed-out load and
    // then a signed-in one the moment it resolves would fetch twice and, worse,
    // flash an empty library at a player who IS signed in.
    if (!bootAuthDone) return;
    let cancelled = false;

    dispatch({ type: "boot/step", step: "Cargando tu biblioteca…" });
    dispatch({ type: "packs/loading" });
    loadPackEntries({ authenticated: !!boffAccountId })
      .then(({ entries, registryError, registryErrorCode }) => {
        // A late response from the PREVIOUS account must not repopulate the
        // list after a sign-out — that is exactly the leak `signout` clears.
        if (cancelled) return;
        dispatch({ type: "packs/load", packs: entries, registryError });
        // This request just proved what the probe would go and ask, so the
        // banner is accurate immediately instead of up to a poll behind. A
        // SUCCESSFUL registry call proves the opposite just as well.
        const serverFault = BACKEND_FAULT[registryErrorCode ?? ""];
        if (serverFault) {
          dispatch({
            type: "backend/status",
            status: serverFault,
            detail: registryError,
          });
        } else if (!registryError && boffAccountId) {
          // Only when a request actually went out. A signed-out load asks the
          // registry nothing, so its clean result proves nothing about the
          // server and must not overwrite what the probe found.
          dispatch({ type: "backend/status", status: "ok" });
        }
        if (registryError) {
          // Not an error state: the local packs below it are real and usable.
          // Only the managed half is missing, and the banner says so.
          log({ level: "warn", source: "app", text: registryError });
        }
      })
      .catch((err: { message?: string; code?: string }) => {
        if (cancelled) return;
        const serverFault = BACKEND_FAULT[err?.code ?? ""];
        if (serverFault) {
          dispatch({
            type: "backend/status",
            status: serverFault,
            detail: err?.message ?? null,
          });
        }
        dispatch({
          type: "packs/error",
          message: err?.message ?? "No se pudo cargar tu biblioteca de packs.",
        });
        log({
          level: "error",
          source: "app",
          text: err?.message ?? "No se pudo cargar tu biblioteca de packs.",
        });
      })
      // The gate opens on BOTH outcomes and only ever the first time: a later
      // manual reload must not put the splash back over a running launcher.
      .finally(() => {
        if (!cancelled) dispatch({ type: "boot/done", part: "packs" });
      });

    return () => {
      cancelled = true;
    };
  }, [bootAuthDone, boffAccountId, log, reloadToken]);

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
        log({ level: "info", source: "app", text: "Instalación completada" }),
      ),
      onGameLog((line) => dispatch({ type: "log", line })),
      onGameState((game) => {
        // A killed process exits non-zero, so the Rust watcher reports the
        // player's own "stop" as a crash. Only the renderer knows it was
        // deliberate.
        if (game.kind === "crashed" && stopping.current) {
          stopping.current = false;
          dispatch({ type: "game/state", game: { kind: "idle" } });
          return;
        }
        if (game.kind !== "running") stopping.current = false;
        dispatch({ type: "game/state", game });
        if (game.kind === "crashed") {
          log({
            level: "error",
            source: "app",
            text: `El juego se cerró con el código ${game.exitCode}.`,
          });
        }
      }),
    ];
    return () => {
      for (const off of offs) off();
    };
  }, [log]);

  // The manifest is fetched here rather than in Rust because the password
  // path is a UI decision; install_pack re-validates whatever it gets.
  //
  // A local pack IS its manifest, so there is no registry call for
  // it — `packManifest` only ever knows a managed pack's server-issued id.
  // Branching on `origin` is what lets install()/play() work unchanged for
  // both: the manifest itself is the only thing that differs.
  const manifestFor = React.useCallback(async (packId: string) => {
    const entry = packsRef.current.find((p) => p.pack.id === packId);
    const isLocal = entry?.origin === "local";

    if (!isDesktop()) {
      if (!isLocal) return null;
      // dev:renderer has no Rust side to ask, so the same mock library
      // `local_packs_list`'s browser stand-in serves is looked up by id.
      return mockLocalPacks().find((m) => m.pack.id === packId) ?? null;
    }

    if (isLocal && entry) return localPackGet(entry.pack.slug);
    return packManifest(packId);
  }, []);

  const install = React.useCallback(
    async (packId: string) => {
      // Every install downloads files, so offline it can only fail — and it
      // would fail deep in Rust with a network message that reads like a bug.
      // Refusing here says the true thing instead.
      if (offlineRef.current) {
        log({
          level: "warn",
          source: "app",
          text: "Instalar necesita conexión. Vuelve a iniciar sesión cuando tengas red.",
        });
        return;
      }
      // The Rust side refuses a concurrent install of the same pack too; this
      // just avoids the round trip and the "ya se está instalando" toast that a
      // StrictMode double-invoke would otherwise produce.
      if (busy.current.has(packId)) return;
      busy.current.add(packId);
      dispatch({ type: "install/start", packId });
      try {
        const manifest = await manifestFor(packId);
        try {
          const state = await installPack(packId, manifest);
          dispatch({ type: "install/state", packId, state });
        } catch (err) {
          // A Minecraft pack needs a live Minecraft (MSA) session to install.
          // When the backend says so, PROMPT the sign-in here and retry once,
          // rather than marking the pack broken over a missing sub-credential.
          // Emulator packs never reach this — they install Minecraft-free.
          if ((err as { needsSignin?: boolean })?.needsSignin) {
            const ok = await signIn();
            if (!ok) throw err;
            const retried = await installPack(packId, manifest);
            dispatch({ type: "install/state", packId, state: retried });
          } else {
            throw err;
          }
        }
      } catch (err) {
        const errObj = err as { message?: string; code?: string };
        let message = errObj.message ?? "No se pudo instalar el pack.";
        // Map specific error codes to localized messages (randomizer errors)
        if (errObj.code === "randomizer_not_patched") {
          message =
            "Este pack está vinculado a un evento de randomizador que requiere que parches el ROM antes de jugar.";
        } else if (errObj.code === "randomizer_rom_mismatch") {
          message =
            "El ROM no coincide con el esperado. Asegúrate de que has descargado la versión correcta randomizada.";
        }
        // Broken, not not-installed: files may already be on disk, and hiding
        // that would offer a fresh install over a half-written instance.
        dispatch({
          type: "install/state",
          packId,
          state: { kind: "broken", reason: message },
        });
        log({ level: "error", source: "app", text: message });
      } finally {
        busy.current.delete(packId);
      }
    },
    [log, manifestFor, signIn],
  );

  /** Wipe the managed files and install again. One action rather than two
   *  buttons: a player looking at "Dañado" wants a working pack, not a choice
   *  between two verbs whose difference only makes sense to us. */
  const repair = React.useCallback(
    async (packId: string) => {
      const entry = packsRef.current.find((p) => p.pack.id === packId);
      if (!entry || busy.current.has(packId)) return;
      // Repair re-downloads whatever is missing, so it is an install by another
      // name and is unavailable for the same reason.
      if (offlineRef.current) {
        log({
          level: "warn",
          source: "app",
          text: "Reparar necesita conexión para volver a descargar los archivos.",
        });
        return;
      }
      log({
        level: "info",
        source: "app",
        text: `Reparando ${entry.pack.name}…`,
      });
      try {
        const state = await repairInstance(entry.pack.slug);
        dispatch({ type: "install/state", packId, state });
      } catch (err) {
        const message =
          (err as { message?: string })?.message ??
          "No se pudo reparar el pack.";
        log({ level: "error", source: "app", text: message });
        return;
      }
      await install(packId);
    },
    [install, log],
  );

  const play = React.useCallback(
    async (packId: string) => {
      if (busy.current.has(packId)) return;
      busy.current.add(packId);
      dispatch({ type: "game/state", game: { kind: "preparing" } });
      log({ level: "info", source: "app", text: "Preparando lanzamiento…" });
      try {
        // A launch re-verifies, so it emits install progress as well; the pack
        // card shows that until `game://state` flips to running.
        // The pid is already on its way as a `game://state` running event, and
        // that event is authoritative — a crash can beat this resolve, and
        // dispatching "running" here would paper over it.
        //
        // Emu-M3 — `manifestFor` hits the network, so offline it throws and an
        // already-installed emulator pack could not launch. Fall back to the
        // manifest cached on the last successful fetch: it drives the same
        // Java-free launch, and any randomizer clean-ROM gate is still rebuilt
        // in Rust from the on-disk marker, so the fallback cannot weaken it.
        // Scoped to emulator packs — Minecraft keeps its own offline path.
        let manifest: unknown;
        try {
          manifest = await manifestFor(packId);
        } catch (err) {
          const entry = packsRef.current.find((p) => p.pack.id === packId);
          const cached =
            offlineRef.current && entry?.pack.gameType === "emulator"
              ? await packManifestCached(entry.pack.slug)
              : null;
          if (!cached) throw err;
          log({
            level: "warn",
            source: "app",
            text: "Sin conexión: usando el manifiesto guardado de este pack.",
          });
          manifest = cached;
        }
        // Warned, never blocked. A pack whose dependency graph looks broken
        // still launches: the scan is a heuristic over jar metadata, and a false
        // positive — an unreadable jar, an id spelled oddly — must not be able to
        // make a pack unplayable. Telling the player before the crash log is the
        // whole value; deciding for them is not.
        //
        // Minecraft only: an emulator pack has no `mods/` and the scan would be
        // a round trip to learn nothing.
        {
          const entry = packsRef.current.find((p) => p.pack.id === packId);
          if (entry && entry.pack.gameType !== "emulator") {
            const graph = await instanceModGraph(entry.pack.slug);
            if (graph.broken.length > 0) {
              const names = [
                ...new Set(
                  graph.broken.map((b) => b.from.split("/").pop() ?? b.from),
                ),
              ];
              toast({
                tone: "warn",
                title: translate("content", "launchBrokenTitle", {
                  count: names.length,
                }),
                msg: names.join(", "),
              });
              log({
                level: "warn",
                source: "app",
                text: `Dependencias sin resolver antes de lanzar: ${names.join(", ")}`,
              });
            }
          }
        }

        try {
          await launchPack(packId, manifest);
        } catch (err) {
          // Launching a Minecraft pack needs a live Minecraft session. When it
          // is missing/expired the backend asks for it; PROMPT here and retry
          // once. Emulator packs launch Minecraft-free and never reach this.
          if ((err as { needsSignin?: boolean })?.needsSignin) {
            const ok = await signIn();
            if (!ok) throw err;
            await launchPack(packId, manifest);
          } else {
            throw err;
          }
        }
        runningPackId.current = packId;
        dispatch({ type: "pack/played", packId, at: new Date().toISOString() });
        void refreshInstallState(packId);
      } catch (err) {
        const errObj = err as { message?: string; code?: string };
        let message = errObj.message ?? "No se pudo iniciar el juego.";
        // Map specific error codes to localized messages (randomizer errors)
        if (errObj.code === "randomizer_not_patched") {
          message =
            "Este pack está vinculado a un evento de randomizador que requiere que parches el ROM antes de jugar.";
        } else if (errObj.code === "randomizer_rom_mismatch") {
          message =
            "El ROM no coincide con el esperado. Asegúrate de que has descargado la versión correcta randomizada.";
        }
        dispatch({ type: "game/state", game: { kind: "idle" } });
        log({ level: "error", source: "app", text: message });
      } finally {
        busy.current.delete(packId);
      }
    },
    [log, manifestFor, refreshInstallState, signIn],
  );

  // Preferences live in a JSON file on the Rust side; the mock defaults only
  // ever stand in for the first paint and for browser mode.
  React.useEffect(() => {
    if (settingsLoaded.current) return;
    settingsLoaded.current = true;
    void settingsGet()
      .then((settings) => {
        dispatch({ type: "settings", settings });
        // Before the reveal, so the first frame the player sees is already at
        // their scale rather than snapping a moment later.
        void applyUiScale(settings.uiScale ?? 1);
      })
      .catch(() => {
        /* defaults are a working launcher; a read failure is not fatal */
      })
      // Gated on for the same reason as auth: the shell reads settings on its
      // first render, and paying with a flash of mock defaults is avoidable
      // when the read is a local file that beats the auth chain every time.
      .finally(() => dispatch({ type: "boot/done", part: "settings" }));
  }, []);

  // Debounced because the memory slider fires per pixel and each save is a file
  // write. The in-memory state updates immediately either way.
  const patchSettings = React.useCallback(
    (patch: Partial<Settings>) => {
      const next = { ...settingsRef.current, ...patch };
      settingsRef.current = next;
      dispatch({ type: "settings", settings: next });
      // Applied immediately, not on the debounced save: the picker has to show
      // its effect as it is used, and zoom is free to set.
      if (patch.uiScale !== undefined) void applyUiScale(patch.uiScale);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void settingsSet(next).catch((err: { message?: string }) => {
          log({
            level: "error",
            source: "app",
            text: err?.message ?? "No se pudieron guardar los ajustes.",
          });
        });
      }, 300);
    },
    [log],
  );

  React.useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  const stop = React.useCallback(() => {
    const packId = runningPackId.current;
    stopping.current = true;
    log({
      level: "warn",
      source: "app",
      text: "Juego detenido por el usuario",
    });
    if (!packId) {
      dispatch({ type: "game/state", game: { kind: "idle" } });
      return;
    }
    void stopGame(packId)
      .catch(() => {
        /* idempotent by contract; the state event still lands */
      })
      .finally(() => {
        runningPackId.current = null;
      });
  }, [log]);

  // ── Account switching ───────────────────────────────────────────────────
  //
  // The roster lives outside the reducer: it is not derived from the launcher's
  // state, it is what the Rust side has on disk, and it changes on exactly
  // three events (sign-in, switch, remove) which all reload it explicitly.
  const [accounts, setAccounts] = React.useState<AccountEntry[]>([]);
  const [switchingAccount, setSwitchingAccount] = React.useState(false);
  const [revalidating, setRevalidating] = React.useState(false);

  const reloadAccounts = React.useCallback(() => {
    void authAccounts().then(setAccounts);
  }, []);

  // Re-read whenever the signed-in account changes: that covers the restore on
  // launch and every sign-in, without either of them having to remember to.
  const activeUuid = state.account?.uuid ?? null;
  React.useEffect(() => {
    reloadAccounts();
  }, [activeUuid, reloadAccounts]);

  const switchAccount = React.useCallback(
    async (uuid: string) => {
      if (uuid === activeUuid || switchingAccount) return;
      setSwitchingAccount(true);
      try {
        const account = await authSwitch(uuid);
        dispatch({
          type: "account/switched",
          account,
        });
        log({
          level: "info",
          source: "app",
          text: `Cuenta activa: ${account.username}`,
        });
      } catch (err) {
        const message =
          (err as { message?: string })?.message ??
          "No se pudo cambiar de cuenta.";
        log({ level: "error", source: "app", text: message });
        // The Rust side prunes an account whose token is gone, so re-reading is
        // what removes the dead row the player just clicked.
        reloadAccounts();
      } finally {
        setSwitchingAccount(false);
      }
    },
    [activeUuid, log, reloadAccounts, switchingAccount],
  );

  const removeAccount = React.useCallback(
    async (uuid: string) => {
      setSwitchingAccount(true);
      try {
        const next = await authRemove(uuid);
        if (next) {
          dispatch({
            type: "account/switched",
            account: next,
          });
        } else {
          // That was the last one; back to the sign-in screen.
          dispatch({ type: "signout" });
        }
      } catch (err) {
        const message =
          (err as { message?: string })?.message ??
          "No se pudo quitar la cuenta.";
        log({ level: "error", source: "app", text: message });
      } finally {
        setSwitchingAccount(false);
        reloadAccounts();
      }
    },
    [log, reloadAccounts],
  );

  // Re-check the BOFFMEDIA session against `/me` — the launcher JWT is what the
  // pack list authenticates with, and it going stale mid-session is what the
  // "packs won't load / 401" state is. A live answer refreshes the account; a
  // dead one (Rust prunes it and resolves null) lands on BoffSignIn rather than
  // looping. The Minecraft session is a separate, launch-time concern.
  const revalidate = React.useCallback(async () => {
    if (!state.boffAccount || revalidating) return;
    setRevalidating(true);
    try {
      const account = await boffRevalidate();
      if (account) {
        dispatch({ type: "boff/done", account });
        log({ level: "info", source: "app", text: "Sesión revalidada." });
      } else {
        dispatch({ type: "boff/signout" });
        log({
          level: "warn",
          source: "app",
          text: "Tu sesión ya no es válida. Vuelve a autorizar el launcher.",
        });
      }
    } catch (err) {
      const message =
        (err as { message?: string })?.message ??
        "No se pudo revalidar la sesión.";
      log({ level: "error", source: "app", text: message });
    } finally {
      setRevalidating(false);
    }
  }, [state.boffAccount, revalidating, log]);

  // The i18n store is a module-level signal, not React state, so the language
  // is applied by pushing settings.locale into it whenever it changes — the boot
  // load and the Settings selector both flow through here.
  React.useEffect(() => {
    setLocale(state.settings.locale);
  }, [state.settings.locale]);

  const booting = !(
    state.bootAuthDone &&
    state.bootSettingsDone &&
    state.bootPacksDone
  );
  const hasSession = !!state.boffAccount || state.offline;

  // The signed-out landing redirect to Tools is GONE. It existed for one
  // reason: Play was a sign-in wall, and dropping a player on a wall is worse
  // than dropping them somewhere public. Play is now a working library for a
  // signed-out player (their local packs, plus an invitation to sign in for the
  // server ones), so everyone lands in the same place and the launcher stops
  // having two different front doors depending on who you are.

  const value: Ctx = {
    ...state,
    booting,
    section: sectionOfView(state.view),
    hasSession,
    checkBackend,
    retryBackend,
    dismissBackendNotice: () => dispatch({ type: "backend/dismiss" }),
    goOffline,
    goBoffOffline,
    sessionBusy,
    selected:
      state.packs.find((p) => p.pack.id === state.selectedPackId) ?? null,
    boffSignIn,
    cancelBoffSignIn,
    boffSignOut: boffSignOutFn,
    boffAccountList,
    switchBoffAccount,
    switchingBoffAccount,
    signIn,
    cancelSignIn: () => dispatch({ type: "signin/cancel" }),
    signOut: () => {
      // "Leave this machine clean": auth_logout forgets every Minecraft account
      // AND the launcher session (api.forget_session), so the renderer drops the
      // Boffmedia principal too and lands back on BoffSignIn.
      void authLogout();
      dispatch({ type: "boff/signout" });
    },
    accounts,
    switchingAccount,
    switchAccount,
    removeAccount,
    revalidate,
    revalidating,
    go: (view, packId, opts) =>
      dispatch({
        type: "view",
        view,
        packId,
        edit: opts?.edit,
        toolId: opts?.toolId,
      }),
    editIntent: state.editIntent,
    clearEditIntent: () => dispatch({ type: "editIntent/clear" }),
    reloadPacks: () => setReloadToken((n) => n + 1),
    selectSystem: (system) => dispatch({ type: "system/select", system }),
    install,
    repair,
    refreshInstallState,
    play,
    stop,
    clearLogs: () => dispatch({ type: "logs/clear" }),
    patchSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
