import { describe, expect, it } from 'vitest'
import { getKOVerdict } from '../smogonAdapter'
import type { DamageResult } from '../../_types/calculator'

function damage(minPct: number, maxPct: number): DamageResult {
  return {
    rolls: [1],
    min: 1,
    max: 1,
    minPct,
    maxPct,
    defHP: 100,
    isPhysical: true,
    desc: '',
  }
}

describe('getKOVerdict', () => {
  it('reports a guaranteed 3HKO when two hits are not enough', () => {
    const verdict = getKOVerdict(damage(41.5, 49))

    expect(verdict).toMatchObject({ labelKey: 'guaranteedHKO', hits: 3 })
  })

  it('prioritizes a possible OHKO over a guaranteed 2HKO', () => {
    const verdict = getKOVerdict(damage(90, 110))

    expect(verdict).toMatchObject({ labelKey: 'possibleOHKO', hits: 1 })
  })

  it('reports no KO when even nine maximum rolls cannot finish', () => {
    const verdict = getKOVerdict(damage(10, 11))

    expect(verdict).toMatchObject({ labelKey: 'noKO', hits: null })
  })

  it('supports the external calculator boundary at 9HKO', () => {
    const verdict = getKOVerdict(damage(12, 12))

    expect(verdict).toMatchObject({ labelKey: 'guaranteedHKO', hits: 9 })
  })
})
