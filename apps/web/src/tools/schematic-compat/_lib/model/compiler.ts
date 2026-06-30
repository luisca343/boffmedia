/**
 * Compile resolved {@link ModelInstance}s into baked geometry ({@link CompiledModel}).
 *
 * For each element → each present face we emit a textured quad, apply the
 * element's local rotation and the variant's whole-model x/y rotation, then scale
 * by `1/16` and offset by `-0.5` so the block's `[0,16]` model box maps to the
 * `[-0.5, 0.5]` cell centred on its integer world coord (matching the viewer's
 * instance matrix). Faces are grouped by `(textureRef, tint, doubleSided)` so the
 * UI builds one material per group.
 *
 * Pure: plain typed-array output, no THREE.
 */

import type {
  CompiledGroup,
  CompiledModel,
  ModelElement,
  ModelFace,
  ModelInstance,
} from "./types";
import { tintColor } from "./tint";

type Vec3 = [number, number, number];
type Dir = "down" | "up" | "north" | "south" | "west" | "east";

const DIR_NORMAL: Record<Dir, Vec3> = {
  down: [0, -1, 0],
  up: [0, 1, 0],
  north: [0, 0, -1],
  south: [0, 0, 1],
  west: [-1, 0, 0],
  east: [1, 0, 0],
};

const DEG = Math.PI / 180;

// ─── vec math ─────────────────────────────────────────────────────────────────

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

/** Rotate a point about an axis-aligned line through `origin` by `angle` degrees. */
function rotateAxis(p: Vec3, origin: Vec3, axis: "x" | "y" | "z", angle: number, rescale = false): Vec3 {
  const c = Math.cos(angle * DEG);
  const s = Math.sin(angle * DEG);
  const d: Vec3 = [p[0] - origin[0], p[1] - origin[1], p[2] - origin[2]];
  let r: Vec3;
  if (axis === "x") r = [d[0], d[1] * c - d[2] * s, d[1] * s + d[2] * c];
  else if (axis === "y") r = [d[0] * c + d[2] * s, d[1], -d[0] * s + d[2] * c];
  else r = [d[0] * c - d[1] * s, d[0] * s + d[1] * c, d[2]];
  if (rescale && angle % 90 !== 0) {
    // Scale the in-plane axes by 1/cos to fill the block (MC `rescale: true`).
    const f = 1 / Math.abs(Math.cos(angle * DEG));
    if (axis === "x") { r[1] *= f; r[2] *= f; }
    else if (axis === "y") { r[0] *= f; r[2] *= f; }
    else { r[0] *= f; r[1] *= f; }
  }
  return [r[0] + origin[0], r[1] + origin[1], r[2] + origin[2]];
}

/** Rotate a direction vector (no translation) about a coordinate axis. */
function rotateNormal(n: Vec3, axis: "x" | "y" | "z", angle: number): Vec3 {
  return rotateAxis(n, [0, 0, 0], axis, angle);
}

// ─── face geometry ─────────────────────────────────────────────────────────────

/**
 * Texture-space corners (TL, TR, BR, BL) of a face, as box corners selected from
 * `from`/`to`. TL/TR sit at the visual top of the texture, BL/BR at the bottom.
 */
function faceCorners(dir: Dir, f: Vec3, t: Vec3): [Vec3, Vec3, Vec3, Vec3] {
  switch (dir) {
    case "up":
      return [[f[0], t[1], f[2]], [t[0], t[1], f[2]], [t[0], t[1], t[2]], [f[0], t[1], t[2]]];
    case "down":
      return [[f[0], f[1], t[2]], [t[0], f[1], t[2]], [t[0], f[1], f[2]], [f[0], f[1], f[2]]];
    case "north":
      return [[t[0], t[1], f[2]], [f[0], t[1], f[2]], [f[0], f[1], f[2]], [t[0], f[1], f[2]]];
    case "south":
      return [[f[0], t[1], t[2]], [t[0], t[1], t[2]], [t[0], f[1], t[2]], [f[0], f[1], t[2]]];
    case "west":
      return [[f[0], t[1], f[2]], [f[0], t[1], t[2]], [f[0], f[1], t[2]], [f[0], f[1], f[2]]];
    case "east":
      return [[t[0], t[1], t[2]], [t[0], t[1], f[2]], [t[0], f[1], f[2]], [t[0], f[1], t[2]]];
  }
}

/** Default UV (0..16, v top-down) from the element extents when a face omits `uv`. */
function autoUv(dir: Dir, f: Vec3, t: Vec3): [number, number, number, number] {
  switch (dir) {
    case "up":
    case "down":
      return [f[0], f[2], t[0], t[2]];
    case "north":
    case "south":
      return [f[0], 16 - t[1], t[0], 16 - f[1]];
    case "west":
    case "east":
      return [f[2], 16 - t[1], t[2], 16 - f[1]];
  }
}

/** UVs for the (TL,TR,BR,BL) corners from a [u0,v0,u1,v1] rect, with face rotation. */
function faceUvs(uv: [number, number, number, number], rotation = 0): Array<[number, number]> {
  const [u0, v0, u1, v1] = uv;
  // GL uv: u/16, flip v (image v is top-down).
  const TL: [number, number] = [u0 / 16, 1 - v0 / 16];
  const TR: [number, number] = [u1 / 16, 1 - v0 / 16];
  const BR: [number, number] = [u1 / 16, 1 - v1 / 16];
  const BL: [number, number] = [u0 / 16, 1 - v1 / 16];
  const corners = [TL, TR, BR, BL];
  const shift = ((rotation / 90) % 4 + 4) % 4;
  return corners.slice(shift).concat(corners.slice(0, shift));
}

// ─── group accumulation ────────────────────────────────────────────────────────

