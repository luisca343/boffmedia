/**
 * Minimal NBT (Named Binary Tag) writer — the inverse of {@link ./nbt}.
 *
 * Java NBT is big-endian and a plain JS number is ambiguous (byte/short/int/
 * float/double), so the writer works on an explicit tagged-value tree: callers
 * build {@link Tag}s with the typed constructors below ({@link Int}, {@link Str},
 * …) and the encoder serialises them, gzip-compressing the result so the loaders
 * (which auto-detect the gzip magic) read it straight back.
 *
 * Longs are written from bigint so 64-bit values — `.litematic` bit-packing —
 * survive the round-trip without truncation.
 */
import { gzip } from "pako";
import { NBT_TAG } from "./nbt";

// ─── Tagged value tree ──────────────────────────────────────────────────────────

export type Tag =
  | { t: 1; v: number } // Byte
  | { t: 2; v: number } // Short
  | { t: 3; v: number } // Int
  | { t: 4; v: bigint } // Long
  | { t: 5; v: number } // Float
  | { t: 6; v: number } // Double
  | { t: 7; v: Uint8Array } // ByteArray
  | { t: 8; v: string } // String
  | { t: 9; elem: number; v: Tag[] } // List
  | { t: 10; v: Record<string, Tag> } // Compound
  | { t: 11; v: Int32Array } // IntArray
  | { t: 12; v: BigInt64Array }; // LongArray

export const Byte = (v: number): Tag => ({ t: NBT_TAG.Byte, v });
export const Short = (v: number): Tag => ({ t: NBT_TAG.Short, v });
export const Int = (v: number): Tag => ({ t: NBT_TAG.Int, v });
export const Long = (v: bigint): Tag => ({ t: NBT_TAG.Long, v });
export const Float = (v: number): Tag => ({ t: NBT_TAG.Float, v });
export const Double = (v: number): Tag => ({ t: NBT_TAG.Double, v });
export const ByteArr = (v: Uint8Array): Tag => ({ t: NBT_TAG.ByteArray, v });
export const Str = (v: string): Tag => ({ t: NBT_TAG.String, v });
export const Compound = (v: Record<string, Tag>): Tag => ({ t: NBT_TAG.Compound, v });
export const IntArr = (v: Int32Array): Tag => ({ t: NBT_TAG.IntArray, v });
export const LongArr = (v: BigInt64Array): Tag => ({ t: NBT_TAG.LongArray, v });

/** A homogeneous list of `elem`-typed payloads. Empty lists use TAG_End (0). */
export const List = (elem: number, v: Tag[]): Tag => ({
  t: NBT_TAG.List,
  elem: v.length === 0 ? NBT_TAG.End : elem,
  v,
});

// ─── Growable big-endian byte buffer ────────────────────────────────────────────

class ByteWriter {
  private buf: Uint8Array;
  private view: DataView;
  private len = 0;
  private encoder = new TextEncoder();

  constructor(initial = 4096) {
    this.buf = new Uint8Array(initial);
    this.view = new DataView(this.buf.buffer);
  }

  private ensure(n: number) {
    if (this.len + n <= this.buf.length) return;
    let cap = this.buf.length;
    while (cap < this.len + n) cap *= 2;
    const next = new Uint8Array(cap);
    next.set(this.buf.subarray(0, this.len));
    this.buf = next;
    this.view = new DataView(next.buffer);
  }

  i8(v: number) { this.ensure(1); this.view.setInt8(this.len, v); this.len += 1; }
  i16(v: number) { this.ensure(2); this.view.setInt16(this.len, v, false); this.len += 2; }
  i32(v: number) { this.ensure(4); this.view.setInt32(this.len, v, false); this.len += 4; }
  i64(v: bigint) { this.ensure(8); this.view.setBigInt64(this.len, v, false); this.len += 8; }
  f32(v: number) { this.ensure(4); this.view.setFloat32(this.len, v, false); this.len += 4; }
  f64(v: number) { this.ensure(8); this.view.setFloat64(this.len, v, false); this.len += 8; }

  bytes(arr: Uint8Array) { this.ensure(arr.length); this.buf.set(arr, this.len); this.len += arr.length; }

  str(s: string) {
    const enc = this.encoder.encode(s);
    this.ensure(2 + enc.length);
    this.view.setUint16(this.len, enc.length, false);
    this.len += 2;
    this.buf.set(enc, this.len);
    this.len += enc.length;
  }

  finish(): Uint8Array {
    return this.buf.slice(0, this.len);
  }
}

