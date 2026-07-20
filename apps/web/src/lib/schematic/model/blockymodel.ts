/**
 * Compile a Hytale `.blockymodel` into baked geometry ({@link CompiledModel}).
 *
 * A `.blockymodel` is a tree of `nodes`, each carrying a local `position`,
 * `orientation` (quaternion) and a box `shape` (size + per-face texture layout).
 * Transforms compose down the tree (`worldRot = parentRot · localRot`,
 * `worldPos = parentPos + parentRot · localPos`). Every box becomes six textured
 * quads; per-face UVs come from the shape's `textureLayout` pixel offsets indexed
 * into the block's single texture sheet.
 *
 * Coordinate space: Hytale authors a full block as 32 units, centred on X/Z with
 * Y growing up from the block floor. We map that to the viewer's `[-0.5, 0.5]`
 * unit cell (`x/32`, `y/32 - 0.5`, `z/32`) so a Hytale model drops into the same
 * instanced-mesh path as the vanilla Minecraft compiler.
 *
 * Pure: plain typed-array output, no THREE — so the worker can compile a model
 * and ship the result across the postMessage boundary unchanged.
 */

import type { CompiledGroup, CompiledModel } from "./types";
import { orientationQuat } from "./rotation-tuple";

// ─── Raw `.blockymodel` shapes ────────────────────────────────────────────────

interface BVec3 {
  x: number;
  y: number;
  z: number;
}
interface BQuat {
  x: number;
  y: number;
  z: number;
  w: number;
}
type FaceName = "top" | "bottom" | "front" | "back" | "left" | "right";

interface FaceLayout {
  offset?: { x: number; y: number };
  mirror?: { x: boolean; y: boolean };
  angle?: number;
}

interface BlockyShape {
  type?: string;
  settings?: { size?: BVec3 };
  offset?: BVec3;
  stretch?: BVec3;
  textureLayout?: Partial<Record<FaceName, FaceLayout>>;
  doubleSided?: boolean;
  visible?: boolean;
}

interface BlockyNode {
  position?: BVec3;
  orientation?: BQuat;
  shape?: BlockyShape;
  children?: BlockyNode[];
}

export interface BlockyModel {
  lod?: string;
  nodes?: BlockyNode[];
}

/** Full-block edge length in Hytale model units. */
const BLOCK_UNITS = 32;

// ─── quaternion / vector math ─────────────────────────────────────────────────

type Vec3 = [number, number, number];
const IDENTITY: BQuat = { x: 0, y: 0, z: 0, w: 1 };

/** Hamilton product a·b. */
function qmul(a: BQuat, b: BQuat): BQuat {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

/** Rotate vector v by quaternion q (v' = v + 2w(q×v) + 2 q×(q×v)). */
function qrot(q: BQuat, v: Vec3): Vec3 {
  const tx = 2 * (q.y * v[2] - q.z * v[1]);
  const ty = 2 * (q.z * v[0] - q.x * v[2]);
  const tz = 2 * (q.x * v[1] - q.y * v[0]);
  return [
    v[0] + q.w * tx + (q.y * tz - q.z * ty),
    v[1] + q.w * ty + (q.z * tx - q.x * tz),
    v[2] + q.w * tz + (q.x * ty - q.y * tx),
  ];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function normalize(a: Vec3): Vec3 {
  const len = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / len, a[1] / len, a[2] / len];
}

// ─── box face topology ────────────────────────────────────────────────────────

/**
 * For each face: the four corners in texture order (TL, TR, BR, BL) expressed as
 * unit-cube sign tuples, the local face normal, and which two box dimensions give
 * the face's pixel width (u) and height (v) for UV layout.
 */
interface FaceSpec {
  corners: [Vec3, Vec3, Vec3, Vec3];
  normal: Vec3;
  /** Box size component used as UV width / height. */
  uAxis: "x" | "y" | "z";
  vAxis: "x" | "y" | "z";
}

const FACES: Record<FaceName, FaceSpec> = {
  top: {
    corners: [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]],
    normal: [0, 1, 0],
    uAxis: "x",
    vAxis: "z",
  },
  bottom: {
    corners: [[-1, -1, 1], [1, -1, 1], [1, -1, -1], [-1, -1, -1]],
    normal: [0, -1, 0],
    uAxis: "x",
    vAxis: "z",
  },
  front: {
    corners: [[-1, 1, 1], [1, 1, 1], [1, -1, 1], [-1, -1, 1]],
    normal: [0, 0, 1],
    uAxis: "x",
    vAxis: "y",
  },
  back: {
    corners: [[1, 1, -1], [-1, 1, -1], [-1, -1, -1], [1, -1, -1]],
    normal: [0, 0, -1],
    uAxis: "x",
    vAxis: "y",
  },
  right: {
    corners: [[1, 1, 1], [1, 1, -1], [1, -1, -1], [1, -1, 1]],
    normal: [1, 0, 0],
    uAxis: "z",
    vAxis: "y",
  },
  left: {
    corners: [[-1, 1, -1], [-1, 1, 1], [-1, -1, 1], [-1, -1, -1]],
    normal: [-1, 0, 0],
    uAxis: "z",
    vAxis: "y",
  },
};

