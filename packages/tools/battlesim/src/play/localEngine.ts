/**
 * The local battle engine — a Web Worker, a set of `BattleSession`s, and NO
 * React.
 *
 * WHY IT LIVES OUTSIDE THE COMPONENT TREE. It used to be refs inside
 * `useLocalBattleEngine`, with an unmount effect that destroyed every session
 * and terminated the worker. That made a battle exactly as durable as the React
 * tree that happened to be rendering it — and a tree is torn down by more
 * things than "the user left": a hot reload, an error boundary catching
 * something unrelated, a `router.refresh()` whose payload fails to arrive, a
 * Suspense boundary that re-suspends. Every one of those silently ended a game
 * in progress, and none of them is an event the player caused or could see.
 * A battle is not view state, so it no longer lives in the view.
 *
 * WHAT STILL ENDS A BATTLE, unchanged: the player closing its tab
 * (`closeBattle`), and leaving the tool — the second one through
 * {@link LocalBattleEngineStore.retain} / {@link LocalBattleEngineStore.release}
 * rather than an unmount effect, so a remount is not mistaken for a departure.
 *
 * `BattleSession` needed no changes: `initScene` already rebinds an existing
 * processor to a new `Scene` ("REBOUND, not rebuilt"), which is precisely the
 * canvas-remount case, so a session picks the battle back up when React returns
 * with a new element.
 */

import { BattleSession } from "../engine/BattleSession";
import { keepReplay } from "../sync";
import { applyWorkerEvent } from "./workerInbox";
import type { BattleWorkerEvent, BattleWorkerRequest } from "./worker-protocol";

/**
 * What `BattleSession` needs of a transport: nothing but `emit`.
 *
 * `rqid` rides along because the session puts it there — the worker refuses a
 * choice that does not answer the request it last delivered, which is what
 * stops a double-click spending two turns.
 */
interface SessionTransport {
  emit(event: string, payload: { roomId: string; choice?: string; rqid?: number | null }): void;
}

/**
 * How long the engine outlives its last React holder.
 *
 * It exists to tell a REMOUNT (holders drop to zero and come back a tick or a
 * few frames later) from a DEPARTURE (they drop to zero and stay there). Long
 * enough that no plausible remount misses it — a slow route transition, a
 * recompile in dev — and short enough that the worker cannot outlive the tool
 * by anything a person would notice. Nothing simulates during the wait: the
 * worker is idle between turns.
 */
const IDLE_GRACE_MS = 30_000;

const newRoomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `room-${Date.now()}-${Math.random().toString(36).slice(2)}`;

class LocalBattleEngineStore {
  private worker: Worker | null = null;
  /** roomId -> the live simulation. Handed out by reference; never replaced. */
  readonly sessions = new Map<string, BattleSession>();
  /** roomId -> format, for the ReplayRecord written when the battle ends. */
  private readonly formats = new Map<string, string>();
  private readonly listeners = new Set<() => void>();
  private holders = 0;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Stands in for the socket `BattleSession` was written against. One object
   * for the life of the module: the session keeps whatever it is handed, so a
   * fresh one per render would leave it emitting through a stale closure.
   */
  private readonly transport: SessionTransport = {
    emit: (event, payload) => {
      if (event === "makeChoice" && payload.choice !== undefined) {
        this.send({ type: "choice", roomId: payload.roomId, choice: payload.choice, rqid: payload.rqid ?? null });
      } else if (event === "forfeit") {
        this.send({ type: "forfeit", roomId: payload.roomId });
      } else if (event === "undoChoice") {
        this.send({ type: "undo", roomId: payload.roomId });
      }
    },
  };

