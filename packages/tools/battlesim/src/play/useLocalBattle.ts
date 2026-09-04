"use client";

/**
 * Local AI battles (D3), replacing `useLiveBattleManager`'s socket.
 *
 * MOUNTED BY `RoomsProvider`, ABOVE THE SCREEN SWITCH — never by a screen.
 * This hook exposes a `Map` of live simulations and the verbs that drive them;
 * it used to live inside `PlayView`, which made "leave the battle screen" and
 * "destroy every running battle" the same event. Rooms outlive screens now, so
 * the engine has to as well.
 *
 * IT NO LONGER OWNS ANY OF IT. The worker and the sessions live in
 * `localEngine.ts`, outside React entirely, and this is the binding: it holds
 * the engine while the tool is mounted and re-renders when a battle changes.
 * The reason is in that file — a React tree is unmounted by more things than a
 * user leaving, and every one of them used to end the game in progress.
 *
 * Which side effect goes where, exactly:
 *   - a battle ends when the USER closes its tab (`closeBattle`), and
 *   - the worker is terminated when the LAST battle closes, or when nothing has
 *     held the engine for a while (the user left the tool and stayed away).
 *
 * It deliberately keeps the SAME surface it always had — `sessions`,
 * `createBattle`, `closeBattle`, `makeChoice`, `forfeit`, `initScene`.
 */

import { useCallback, useEffect, useState } from "react";

import { localBattles } from "./localEngine";

export function useLocalBattleEngine() {
  const [, forceUpdate] = useState(0);

  /**
   * Hold the engine for as long as the tool is mounted.
   *
   * The release is deliberately not a teardown: it starts a grace period the
   * next mount cancels, which is what tells a remount apart from a departure
   * (see `IDLE_GRACE_MS`). StrictMode is the everyday case — mount, unmount,
   * mount — and the count makes it a no-op rather than a lost battle.
   */
  useEffect(() => {
    localBattles.retain();
    return () => localBattles.release();
  }, []);

  useEffect(() => localBattles.subscribe(() => forceUpdate((n) => n + 1)), []);

  const createBattle = useCallback(
    (format?: string, teams?: { p1Team?: string; p2Team?: string }) => localBattles.createBattle(format, teams),
    [],
  );
  const closeBattle = useCallback((roomId: string) => localBattles.closeBattle(roomId), []);
  const getSession = useCallback((roomId: string) => localBattles.getSession(roomId), []);
  const getFormat = useCallback((roomId: string) => localBattles.getFormat(roomId), []);
  const makeChoice = useCallback((roomId: string, choice: string) => localBattles.makeChoice(roomId, choice), []);
  const forfeit = useCallback((roomId: string) => localBattles.forfeit(roomId), []);
  const initScene = useCallback(
    (roomId: string, element: HTMLElement) => localBattles.initScene(roomId, element),
    [],
  );

  return {
    sessions: localBattles.sessions,
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
