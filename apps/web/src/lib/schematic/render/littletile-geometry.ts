/*
 * Geometry arrays for LittleTiles transformable boxes (slopes/wedges).
 *
 * The mod (LittleTransformableBox.requestCache, identical in 1.12 and 1.21)
 * renders the INTERSECTION of the tilted hexahedron with the box's own AABB:
 * tilted strips are cut against the six bound planes and the axis-aligned
 * faces are generated from the bounds, cut by the tilted planes. Corners may
 * legitimately lie far outside the bounds — extractBox splits a multi-block
 * slope per block by shrinking the bounds while keeping the ORIGINAL absolute
 * corners — so rendering the raw hexahedron spills into neighboring cells.
 * This module reproduces the mod's clipping (convex case; the mod's rare
 * inward-facing-strip special case is approximated).
 */

/**
 * Hexahedron faces over the decoded corner order (EUN, EUS, EDN, EDS, WUN,
 * WUS, WDN, WDS), wound CCW-outward. The last entry picks the UV projection
 * plane: 0 = XZ (up/down), 1 = XY (north/south), 2 = ZY (west/east).
 */
export const QUADS: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [4, 5, 1, 0, 0], // up
  [6, 2, 3, 7, 0], // down
  [6, 4, 0, 2, 1], // north
  [7, 3, 1, 5, 1], // south
  [6, 7, 5, 4, 2], // west
  [2, 0, 1, 3, 2], // east
];

/* Per QUADS face: the axis it faces (0=x,1=y,2=z) and which entry of the
 * 6-float bounds array holds that face's plane coordinate. */
const FACE_META: ReadonlyArray<readonly [number, number]> = [
  [1, 4], // up    → maxY
  [1, 1], // down  → minY
  [2, 2], // north → minZ
  [2, 5], // south → maxZ
  [0, 0], // west  → minX
  [0, 3], // east  → maxX
];

/* Bounds-corner signs in the same EUN…WDS order as the decoded corners:
 * [xIsMax, yIsMax, zIsMax]. */
const CORNER_SIGNS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 1, 0],
  [1, 1, 1],
  [1, 0, 0],
  [1, 0, 1],
  [0, 1, 0],
  [0, 1, 1],
  [0, 0, 0],
  [0, 0, 1],
];

const EPS = 1e-4;

type Vec3 = [number, number, number];

/** Sutherland–Hodgman: keep the half-space dot(n, p) ≤ d (+EPS). */
function clipPoly(poly: Vec3[], nx: number, ny: number, nz: number, d: number): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = a[0] * nx + a[1] * ny + a[2] * nz - d;
    const db = b[0] * nx + b[1] * ny + b[2] * nz - d;
    const aIn = da <= EPS;
    const bIn = db <= EPS;
    if (aIn) out.push(a);
    if (aIn !== bIn) {
      const t = da / (da - db);
      out.push([
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
      ]);
    }
  }
  return out;
}

export interface TransformedArrays {
  positions: Float32Array;
  uvs: Float32Array;
  colors: Float32Array | null;
  /** Cumulative emitted-vertex count after each box, for the layer cutoff. */
  boxVertEnd: Uint32Array;
}

/**
 * Build merged triangle arrays for a run of transformable boxes.
 *
 * `corners`: 24 floats per box (8 corners × xyz, absolute world coords).
 * `bounds`: 6 floats per box (world-space AABB of the box's stored min/max) —
 * when present, each box is clipped to its bounds the way the mod renders it;
 * when absent the raw hexahedron is emitted (legacy behavior). Boxes whose
 * corners already sit inside their bounds take the verbatim 36-vertex path,
 * so well-formed slopes are byte-identical to the pre-clipping output.
 */
