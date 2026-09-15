import { toID } from "@boffmedia/pokemon-identity";

export interface RecognitionCandidate {
  id: string;
  name: string;
}

export interface TemplateProgress {
  completed: number;
  total: number;
  loaded: number;
  failed: number;
}

export interface RecognitionCandidateMatch {
  id: string;
  name: string;
  confidence: number;
}

export type RecognitionStatus = "match" | "review" | "unknown";

export interface SlotRecognition {
  slotId: string;
  status: RecognitionStatus;
  best: RecognitionCandidateMatch | null;
  candidates: RecognitionCandidateMatch[];
}

export interface RecognitionSlotSource {
  slotId: string;
  dataUrl: string;
  /** The game panel behind the crop; opponent panels use the red-safe flood. */
  side?: "own" | "opponent";
}

interface Signature {
  gray: Float32Array;
  coarseGray: Float32Array;
  edge: Uint8Array;
  hist: Float32Array;
  phash: Uint8Array;
  foreground: number;
}

interface FeatureWeights {
  phash: number;
  edge: number;
  color: number;
  template: number;
}

const FEATURE_SIZE = 96;
const COARSE_SIZE = 16;
const PHASH_SIZE = 8;
const PHASH_HIGH_FREQUENCY_FACTOR = 4;
const HISTOGRAM_HUE_BINS = 24;
const HISTOGRAM_SV_BINS = 16;
const COARSE_SPECIES_TOP_K = 24;
const DEFAULT_FEATURE_WEIGHTS: FeatureWeights = {
  phash: 0.22,
  edge: 0.24,
  color: 0.24,
  template: 0.3,
};
const OPPONENT_FEATURE_WEIGHTS: FeatureWeights = {
  phash: 0,
  edge: 0.4,
  color: 0.2,
  template: 0.4,
};
const TEMPLATE_AUTO_THRESHOLD = 0.9;
const TEMPLATE_REVIEW_THRESHOLD = 0.35;
const MIN_AUTO_MARGIN = 0.035;
const MAX_SHOWN_CANDIDATES = 3;
const TEMPLATE_CONCURRENCY = 6;
const CHAMPIONS_ASSET_ORIGIN = "https://championsbattledata.com";
const CHAMPIONS_INDEX_URL = `${CHAMPIONS_ASSET_ORIGIN}/api`;
const DCT_SIZE = PHASH_SIZE * PHASH_HIGH_FREQUENCY_FACTOR;
const DCT_COSINES = Array.from({ length: DCT_SIZE }, (_, frequency) =>
  Float32Array.from({ length: DCT_SIZE }, (_, sample) =>
    Math.cos((Math.PI * (2 * sample + 1) * frequency) / (2 * DCT_SIZE)),
  ),
);

// The feature layout and side-specific weights follow the MIT-licensed
// Pokemon-Champions-dmg_cal recognition pipeline:
// https://github.com/crazylei12/Pokemon-Champions-dmg_cal/blob/main/tools/recognition/pokemon-vision-pipeline.py
// The implementation below is browser-native, so it does not require shipping
// OpenCV.js to the preview.

const templateCache = new Map<string, Promise<Signature | null>>();
let championsSpriteIndex: Promise<Map<string, string>> | null = null;

/**
 * The local fallback keeps the preview useful when the API is unavailable. It
 * is loaded dynamically because @pkmn/dex is a large data package and should
 * remain behind the preview's lazy route.
 */
export async function getFallbackRecognitionCandidates(): Promise<
  RecognitionCandidate[]
> {
  const { Dex } = await import("@pkmn/dex");
  const seen = new Set<string>();

  return Dex.species
    .all()
    .filter(
      (species) => species.exists && species.num > 0 && !species.isNonstandard,
    )
    .map((species) => ({ id: toID(species.name), name: species.name }))
    .filter((candidate) => {
      if (!candidate.id || seen.has(candidate.id)) return false;
      seen.add(candidate.id);
      return true;
    });
}

/**
 * Match the calibrated crops against cached sprite templates. The matcher is
 * intentionally conservative: a close first match without a useful margin is
 * returned as "review", never auto-applied to a team slot.
 */
export async function recognizeSlotTemplates(
  slots: RecognitionSlotSource[],
  candidates: RecognitionCandidate[],
  onProgress?: (progress: TemplateProgress) => void,
): Promise<SlotRecognition[]> {
  if (slots.length === 0 || candidates.length === 0) return [];

  const observations = await Promise.all(
    slots.map(async (slot) => ({
      slotId: slot.slotId,
      side: slot.side ?? inferPanelSide(slot.slotId),
      signature: await signatureFromDataUrl(
        slot.dataUrl,
        slot.side ?? inferPanelSide(slot.slotId),
      ),
    })),
  );
  const uniqueCandidates = dedupeCandidates(candidates);
  let completed = 0;
  let loaded = 0;
  let failed = 0;
  const loadedTemplates: {
    candidate: RecognitionCandidate;
    signature: Signature;
    mirroredSignature: Signature;
  }[] = [];

  onProgress?.({ completed, total: uniqueCandidates.length, loaded, failed });

  await forEachConcurrent(
    uniqueCandidates,
    TEMPLATE_CONCURRENCY,
    async (candidate) => {
      const signature = await loadTemplateSignature(candidate);
      if (!signature) failed += 1;
      else {
        loaded += 1;
        loadedTemplates.push({
          candidate,
          signature,
          mirroredSignature: mirrorSignature(signature),
        });
      }
      completed += 1;
      onProgress?.({
        completed,
        total: uniqueCandidates.length,
        loaded,
        failed,
      });
    },
  );

  return observations.map((observation) => {
    if (!observation.signature || observation.signature.foreground < 0.01) {
      return {
        slotId: observation.slotId,
        status: "unknown" as const,
        best: null,
        candidates: [],
      };
    }

    const weights =
      observation.side === "opponent"
        ? OPPONENT_FEATURE_WEIGHTS
        : DEFAULT_FEATURE_WEIGHTS;
    const shortlist = loadedTemplates
      .map((entry) => ({
        ...entry,
        coarseScore:
          weights.phash *
            hashSimilarity(
              observation.signature!.phash,
              entry.signature.phash,
            ) +
          weights.color *
            histogramSimilarity(
              observation.signature!.hist,
              entry.signature.hist,
            ) +
          weights.template *
            normalizedCorrelation(
              observation.signature!.coarseGray,
              entry.signature.coarseGray,
            ),
      }))
      .sort((left, right) => right.coarseScore - left.coarseScore)
      .slice(0, COARSE_SPECIES_TOP_K);
    const matches = shortlist
      .map(({ candidate, signature, mirroredSignature }) => {
        const score = compareSignatures(
          observation.signature!,
          signature,
          mirroredSignature,
          weights,
        );
        return {
          id: candidate.id,
          name: candidate.name,
          confidence: score,
          score,
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, MAX_SHOWN_CANDIDATES);
    const candidatesForSlot = matches
      .slice(0, MAX_SHOWN_CANDIDATES)
      .map(({ id, name, score }) => ({
        id,
        name,
        confidence: score,
      }));
    const best = candidatesForSlot[0] ?? null;
    const margin = best
      ? best.confidence - (candidatesForSlot[1]?.confidence ?? 0)
      : 0;
    const status: RecognitionStatus =
      !best || best.confidence < TEMPLATE_REVIEW_THRESHOLD
        ? "unknown"
        : best.confidence >= TEMPLATE_AUTO_THRESHOLD &&
            margin >= MIN_AUTO_MARGIN
          ? "match"
          : "review";

    return {
      slotId: observation.slotId,
      status,
      best,
      candidates: candidatesForSlot,
    };
  });
}

function dedupeCandidates(
  candidates: RecognitionCandidate[],
): RecognitionCandidate[] {
  const seen = new Set<string>();
  return candidates.flatMap((candidate) => {
    const id = candidate.id || toID(candidate.name);
    if (!id || seen.has(id)) return [];
    seen.add(id);
    return [{ ...candidate, id }];
  });
}

async function forEachConcurrent<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        const item = items[cursor];
        cursor += 1;
        await worker(item);
      }
    },
  );
  await Promise.all(runners);
}

