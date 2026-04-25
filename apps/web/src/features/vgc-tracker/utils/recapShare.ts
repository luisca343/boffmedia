export interface RecapSummary {
  v: 1;
  label: string;
  format: string;
  reg: string;
  type: 'ladder' | 'tournament';
  w: number;
  l: number;
  d: number;
  startElo?: number;
  curElo?: number;
  bestElo?: number;
  pkmn: string[];
}

export function encodeRecap(summary: RecapSummary): string {
  return btoa(encodeURIComponent(JSON.stringify(summary)));
}

export function decodeRecap(encoded: string): RecapSummary | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(encoded)));
    if (parsed?.v !== 1) return null;
    return parsed as RecapSummary;
  } catch {
    return null;
  }
}

export function buildShareUrl(summary: RecapSummary, origin: string): string {
  return `${origin}/pokemon/vgc/tracker/share?d=${encodeRecap(summary)}`;
}
