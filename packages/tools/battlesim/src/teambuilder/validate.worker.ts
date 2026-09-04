/**
 * Team legality AND format-aware learnsets, off the main thread (D12).
 *
 * `TeamValidator` walks every set against the format's rules, its bans and the
 * species' learnsets, and on a six-slot team that is hundreds of milliseconds.
 * Run inline it lands on exactly the interaction it is reporting on — the
 * keystroke that changed a move — and the editor stutters while you type.
 *
 * The move list and the species roster are here for the same reason and one
 * more: `legalMovesFor` / `legalSpeciesFor`
 * reaches into the full `@pkmn/sim` modded dex, which is the single heaviest
 * import in the tool. It is already loaded in this worker, so asking it here
 * costs a `postMessage` instead of a second copy on the main thread.
 *
 * Three request kinds share the socket, discriminated by `kind`; every reply
 * echoes the request's `token` so a slow answer to an old keystroke can be
 * discarded, and its own `kind` so the host can route it.
 *
 * Validation is ADVISORY here: the editor shows problems and still saves.
 * The binding check is the server's, at `joinQueue`, because a client-side
 * validator is a convenience and never an authority.
 */

// @pkmn reaches for Node's `global`; without this the worker dies on first use.
import "../lib/node-globals";

import { allAvailableSpecies, legalMovesFor, legalSpeciesFor, registerBattleMods, unpackTeam, validateTeam } from "@boffmedia/battle-core";
import type { SpeciesPickerData } from "@boffmedia/battle-core";

registerBattleMods();

export interface ValidateRequest {
  kind: "validate";
  /** Echoed back so a slow answer to an old keystroke can be discarded. */
  token: number;
  format: string;
  packed: string;
}

export interface MovesRequest {
  kind: "moves";
  token: number;
  format: string;
  species: string;
}

export interface SpeciesRequest {
  kind: "species";
  token: number;
  format: string;
}

export interface AllSpeciesRequest {
  kind: "all-species";
  token: number;
}

export type BsimWorkerRequest = ValidateRequest | MovesRequest | SpeciesRequest | AllSpeciesRequest;

export interface ValidateResponse {
  kind: "validate";
  token: number;
  ok: boolean;
  problems: string[];
}

export interface MovesResponse {
  kind: "moves";
  token: number;
  moves: string[];
  /** False = could not determine. The caller MUST fall back to the full list. */
  known: boolean;
}

export interface SpeciesResponse {
  kind: "species";
  token: number;
  species: string[];
  /** False = could not determine. The caller MUST mark nothing. */
  known: boolean;
}

export interface AllSpeciesResponse {
  kind: "all-species";
  token: number;
  species: SpeciesPickerData[];
  /** Always true for all-species; included for protocol consistency. */
  known: boolean;
}

export type BsimWorkerResponse = ValidateResponse | MovesResponse | SpeciesResponse | AllSpeciesResponse;

const post = (message: BsimWorkerResponse) => (self as unknown as Worker).postMessage(message);

function handleValidate(request: ValidateRequest) {
  const { token, format, packed } = request;

  if (!packed) {
    post({ kind: "validate", token, ok: true, problems: [] });
    return;
  }

  const team = unpackTeam(packed);
  if (!team) {
    post({ kind: "validate", token, ok: false, problems: ["El equipo no se pudo leer."] });
    return;
  }

  try {
    const result = validateTeam(format, team);
    post({ kind: "validate", token, ok: result.ok, problems: result.problems });
  } catch (error) {
    post({
      kind: "validate",
      token,
      ok: false,
      problems: [error instanceof Error ? error.message : "No se pudo validar el equipo."],
    });
  }
}

function handleMoves(request: MovesRequest) {
  const { token, format, species } = request;
  if (!species) {
    post({ kind: "moves", token, moves: [], known: false });
    return;
  }
  try {
    const result = legalMovesFor(format, species);
    post({ kind: "moves", token, moves: result.moves, known: result.known });
  } catch {
    // `known: false` is the honest answer to a throw: the picker shows every
    // move rather than telling the builder this Pokémon learns nothing.
    post({ kind: "moves", token, moves: [], known: false });
  }
}

function handleSpecies(request: SpeciesRequest) {
  const { token, format } = request;
  try {
    const result = legalSpeciesFor(format);
    post({ kind: "species", token, species: result.species, known: result.known });
  } catch {
    // Same contract as moves: an unknown answer marks nothing, so a lookup that
    // failed can never paint the whole dex red.
    post({ kind: "species", token, species: [], known: false });
  }
}

function handleAllSpecies(request: AllSpeciesRequest) {
  const { token } = request;
  try {
    const result = allAvailableSpecies();
    post({ kind: "all-species", token, species: result.species, known: result.known });
  } catch {
    post({ kind: "all-species", token, species: [], known: false });
  }
}

self.onmessage = (event: MessageEvent<BsimWorkerRequest>) => {
  const request = event.data;
  if (request.kind === "moves") handleMoves(request);
  else if (request.kind === "species") handleSpecies(request);
  else if (request.kind === "all-species") handleAllSpecies(request);
  else handleValidate(request);
};
