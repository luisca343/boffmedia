const NUMERALS: [string, number][] = [
  ["C", 100],
  ["XC", 90],
  ["L", 50],
  ["XL", 40],
  ["X", 10],
  ["IX", 9],
  ["V", 5],
  ["IV", 4],
  ["I", 1],
]

/** The season numeral — «Temporada IV». Nothing here counts past a hundred seasons. */
export function roman(n: number): string {
  let rest = Math.floor(n)
  if (!Number.isFinite(rest) || rest <= 0) return ""
  let out = ""
  for (const [numeral, value] of NUMERALS) {
    while (rest >= value) {
      out += numeral
      rest -= value
    }
  }
  return out
}
