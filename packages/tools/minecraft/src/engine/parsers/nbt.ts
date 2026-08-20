/**
 * Minimal NBT (Named Binary Tag) reader for the schematic compatibility tool.
 *
 * Java NBT is big-endian. Files are usually gzip-compressed; we auto-detect the
 * gzip magic (0x1f 0x8b) and inflate with pako before parsing.
 *
 * Longs are decoded as bigint (TAG_Long / TAG_Long_Array) so 64-bit values are
 * never truncated — `.litematic` bit-packing depends on this.
 */
import { ungzip } from "pako";

export const NBT_TAG = {
  End: 0,
  Byte: 1,
  Short: 2,
  Int: 3,
  Long: 4,
  Float: 5,
  Double: 6,
  ByteArray: 7,
  String: 8,
  List: 9,
  Compound: 10,
  IntArray: 11,
  LongArray: 12,
} as const;

export type NbtCompound = { [key: string]: NbtValue };
export type NbtValue =
  | number
  | bigint
  | string
  | Uint8Array
  | Int32Array
  | BigInt64Array
  | NbtValue[]
  | NbtCompound;

class NbtReader {
  private view: DataView;
  private offset = 0;
  private decoder = new TextDecoder("utf-8");

  constructor(data: Uint8Array) {
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  }

  private readByte(): number {
    const v = this.view.getInt8(this.offset);
    this.offset += 1;
    return v;
  }

  private readShort(): number {
    const v = this.view.getInt16(this.offset, false);
    this.offset += 2;
    return v;
  }

  private readUShort(): number {
    const v = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return v;
  }

  private readInt(): number {
    const v = this.view.getInt32(this.offset, false);
    this.offset += 4;
    return v;
  }

  private readLong(): bigint {
    const v = this.view.getBigInt64(this.offset, false);
    this.offset += 8;
    return v;
  }

  private readFloat(): number {
    const v = this.view.getFloat32(this.offset, false);
    this.offset += 4;
    return v;
  }

  private readDouble(): number {
    const v = this.view.getFloat64(this.offset, false);
    this.offset += 8;
    return v;
  }

  private readString(): string {
    const len = this.readUShort();
    const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, len);
    this.offset += len;
    return this.decoder.decode(bytes);
  }

  private readPayload(type: number): NbtValue {
    switch (type) {
      case NBT_TAG.Byte:
        return this.readByte();
      case NBT_TAG.Short:
        return this.readShort();
      case NBT_TAG.Int:
        return this.readInt();
      case NBT_TAG.Long:
        return this.readLong();
      case NBT_TAG.Float:
        return this.readFloat();
      case NBT_TAG.Double:
        return this.readDouble();
      case NBT_TAG.ByteArray: {
        const len = this.readInt();
        const arr = new Uint8Array(len);
        for (let i = 0; i < len; i++) arr[i] = this.view.getUint8(this.offset + i);
        this.offset += len;
        return arr;
      }
      case NBT_TAG.String:
        return this.readString();
      case NBT_TAG.List: {
        const elemType = this.readByte();
        const len = this.readInt();
        const list: NbtValue[] = [];
        for (let i = 0; i < len; i++) list.push(this.readPayload(elemType));
        return list;
      }
      case NBT_TAG.Compound:
        return this.readCompound();
      case NBT_TAG.IntArray: {
        const len = this.readInt();
        const arr = new Int32Array(len);
        for (let i = 0; i < len; i++) arr[i] = this.readInt();
        return arr;
      }
      case NBT_TAG.LongArray: {
        const len = this.readInt();
        const arr = new BigInt64Array(len);
        for (let i = 0; i < len; i++) arr[i] = this.readLong();
        return arr;
      }
      default:
        throw new Error(`Unknown NBT tag type: ${type}`);
    }
  }

  private readCompound(): NbtCompound {
    const obj: NbtCompound = {};
    for (;;) {
      const type = this.readByte();
      if (type === NBT_TAG.End) break;
      const name = this.readString();
      obj[name] = this.readPayload(type);
    }
    return obj;
  }

  /** Reads the root tag. The root is always a (usually unnamed) compound. */
  readRoot(): NbtCompound {
    const type = this.readByte();
    if (type !== NBT_TAG.Compound) {
      throw new Error(`Expected root compound, got tag type ${type}`);
    }
    this.readString(); // root name (often empty)
    return this.readCompound();
  }
}

/** Returns true if the buffer starts with the gzip magic bytes. */
function isGzip(data: Uint8Array): boolean {
  return data.length > 2 && data[0] === 0x1f && data[1] === 0x8b;
}

/**
 * Parse an NBT buffer (gzip-compressed or raw) into a plain object tree.
 */
export function parseNBT(data: Uint8Array): NbtCompound {
  const raw = isGzip(data) ? ungzip(data) : data;
  return new NbtReader(raw).readRoot();
}

// ─── Typed accessors ──────────────────────────────────────────────────────────
// NBT loses static type info; these helpers assert the expected shape and throw
// a clear error when a schematic is malformed.

export function asCompound(v: NbtValue | undefined, ctx: string): NbtCompound {
  if (v === null || typeof v !== "object" || Array.isArray(v) || ArrayBuffer.isView(v)) {
    throw new Error(`Expected compound at ${ctx}`);
  }
  return v as NbtCompound;
}

export function asString(v: NbtValue | undefined, ctx: string): string {
  if (typeof v !== "string") throw new Error(`Expected string at ${ctx}`);
  return v;
}

export function asNumber(v: NbtValue | undefined, ctx: string): number {
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  throw new Error(`Expected number at ${ctx}`);
}

export function asByteArray(v: NbtValue | undefined, ctx: string): Uint8Array {
  if (!(v instanceof Uint8Array)) throw new Error(`Expected byte array at ${ctx}`);
  return v;
}

export function asIntArray(v: NbtValue | undefined, ctx: string): Int32Array {
  if (!(v instanceof Int32Array)) throw new Error(`Expected int array at ${ctx}`);
  return v;
}

export function asList(v: NbtValue | undefined, ctx: string): NbtValue[] {
  if (!Array.isArray(v)) throw new Error(`Expected list at ${ctx}`);
  return v;
}

export function asLongArray(v: NbtValue | undefined, ctx: string): BigInt64Array {
  if (!(v instanceof BigInt64Array)) throw new Error(`Expected long array at ${ctx}`);
  return v;
}

/**
 * Decode an unsigned LEB128 varint stream into palette indices.
 * `.schem` BlockData stores one varint per block in YZX order.
 */
export function decodeVarintArray(bytes: Uint8Array, expectedLength: number): Int32Array {
  const out = new Int32Array(expectedLength);
  let pos = 0;
  let i = 0;
  while (pos < bytes.length && i < expectedLength) {
    let value = 0;
    let shift = 0;
    for (;;) {
      const byte = bytes[pos++];
      value |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
      if (shift > 35) throw new Error("Varint too long in BlockData");
    }
    out[i++] = value;
  }
  return out;
}