async function signatureFromDataUrl(
  dataUrl: string,
  side: "own" | "opponent",
): Promise<Signature | null> {
  try {
    const image = await loadImage(dataUrl);
    return signatureFromImage(image, false, side);
  } catch {
    return null;
  }
}

function inferPanelSide(slotId: string): "own" | "opponent" {
  return /^(?:opponent|enemy|rival)(?:[-_.]|$)/i.test(slotId)
    ? "opponent"
    : "own";
}

async function loadTemplateSignature(
  candidate: RecognitionCandidate,
): Promise<Signature | null> {
  const id = toID(candidate.id || candidate.name);
  const cached = templateCache.get(id);
  if (cached) return cached;

  const pending = loadTemplateSignatureUncached(candidate);
  templateCache.set(id, pending);
  const signature = await pending;
  if (!signature) templateCache.delete(id);
  return signature;
}

async function loadTemplateSignatureUncached(
  candidate: RecognitionCandidate,
): Promise<Signature | null> {
  for (const url of await templateUrls(candidate)) {
    try {
      const image = await loadImage(url);
      return signatureFromImage(image, true);
    } catch {
      // Try the direct form-name fallback, and let an unavailable form remain
      // a failed candidate instead of blocking the other slots.
    }
  }
  return null;
}

async function templateUrls(
  candidate: RecognitionCandidate,
): Promise<string[]> {
  const urls: string[] = [];
  const indexedUrl = (await getChampionsSpriteIndex()).get(
    toID(candidate.id || candidate.name),
  );
  if (indexedUrl) urls.push(indexedUrl);

  urls.push(...championsSpriteNameGuesses(candidate.name));
  return [...new Set(urls)];
}

/**
 * Champions Battle Data publishes the form-specific path for each asset in
 * its index. The name guesses below only cover a failed index request or a
 * newly-added form, and still point at Champions assets rather than generic
 * Showdown sprites.
 */
function championsSpriteNameGuesses(name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return [];

  const guesses = new Set<string>([trimmed, trimmed.replaceAll("-", " ")]);
  const parts = trimmed.split("-");
  const base = parts.shift() ?? trimmed;
  const form = parts.join("-");

  if (form === "F") guesses.add(`${base} Female`);
  if (form === "M") {
    // Showdown can expose the male form as Indeedee-M, while Champions' asset
    // index publishes that form under the un-suffixed Indeedee.png path.
    guesses.add(base);
    guesses.add(`${base} Male`);
  }
  if (form === "Alola") guesses.add(`Alolan ${base}`);
  if (form === "Galar") guesses.add(`Galarian ${base}`);
  if (form === "Hisui") guesses.add(`Hisuian ${base}`);
  if (form === "Paldea") guesses.add(`Paldean ${base}`);
  if (form === "Paldea-Aqua") guesses.add(`Paldean ${base} Aqua Breed`);
  if (form === "Paldea-Blaze") guesses.add(`Paldean ${base} Blaze Breed`);
  if (form === "Paldea-Combat") guesses.add(`Paldean ${base} Combat Breed`);
  if (form === "Mega") guesses.add(`Mega ${base}`);
  if (form === "Mega-X") guesses.add(`Mega ${base} X`);
  if (form === "Mega-Y") guesses.add(`Mega ${base} Y`);
  if (form === "Gmax") guesses.add(`Gigantamax ${base}`);

  return [...guesses].map(
    (guess) =>
      `${CHAMPIONS_ASSET_ORIGIN}/pokemon_champions_assets/pokemon/${encodeURIComponent(guess)}.png`,
  );
}

async function getChampionsSpriteIndex(): Promise<Map<string, string>> {
  if (!championsSpriteIndex) {
    championsSpriteIndex = fetchChampionsSpriteIndex();
  }
  return championsSpriteIndex;
}

async function fetchChampionsSpriteIndex(): Promise<Map<string, string>> {
  try {
    const response = await fetch(CHAMPIONS_INDEX_URL, { cache: "force-cache" });
    if (!response.ok) return new Map();

    const payload: unknown = await response.json();
    const entries =
      isRecord(payload) && Array.isArray(payload.pokemon)
        ? payload.pokemon
        : Array.isArray(payload)
          ? payload
          : [];
    const index = new Map<string, string>();

    entries.forEach((entry) => {
      if (!isRecord(entry)) return;
      const id = firstString(
        entry.showdownId,
        entry.showdownName,
        entry.name,
        entry.id,
      );
      const spritePath = findSpritePath(entry);
      if (!id || !spritePath) return;
      index.set(toID(id), toAbsoluteChampionsUrl(spritePath));
    });

    return index;
  } catch {
    // A temporary source/index failure should not prevent the local matcher
    // from trying the direct form-name guesses.
    return new Map();
  }
}

function findSpritePath(
  value: unknown,
  seen = new Set<object>(),
): string | null {
  if (typeof value === "string") {
    return /(?:^|\/)pokemon_champions_assets\/pokemon\/.*\.png(?:$|\?)/i.test(
      value,
    )
      ? value
      : null;
  }
  if (!value || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);

  const record = value as Record<string, unknown>;
  const preferredKeys = [
    "sprite",
    "sprites",
    "imagePath",
    "image_path",
    "image",
  ];
  for (const key of preferredKeys) {
    const result = findSpritePath(record[key], seen);
    if (result) return result;
  }
  for (const child of Object.values(record)) {
    const result = findSpritePath(child, seen);
    if (result) return result;
  }
  return null;
}