const FACE_NAMES = Object.keys(FACES) as FaceName[];

// ─── group accumulation ────────────────────────────────────────────────────────

interface GroupBuf {
  doubleSided: boolean;
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
  vertCount: number;
}

/** Append a quad, picking winding so the front face matches `normal`. */
function pushQuad(group: GroupBuf, corners: Vec3[], uvs: Array<[number, number]>, normal: Vec3): void {
  const base = group.vertCount;
  for (let i = 0; i < 4; i++) {
    group.positions.push(corners[i][0], corners[i][1], corners[i][2]);
    group.normals.push(normal[0], normal[1], normal[2]);
    group.uvs.push(uvs[i][0], uvs[i][1]);
  }
  group.vertCount += 4;
  const geoNormal = cross(sub(corners[1], corners[0]), sub(corners[2], corners[0]));
  if (dot(geoNormal, normal) >= 0) {
    group.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  } else {
    group.indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
  }
}

/** UVs (TL,TR,BR,BL) for a face, applying the layout's mirror + 90° rotation. */
function faceUvs(layout: FaceLayout | undefined, uW: number, vH: number, texW: number, texH: number): Array<[number, number]> {
  const ox = layout?.offset?.x ?? 0;
  const oy = layout?.offset?.y ?? 0;
  let u0 = ox / texW;
  let u1 = (ox + uW) / texW;
  // Image V is top-down; THREE V is bottom-up → flip.
  let v0 = 1 - oy / texH;
  let v1 = 1 - (oy + vH) / texH;
  if (layout?.mirror?.x) [u0, u1] = [u1, u0];
  if (layout?.mirror?.y) [v0, v1] = [v1, v0];
  const tl: [number, number] = [u0, v0];
  const tr: [number, number] = [u1, v0];
  const br: [number, number] = [u1, v1];
  const bl: [number, number] = [u0, v1];
  const corners: Array<[number, number]> = [tl, tr, br, bl];
  const shift = ((Math.round((layout?.angle ?? 0) / 90) % 4) + 4) % 4;
  return corners.slice(shift).concat(corners.slice(0, shift));
}

// ─── box emission ───────────────────────────────────────────────────────────────

function sizeOf(shape: BlockyShape, axis: "x" | "y" | "z"): number {
  return shape.settings?.size?.[axis] ?? BLOCK_UNITS;
}

function emitBox(
  shape: BlockyShape,
  worldPos: Vec3,
  worldRot: BQuat,
  blockRot: BQuat,
  texW: number,
  texH: number,
  solid: GroupBuf,
  doubled: GroupBuf,
): void {
  if (shape.visible === false) return;
  if (shape.type && shape.type !== "box") return;

  const sx = sizeOf(shape, "x");
  const sy = sizeOf(shape, "y");
  const sz = sizeOf(shape, "z");
  const off = shape.offset ?? { x: 0, y: 0, z: 0 };
  const str = shape.stretch ?? { x: 1, y: 1, z: 1 };
  // Half-extents carry the stretch sign so a negative stretch mirrors the box
  // (winding is recovered per-quad from the geometric normal in pushQuad).
  const hx = (sx / 2) * str.x;
  const hy = (sy / 2) * str.y;
  const hz = (sz / 2) * str.z;
  const group = shape.doubleSided ? doubled : solid;

  /** Local sign tuple → world-space, viewer-scaled, block-rotated vertex. */
  const place = (c: Vec3): Vec3 => {
    const local: Vec3 = [off.x + c[0] * hx, off.y + c[1] * hy, off.z + c[2] * hz];
    const r = qrot(worldRot, local);
    const wx = worldPos[0] + r[0];
    const wy = worldPos[1] + r[1];
    const wz = worldPos[2] + r[2];
    // Centred at the cell origin, so the placement rotation pivots on the block.
    return qrot(blockRot, [wx / BLOCK_UNITS, wy / BLOCK_UNITS - 0.5, wz / BLOCK_UNITS]);
  };

  for (const name of FACE_NAMES) {
    const spec = FACES[name];
    const layout = shape.textureLayout?.[name];
    const corners = spec.corners.map(place) as Vec3[];
    const normal = normalize(qrot(blockRot, qrot(worldRot, spec.normal)));
    const uW = spec[`uAxis`] === "x" ? sx : spec.uAxis === "y" ? sy : sz;
    const vH = spec.vAxis === "x" ? sx : spec.vAxis === "y" ? sy : sz;
    const uvs = faceUvs(layout, uW, vH, texW, texH);
    pushQuad(group, corners, uvs, normal);
  }
}

