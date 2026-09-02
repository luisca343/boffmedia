"use client";

/**
 * The codex's five remembered preferences — trail, favourites, view mode,
 * cursor and sound — behind the host's storage rather than `localStorage`.
 *
 * `localStorage` does exist in both hosts, so this is not about it being
 * missing. It is about WHERE it is: in the launcher the tool shares one origin
 * with the whole shell, so an unprefixed `mew-codex:favs` sits in the same
 * bucket as every other tool's keys, and nothing about it travels with the
 * host's own data. `toolStorage()` is the namespaced door both hosts already
 * hand tools, and it is what the ported TCG and VGC screens use.
 *
 * The one real difference is that it is ASYNCHRONOUS. Every call site here was
 * a synchronous read inside a mount effect, which is exactly the shape that
 * survives the change — the state starts at its default and the stored value
 * lands a tick later — but a read can now resolve AFTER the component is gone,
 * so each one is guarded.
 */

import { toolStorage } from "@boffmedia/tool-kit";

const PREFIX = "mew-codex:";

export async function mewRead<T>(key: string): Promise<T | null> {
  try {
    return await toolStorage().get<T>(PREFIX + key);
  } catch {
    return null;
  }
}

export function mewWrite(key: string, value: unknown): void {
  // Fire and forget: a preference that fails to persist must never break the
  // interaction that changed it. This mirrors the `try {} catch {}` the
  // `localStorage` version wrapped every write in.
  void toolStorage()
    .set(PREFIX + key, value)
    .catch(() => {});
}