function firstString(...values: unknown[]): string | null {
  return (
    values.find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    ) ?? null
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toAbsoluteChampionsUrl(path: string): string {
  return new URL(path, `${CHAMPIONS_ASSET_ORIGIN}/`).toString();
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("template_load_failed"));
    image.src = source;
  });
}

function signatureFromImage(
  image: HTMLImageElement,
  transparent: boolean,
  side: "own" | "opponent" = "own",
): Signature | null {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (sourceWidth < 1 || sourceHeight < 1) return null;

  const scale = Math.min(1, 256 / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const hasTransparency = hasTransparentPixels(pixels);
  let mask =
    transparent && hasTransparency
      ? alphaMask(pixels)
      : buildForegroundMask(pixels, canvas.width, canvas.height, side);
  let foreground = countMask(mask);

  // This is the same last-resort behavior as the reference pipeline: if a
  // mask is unusably small, keep the crop rather than silently discarding the
  // slot. A bad crop is still surfaced by its score and review status.
  if (foreground < Math.max(8, canvas.width * canvas.height * 0.005)) {
    mask = new Uint8Array(canvas.width * canvas.height).fill(1);
    foreground = mask.length;
  }

  const bounds = maskBounds(mask, canvas.width, canvas.height);
  if (!bounds) return null;

  const features = buildFeatures(
    pixels,
    canvas.width,
    canvas.height,
    mask,
    bounds,
    transparent,
  );
  return {
    ...features,
    foreground: foreground / (canvas.width * canvas.height),
  };
}

function hasTransparentPixels(pixels: Uint8ClampedArray): boolean {
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 250) return true;
  }
  return false;
}

function alphaMask(pixels: Uint8ClampedArray): Uint8Array {
  const mask = new Uint8Array(pixels.length / 4);
  for (let index = 0; index < mask.length; index += 1) {
    if (pixels[index * 4 + 3] > 8) mask[index] = 1;
  }
  return mask;
}

function countMask(mask: Uint8Array): number {
  let count = 0;
  for (const value of mask) count += value;
  return count;
}

function buildForegroundMask(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  side: "own" | "opponent",
): Uint8Array {
  const strict = colorDistanceForegroundMask(pixels, width, height, 52, 32);
  const relaxed = colorDistanceForegroundMask(pixels, width, height, 42, 26);
  const color = chooseColorMaskVariant(strict, relaxed, width, height);
  const colorQuality = foregroundMaskQuality(color, width, height);
  if (colorQuality >= 3.5) return color;

  // Canvas has no OpenCV GrabCut. The reference project's browser equivalent
  // is a conservative panel flood, used only when the color mask is weak.
  const floodPixels = new Uint8ClampedArray(pixels);
  if (side === "opponent")
    removeOpponentPanelBackground(floodPixels, width, height);
  else removePanelBackground(floodPixels, width, height);
  const flood = selectForegroundComponents(
    alphaMask(floodPixels),
    width,
    height,
  );
  if (foregroundMaskQuality(flood, width, height) > colorQuality) return flood;
  return color;
}

function removePanelBackground(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  const background = floodMask(
    width,
    height,
    nearBorderPalette(pixels, width, height, 46),
  );
  for (let index = 0; index < background.length; index += 1) {
    if (background[index]) pixels[index * 4 + 3] = 0;
  }
}

/**
 * The opponent panel is red. A palette-only flood is too eager there: the
 * panel's dark red edge can bridge into dark/grey sprite pixels. The second
 * red flood is deliberately conservative, and only their intersection is
 * removed. This mirrors the proven opponent path used by the browser
 * recognizer we compared against.
 */
function removeOpponentPanelBackground(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  const palette = floodMask(
    width,
    height,
    nearBorderPalette(pixels, width, height, 46),
  );
  const red = floodMask(width, height, isRedPanelPixel(pixels));
  for (let index = 0; index < palette.length; index += 1) {
    if (palette[index] && red[index]) pixels[index * 4 + 3] = 0;
  }
}

function isRedPanelPixel(
  pixels: Uint8ClampedArray,
): (index: number) => boolean {
  return (index: number) => {
    const pixel = index * 4;
    const red = pixels[pixel];
    const green = pixels[pixel + 1];
    const blue = pixels[pixel + 2];
    if (red > 45 && red > green * 1.25 && red > blue * 1.1) return true;
    return (
      red > 175 && green > 160 && blue > 160 && red >= green && red >= blue - 4
    );
  };
}

interface BackgroundPrototype {
  rgb: [number, number, number];
  hsv: [number, number, number];
}

function colorDistanceForegroundMask(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  rgbThreshold: number,
  hsvThreshold: number,
): Uint8Array {
  const prototypes = sampleBackgroundPrototypes(pixels, width, height);
  const mask = new Uint8Array(width * height);

  for (let index = 0; index < mask.length; index += 1) {
    const pixel = index * 4;
    const red = pixels[pixel];
    const green = pixels[pixel + 1];
    const blue = pixels[pixel + 2];
    const [hue, saturation, value] = rgbToOpenCvHsv(red, green, blue);
    let minRgbDistance = Number.POSITIVE_INFINITY;
    let minHsvDistance = Number.POSITIVE_INFINITY;

    prototypes.forEach((prototype) => {
      const deltaRed = red - prototype.rgb[0];
      const deltaGreen = green - prototype.rgb[1];
      const deltaBlue = blue - prototype.rgb[2];
      minRgbDistance = Math.min(
        minRgbDistance,
        Math.sqrt(deltaRed ** 2 + deltaGreen ** 2 + deltaBlue ** 2),
      );

      const rawHue = Math.abs(hue - prototype.hsv[0]);
      const hueDelta = Math.min(rawHue, 180 - rawHue) * 1.6;
      const saturationDelta = (saturation - prototype.hsv[1]) * 0.45;
      const valueDelta = (value - prototype.hsv[2]) * 0.45;
      minHsvDistance = Math.min(
        minHsvDistance,
        Math.sqrt(hueDelta ** 2 + saturationDelta ** 2 + valueDelta ** 2),
      );
    });

    if (minRgbDistance > rgbThreshold && minHsvDistance > hsvThreshold)
      mask[index] = 1;
  }

  const opened = morphology(mask, width, height, "open");
  const closed = morphology(opened, width, height, "close");
  const cleaned = removeUiFrameArtifacts(closed, pixels, width, height);
  return selectForegroundComponents(cleaned, width, height);
}

