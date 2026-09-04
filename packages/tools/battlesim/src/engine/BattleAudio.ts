/**
 * Audio subsystem for the battle simulator.
 *
 * The port from the Showdown client dropped `BattleSound` entirely, so this is
 * new rather than restored. Three channels — `music`, `cry`, `sfx` — each with
 * its own level under a master, plus a mute. **The `sfx` channel is wired and
 * has nothing in it**: Showdown ships no sound-effect set (its `audio/` tree is
 * the cries plus 19 music tracks), so there was nothing upstream to mirror. The
 * channel exists so adding effects later is a call to `playSfx`, not a redesign.
 *
 * Every url goes through `battlesimAssetUrl()` / `cryUrl()`. That is a hard
 * requirement, not a convention: the desktop host's CSP allows `media-src` from
 * the asset scheme and NOT from the CDN, which is exactly why the engine's old
 * hardcoded `play.pokemonshowdown.com/audio/cries/...` was silent in the
 * launcher. A raw CDN url here would be silent there and fine on the web, which
 * is the worst way for a bug to behave.
 */

import { cryCandidates } from '../sprites';
import { battlesimAssetUrl } from '../asset';

export interface AudioVolume {
  music: number;
  cry: number;
  sfx: number;
  master: number;
}

export interface BattleAudioState {
  volume: AudioVolume;
  muted: boolean;
  autoplayUnlocked: boolean;
}

export const DEFAULT_VOLUME: AudioVolume = {
  music: 0.6,
  cry: 0.8,
  sfx: 0.7,
  master: 1.0,
};

/* ── Autoplay unlock ──────────────────────────────────────────────────────── */

/**
 * THE UNLOCK LISTENS TO THE WHOLE DOCUMENT, and that is the point.
 *
 * Browsers refuse to start audio before a user gesture, and they refuse
 * SILENTLY — a locked context and a broken subsystem look identical from the
 * outside. So if the only thing that unlocks audio is the audio button, a
 * player who never presses it hears nothing all battle and reports "sound
 * doesn't work", which is the complaint this feature exists to answer.
 *
 * Any gesture will do: clicking a move, pressing Play, a key. One capture-phase
 * listener per event, removed as soon as one of them fires. `pointerdown`
 * covers mouse and touch on everything modern; `touchend` is Safari's belt and
 * braces; `keydown` covers keyboard-only play.
 */
let unlocked = false;
let unlockInstalled = false;
const unlockListeners = new Set<() => void>();

/** Whether a gesture has unlocked audio in this document yet. */
export function isAudioUnlocked(): boolean {
  return unlocked;
}

/** Subscribe to the unlock. Returns an unsubscriber. Fires at most once. */
export function onAudioUnlock(fn: () => void): () => void {
  if (unlocked) {
    fn();
    return () => {};
  }
  unlockListeners.add(fn);
  return () => unlockListeners.delete(fn);
}

const UNLOCK_EVENTS = ['pointerdown', 'touchend', 'keydown'] as const;

/**
 * Arms the document-wide unlock. Idempotent, and safe to call during render
 * effects in several rooms at once — the listeners are installed once.
 */
export function installAutoplayUnlock(): void {
  if (unlockInstalled || unlocked || typeof document === 'undefined') return;
  unlockInstalled = true;
  const fire = () => {
    if (unlocked) return;
    unlocked = true;
    for (const ev of UNLOCK_EVENTS) document.removeEventListener(ev, fire, true);
    // Resuming can reject (no gesture credit, a context torn down mid-flight);
    // the unlock still stands for the <audio> path, which does not need one.
    void resumeContext();
    for (const fn of unlockListeners) fn();
    unlockListeners.clear();
  };
  for (const ev of UNLOCK_EVENTS) document.addEventListener(ev, fire, true);
}

/**
 * Explicit unlock, for a control that is already a gesture (the audio button).
 * The document listener would catch it anyway; this makes the same click also
 * resume the context synchronously enough to start the sound it asked for.
 */
export async function unlockAudioAutoplay(): Promise<void> {
  unlocked = true;
  await resumeContext();
  for (const fn of unlockListeners) fn();
  unlockListeners.clear();
}

/* ── Cries and effects (decoded, cached) ──────────────────────────────────── */

/**
 * The context is created LAZILY, on first use after the unlock. Constructing an
 * `AudioContext` at import time gets one in `suspended` state and a console
 * warning in Chrome for a tool the user may never open.
 */
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioContext) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      sharedAudioContext = new Ctor();
    } catch {
      return null;
    }
  }
  return sharedAudioContext;
}

