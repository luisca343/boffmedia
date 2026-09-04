"use client";

/**
 * Local AI battles (D3), replacing `useLiveBattleManager`'s socket.
 *
 * MOUNTED BY `RoomsProvider`, ABOVE THE SCREEN SWITCH — never by a screen.
 * This hook owns a Web Worker and a `Map` of live simulations, and it used to
 * live inside `PlayView`. That made "leave the battle screen" and "destroy
 * every running battle" the same event: the unmount effect below terminated
 * the worker, so switching to the teambuilder with two battles open threw both
 * away. Rooms outlive screens now, so the engine has to as well.
 *
 * Which side effect goes where, exactly:
 *   - a battle ends when the USER closes its tab (`closeBattle`), and
 *   - the worker is terminated when the LAST battle closes, or when the
 *     provider itself unmounts (the user left the tool).
 *
 * It deliberately keeps the SAME surface it always had — `sessions`,
 * `createBattle`, `closeBattle`, `makeChoice`, `forfeit`, `initScene` — minus
 * the two pieces that were never the engine's business: which tab is active
 * and how you switch, which are now the address bar's (see `RoomsProvider`).
 *
 * `BattleSession` is reused unchanged. It sends choices through
 * `socket.emit(event, payload)` and never touches anything else on that object,
 * so a small adapter with an `emit` method is a complete stand-in for the
 * socket — no engine edits, and one code path for local, PvP and relayed
 * battles.
 */

import { useCallback, useEffect, useRef, useState } from "react";

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

const newRoomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `room-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useLocalBattleEngine() {
  const workerRef = useRef<Worker | null>(null);
  const sessionsRef = useRef<Map<string, BattleSession>>(new Map());
  /** roomId -> format, for the ReplayRecord written when the battle ends. */
  const formatsRef = useRef<Map<string, string>>(new Map());
  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  const ensureWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;

    // A static `new URL(..., import.meta.url)` literal: both Vite (launcher)
    // and Next/Turbopack (web) resolve and bundle the worker from this exact
    // shape, and neither can follow a computed path.
    const worker = new Worker(new URL("./battle.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event: MessageEvent<BattleWorkerEvent>) => {
      const message = event.data;
      const session = sessionsRef.current.get(message.roomId);
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
            format: formatsRef.current.get(end.roomId) ?? "",
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
        onChange: rerender,
      });
    };

    workerRef.current = worker;
    return worker;
  }, [rerender]);

  const send = useCallback(
    (message: BattleWorkerRequest) => {
      ensureWorker().postMessage(message);
    },
    [ensureWorker],
  );

  /**
   * Stands in for the socket `BattleSession` was written against.
   *
   * Built once and kept in a ref: the session holds whatever object it is
   * handed, so handing it a new one each render would leave it emitting through
   * a stale closure.
   */
  const transport = useRef<SessionTransport>({ emit: () => {} });
  transport.current.emit = (event, payload) => {
    if (event === "makeChoice" && payload.choice !== undefined) {
      send({ type: "choice", roomId: payload.roomId, choice: payload.choice, rqid: payload.rqid ?? null });
    } else if (event === "forfeit") {
      send({ type: "forfeit", roomId: payload.roomId });
    } else if (event === "undoChoice") {
      send({ type: "undo", roomId: payload.roomId });
    }
  };

  const createBattle = useCallback(
    (format = "gen9randombattle", teams?: { p1Team?: string; p2Team?: string }) => {
      const roomId = newRoomId();
      const session = new BattleSession(roomId, {
        onUpdate: rerender,
        onRequest: () => rerender(),
        onBattleEnd: () => rerender(),
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
      sessionsRef.current.set(roomId, session);
      formatsRef.current.set(roomId, format);
      send({ type: "start", roomId, format, ...teams });
      rerender();
      return roomId;
    },
    [rerender, send],
  );

  const getSession = useCallback((roomId: string) => sessionsRef.current.get(roomId), []);

  const makeChoice = useCallback(
    (roomId: string, choice: string) => {
      sessionsRef.current.get(roomId)?.makeChoice(choice, transport.current);
    },
    [],
  );

  const forfeit = useCallback((roomId: string) => {
    sessionsRef.current.get(roomId)?.forfeit(transport.current);
  }, []);

  /**
   * Destroy one battle.
   *
   * The worker goes with the LAST one, not with the screen: it holds the @pkmn
   * dex tables (expensive to rebuild) and it is multiplexed by `roomId`, so it
   * is exactly as long-lived as the set of open battles.
   */
  const closeBattle = useCallback(
    (roomId: string) => {
      const session = sessionsRef.current.get(roomId);
      if (!session) return;
      session.destroy();
      sessionsRef.current.delete(roomId);
      formatsRef.current.delete(roomId);
      if (sessionsRef.current.size === 0) {
        workerRef.current?.terminate();
        workerRef.current = null;
      } else {
        send({ type: "stop", roomId });
      }
      rerender();
    },
    [rerender, send],
  );

  // pov 0 is the argument's default; `setViewerSide('p1')` at creation already
  // outranks it, so a remount cannot flip the field.
  const initScene = useCallback((roomId: string, element: HTMLElement) => {
    sessionsRef.current.get(roomId)?.initScene(element, 0);
  }, []);

  // One worker for the TOOL, not one per battle: it is idle between turns and
  // holds the @pkmn dex tables, which are expensive to instantiate repeatedly.
  // This teardown is the provider unmounting — the user left the tool — which
  // is the only remaining event that may take every battle with it.
  useEffect(() => {
    const sessions = sessionsRef.current;
    return () => {
      for (const session of sessions.values()) session.destroy();
      sessions.clear();
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  /** The format a room was started with — the rematch and the tab label read it. */
  const getFormat = useCallback((roomId: string) => formatsRef.current.get(roomId), []);

  return {
    sessions: sessionsRef.current,
    getSession,
    getFormat,
    createBattle,
    closeBattle,
    /** Kept for surface-compatibility with the socket hook; nothing to connect. */
    connect: () => {},
    makeChoice,
    forfeit,
    initScene,
  };
}

export type LocalBattleEngine = ReturnType<typeof useLocalBattleEngine>;
