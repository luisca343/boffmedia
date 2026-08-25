/**
 * seedInput.ts — turn what a player typed into the seed the game would use.
 *
 * Minecraft's own rule, from `WorldOptions.parseSeed`: if the text parses as a
 * long, that *is* the seed; otherwise it is `String.hashCode()` of the text.
 * So "glacier" is a real, reproducible seed and not an error, and a player who
 * types the same word into the game gets the same world.
 *
 * Getting this wrong is worse than rejecting the input: hashing something that
 * should have parsed as a number silently searches a different world.
 */

/**
 * Java `long` bounds. Outside these, Minecraft falls back to hashing the text.
 * Built with `BigInt()` rather than `2n ** 63n` literals because the shared
 * tsconfig targets below ES2020, and the package is not the place to raise it.
 */
const LONG_MAX = BigInt("9223372036854775807");
const LONG_MIN = -LONG_MAX - BigInt(1);

export interface ParsedSeed {
  readonly value: bigint;
  /** `number` if the text parsed as a long; `hash` if it was hashed like Java. */
  readonly kind: "number" | "hash";
}

/**
 * Java's `String.hashCode()`: `s[0]*31^(n-1) + s[1]*31^(n-2) + ...`, wrapped to
 * a signed 32-bit int. `Math.imul` does the wrapping multiply; `| 0` keeps the
 * sign, which matters — a negative hash is a perfectly ordinary seed and
 * dropping the sign would land you in the wrong world.
 */
export function javaStringHash(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (Math.imul(31, hash) + s.charCodeAt(i)) | 0;
  }
  return hash;
}

export function parseSeed(input: string): ParsedSeed {
  const text = input.trim();
  if (text === "") return { value: BigInt(0), kind: "hash" };

  if (/^[+-]?\d+$/.test(text)) {
    const value = BigInt(text);
    // Only a value that actually fits a long is used as-is. Beyond that
    // Minecraft hashes the digits as text, and so do we.
    if (value >= LONG_MIN && value <= LONG_MAX) return { value, kind: "number" };
  }

  return { value: BigInt(javaStringHash(text)), kind: "hash" };
}