function chooseColorMaskVariant(
  strict: Uint8Array,
  relaxed: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const strictPixels = countMask(strict);
  const relaxedPixels = countMask(relaxed);
  if (strictPixels === 0) return relaxed;
  if (relaxedPixels < strictPixels * 1.08) return strict;

  const overlap =
    intersectionCount(strict, relaxed) / Math.max(1, strictPixels);
  if (overlap < 0.82) return strict;

  const strictScore = foregroundMaskQuality(strict, width, height);
  const relaxedScore = foregroundMaskQuality(relaxed, width, height);
  if (relaxedScore < strictScore - 0.15) return strict;

  const bounds = maskBounds(relaxed, width, height);
  if (!bounds || bounds[2] >= width * 0.96 || bounds[3] >= height * 0.96)
    return strict;
  return relaxed;
}

function sampleBackgroundPrototypes(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): BackgroundPrototype[] {
  const boxes: [number, number, number, number][] = [
    [
      0,
      0,
      Math.max(1, Math.floor(width * 0.18)),
      Math.max(1, Math.floor(height * 0.18)),
    ],
    [
      Math.floor(width * 0.82),
      0,
      Math.max(1, Math.floor(width * 0.18)),
      Math.max(1, Math.floor(height * 0.18)),
    ],
    [
      0,
      Math.floor(height * 0.82),
      Math.max(1, Math.floor(width * 0.18)),
      Math.max(1, Math.floor(height * 0.18)),
    ],
    [
      Math.floor(width * 0.82),
      Math.floor(height * 0.82),
      Math.max(1, Math.floor(width * 0.18)),
      Math.max(1, Math.floor(height * 0.18)),
    ],
    [0, 0, width, Math.max(1, Math.floor(height * 0.05))],
    [
      0,
      Math.floor(height * 0.95),
      width,
      Math.max(1, Math.floor(height * 0.05)),
    ],
  ];

  return boxes.map(([left, top, boxWidth, boxHeight]) => {
    const red: number[] = [];
    const green: number[] = [];
    const blue: number[] = [];
    const hue: number[] = [];
    const saturation: number[] = [];
    const value: number[] = [];
    const right = Math.min(width, left + boxWidth);
    const bottom = Math.min(height, top + boxHeight);

    for (let y = Math.max(0, top); y < bottom; y += 1) {
      for (let x = Math.max(0, left); x < right; x += 1) {
        const pixel = (y * width + x) * 4;
        red.push(pixels[pixel]);
        green.push(pixels[pixel + 1]);
        blue.push(pixels[pixel + 2]);
        const hsv = rgbToOpenCvHsv(
          pixels[pixel],
          pixels[pixel + 1],
          pixels[pixel + 2],
        );
        hue.push(hsv[0]);
        saturation.push(hsv[1]);
        value.push(hsv[2]);
      }
    }

    return {
      rgb: [median(red), median(green), median(blue)],
      hsv: [median(hue), median(saturation), median(value)],
    };
  });
}

function rgbToOpenCvHsv(
  red: number,
  green: number,
  blue: number,
): [number, number, number] {
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  let hue = 0;

  if (delta > 0) {
    if (maximum === red) hue = ((green - blue) / delta) % 6;
    else if (maximum === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  return [hue / 2, maximum === 0 ? 0 : (delta / maximum) * 255, maximum];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  values.sort((left, right) => left - right);
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 0
    ? (values[middle - 1] + values[middle]) / 2
    : values[middle];
}

function morphology(
  mask: Uint8Array,
  width: number,
  height: number,
  operation: "open" | "close",
): Uint8Array {
  const first =
    operation === "open"
      ? erode(mask, width, height)
      : dilate(mask, width, height);
  return operation === "open"
    ? dilate(first, width, height)
    : erode(first, width, height);
}

function erode(mask: Uint8Array, width: number, height: number): Uint8Array {
  const result = new Uint8Array(mask.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let keep = true;
      for (let dy = -1; dy <= 1 && keep; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (
            nx < 0 ||
            nx >= width ||
            ny < 0 ||
            ny >= height ||
            !mask[ny * width + nx]
          ) {
            keep = false;
            break;
          }
        }
      }
      if (keep) result[y * width + x] = 1;
    }
  }
  return result;
}

function dilate(mask: Uint8Array, width: number, height: number): Uint8Array {
  const result = new Uint8Array(mask.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let keep = false;
      for (let dy = -1; dy <= 1 && !keep; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (
            nx >= 0 &&
            nx < width &&
            ny >= 0 &&
            ny < height &&
            mask[ny * width + nx]
          ) {
            keep = true;
            break;
          }
        }
      }
      if (keep) result[y * width + x] = 1;
    }
  }
  return result;
}

function removeUiFrameArtifacts(
  mask: Uint8Array,
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8Array {
  const seed = new Uint8Array(mask.length);
  for (let index = 0; index < seed.length; index += 1) {
    const pixel = index * 4;
    const [, saturation, value] = rgbToOpenCvHsv(
      pixels[pixel],
      pixels[pixel + 1],
      pixels[pixel + 2],
    );
    if (saturation <= 130 && value >= 130) seed[index] = 1;
  }
  const closedSeed = morphology(seed, width, height, "close");
  const edgeBand = new Uint8Array(mask.length);
  const leftBand = Math.max(2, Math.floor(width * 0.08));
  const rightBand = Math.max(2, Math.floor(width * 0.22));
  const topBand = Math.max(2, Math.floor(height * 0.08));
  const bottomBand = Math.max(2, Math.floor(height * 0.08));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (
        x < leftBand ||
        x >= width - rightBand ||
        y < topBand ||
        y >= height - bottomBand
      ) {
        edgeBand[y * width + x] = 1;
      }
    }
  }

  const result = new Uint8Array(mask);
  for (let index = 0; index < result.length; index += 1) {
    if (closedSeed[index] && edgeBand[index]) result[index] = 0;
  }
  return result;
}

