import type { PasaporteProfileEntity } from "@boffmedia/shared"

/**
 * THIS IS A DECORATIVE CODE. It is not a QR code and nothing can read it.
 *
 * It borrows the silhouette of one — three finder eyes, a timing line, an alignment block,
 * a field of modules — because that is what a passport's machine-readable patch looks like
 * to a reader. The modules are seeded noise, not an encoding: there is no payload, no error
 * correction, and scanning it with a phone yields nothing. It is stable per trainer (the
 * seed is their real trainerId and uuid) and different between trainers, which is the whole
 * of what it promises. Never present it as scannable.
 */
export function qrMatrix(seed: string, n = 25): boolean[][] {
  const grid: boolean[][] = Array.from({ length: n }, () => Array<boolean>(n).fill(false))
  const reserved: boolean[][] = Array.from({ length: n }, () => Array<boolean>(n).fill(false))

  // FNV-1a over the seed, then xorshift32 — a deterministic fill, so the same trainer's
  // patch is identical on every render, on every device, forever.
  let h = 2166136261
  for (const ch of String(seed)) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  let state = h >>> 0
  const rnd = () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state / 4294967296
  }

  const finder = (r: number, c: number) => {
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const rr = r + i
        const cc = c + j
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue
        reserved[rr][cc] = true
        const border = (i >= 0 && i <= 6 && (j === 0 || j === 6)) || (j >= 0 && j <= 6 && (i === 0 || i === 6))
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4
        grid[rr][cc] = border || core
      }
    }
  }

  finder(0, 0)
  finder(0, n - 7)
  finder(n - 7, 0)

  for (let i = 0; i < n; i++) {
    if (!reserved[6][i]) {
      grid[6][i] = i % 2 === 0
      reserved[6][i] = true
    }
    if (!reserved[i][6]) {
      grid[i][6] = i % 2 === 0
      reserved[i][6] = true
    }
  }

  for (let i = n - 9; i <= n - 5; i++) {
    for (let j = n - 9; j <= n - 5; j++) {
      reserved[i][j] = true
      grid[i][j] =
        i === n - 9 || i === n - 5 || j === n - 9 || j === n - 5 || (i === n - 7 && j === n - 7)
    }
  }

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!reserved[r][c]) grid[r][c] = rnd() < 0.46
    }
  }

  return grid
}

/** The seed is the trainer's real identity, so the patch is theirs and only theirs. */
export function qrSeed(profile: PasaporteProfileEntity): string {
  return `${profile.trainerId}|${profile.uuid}`
}
