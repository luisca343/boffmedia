export interface UsageTxtEntry {
  rank:         number;
  name:         string;
  usagePercent: number;
  rawCount:     number;
}

/**
 * Parses a Smogon stats.txt file into a ranked usage list.
 * Matches data rows: | rank | Name | usage% | rawCount | ...
 */
export function parseUsageTxt(text: string): UsageTxtEntry[] {
  const results: UsageTxtEntry[] = [];
  const re = /\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([\d.]+)%\s*\|\s*(\d+)\s*\|/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    results.push({
      rank:         parseInt(match[1], 10),
      name:         match[2].trim(),
      usagePercent: parseFloat(match[3]),
      rawCount:     parseInt(match[4], 10),
    });
  }
  return results;
}