function nearBorderPalette(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance: number,
): (index: number) => boolean {
  const palette: [number, number, number][] = [];
  const seen = new Set<string>();
  const sample = (index: number) => {
    const pixel = index * 4;
    const key = `${pixels[pixel] >> 4}_${pixels[pixel + 1] >> 4}_${pixels[pixel + 2] >> 4}`;
    if (seen.has(key)) return;
    seen.add(key);
    palette.push([pixels[pixel], pixels[pixel + 1], pixels[pixel + 2]]);
  };

  for (let x = 0; x < width; x += 1) {
    sample(x);
    sample((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    sample(y * width);
    sample(y * width + width - 1);
  }

  const toleranceSquared = tolerance ** 2;
  return (index: number) => {
    const pixel = index * 4;
    return palette.some(([red, green, blue]) => {
      const deltaRed = pixels[pixel] - red;
      const deltaGreen = pixels[pixel + 1] - green;
      const deltaBlue = pixels[pixel + 2] - blue;
      return (
        deltaRed ** 2 + deltaGreen ** 2 + deltaBlue ** 2 < toleranceSquared
      );
    });
  };
}

function floodMask(
  width: number,
  height: number,
  accepts: (index: number) => boolean,
): Uint8Array {
  const mask = new Uint8Array(width * height);
  const stack: number[] = [];
  const seed = (index: number) => {
    if (!mask[index] && accepts(index)) {
      mask[index] = 1;
      stack.push(index);
    }
  };

  for (let x = 0; x < width; x += 1) {
    seed(x);
    seed((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    seed(y * width);
    seed(y * width + width - 1);
  }

  while (stack.length > 0) {
    const index = stack.pop() ?? 0;
    const x = index % width;
    const neighbours = [
      x > 0 ? index - 1 : -1,
      x < width - 1 ? index + 1 : -1,
      index - width,
      index + width,
    ];
    neighbours.forEach((neighbour) => {
      if (
        neighbour < 0 ||
        neighbour >= width * height ||
        mask[neighbour] ||
        !accepts(neighbour)
      )
        return;
      mask[neighbour] = 1;
      stack.push(neighbour);
    });
  }

  return mask;
}

function selectForegroundComponents(
  mask: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const labels = new Int32Array(width * height).fill(-1);
  const stack: number[] = [];
  const components: { label: number; score: number }[] = [];
  const total = width * height;

  for (let start = 0; start < labels.length; start += 1) {
    if (labels[start] !== -1 || !mask[start]) continue;
    labels[start] = start;
    stack.push(start);
    let size = 0;
    let left = width;
    let right = -1;
    let top = height;
    let bottom = -1;
    let sumX = 0;
    let sumY = 0;

    while (stack.length > 0) {
      const index = stack.pop() ?? 0;
      const x = index % width;
      const y = Math.floor(index / width);
      size += 1;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      sumX += x;
      sumY += y;

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const neighbour = ny * width + nx;
          if (labels[neighbour] !== -1 || !mask[neighbour]) continue;
          labels[neighbour] = start;
          stack.push(neighbour);
        }
      }
    }

    if (
      size < Math.max(14, total * 0.0015) ||
      right - left + 1 < width * 0.06 ||
      bottom - top + 1 < height * 0.06
    )
      continue;
    const centerX = sumX / size;
    const centerY = sumY / size;
    const dx = (centerX - width / 2) / Math.max(1, width);
    const dy = (centerY - height / 2) / Math.max(1, height);
    const centerWeight = 1 / (1 + Math.sqrt(dx * dx + dy * dy) * 2.2);
    const touchesBorder =
      left === 0 || top === 0 || right + 1 >= width || bottom + 1 >= height;
    components.push({
      label: start,
      score: size * centerWeight * (touchesBorder ? 0.65 : 1),
    });
  }

  if (components.length === 0) return mask;
  const bestScore = Math.max(...components.map((component) => component.score));
  const selected = new Uint8Array(mask.length);
  components.forEach((component) => {
    if (component.score < bestScore * 0.2) return;
    for (let index = 0; index < labels.length; index += 1) {
      if (labels[index] === component.label) selected[index] = 1;
    }
  });
  return selected;
}

function maskBounds(
  mask: Uint8Array,
  width: number,
  height: number,
): [number, number, number, number] | null {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!mask[y * width + x]) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  return right < left || bottom < top
    ? null
    : [left, top, right - left + 1, bottom - top + 1];
}

function foregroundMaskQuality(
  mask: Uint8Array,
  width: number,
  height: number,
): number {
  const foreground = countMask(mask);
  if (foreground < Math.max(8, width * height * 0.003)) return -10;
  const bounds = maskBounds(mask, width, height);
  if (!bounds) return -10;
  const [left, top, boxWidth, boxHeight] = bounds;
  const ratio = foreground / (width * height);
  const border = Math.max(1, Math.floor(Math.min(width, height) * 0.03));
  let borderForeground = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (
        mask[y * width + x] &&
        (x < border ||
          x >= width - border ||
          y < border ||
          y >= height - border)
      ) {
        borderForeground += 1;
      }
    }
  }
  const borderPixels = Math.max(
    1,
    2 * border * width + 2 * Math.max(0, height - 2 * border) * border,
  );
  const touches =
    left <= 1 ||
    top <= 1 ||
    left + boxWidth >= width - 1 ||
    top + boxHeight >= height - 1;
  let score = ratio >= 0.035 && ratio <= 0.65 ? 2 : -1.5;
  score += boxWidth / width <= 0.92 ? 1 : -1;
  score += boxHeight / height <= 0.92 ? 1 : -1;
  score -= (borderForeground / borderPixels) * 4;
  if (touches) score -= 0.8;
  const centerX = left + boxWidth * 0.5;
  const centerY = top + boxHeight * 0.5;
  score -=
    (Math.abs(centerX - width * 0.5) / Math.max(1, width) +
      Math.abs(centerY - height * 0.5) / Math.max(1, height)) *
    0.75;
  return score;
}

function paddedBounds(
  bounds: [number, number, number, number],
  width: number,
  height: number,
  ratio: number,
): [number, number, number, number] {
  const padding = Math.max(
    2,
    Math.floor(Math.max(bounds[2], bounds[3]) * ratio),
  );
  const left = Math.max(0, bounds[0] - padding);
  const top = Math.max(0, bounds[1] - padding);
  const right = Math.min(width, bounds[0] + bounds[2] + padding);
  const bottom = Math.min(height, bounds[1] + bounds[3] + padding);
  return [left, top, right - left, bottom - top];
}

