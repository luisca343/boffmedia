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
import type {
  BoffAccount,
  BoffDeviceCode,
  ScannedInstallState,
} from "../runtime";
import {
  updateQueueReducer,
  initialUpdateQueueState,
  type UpdateQueueState,
  type UpdateQueueAction,
} from "./updateQueue";

// ── Types ───────────────────────────────────────────────────────────────

/** `unreachable` — nothing answered, and we cannot tell whose network is at
 *  fault. `down` — the server answered 5xx, which is unambiguously theirs. */
export type BackendStatus =
  | "unknown"
  | "checking"
  | "ok"
  | "unreachable"
  | "down";

export type AppState = {
  /** The BOFFMEDIA account the launcher is signed in as. This is the principal:
   *  the pack list, entitlement and downloads all key on it, and the shell is
   *  gated on it. */
  boffAccount: BoffAccount | null;
  boffDeviceCode: BoffDeviceCode | null;
  boffSigningIn: boolean;
  boffError: string | null;
  /** Elapsed seconds since device code was issued; null when not signing in. */
  boffElapsedSeconds: number | null;
  /** Whether the device code has expired. */
  boffCodeExpired: boolean;
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
  view: "packs" | "pack" | "logs" | "settings" | "tools" | "tool";
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
  /** Diagnostic error code for the current backend status (e.g., "dns_failed",
   *  "connection_refused", "server_5xx_error"). Used by the UI to display
   *  localized diagnostic messages. Null when status is unknown or ok. */
  backendErrorCode: string | null;
  /** The player closed the outage banner. Sticky for the WHOLE outage, not just
   *  the render — a banner that reopens on the next navigation or the next
   *  30-second poll is not dismissible, it is nagging. Re-armed only when the
   *  backend comes back, so the NEXT outage is announced once more. */
  backendNoticeDismissed: boolean;
  /** Batch update queue for multiple packs. */
  updateQueue: UpdateQueueState;
};

export type AppAction =
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
  | { type: "boff/expired" }
  | { type: "boff/elapsed"; seconds: number }
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
      view: "packs" | "pack" | "logs" | "settings" | "tools" | "tool";
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
  | {
      type: "backend/status";
      status: BackendStatus;
      detail?: string | null;
      code?: string | null;
    }
  | { type: "backend/dismiss" }
  | UpdateQueueAction;