async function resumeContext(): Promise<void> {
  const ctx = sharedAudioContext;
  if (!ctx || ctx.state !== 'suspended') return;
  try {
    await ctx.resume();
  } catch {
    /* the caller degrades to silence */
  }
}

/**
 * Decoded one-shots, cached by url.
 *
 * A cry fires on every switch-in and every faint, and the same species switches
 * in over and over in one battle — re-fetching and re-decoding a file we
 * already hold is pure waste on a path that runs mid-animation. In-flight
 * promises are cached too, so two simultaneous switch-ins of the same species
 * (doubles) decode once.
 *
 * A `null` result IS cached, but only when it is a real miss — a 404 (no file
 * at that url) or a decode failure (a corrupt/unsupported file): a Pokémon
 * with no cry recording must not retry that 404 on every switch. A transient
 * failure — the fetch timing out, or a network error — is deliberately NOT
 * cached: the file may well exist, and permanently remembering "miss" for a
 * blip would make one dropped packet mid-battle silence that Pokémon's cry
 * for the rest of the session.
 */
const CRY_FETCH_TIMEOUT_MS = 4000;
const bufferCache = new Map<string, Promise<AudioBuffer | null>>();

function loadBuffer(url: string, ctx: AudioContext): Promise<AudioBuffer | null> {
  const hit = bufferCache.get(url);
  if (hit) return hit;

  const p = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CRY_FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } catch {
      // Aborted (timeout) or a network error — transient. Do not remember
      // this as a miss; let the next call try again.
      bufferCache.delete(url);
      return null;
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) return null; // real 404 — a durable miss.

    try {
      return await ctx.decodeAudioData(await res.arrayBuffer());
    } catch {
      return null; // corrupt/unsupported file — also a durable miss.
    }
  })();

  bufferCache.set(url, p);
  return p;
}

/** Builds the graph for one decoded buffer and starts it. Never throws. */
function playDecodedBuffer(buffer: AudioBuffer, channel: keyof AudioVolume, state: BattleAudioState, ctx: AudioContext): void {
  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = (state.volume[channel] ?? 1) * state.volume.master;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
  } catch {
    /* the battle continues either way */
  }
}

/** Plays a cached one-shot on a channel. Silent, never throwing, on any failure. */
export async function playAudio(url: string, channel: keyof AudioVolume, state: BattleAudioState): Promise<void> {
  if (!unlocked || state.muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') await resumeContext();
  if (ctx.state !== 'running') return;

  const buffer = await loadBuffer(url, ctx);
  if (!buffer) return;
  playDecodedBuffer(buffer, channel, state, ctx);
}

/**
 * A Pokémon's cry, by species (forme included). Many species/formes have none
 * — that is not an error, it just falls through to the base cry or to silence.
 *
 * MUST NEVER throw or reject, and is never awaited by its callers on the hot
 * path (a switch-in should not stall on network) — the `Promise<void>` return
 * exists for callers that DO want to know playback was attempted (tests,
 * `preloadCries`), not as a contract callers must honor.
 */
export async function playCry(speciesId: string, state: BattleAudioState): Promise<void> {
  try {
    if (!unlocked || state.muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') await resumeContext();
    if (ctx.state !== 'running') return;

    for (const url of cryCandidates(speciesId)) {
      const buffer = await loadBuffer(url, ctx);
      if (buffer) {
        playDecodedBuffer(buffer, 'cry', state, ctx);
        return;
      }
    }
  } catch {
    /* never surface a rejection to the caller */
  }
}

/**
 * Warms the cry cache for a set of species — call once per side at battle
 * start so the first switch-in's cry is already decoded instead of racing a
 * fetch against the switch animation. Bounded to 4 concurrent decodes so a
 * six-mon team doesn't open six requests at once; fire-and-forget, so a slow
 * or failing preload never blocks or is awaited by the caller.
 */
export function preloadCries(speciesIds: string[]): void {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const queue = Array.from(new Set(speciesIds));
  let next = 0;
  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= queue.length) return;
      for (const url of cryCandidates(queue[i])) {
        const buffer = await loadBuffer(url, ctx);
        if (buffer) break; // primed the one this species will actually play
      }
    }
  };

  const CONCURRENCY = 4;
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker());
  void Promise.all(workers).catch(() => {
    /* preloading is an optimisation; a failure here is not a battle error */
  });
}