function buildFeatures(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  mask: Uint8Array,
  bounds: [number, number, number, number],
  zeroOutsideMask: boolean,
): Pick<Signature, "gray" | "coarseGray" | "edge" | "hist" | "phash"> {
  const [left, top, boxWidth, boxHeight] = paddedBounds(
    bounds,
    width,
    height,
    0.06,
  );
  const side = Math.max(boxWidth, boxHeight);
  const normalizedCrop = normalizeColorCrop(
    pixels,
    width,
    height,
    mask,
    [left, top, boxWidth, boxHeight],
    zeroOutsideMask,
  );
  const colorSquare = new Float32Array(side * side * 3);
  const maskSquare = new Float32Array(side * side);
  const offsetX = Math.floor((side - boxWidth) / 2);
  const offsetY = Math.floor((side - boxHeight) / 2);

  for (let y = 0; y < boxHeight; y += 1) {
    for (let x = 0; x < boxWidth; x += 1) {
      const sourceIndex = (top + y) * width + left + x;
      const targetIndex = (offsetY + y) * side + offsetX + x;
      if (!mask[sourceIndex]) continue;
      maskSquare[targetIndex] = 1;
      const normalizedIndex = (y * boxWidth + x) * 3;
      colorSquare[targetIndex * 3] = normalizedCrop[normalizedIndex];
      colorSquare[targetIndex * 3 + 1] = normalizedCrop[normalizedIndex + 1];
      colorSquare[targetIndex * 3 + 2] = normalizedCrop[normalizedIndex + 2];
    }
  }

  const color = downsample(colorSquare, side, FEATURE_SIZE, 3);
  const resizedMask = resizeMaskNearest(maskSquare, side, FEATURE_SIZE);
  const gray = new Float32Array(FEATURE_SIZE * FEATURE_SIZE);
  for (let index = 0; index < gray.length; index += 1) {
    gray[index] =
      0.299 * color[index * 3] +
      0.587 * color[index * 3 + 1] +
      0.114 * color[index * 3 + 2];
  }
  for (let index = 0; index < gray.length; index += 1) {
    if (resizedMask[index] < 0.5) gray[index] = 0;
  }

  return {
    gray,
    coarseGray: downsample(gray, FEATURE_SIZE, COARSE_SIZE, 1),
    edge: edgeFingerprint(gray, resizedMask, FEATURE_SIZE),
    hist: colorHistogram(color, resizedMask),
    phash: perceptualHash(gray),
  };
}

function normalizeColorCrop(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  mask: Uint8Array,
  bounds: [number, number, number, number],
  zeroOutsideMask: boolean,
): Float32Array {
  const [left, top, cropWidth, cropHeight] = bounds;
  const count = cropWidth * cropHeight;
  const luminance = new Uint8Array(count);
  const labA = new Float32Array(count);
  const labB = new Float32Array(count);

  for (let y = 0; y < cropHeight; y += 1) {
    for (let x = 0; x < cropWidth; x += 1) {
      const sourceIndex = (top + y) * width + left + x;
      const targetIndex = y * cropWidth + x;
      const sourcePixel = sourceIndex * 4;
      const isForeground = mask[sourceIndex] !== 0;
      const red = zeroOutsideMask && !isForeground ? 0 : pixels[sourcePixel];
      const green =
        zeroOutsideMask && !isForeground ? 0 : pixels[sourcePixel + 1];
      const blue =
        zeroOutsideMask && !isForeground ? 0 : pixels[sourcePixel + 2];
      const [lightness, a, b] = rgbToLab(red, green, blue);
      luminance[targetIndex] = Math.round((lightness / 100) * 255);
      labA[targetIndex] = a;
      labB[targetIndex] = b;
    }
  }

  const enhancedLuminance = clahe(luminance, cropWidth, cropHeight, 1.6, 4, 4);
  const normalized = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const [red, green, blue] = labToRgb(
      (enhancedLuminance[index] / 255) * 100,
      labA[index],
      labB[index],
    );
    normalized[index * 3] = red;
    normalized[index * 3 + 1] = green;
    normalized[index * 3 + 2] = blue;
  }
  return normalized;
}

function rgbToLab(
  red: number,
  green: number,
  blue: number,
): [number, number, number] {
  const redLinear = srgbToLinear(red / 255);
  const greenLinear = srgbToLinear(green / 255);
  const blueLinear = srgbToLinear(blue / 255);
  const x =
    (redLinear * 0.4124564 + greenLinear * 0.3575761 + blueLinear * 0.1804375) /
    0.95047;
  const y =
    redLinear * 0.2126729 + greenLinear * 0.7151522 + blueLinear * 0.072175;
  const z =
    (redLinear * 0.0193339 + greenLinear * 0.119192 + blueLinear * 0.9503041) /
    1.08883;
  const fx = labPivot(x);
  const fy = labPivot(y);
  const fz = labPivot(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labToRgb(
  lightness: number,
  a: number,
  b: number,
): [number, number, number] {
  const fy = (lightness + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const x = 0.95047 * labPivotInverse(fx);
  const y = labPivotInverse(fy);
  const z = 1.08883 * labPivotInverse(fz);
  const red = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  const green = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  const blue = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
  return [
    linearToSrgb(red) * 255,
    linearToSrgb(green) * 255,
    linearToSrgb(blue) * 255,
  ];
}

function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

function labPivot(value: number): number {
  return value > 0.008856451679035631
    ? Math.cbrt(value)
    : 7.787037037037037 * value + 16 / 116;
}

function labPivotInverse(value: number): number {
  const cube = value ** 3;
  return cube > 0.008856451679035631
    ? cube
    : (value - 16 / 116) / 7.787037037037037;
}

function clahe(
  luminance: Uint8Array,
  width: number,
  height: number,
  clipLimit: number,
  tileColumns: number,
  tileRows: number,
): Uint8Array {
  const columns = Math.min(tileColumns, Math.max(1, width));
  const rows = Math.min(tileRows, Math.max(1, height));
  const tileWidth = Math.max(1, Math.ceil(width / columns));
  const tileHeight = Math.max(1, Math.ceil(height / rows));
  const lookupTables = new Uint8Array(columns * rows * 256);

  for (let tileY = 0; tileY < rows; tileY += 1) {
    const top = tileY * tileHeight;
    const bottom = Math.min(height, top + tileHeight);
    for (let tileX = 0; tileX < columns; tileX += 1) {
      const left = tileX * tileWidth;
      const right = Math.min(width, left + tileWidth);
      const tileArea = Math.max(1, (right - left) * (bottom - top));
      const histogram = new Uint32Array(256);
      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1)
          histogram[luminance[y * width + x]] += 1;
      }

      const limit = Math.max(1, Math.floor((clipLimit * tileArea) / 256));
      let clipped = 0;
      for (let index = 0; index < histogram.length; index += 1) {
        if (histogram[index] <= limit) continue;
        clipped += histogram[index] - limit;
        histogram[index] = limit;
      }
      const redistribution = Math.floor(clipped / histogram.length);
      let residual = clipped - redistribution * histogram.length;
      if (redistribution > 0) {
        for (let index = 0; index < histogram.length; index += 1)
          histogram[index] += redistribution;
      }
      if (residual > 0) {
        const step = Math.max(1, Math.floor(histogram.length / residual));
        for (
          let index = 0;
          index < histogram.length && residual > 0;
          index += step
        ) {
          histogram[index] += 1;
          residual -= 1;
        }
      }

      const tableOffset = (tileY * columns + tileX) * 256;
      let cumulative = 0;
      for (let index = 0; index < histogram.length; index += 1) {
        cumulative += histogram[index];
        lookupTables[tableOffset + index] = Math.max(
          0,
          Math.min(255, Math.round((cumulative * 255) / tileArea)),
        );
      }
    }
  }

  const result = new Uint8Array(luminance.length);
  for (let y = 0; y < height; y += 1) {
    const tilePositionY = (y + 0.5) / tileHeight - 0.5;
    const tileY = Math.floor(tilePositionY);
    const topTile = Math.max(0, Math.min(rows - 1, tileY));
    const bottomTile = Math.max(0, Math.min(rows - 1, tileY + 1));
    const yWeight =
      tileY < 0 ? 0 : tileY >= rows - 1 ? 1 : tilePositionY - tileY;
    for (let x = 0; x < width; x += 1) {
      const tilePositionX = (x + 0.5) / tileWidth - 0.5;
      const tileX = Math.floor(tilePositionX);
      const leftTile = Math.max(0, Math.min(columns - 1, tileX));
      const rightTile = Math.max(0, Math.min(columns - 1, tileX + 1));
      const xWeight =
        tileX < 0 ? 0 : tileX >= columns - 1 ? 1 : tilePositionX - tileX;
      const value = luminance[y * width + x];
      const topLeft =
        lookupTables[(topTile * columns + leftTile) * 256 + value];
      const topRight =
        lookupTables[(topTile * columns + rightTile) * 256 + value];
      const bottomLeft =
        lookupTables[(bottomTile * columns + leftTile) * 256 + value];
      const bottomRight =
        lookupTables[(bottomTile * columns + rightTile) * 256 + value];
      const topValue = topLeft + (topRight - topLeft) * xWeight;
      const bottomValue = bottomLeft + (bottomRight - bottomLeft) * xWeight;
      result[y * width + x] = Math.max(
        0,
        Math.min(
          255,
          Math.round(topValue + (bottomValue - topValue) * yWeight),
        ),
      );
    }
  }
  return result;
}

function resizeMaskNearest(
  source: Float32Array,
  side: number,
  size: number,
): Float32Array {
  const result = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    const sourceY = Math.min(side - 1, Math.floor(((y + 0.5) * side) / size));
    for (let x = 0; x < size; x += 1) {
      const sourceX = Math.min(side - 1, Math.floor(((x + 0.5) * side) / size));
      result[y * size + x] = source[sourceY * side + sourceX];
    }
  }
  return result;
}

