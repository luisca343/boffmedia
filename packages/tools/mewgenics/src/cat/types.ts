// Mewgenics cat compositor types and data structures

export interface CatParts {
  body?: number
  head?: number
  ears?: number | { left: number; right: number }
  eyes?: number | { left: number; right: number }
  eyebrows?: number | { left: number; right: number }
  mouth?: number
  tail?: number
  legs?: number | { leg1: number; leg2: number }
  arms?: number | { arm1: number; arm2: number }
  texture?: number
  claws?: number
}

export interface CatEquipment {
  head?: number
  face?: number
  neck?: number
  weapon?: number
  trinket?: number
}

export interface CatCompositorProps {
  parts: CatParts
  palette: number
  pose?: {
    eyes?: "open" | "closed"
    mouth?: "normal" | "open" | "smile"
  }
  equipment?: CatEquipment
  size?: number
  /** Canvas backdrop (any CSS `background` value). Defaults to the paper the
   *  codex fiche uses; the builder passes its own so the stage reads as one
   *  surface instead of a cream square floating in a dark box. */
  background?: string
  /** Frame the cat by the pixels it actually paints instead of by the clip
   *  canvases `part_bounds` reports. Costs one 256px probe render; opt-in so
   *  the codex's tuned card art keeps its existing framing. */
  tightFit?: boolean
}

// 2D affine matrix as emitted by the extractor:
// a=sx, b=r0, c=r1, d=sy, e=tx, f=ty (canvas setTransform order)
export interface RigMatrix {
  sx: number
  sy: number
  r0: number
  r1: number
  tx: number
  ty: number
}

// One display-list entry of a rig sprite frame (catparts_placements.json)
export interface PlacementEntry {
  depth: number
  char?: number
  name?: string // instance name: lear/rear/leye/reye/mouth/tex/scars/ahead/aneck/aface
  matrix?: RigMatrix // absent = identity
}

export interface SpriteTimeline {
  id: number
  frame_count: number
  labels?: Record<string, number>
  frames: PlacementEntry[][]
}

// [xmin, ymin, xmax, ymax] in the clip's TRUE local coordinates (px).
// The exported SVGs' viewBoxes are NOT local coords (FFDec canvas offsets);
// render by mapping the SVG onto this rect, then applying the matrix chain.
export type PartBoundsRect = [number, number, number, number]

export interface CatPartsPlacements {
  _readme: string
  _charnames: Record<string, string>
  sprites: Record<string, SpriteTimeline>
  part_bounds: Record<string, Record<string, PartBoundsRect>>
}

export interface CatPartsData {
  part_counts_defined?: Record<string, number>
  exported_counts?: Record<string, number>
  palette_count?: number
  palette_algorithm?: string
  note?: string
  [key: string]: unknown
}