/**
 * The empty channel. Nothing calls this yet — see the note at the top of the
 * file — but the wiring is here so that adding effects is a data change.
 */
export async function playSfx(name: string, state: BattleAudioState): Promise<void> {
  return playAudio(battlesimAssetUrl(`audio/sfx/${name}.mp3`), 'sfx', state);
}

/* ── Music ────────────────────────────────────────────────────────────────── */

/**
 * Music is an `<audio>` element, NOT a decoded buffer, and the difference is
 * not stylistic. `decodeAudioData` on a 2-3 MB track expands it to raw PCM —
 * a two-minute stereo track at 48 kHz is roughly 46 MB resident — and it cannot
 * start until the whole file has downloaded and decoded. An element streams,
 * loops natively, and costs almost nothing. Buffers are right for cries, which
 * are tiny, repeated and latency-sensitive; they are wrong for a looping track.
 *
 * MUSIC HAS AN OWNER, for the same reason `setCanvasWidth` does (see
 * `lib/battle-layout.tsx`): several battle rooms are mounted at once and the
 * hidden ones keep their layout, so a room tearing down would otherwise call a
 * module-level `stopMusic()` and cut the music of the room being looked at. The
 * owner is a token — whoever started the track. A stop request from anyone else
 * is ignored.
 */
let musicEl: HTMLAudioElement | null = null;
let musicOwner: unknown = null;

export async function playMusic(trackName: string, state: BattleAudioState, owner: unknown): Promise<void> {
  if (!unlocked || state.muted) return;
  if (typeof Audio === 'undefined') return;
  // Already playing this track for this owner — do not restart it on a re-render.
  if (musicEl && musicOwner === owner && musicEl.dataset.track === trackName) return;

  stopMusic(musicOwner);
  try {
    const el = new Audio(battlesimAssetUrl(`audio/music/${trackName}.mp3`));
    el.loop = true;
    el.preload = 'auto';
    el.dataset.track = trackName;
    el.volume = Math.max(0, Math.min(1, (state.volume.music ?? 1) * state.volume.master));
    musicEl = el;
    musicOwner = owner;
    await el.play();
  } catch {
    // A rejected play() means the gesture did not carry; leave the element in
    // place so `setMusicVolume`/a later start can retry rather than dropping it.
  }
}

/** Stops the music, but only if `owner` is the one that started it. */
export function stopMusic(owner: unknown): void {
  if (!musicEl || (musicOwner !== null && musicOwner !== owner)) return;
  try {
    musicEl.pause();
    musicEl.src = '';
  } catch {
    /* nothing to do */
  }
  musicEl = null;
  musicOwner = null;
}

/** Live volume/mute for the playing track, without restarting it. */
export function setMusicVolume(state: BattleAudioState): void {
  if (!musicEl) return;
  musicEl.volume = state.muted ? 0 : Math.max(0, Math.min(1, (state.volume.music ?? 1) * state.volume.master));
}

/** Room teardown. Stops only this room's music; the context is shared and stays. */
export function cleanupAudio(owner: unknown): void {
  stopMusic(owner);
}

/* ── Track selection ──────────────────────────────────────────────────────── */

/** The 19 battle tracks mirrored from Pokémon Showdown's `audio/`. */
export const BATTLE_TRACKS = [
  'bw-rival',
  'bw-subway-trainer',
  'bw-trainer',
  'bw2-homika-dogars',
  'bw2-kanto-gym-leader',
  'bw2-rival',
  'colosseum-miror-b',
  'dpp-rival',
  'dpp-trainer',
  'hgss-johto-trainer',
  'hgss-kanto-trainer',
  'oras-rival',
  'oras-trainer',
  'sm-rival',
  'sm-trainer',
  'spl-elite4',
  'xd-miror-b',
  'xy-rival',
  'xy-trainer',
];

/**
 * The track for a battle, derived from its id rather than drawn at random.
 *
 * Determinism buys two things: a reload does not change the music mid-battle,
 * and both players in a PvP room hear the same track — the room id is the one
 * value both sides already agree on.
 */
export function selectTrackForBattle(roomId: string): string {
  if (!roomId) return BATTLE_TRACKS[0];
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    hash = (hash << 5) - hash + roomId.charCodeAt(i);
    hash |= 0;
  }
  // `Math.abs(-2147483648)` stays negative in two's complement, so mask instead.
  return BATTLE_TRACKS[(hash >>> 0) % BATTLE_TRACKS.length];
}