function downsample(
  source: Float32Array,
  side: number,
  size: number,
  channels: number,
): Float32Array {
  const result = new Float32Array(size * size * channels);
  for (let y = 0; y < size; y += 1) {
    const top = Math.floor((y * side) / size);
    const bottom = Math.max(top + 1, Math.floor(((y + 1) * side) / size));
    for (let x = 0; x < size; x += 1) {
      const left = Math.floor((x * side) / size);
      const right = Math.max(left + 1, Math.floor(((x + 1) * side) / size));
      const target = (y * size + x) * channels;
      let count = 0;
      for (let sourceY = top; sourceY < bottom; sourceY += 1) {
        for (let sourceX = left; sourceX < right; sourceX += 1) {
          const sourceIndex = (sourceY * side + sourceX) * channels;
          for (let channel = 0; channel < channels; channel += 1)
            result[target + channel] += source[sourceIndex + channel];
          count += 1;
        }
      }
      for (let channel = 0; channel < channels; channel += 1)
        result[target + channel] /= count;
    }
  }
  return result;
}

function edgeFingerprint(
  gray: Float32Array,
  mask: Float32Array,
  size: number,
): Uint8Array {
  const magnitude = new Float32Array(size * size);
  const direction = new Uint8Array(size * size);
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const index = y * size + x;
      if (mask[index] < 0.5) continue;
      const topLeft = gray[index - size - 1];
      const top = gray[index - size];
      const topRight = gray[index - size + 1];
      const left = gray[index - 1];
      const right = gray[index + 1];
      const bottomLeft = gray[index + size - 1];
      const bottom = gray[index + size];
      const bottomRight = gray[index + size + 1];
      const horizontal =
        -topLeft + topRight - 2 * left + 2 * right - bottomLeft + bottomRight;
      const vertical =
        -topLeft - 2 * top - topRight + bottomLeft + 2 * bottom + bottomRight;
      const angle = (Math.atan2(vertical, horizontal) * 180) / Math.PI;
      const normalizedAngle = angle < 0 ? angle + 180 : angle;
      magnitude[index] = Math.abs(horizontal) + Math.abs(vertical);
      direction[index] =
        normalizedAngle < 22.5 || normalizedAngle >= 157.5
          ? 0
          : normalizedAngle < 67.5
            ? 1
            : normalizedAngle < 112.5
              ? 2
              : 3;
    }
  }

  // OpenCV's Canny(60, 150) is the reference edge feature. This keeps the
  // same two-threshold hysteresis in a browser-native implementation without
  // bringing OpenCV.js into the tool bundle.
  const strong = new Uint8Array(size * size);
  const weak = new Uint8Array(size * size);
  const neighbourOffsets = [
    [
      [0, -1],
      [0, 1],
    ],
    [
      [-1, -1],
      [1, 1],
    ],
    [
      [-1, 0],
      [1, 0],
    ],
    [
      [1, -1],
      [-1, 1],
    ],
  ] as const;
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const index = y * size + x;
      if (mask[index] < 0.5 || magnitude[index] < 60) continue;
      const [first, second] = neighbourOffsets[direction[index]];
      const firstMagnitude = magnitude[(y + first[1]) * size + x + first[0]];
      const secondMagnitude = magnitude[(y + second[1]) * size + x + second[0]];
      if (
        magnitude[index] < firstMagnitude ||
        magnitude[index] < secondMagnitude
      )
        continue;
      if (magnitude[index] >= 150) strong[index] = 1;
      else weak[index] = 1;
    }
  }

  const edge = new Uint8Array(size * size);
  const stack: number[] = [];
  for (let index = 0; index < strong.length; index += 1) {
    if (strong[index]) {
      edge[index] = 1;
      stack.push(index);
    }
  }
  while (stack.length > 0) {
    const index = stack.pop() ?? 0;
    const x = index % size;
    const y = Math.floor(index / size);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
        const neighbour = ny * size + nx;
        if (!weak[neighbour] || edge[neighbour]) continue;
        edge[neighbour] = 1;
        stack.push(neighbour);
      }
    }
  }
  return edge;
}

