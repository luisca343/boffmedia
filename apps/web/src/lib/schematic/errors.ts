/**
 * Machine-readable error codes for failures that cross the worker boundary.
 *
 * Comlink serialises a thrown Error as `{ name, message, stack }` — custom
 * fields are dropped — so the code travels as a `CODE: message` prefix on the
 * message itself. The UI maps the code to a translated string and only falls
 * back to the raw (English) message when a failure has no code.
 */

export const ERR = {
  /** No launcher layout matched — the UI offers manual version/loader entry. */
  instanceUndetected: "E_INSTANCE_UNDETECTED",
  /** No mod JARs and no metadata: the picked folder isn't an instance at all. */
  instanceEmpty: "E_INSTANCE_EMPTY",
  /** File extension isn't one of the supported schematic formats. */
  schematicUnsupported: "E_SCHEMATIC_UNSUPPORTED",
  /** Picked file isn't parseable as a `level.dat`. */
  levelDatUnreadable: "E_LEVELDAT_UNREADABLE",
  /** A `level.dat` with no Forge block registry — vanilla world, nothing to map. */
  levelDatNoRegistry: "E_LEVELDAT_NO_REGISTRY",
  /** Structure exceeds a format's representable size (e.g. .schem's 65535 axis). */
  exportTooLarge: "E_EXPORT_TOO_LARGE",
} as const;

export type ErrCode = (typeof ERR)[keyof typeof ERR];

const ALL_CODES: readonly string[] = Object.values(ERR);

/** Build an Error whose message carries a machine-readable code prefix. */
export function codedError(code: ErrCode, message: string): Error {
  return new Error(`${code}: ${message}`);
}

/** The code prefixed on an error message, or undefined when it carries none. */
export function errorCode(err: unknown): ErrCode | undefined {
  const message = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const colon = message.indexOf(":");
  if (colon === -1) return undefined;
  const candidate = message.slice(0, colon);
  return ALL_CODES.includes(candidate) ? (candidate as ErrCode) : undefined;
}

/** The human-readable part of a coded message (the whole message when uncoded). */
export function errorDetail(err: unknown): string {
  const message = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return errorCode(err) ? message.slice(message.indexOf(":") + 1).trim() : message;
}
