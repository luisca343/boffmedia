export type PreviewSide = "own" | "opponent";

export interface PreviewRoi {
  id: string;
  side: PreviewSide;
  slotIndex: number;
  /** Normalised against the centered 16:9 game viewport: 0..1. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The MIT-licensed `team-preview.safe-zone-roi.zh-Hans.v2.json` in
 * crazylei12/Pokemon-Champions-dmg_cal (commit 9f1f0ff) was useful for
 * confirming the 12-slot topology, but its Android safe zones do not match
 * the PC/OBS layout in our feed: they land on the small metadata icons to the
 * right of each card. The defaults below are the PC/OBS preset from the
 * supplied 16:9 frame and deliberately cover the large Pokemon sprites.
 *
 * Values are normalized against the preview viewport, so they scale with
 * 1920x1080 OBS input and remain editable through the calibration overlay.
 * The per-slot y values preserve the user's final manual calibration instead
 * of assuming that the cards are mathematically evenly spaced.
 */
const OBS_PREVIEW_ROIS: readonly PreviewRoi[] = [
  { id: "own-0", side: "own", slotIndex: 0, x: 0.1853, y: 0.1628, width: 0.058, height: 0.101 },
  { id: "own-1", side: "own", slotIndex: 1, x: 0.1853, y: 0.2828, width: 0.058, height: 0.101 },
  { id: "own-2", side: "own", slotIndex: 2, x: 0.1853, y: 0.3998, width: 0.058, height: 0.101 },
  { id: "own-3", side: "own", slotIndex: 3, x: 0.1853, y: 0.5138, width: 0.058, height: 0.101 },
  { id: "own-4", side: "own", slotIndex: 4, x: 0.1853, y: 0.6328, width: 0.058, height: 0.101 },
  { id: "own-5", side: "own", slotIndex: 5, x: 0.1853, y: 0.7498, width: 0.058, height: 0.101 },
  { id: "opponent-0", side: "opponent", slotIndex: 0, x: 0.7213, y: 0.1643, width: 0.058, height: 0.101 },
  { id: "opponent-1", side: "opponent", slotIndex: 1, x: 0.7213, y: 0.2828, width: 0.058, height: 0.101 },
  { id: "opponent-2", side: "opponent", slotIndex: 2, x: 0.7213, y: 0.3998, width: 0.058, height: 0.101 },
  { id: "opponent-3", side: "opponent", slotIndex: 3, x: 0.7213, y: 0.5138, width: 0.058, height: 0.101 },
  { id: "opponent-4", side: "opponent", slotIndex: 4, x: 0.7213, y: 0.6318, width: 0.058, height: 0.101 },
  { id: "opponent-5", side: "opponent", slotIndex: 5, x: 0.7213, y: 0.7498, width: 0.058, height: 0.101 },
];

export const DEFAULT_PREVIEW_ROIS: readonly PreviewRoi[] = OBS_PREVIEW_ROIS;

export function moveRoi(roi: PreviewRoi, deltaX: number, deltaY: number): PreviewRoi {
  return {
    ...roi,
    x: clamp(roi.x + deltaX, 0, 1 - roi.width),
    y: clamp(roi.y + deltaY, 0, 1 - roi.height),
  };
}

export function cropBounds(roi: PreviewRoi, sourceWidth: number, sourceHeight: number) {
  return {
    left: Math.max(0, Math.round(roi.x * sourceWidth)),
    top: Math.max(0, Math.round(roi.y * sourceHeight)),
    width: Math.max(1, Math.round(roi.width * sourceWidth)),
    height: Math.max(1, Math.round(roi.height * sourceHeight)),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