function writePayload(w: ByteWriter, tag: Tag): void {
  switch (tag.t) {
    case NBT_TAG.Byte: w.i8(tag.v); break;
    case NBT_TAG.Short: w.i16(tag.v); break;
    case NBT_TAG.Int: w.i32(tag.v); break;
    case NBT_TAG.Long: w.i64(tag.v); break;
    case NBT_TAG.Float: w.f32(tag.v); break;
    case NBT_TAG.Double: w.f64(tag.v); break;
    case NBT_TAG.ByteArray: w.i32(tag.v.length); w.bytes(tag.v); break;
    case NBT_TAG.String: w.str(tag.v); break;
    case NBT_TAG.List:
      w.i8(tag.elem);
      w.i32(tag.v.length);
      for (const item of tag.v) writePayload(w, item);
      break;
    case NBT_TAG.Compound:
      for (const [key, child] of Object.entries(tag.v)) {
        w.i8(child.t);
        w.str(key);
        writePayload(w, child);
      }
      w.i8(NBT_TAG.End);
      break;
    case NBT_TAG.IntArray:
      w.i32(tag.v.length);
      for (let i = 0; i < tag.v.length; i++) w.i32(tag.v[i]);
      break;
    case NBT_TAG.LongArray:
      w.i32(tag.v.length);
      for (let i = 0; i < tag.v.length; i++) w.i64(tag.v[i]);
      break;
  }
}

/**
 * Serialise a root compound into a gzip-compressed NBT buffer.
 * Pass `gzipOutput: false` for a raw (uncompressed) buffer.
 */
export function encodeNBT(
  root: Record<string, Tag>,
  opts: { rootName?: string; gzipOutput?: boolean } = {}
): Uint8Array {
  const { rootName = "", gzipOutput = true } = opts;
  const w = new ByteWriter();
  w.i8(NBT_TAG.Compound);
  w.str(rootName);
  writePayload(w, { t: NBT_TAG.Compound, v: root });
  const raw = w.finish();
  return gzipOutput ? gzip(raw) : raw;
}

// ─── NbtValue → Tag bridge ────────────────────────────────────────────────────

/**
 * Convert a parsed {@link NbtValue} back into a {@link Tag} so that tile-entity
 * compounds (stored in {@link TileEntity.data}) can be re-encoded on export.
 *
 * Number type recovery uses a "smallest signed type" heuristic:
 *   integer in [-128, 127]            → Byte
 *   integer in [-32768, 32767]        → Short
 *   integer in [-2³¹, 2³¹-1]         → Int
 *   non-integer                        → Double
 *
 * This is lossy but correct for the most common tile-entity fields (item Slot,
 * Count, coordinates, redstone power, etc.). Float values read by the NBT
 * parser lose their Float vs. Double distinction — encoding them as Double is
 * safe because Minecraft's deserializer accepts Double where Float is expected.
 */
export function nbtValueToTag(v: unknown): Tag {
  if (typeof v === "bigint") return Long(v);

  if (typeof v === "number") {
    if (Number.isInteger(v)) {
      if (v >= -128 && v <= 127)   return Byte(v);
      if (v >= -32768 && v <= 32767) return Short(v);
      return Int(v);
    }
    return Double(v);
  }

  if (typeof v === "string") return Str(v);

  if (v instanceof BigInt64Array) return LongArr(v);
  if (v instanceof Int32Array)    return IntArr(v);
  if (v instanceof Uint8Array)    return ByteArr(v);

  if (Array.isArray(v)) {
    if (v.length === 0) return { t: NBT_TAG.List, elem: NBT_TAG.End, v: [] };
    const tags = v.map(nbtValueToTag);
    return { t: NBT_TAG.List, elem: tags[0].t, v: tags };
  }

  if (v !== null && typeof v === "object") {
    const fields: Record<string, Tag> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      fields[k] = nbtValueToTag(val);
    }
    return Compound(fields);
  }

  // Fallback for null / undefined — encode as empty string
  return Str("");
}

/**
 * Encode palette indices as an unsigned LEB128 varint stream — the inverse of
 * `decodeVarintArray`. Used for `.schem` BlockData.
 */
export function encodeVarintArray(indices: Int32Array): Uint8Array {
  // Worst case 5 bytes per index (32-bit value).
  const out = new ByteWriter(indices.length + 16);
  for (let i = 0; i < indices.length; i++) {
    let value = indices[i] >>> 0;
    for (;;) {
      const byte = value & 0x7f;
      value >>>= 7;
      if (value !== 0) {
        out.i8(byte | 0x80);
      } else {
        out.i8(byte);
        break;
      }
    }
  }
  return out.finish();
}
