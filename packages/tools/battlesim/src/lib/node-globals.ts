/**
 * Gives `@pkmn/*` the Node globals it assumes exist.
 *
 * The simulator and the client are written for Node first, and parts of them
 * reach for the bare `global` binding — `Battle.onBegin` does, which is on the
 * path of literally every battle. In a browser that is a hard
 * `ReferenceError: global is not defined`, thrown mid-render, with the battle
 * simply never appearing. It survives type-checking, bundling and every lint
 * gate in the repo, because nothing about it is statically wrong; it only fails
 * when the code actually runs.
 *
 * Shimmed HERE rather than with a bundler `define` because this package has two
 * hosts — Vite in the launcher and Next on the web — and a fix in one config
 * leaves the other broken. A package that depends on `@pkmn` should carry the
 * cost of `@pkmn` being a Node library.
 *
 * Import this for side effects at the top of any entry point that will touch
 * `@pkmn/client` or `@pkmn/sim`: `BsimRoot` (every screen) and the battle
 * worker. The assignment is conditional so a real Node environment (SSR, the
 * API, tests) keeps the `global` it already has.
 */

const scope = globalThis as typeof globalThis & { global?: unknown };
if (scope.global === undefined) {
  scope.global = scope;
}

export {};
