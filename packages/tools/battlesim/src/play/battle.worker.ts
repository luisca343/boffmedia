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

const engines = new Map<string, BattleEngine>();

const post = (event: BattleWorkerEvent) => {
  (self as unknown as Worker).postMessage(event);
};

function start(message: Extract<BattleWorkerRequest, { type: "start" }>) {
  const { roomId, format } = message;
  if (engines.has(roomId)) return;

  const engine = new BattleEngine(
    roomId,
    {
      onProtocol: (line) => post({ type: "protocol", roomId, line }),
      onRequestP1: (request) => post({ type: "request", roomId, request }),
      onBattleEnd: (result) => {
        post({
          type: "battleEnd",
          roomId,
          winner: result.winner,
          log: result.log,
          teams: result.teams,
        });
        engines.delete(roomId);
      },
      onError: (message_) => post({ type: "error", roomId, message: message_ }),
    },
    // The human is p1; a RandomPlayerAI takes p2. Never both — an AI on p1
    // consumes the stream the UI's choices are supposed to answer.
    "ai",
  );

  engines.set(roomId, engine);

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
      engines.delete(roomId);
      post({
        type: "error",
        roomId,
        message: error instanceof Error ? error.message : "Failed to start the battle",
      });
    });
}

self.onmessage = (event: MessageEvent<BattleWorkerRequest>) => {
  const message = event.data;
  const engine = message.type === "start" ? undefined : engines.get(message.roomId);

  switch (message.type) {
    case "start":
      start(message);
      return;
    case "choice":
      void engine?.playerChoice(message.choice, "p1");
      return;
    case "undo":
      void engine?.undoChoice("p1");
      return;
    case "forfeit":
      void engine?.forfeit("p1");
      return;
    case "stop":
      // No forfeit event wanted here — the room is being thrown away (tab
      // closed, screen unmounted), and nobody is left to be told who won.
      engines.delete(message.roomId);
      return;
  }
};