  /* ── The hold React has on the engine ─────────────────────────────────── */

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  /** A mounted tool holds the engine. Cancels a pending shutdown. */
  retain(): void {
    this.holders += 1;
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /** The tool unmounted. Shut down only if nothing takes the engine back. */
  release(): void {
    this.holders = Math.max(0, this.holders - 1);
    if (this.holders > 0 || this.idleTimer) return;
    this.idleTimer = setTimeout(() => {
      this.idleTimer = null;
      if (this.holders === 0) this.shutdown();
    }, IDLE_GRACE_MS);
  }

  /* ── The worker ───────────────────────────────────────────────────────── */

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;

    // A static `new URL(..., import.meta.url)` literal: both Vite (launcher)
    // and Next/Turbopack (web) resolve and bundle the worker from this exact
    // shape, and neither can follow a computed path.
    const worker = new Worker(new URL("./battle.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event: MessageEvent<BattleWorkerEvent>) => {
      const message = event.data;
      const session = this.sessions.get(message.roomId);
      if (!session) return;

      // The routing lives in `workerInbox` so it can be tested without a Web
      // Worker, a bundler that can resolve one, or a React renderer.
      applyWorkerEvent(session, message, {
        onEnd: (end) => {
          // D7: stored locally first, always — a battle with no account and no
          // network still leaves a replay. `keepReplay` queues the upload
          // through the outbox only when a session exists.
          void keepReplay({
            id: end.roomId,
            format: this.formats.get(end.roomId) ?? "",
            p1: "Player",
            p2: "Bot",
            winner: end.winner,
            log: end.log,
            teams: end.teams as never,
            playedAt: Date.now(),
            source: "local",
          }).catch((e) => {
            // Storage is a convenience here, not the battle itself.
            console.warn("[battlesim] could not store the local replay", e);
          });
        },
        onChange: () => this.emit(),
      });
    };

    this.worker = worker;
    return worker;
  }

  private send(message: BattleWorkerRequest): void {
    this.ensureWorker().postMessage(message);
  }

  /* ── Battles ──────────────────────────────────────────────────────────── */

  createBattle(format = "gen9randombattle", teams?: { p1Team?: string; p2Team?: string }): string {
    const roomId = newRoomId();
    const session = new BattleSession(roomId, {
      onUpdate: () => this.emit(),
      onRequest: () => this.emit(),
      onBattleEnd: () => this.emit(),
    });
    session.status = "connecting";
    // The player is ALWAYS p1 in a local battle — the worker only ever sends
    // the p1 view — so the side is stated outright rather than guessed from a
    // `pov` argument at canvas-mount time.
    session.setViewerSide("p1");
    session.callbacks.onGap = (lastSeq, seq) => {
      // Nothing to ask: the worker has no resync verb and the frames it posts
      // cannot be lost in transit. A gap here means a bug, so say so.
      console.warn(`[battlesim] worker gap in ${roomId}: had ${lastSeq}, got ${seq}`);
    };
    this.sessions.set(roomId, session);
    this.formats.set(roomId, format);
    this.send({ type: "start", roomId, format, ...teams });
    this.emit();
    return roomId;
  }

  /**
   * Destroy one battle.
   *
   * The worker goes with the LAST one, not with the screen: it holds the @pkmn
   * dex tables (expensive to rebuild) and it is multiplexed by `roomId`, so it
   * is exactly as long-lived as the set of open battles.
   */
  closeBattle(roomId: string): void {
    const session = this.sessions.get(roomId);
    if (!session) return;
    session.destroy();
    this.sessions.delete(roomId);
    this.formats.delete(roomId);
    if (this.sessions.size === 0) {
      this.worker?.terminate();
      this.worker = null;
    } else {
      this.send({ type: "stop", roomId });
    }
    this.emit();
  }

  getSession(roomId: string): BattleSession | undefined {
    return this.sessions.get(roomId);
  }

  /** The format a room was started with — the rematch and the tab label read it. */
  getFormat(roomId: string): string | undefined {
    return this.formats.get(roomId);
  }

  makeChoice(roomId: string, choice: string): void {
    this.sessions.get(roomId)?.makeChoice(choice, this.transport);
  }

  forfeit(roomId: string): void {
    this.sessions.get(roomId)?.forfeit(this.transport);
  }

  // pov 0 is the argument's default; `setViewerSide('p1')` at creation already
  // outranks it, so a remount cannot flip the field.
  initScene(roomId: string, element: HTMLElement): void {
    this.sessions.get(roomId)?.initScene(element, 0);
  }

  /** Everything goes: the user left the tool and did not come back. */
  private shutdown(): void {
    for (const session of this.sessions.values()) session.destroy();
    this.sessions.clear();
    this.formats.clear();
    this.worker?.terminate();
    this.worker = null;
    this.emit();
  }
}

/** The one engine. A battle belongs to the TAB, not to any tree inside it. */
export const localBattles = new LocalBattleEngineStore();