export function buildTransformedArrays(
  corners: Float32Array,
  colors: Float32Array | undefined,
  bounds?: Float32Array,
): TransformedArrays {
  const count = corners.length / 24;
  const pos: number[] = [];
  const uv: number[] = [];
  const col: number[] | null = colors ? [] : null;
  const boxVertEnd = new Uint32Array(count);

  for (let i = 0; i < count; i++) {
    const r = colors ? colors[i * 3] : 1;
    const g = colors ? colors[i * 3 + 1] : 1;
    const b = colors ? colors[i * 3 + 2] : 1;
    const corner = (ci: number): Vec3 => [
      corners[i * 24 + ci * 3],
      corners[i * 24 + ci * 3 + 1],
      corners[i * 24 + ci * 3 + 2],
    ];
    const pushVert = (p: Vec3, uvMode: number): void => {
      pos.push(p[0], p[1], p[2]);
      if (uvMode === 0) uv.push(p[0], p[2]);
      else if (uvMode === 1) uv.push(p[0], p[1]);
      else uv.push(p[2], p[1]);
      col?.push(r, g, b);
    };
    const pushPoly = (poly: Vec3[], uvMode: number): void => {
      for (let k = 1; k + 1 < poly.length; k++) {
        pushVert(poly[0], uvMode);
        pushVert(poly[k], uvMode);
        pushVert(poly[k + 1], uvMode);
      }
    };

    const bb = bounds ? bounds.subarray(i * 6, i * 6 + 6) : undefined;
    let inside = true;
    if (bb) {
      for (let ci = 0; ci < 8 && inside; ci++) {
        for (let ax = 0; ax < 3; ax++) {
          const v = corners[i * 24 + ci * 3 + ax];
          if (v < bb[ax] - EPS || v > bb[3 + ax] + EPS) {
            inside = false;
            break;
          }
        }
      }
    }

    if (!bb || inside) {
      // Verbatim hexahedron: collapsed faces become zero-area triangles,
      // which THREE simply doesn't rasterize.
      for (const [a, b2, c2, d, m] of QUADS) {
        pushPoly([corner(a), corner(b2), corner(c2), corner(d)], m);
      }
      boxVertEnd[i] = pos.length / 3;
      continue;
    }

    // The six bound planes, as keep-inside half-spaces (mirrors the mod's
    // axis-aligned NormalPlane array in requestCache).
    const boundPlanes: Array<[number, number, number, number]> = [
      [-1, 0, 0, -bb[0]],
      [1, 0, 0, bb[3]],
      [0, -1, 0, -bb[1]],
      [0, 1, 0, bb[4]],
      [0, 0, -1, -bb[2]],
      [0, 0, 1, bb[5]],
    ];

    // Tilted faces: skip faces still lying in their bounds plane (the caps
    // cover those, exactly like the mod's checkEqual → continue), collect the
    // outward plane of each genuinely tilted face, clip it to the AABB.
    const tiltedPlanes: Array<[number, number, number, number]> = [];
    for (let f = 0; f < QUADS.length; f++) {
      const [a, b2, c2, d, m] = QUADS[f];
      const quad = [corner(a), corner(b2), corner(c2), corner(d)];
      const [axis, bIdx] = FACE_META[f];
      if (quad.every((p) => Math.abs(p[axis] - bb[bIdx]) <= EPS)) continue;

      // Newell normal — outward, since QUADS wind CCW-outward.
      let nx = 0;
      let ny = 0;
      let nz = 0;
      for (let k = 0; k < 4; k++) {
        const p = quad[k];
        const q = quad[(k + 1) % 4];
        nx += (p[1] - q[1]) * (p[2] + q[2]);
        ny += (p[2] - q[2]) * (p[0] + q[0]);
        nz += (p[0] - q[0]) * (p[1] + q[1]);
      }
      const len = Math.hypot(nx, ny, nz);
      if (len < 1e-5) continue; // collapsed face (e.g. a wedge's folded top)
      nx /= len;
      ny /= len;
      nz /= len;
      tiltedPlanes.push([nx, ny, nz, quad[0][0] * nx + quad[0][1] * ny + quad[0][2] * nz]);

      let poly: Vec3[] = quad;
      for (const [px, py, pz, pd] of boundPlanes) {
        poly = clipPoly(poly, px, py, pz, pd);
        if (poly.length < 3) break;
      }
      if (poly.length >= 3) pushPoly(poly, m);
    }

    // Axis caps: each bounds face cut by every tilted plane (the mod's axis
    // strips). Fully cut-away caps vanish; untouched caps stay full quads.
    for (let f = 0; f < QUADS.length; f++) {
      const [a, b2, c2, d, m] = QUADS[f];
      let poly: Vec3[] = [a, b2, c2, d].map((ci) => {
        const s = CORNER_SIGNS[ci];
        return [bb[s[0] ? 3 : 0], bb[s[1] ? 4 : 1], bb[s[2] ? 5 : 2]] as Vec3;
      });
      for (const [px, py, pz, pd] of tiltedPlanes) {
        poly = clipPoly(poly, px, py, pz, pd);
        if (poly.length < 3) break;
      }
      if (poly.length >= 3) pushPoly(poly, m);
    }

    boxVertEnd[i] = pos.length / 3;
  }

  return {
    positions: Float32Array.from(pos),
    uvs: Float32Array.from(uv),
    colors: col ? Float32Array.from(col) : null,
    boxVertEnd,
  };
}