interface GroupBuf {
  textureRef: string | null;
  tint: string | null;
  doubleSided: boolean;
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
  vertCount: number;
}

function groupKey(textureRef: string | null, tint: string | null, doubleSided: boolean): string {
  return `${textureRef ?? ""}|${tint ?? ""}|${doubleSided ? 1 : 0}`;
}

/** Append a quad to its group, choosing winding so the front face matches `normal`. */
function pushQuad(
  group: GroupBuf,
  corners: [Vec3, Vec3, Vec3, Vec3],
  uvs: Array<[number, number]>,
  normal: Vec3,
): void {
  const base = group.vertCount;
  for (let i = 0; i < 4; i++) {
    group.positions.push(corners[i][0], corners[i][1], corners[i][2]);
    group.normals.push(normal[0], normal[1], normal[2]);
    group.uvs.push(uvs[i][0], uvs[i][1]);
  }
  group.vertCount += 4;

  // Triangulate TL,TR,BR,BL. Flip if the geometric normal opposes the intended one.
  const geoNormal = cross(sub(corners[1], corners[0]), sub(corners[2], corners[0]));
  if (dot(geoNormal, normal) >= 0) {
    group.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  } else {
    group.indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
  }
}

// ─── public compile ────────────────────────────────────────────────────────────

/**
 * Compile resolved model instances for a block into baked geometry. `blockId` and
 * `states` drive biome tint for `tintindex` faces. Returns `empty: true` geometry
 * when nothing was produced.
 */
export function compileModel(
  instances: ModelInstance[],
  blockId: string,
  states: Record<string, string>,
): CompiledModel {
  const groups = new Map<string, GroupBuf>();
  const tint = tintColor(blockId, states);

  const getGroup = (textureRef: string | null, tinted: boolean, doubleSided: boolean): GroupBuf => {
    const t = tinted ? tint : null;
    const key = groupKey(textureRef, t, doubleSided);
    let g = groups.get(key);
    if (!g) {
      g = { textureRef, tint: t, doubleSided, positions: [], normals: [], uvs: [], indices: [], vertCount: 0 };
      groups.set(key, g);
    }
    return g;
  };

  for (const inst of instances) {
    for (const el of inst.model.elements ?? []) {
      const f = el.from;
      const t = el.to;
      const planar = f[0] === t[0] || f[1] === t[1] || f[2] === t[2];

      for (const dirKey of Object.keys(el.faces) as Dir[]) {
        const face = el.faces[dirKey] as ModelFace;
        const textureRef = resolveFaceTexture(face.texture, inst.textures);
        const tinted = face.tintindex !== undefined && face.tintindex >= 0;
        const group = getGroup(textureRef, tinted, planar);

        let corners = faceCorners(dirKey, f, t);
        let normal = DIR_NORMAL[dirKey];

        // 1. element rotation
        if (el.rotation) {
          const { origin, axis, angle, rescale } = el.rotation;
          corners = corners.map((c) => rotateAxis(c, origin, axis, angle, rescale)) as typeof corners;
          normal = rotateNormal(normal, axis, angle);
        }
        // 2. variant x then y rotation about the block centre (8,8,8)
        if (inst.x) {
          corners = corners.map((c) => rotateAxis(c, [8, 8, 8], "x", inst.x)) as typeof corners;
          normal = rotateNormal(normal, "x", inst.x);
        }
        if (inst.y) {
          corners = corners.map((c) => rotateAxis(c, [8, 8, 8], "y", inst.y)) as typeof corners;
          normal = rotateNormal(normal, "y", inst.y);
        }
        // 3. scale 1/16 + offset -0.5 → centred unit cell
        corners = corners.map((c) => [c[0] / 16 - 0.5, c[1] / 16 - 0.5, c[2] / 16 - 0.5]) as typeof corners;

        const uvs = faceUvs(face.uv ?? autoUv(dirKey, f, t), face.rotation);
        pushQuad(group, corners, uvs, normalize(normal));
      }
    }
  }

  return assemble([...groups.values()]);
}

function resolveFaceTexture(ref: string, textures: Record<string, string>): string | null {
  let value: string | undefined = ref;
  for (let i = 0; value && value.startsWith("#") && i < 8; i++) {
    value = textures[value.slice(1)];
  }
  return value && !value.startsWith("#") ? value : null;
}

/** Concatenate per-group buffers into the final interleaved typed arrays. */
function assemble(bufs: GroupBuf[]): CompiledModel {
  const nonEmpty = bufs.filter((b) => b.vertCount > 0);
  if (nonEmpty.length === 0) {
    return {
      positions: new Float32Array(0),
      normals: new Float32Array(0),
      uvs: new Float32Array(0),
      indices: new Uint32Array(0),
      groups: [],
      empty: true,
    };
  }

  const totalVerts = nonEmpty.reduce((s, b) => s + b.vertCount, 0);
  const totalIndices = nonEmpty.reduce((s, b) => s + b.indices.length, 0);
  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices = new Uint32Array(totalIndices);
  const groups: CompiledGroup[] = [];

  let vBase = 0;
  let iBase = 0;
  for (const b of nonEmpty) {
    positions.set(b.positions, vBase * 3);
    normals.set(b.normals, vBase * 3);
    uvs.set(b.uvs, vBase * 2);
    for (let i = 0; i < b.indices.length; i++) indices[iBase + i] = b.indices[i] + vBase;
    groups.push({
      textureRef: b.textureRef,
      tint: b.tint,
      doubleSided: b.doubleSided,
      start: iBase,
      count: b.indices.length,
    });
    vBase += b.vertCount;
    iBase += b.indices.length;
  }

  return { positions, normals, uvs, indices, groups, empty: false };
}