function colorHistogram(color: Float32Array, mask: Float32Array): Float32Array {
  const histogram = new Float32Array(HISTOGRAM_HUE_BINS * HISTOGRAM_SV_BINS);
  let total = 0;
  for (let index = 0; index < mask.length; index += 1) {
    if (mask[index] < 0.5) continue;
    const [hue, saturation] = rgbToOpenCvHsv(
      color[index * 3],
      color[index * 3 + 1],
      color[index * 3 + 2],
    );
    const hueBin = Math.min(
      HISTOGRAM_HUE_BINS - 1,
      Math.floor((hue / 180) * HISTOGRAM_HUE_BINS),
    );
    const saturationBin = Math.min(
      HISTOGRAM_SV_BINS - 1,
      Math.floor((saturation / 256) * HISTOGRAM_SV_BINS),
    );
    histogram[hueBin * HISTOGRAM_SV_BINS + saturationBin] += 1;
    total += 1;
  }
  if (total > 0) {
    for (let index = 0; index < histogram.length; index += 1)
      histogram[index] /= total;
  }
  return histogram;
}

function perceptualHash(gray: Float32Array): Uint8Array {
  const resized = downsample(gray, FEATURE_SIZE, DCT_SIZE, 1);
  const horizontal = new Float32Array(DCT_SIZE * DCT_SIZE);
  const coefficients = new Float32Array(DCT_SIZE * DCT_SIZE);

  // The reference computes a 32x32 DCT before taking the low 8x8 block. Do
  // it separably here so the browser does not repeat four nested loops for
  // every one of the hundreds of Champions templates.
  for (let y = 0; y < DCT_SIZE; y += 1) {
    for (let xFrequency = 0; xFrequency < DCT_SIZE; xFrequency += 1) {
      let sum = 0;
      for (let x = 0; x < DCT_SIZE; x += 1) {
        sum += resized[y * DCT_SIZE + x] * DCT_COSINES[xFrequency][x];
      }
      horizontal[y * DCT_SIZE + xFrequency] = sum;
    }
  }
  for (let yFrequency = 0; yFrequency < DCT_SIZE; yFrequency += 1) {
    for (let xFrequency = 0; xFrequency < DCT_SIZE; xFrequency += 1) {
      let sum = 0;
      for (let y = 0; y < DCT_SIZE; y += 1) {
        sum +=
          horizontal[y * DCT_SIZE + xFrequency] * DCT_COSINES[yFrequency][y];
      }
      coefficients[yFrequency * DCT_SIZE + xFrequency] = sum;
    }
  }

  const lowFrequency = [];
  for (let y = 1; y < PHASH_SIZE; y += 1) {
    for (let x = 1; x < PHASH_SIZE; x += 1)
      lowFrequency.push(coefficients[y * DCT_SIZE + x]);
  }
  const threshold = median(lowFrequency);
  const hash = new Uint8Array(PHASH_SIZE * PHASH_SIZE);
  for (let y = 0; y < PHASH_SIZE; y += 1) {
    for (let x = 0; x < PHASH_SIZE; x += 1) {
      if (coefficients[y * DCT_SIZE + x] > threshold)
        hash[y * PHASH_SIZE + x] = 1;
    }
  }
  return hash;
}

function compareSignatures(
  observation: Signature,
  template: Signature,
  mirroredTemplate: Signature,
  weights: FeatureWeights,
): number {
  const normal = weightedSimilarity(observation, template, weights);
  const mirrored = weightedSimilarity(observation, mirroredTemplate, weights);
  return Math.min(1, Math.max(0, normal, mirrored));
}

function weightedSimilarity(
  left: Signature,
  right: Signature,
  weights: FeatureWeights,
): number {
  const scores = {
    phash: hashSimilarity(left.phash, right.phash),
    edge: binaryIoU(left.edge, right.edge),
    color: histogramSimilarity(left.hist, right.hist),
    template: templateSimilarity(left.gray, right.gray),
  };
  return clamp01(
    scores.phash * weights.phash +
      scores.edge * weights.edge +
      scores.color * weights.color +
      scores.template * weights.template,
  );
}

function mirrorSignature(signature: Signature): Signature {
  const gray = mirrorFloatGrid(signature.gray, FEATURE_SIZE);
  return {
    gray,
    coarseGray: mirrorFloatGrid(signature.coarseGray, COARSE_SIZE),
    edge: mirrorByteGrid(signature.edge, FEATURE_SIZE),
    hist: signature.hist,
    phash: perceptualHash(gray),
    foreground: signature.foreground,
  };
}

function mirrorFloatGrid(values: Float32Array, size: number): Float32Array {
  const mirrored = new Float32Array(values.length);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const source = y * size + x;
      const target = y * size + size - x - 1;
      mirrored[target] = values[source];
    }
  }
  return mirrored;
}

function mirrorByteGrid(values: Uint8Array, size: number): Uint8Array {
  const mirrored = new Uint8Array(values.length);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      mirrored[y * size + size - x - 1] = values[y * size + x];
    }
  }
  return mirrored;
}

function hashSimilarity(left: Uint8Array, right: Uint8Array): number {
  let different = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) different += 1;
  }
  return left.length === 0 ? 0 : 1 - different / left.length;
}

function binaryIoU(left: Uint8Array, right: Uint8Array): number {
  let intersection = 0;
  let union = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] || right[index]) {
      union += 1;
      if (left[index] && right[index]) intersection += 1;
    }
  }
  return union === 0 ? 0 : intersection / union;
}

function intersectionCount(left: Uint8Array, right: Uint8Array): number {
  let count = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] && right[index]) count += 1;
  }
  return count;
}

function histogramSimilarity(left: Float32Array, right: Float32Array): number {
  return normalizedCorrelation(left, right);
}

function templateSimilarity(left: Float32Array, right: Float32Array): number {
  return normalizedCorrelation(left, right);
}

function normalizedCorrelation(
  left: Float32Array,
  right: Float32Array,
): number {
  if (left.length === 0 || left.length !== right.length) return 0;
  let leftMean = 0;
  let rightMean = 0;
  for (let index = 0; index < left.length; index += 1) {
    leftMean += left[index];
    rightMean += right[index];
  }
  leftMean /= left.length;
  rightMean /= right.length;

  let numerator = 0;
  let leftVariance = 0;
  let rightVariance = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftDelta = left[index] - leftMean;
    const rightDelta = right[index] - rightMean;
    numerator += leftDelta * rightDelta;
    leftVariance += leftDelta ** 2;
    rightVariance += rightDelta ** 2;
  }
  if (leftVariance === 0 || rightVariance === 0) return 0;
  return clamp01((numerator / Math.sqrt(leftVariance * rightVariance) + 1) / 2);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