// ── Reducer ──────────────────────────────────────────────────────────────

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "boff/start":
      return {
        ...state,
        boffSigningIn: true,
        boffDeviceCode: null,
        boffError: null,
        boffRestoreError: null,
      };
    case "boff/code":
      return { ...state, boffDeviceCode: action.code };
    case "boff/done":
      return {
        ...state,
        boffAccount: action.account,
        boffSigningIn: false,
        boffDeviceCode: null,
        boffError: null,
        boffRestoreError: null,
        boffElapsedSeconds: null,
        boffCodeExpired: false,
      };
    case "boff/switched":
      // A different Boffmedia account: its entitlements differ, so the library
      // is dropped and reloaded (the packs effect keys on boffAccount.id) —
      // never show one account another's pack names. The Minecraft session, the
      // logs and any running-game state belonged to the departing account too
      // (Rust clears the MSA session on switch), so they are dropped with it.
      return {
        ...state,
        boffAccount: action.account,
        account: null,
        boffSigningIn: false,
        boffDeviceCode: null,
        boffError: null,
        boffRestoreError: null,
        boffElapsedSeconds: null,
        boffCodeExpired: false,
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
        view: state.view === "pack" ? "packs" : state.view,
        selectedPackId: null,
      };
    case "boff/offline":
      // Offline Boffmedia principal: the stored token proved a prior sign-in,
      // but nothing server-side is reachable. The shell opens on installed packs
      // only; `offline` is what keeps install/update buttons hidden.
      return {
        ...state,
        boffAccount: action.account,
        offline: true,
        boffSigningIn: false,
        boffDeviceCode: null,
        boffError: null,
        boffRestoreError: null,
      };
    case "boff/restore-failed":
      return {
        ...state,
        boffRestoreError: {
          message: action.message,
          needsSignin: action.needsSignin,
          code: action.code,
        },
      };
    case "boff/cancel":
      return {
        ...state,
        boffSigningIn: false,
        boffDeviceCode: null,
        boffError: action.message ?? null,
        boffElapsedSeconds: null,
        boffCodeExpired: false,
      };
    case "boff/expired":
      return {
        ...state,
        boffCodeExpired: true,
        boffSigningIn: false,
      };
    case "boff/elapsed":
      return {
        ...state,
        boffElapsedSeconds: action.seconds,
      };
    case "boff/signout":
      // Signing out of Boffmedia empties the library too: every managed pack in
      // it was listed for THAT account's entitlements. The Minecraft session,
      // logs and game state went with it (Rust clears the MSA session on
      // sign-out), and offline mode ends — the next account proves itself fresh.
      return {
        ...state,
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
        view: state.view === "pack" ? "packs" : state.view,
        selectedPackId: null,
      };
    case "boot/step":
      return { ...state, bootStep: action.step };
    case "boot/done":
      if (action.part === "auth") return { ...state, bootAuthDone: true };
      if (action.part === "packs") return { ...state, bootPacksDone: true };
      return { ...state, bootSettingsDone: true };
    case "signin/restore-failed":
      return {
        ...state,
        restoreError: { message: action.message, needsSignin: action.needsSignin },
      };
    case "signin/start":
      // Clearing the banner here is what stops "tu sesión caducó" from sitting
      // above the device code the player is already typing in.
      return { ...state, signingIn: true, deviceCode: null, restoreError: null };
    case "signin/code":
      return { ...state, deviceCode: action.code };
    case "signin/done":
      // A real sign-in always clears offline: we demonstrably have a network.
      return {
        ...state,
        account: action.account,
        signingIn: false,
        deviceCode: null,
        restoreError: null,
        offline: false,
      };
    case "signin/offline":
      return {
        ...state,
        account: action.account,
        offline: true,
        signingIn: false,
        deviceCode: null,
      };
    case "signin/cancel":
      return { ...state, signingIn: false, deviceCode: null };
    // A switch is a signout and a signin at once. It gets its own case rather
    // than dispatching both because the pair would blank the shell for a frame
    // and bounce the player back to the packs list; the ONE thing that must
    // still happen is dropping the packs, for the same reason as below.
    // NEITHER of these touches the pack library, and that is a correction.
    //
    // Both used to clear `packs`, on the reasoning that "entitlements are
    // per-UUID and showing the previous user's list would leak pack names".
    // That was true when the MINECRAFT account was the launcher's principal. It
    // is not any more: the library is filtered by the BOFFMEDIA account (see
    // `packs_list`, which keys both the request and its offline cache on
    // `active_boff_id`), and these two actions leave that account alone by
    // design. So there is nothing to leak — and the load effect keys on
    // `boffAccountId`, so a cleared list had nothing to refill it. The library
    // simply went empty until the player found the retry button.
    //
    // It never bit before because switching Minecraft accounts was unreachable:
    // the roster existed in Rust with no UI in front of it. The rail's chip
    // makes it a one-click action, which is exactly what would have surfaced it.
    case "account/switched":
      return {
        ...state,
        account: action.account,
        // A switch runs the full refresh chain, so reaching this action at all
        // proves the network is back.
        offline: false,
      };
    case "signout":
      // The BOFFMEDIA principal is untouched here — only the Minecraft
      // sub-credential went — so the player's place in the app stays valid,
      // including an open pack. It is still installed and still theirs; the
      // launch button will simply ask for a link again.
      return { ...state, account: null };
    case "packs/loading":
      return { ...state, packsLoading: true, packsError: null };
    case "packs/load":
      return {
        ...state,
        packs: action.packs,
        packsLoading: false,
        packsError: null,
        packsPartial: action.registryError,
      };
    case "packs/error":
      // Keep whatever list is already on screen: a failed REFRESH should not
      // empty a library the player was just looking at.
      return { ...state, packsLoading: false, packsError: action.message };
    case "view":
      return {
        ...state,
        view: action.view,
        selectedPackId: action.packId ?? state.selectedPackId,
        selectedToolId: action.toolId ?? state.selectedToolId,
        editIntent: action.edit ?? false,
      };
    case "editIntent/clear":
      return { ...state, editIntent: false };
    case "install/start":
      return {
        ...state,
        packs: state.packs.map((p) =>
          p.pack.id !== action.packId
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
        ...state,
        packs: state.packs.map((p) =>
          p.pack.id !== action.packId
            ? p
            : {
                ...p,
                state: {
                  kind: "installing",
                  progress: {
                    phase: action.phase,
                    fraction: action.fraction,
                    currentFile: action.file,
                    downloadedBytes: action.downloadedBytes,
                    totalBytes: action.totalBytes,
                  },
                },
              },
        ),
      };
    case "install/state":
      return {
        ...state,
        packs: state.packs.map((p) =>
          p.pack.id !== action.packId ? p : { ...p, state: action.state },
        ),
      };
    case "pack/played":
      // Mirrors what Rust just wrote to plays.json, so the card stops saying
      // "Nunca jugado" without a full re-listing.
      return {
        ...state,
        packs: state.packs.map((p) =>
          p.pack.id !== action.packId ? p : { ...p, lastPlayed: action.at },
        ),
      };
    case "game/state":
      return { ...state, game: action.game };
    case "log":
      // Bounded: the game is a firehose and an unbounded array is a slow leak.
      return { ...state, logs: [...state.logs, action.line].slice(-2000) };
    case "logs/clear":
      return { ...state, logs: [] };
    case "settings":
      return { ...state, settings: action.settings };
    case "system/select":
      // Persist selection to localStorage
      try {
        localStorage.setItem("app:selectedSystem", action.system);
      } catch {
        /* storage error is non-fatal */
      }
      return { ...state, selectedSystem: action.system };
    case "backend/status":
      return {
        ...state,
        backendStatus: action.status,
        backendDetail: action.detail ?? null,
        backendErrorCode: action.code ?? null,
        // Recovery re-arms the banner; a `checking` tick in the middle of an
        // outage must NOT, or every poll would resurrect what was dismissed.
        backendNoticeDismissed:
          action.status === "ok" ? false : state.backendNoticeDismissed,
      };
    case "backend/dismiss":
      return { ...state, backendNoticeDismissed: true };
    // Queue actions are delegated to the queue reducer
    case "queue/enqueue":
    case "queue/start":
    case "queue/done":
    case "queue/error":
    case "queue/stop":
    case "queue/clear":
      return {
        ...state,
        updateQueue: updateQueueReducer(
          state.updateQueue,
          action as UpdateQueueAction
        ),
      };
    default:
      return state;
  }
}

// ── Initial State ────────────────────────────────────────────────────────

// This needs to be imported from services to get MOCK_SETTINGS, so we can't
// fully initialize it here. Instead, this is the structure; the actual initial
// value is created in app.tsx and passed to the reducer.
export function createAppInitialState(settings: Settings): AppState {
  return {
    boffAccount: null,
    boffDeviceCode: null,
    boffSigningIn: false,
    boffError: null,
    boffElapsedSeconds: null,
    boffCodeExpired: false,
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
    settings,
    selectedSystem: "All",
    backendStatus: "unknown",
    backendDetail: null,
    backendErrorCode: null,
    backendNoticeDismissed: false,
    updateQueue: initialUpdateQueueState,
  };
}
