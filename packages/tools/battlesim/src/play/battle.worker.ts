/**
 * Runs battles off the main thread (D3).
 *
 * The whole point of M1: an AI battle is simulated HERE, in the page, so play
 * and replay work with no server and no account. Before this, the play screen
 * opened a socket to the API's `/battle` namespace and asked the server to run
 * a `RandomPlayerAI` for it — which meant no offline play at all, and in the
 * launcher not even online play, since the desktop CSP does not allow a socket
 * to the API origin.
 *
 * It has to be a worker rather than just a module: `@pkmn/sim` resolves a whole
 * turn synchronously, and doing that on the main thread drops frames in the
 * middle of the animation the player is watching.
 *
 * WHAT IT FORWARDS IS THE P1 VIEW, not the omniscient log. The engine hands
 * this worker one ordered stream per viewer; the human is p1, so p1's stream is
 * the one that goes to the page. That stream already has `|split|` resolved the
 * way Showdown resolves it (exact HP for the player's own Pokémon, percentages
 * for the bot's) and carries `|request|` lines inline, in order — which is why
 * there is no separate `request` message any more.
 *
 * `@boffmedia/battle-core` is imported as its COMPILED ESM build. Never point a
 * bundler at that package's `src/` — apps/api consumes the CJS half of the same
 * build, and aliasing one host to source is how the two drift apart.
 */

// Must precede the battle-core import: @pkmn/sim touches `global` on load.
import "../lib/node-globals";

import { BattleEngine, registerBattleMods, unpackTeam } from "@boffmedia/battle-core";

import type { BattleWorkerEvent, BattleWorkerRequest } from "./worker-protocol";

// Teras and (from M3) champions have to exist in the Dex before any battle in
// those formats starts. Idempotent, so calling it at worker boot is free.
registerBattleMods();

interface Room {
  engine: BattleEngine;
  /** Next `protocol.seq`, monotonic from 0. Mirrors the PvP gateway. */
  seq: number;
}

const rooms = new Map<string, Room>();

const post = (event: BattleWorkerEvent) => {
  (self as unknown as Worker).postMessage(event);
};

function start(message: Extract<BattleWorkerRequest, { type: "start" }>) {
  const { roomId, format } = message;
  if (rooms.has(roomId)) return;

  const room: Room = { engine: undefined as unknown as BattleEngine, seq: 0 };

  const engine = new BattleEngine(
    roomId,
    {
      onLine: (viewer, line) => {
        // The bot's own view and the spectator view exist, but nobody in this
        // page is allowed to see them: forwarding either is what would put the
        // opponent's exact HP on screen.
        if (viewer !== "p1") return;
        post({ type: "protocol", roomId, seq: room.seq++, line });
      },
      onBattleEnd: (result) => {
        // Fired only after `|win|` has been delivered on every stream, so the
        // page has already applied the real ending. Nothing here synthesises a
        // second one — this message carries the log and the teams for the
        // replay record, not the terminal protocol line.
        post({
          type: "battleEnd",
          roomId,
          seq: room.seq++,
          winner: result.winner,
          log: result.log,
          teams: result.teams,
        });
        rooms.delete(roomId);
      },
      onError: (message_) => post({ type: "error", roomId, message: message_ }),
    },
    // The human is p1; a RandomPlayerAI takes p2. Never both — an AI on p1
    // consumes the stream the UI's choices are supposed to answer.
    "ai",
  );

  room.engine = engine;
  rooms.set(roomId, room);

  const p1Team = message.p1Team ? unpackTeam(message.p1Team) ?? undefined : undefined;
  const p2Team = message.p2Team ? unpackTeam(message.p2Team) ?? undefined : undefined;

  engine
    .create(
      format,
      { name: message.p1Name ?? "Player", team: p1Team },
      { name: message.p2Name ?? "Bot", team: p2Team },
    )
    .then(() => post({ type: "battleCreated", roomId, format }))
    .catch((error: unknown) => {
      rooms.delete(roomId);
      post({
        type: "error",
        roomId,
        message: error instanceof Error ? error.message : "Failed to start the battle",
      });
    });
}

self.onmessage = (event: MessageEvent<BattleWorkerRequest>) => {
  const message = event.data;
  const room = message.type === "start" ? undefined : rooms.get(message.roomId);

  switch (message.type) {
    case "start":
      start(message);
      return;
    case "choice":
      void room?.engine.makeChoice("p1", message.choice, message.rqid).then((result) => {
        if (!result.ok) {
          post({
            type: "error",
            roomId: message.roomId,
            code: result.code,
            message: `Choice refused: ${result.code}`,
          });
        }
      });
      return;
    case "undo":
      void room?.engine.undoChoice("p1").then((result) => {
        if (!result.ok) {
          post({
            type: "error",
            roomId: message.roomId,
            code: result.code,
            message: `Undo refused: ${result.code}`,
          });
        }
      });
      return;
    case "forfeit":
      void room?.engine.forfeit("p1");
      return;
    case "stop":
      // No forfeit event wanted here — the room is being thrown away (tab
      // closed, screen unmounted), and nobody is left to be told who won.
      rooms.delete(message.roomId);
      return;
  }
};