// ─── tree walk ────────────────────────────────────────────────────────────────

function walk(
  node: BlockyNode,
  parentPos: Vec3,
  parentRot: BQuat,
  blockRot: BQuat,
  texW: number,
  texH: number,
  solid: GroupBuf,
  doubled: GroupBuf,
): void {
  const localRot = node.orientation ?? IDENTITY;
  const localPos: Vec3 = node.position ? [node.position.x, node.position.y, node.position.z] : [0, 0, 0];
  const worldRot = qmul(parentRot, localRot);
  const rotated = qrot(parentRot, localPos);
  const worldPos: Vec3 = [parentPos[0] + rotated[0], parentPos[1] + rotated[1], parentPos[2] + rotated[2]];

  if (node.shape) emitBox(node.shape, worldPos, worldRot, blockRot, texW, texH, solid, doubled);
  for (const child of node.children ?? []) walk(child, worldPos, worldRot, blockRot, texW, texH, solid, doubled);
}

// ─── public compile ──────────────────────────────────────────────────────────

const EMPTY: CompiledModel = {
  positions: new Float32Array(0),
  normals: new Float32Array(0),
  uvs: new Float32Array(0),
  indices: new Uint32Array(0),
  groups: [],
  empty: true,
};

/**
 * Compile a parsed `.blockymodel` into baked geometry. `textureRef` is the src
 * the UI will load for every face (a `data:` URL the worker already extracted);
 * `texW`/`texH` are the texture's pixel dimensions, used to normalise the
 * per-face UV offsets. Returns `empty` geometry if nothing was produced.
 */
export function compileBlockyModel(
  model: BlockyModel,
  textureRef: string,
  texW: number,
  texH: number,
  rotation = 0,
): CompiledModel {
  const nodes = model.nodes;
  if (!Array.isArray(nodes) || nodes.length === 0) return EMPTY;
  const w = texW > 0 ? texW : 1;
  const h = texH > 0 ? texH : 1;
  const blockRot = orientationQuat(rotation);

  const solid: GroupBuf = { doubleSided: false, positions: [], normals: [], uvs: [], indices: [], vertCount: 0 };
  const doubled: GroupBuf = { doubleSided: true, positions: [], normals: [], uvs: [], indices: [], vertCount: 0 };
  for (const node of nodes) walk(node, [0, 0, 0], IDENTITY, blockRot, w, h, solid, doubled);

  const bufs = [solid, doubled].filter((b) => b.vertCount > 0);
  if (bufs.length === 0) return EMPTY;

  const totalVerts = bufs.reduce((s, b) => s + b.vertCount, 0);
  const totalIndices = bufs.reduce((s, b) => s + b.indices.length, 0);
  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices = new Uint32Array(totalIndices);
  const groups: CompiledGroup[] = [];

  let vBase = 0;
  let iBase = 0;
  for (const b of bufs) {
    positions.set(b.positions, vBase * 3);
    normals.set(b.normals, vBase * 3);
    uvs.set(b.uvs, vBase * 2);
    for (let i = 0; i < b.indices.length; i++) indices[iBase + i] = b.indices[i] + vBase;
    groups.push({ textureRef, tint: null, doubleSided: b.doubleSided, start: iBase, count: b.indices.length });
    vBase += b.vertCount;
    iBase += b.indices.length;
  }

  return { positions, normals, uvs, indices, groups, empty: false };
}

/** Read a PNG's pixel dimensions from its IHDR chunk (no full decode). */
export function pngDimensions(bytes: Uint8Array): { width: number; height: number } {
  // PNG: 8-byte signature, then IHDR length(4)+type(4), then width(4)+height(4).
  if (bytes.length < 24) return { width: 1, height: 1 };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
}
