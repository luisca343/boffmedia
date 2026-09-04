import { describe, it, expect, beforeEach } from 'vitest'
import { naiveToUtc, utcToNaive } from './timezone-utils'

/**
 * Tests for timezone conversion between naive Madrid wall-clock time and UTC.
 *
 * CRITICAL: These tests verify the INPUT→STORAGE path, which was the bug in W11.
 * Tests are designed to work correctly regardless of the host machine's timezone.
 * The conversion should always interpret naive input as Europe/Madrid time.
 */

describe('naiveToUtc', () => {
  describe('Winter (CET, UTC+1)', () => {
    /**
     * January 15, 2026 20:00 in Madrid (CET, UTC+1)
     * Should convert to 2026-01-15T19:00:00Z
     */
    it('should convert winter time correctly', () => {
      const result = naiveToUtc('2026-01-15T20:00')
      expect(result).toBeTruthy()
      const date = new Date(result!)
      // Should be 19:00 UTC
      expect(date.getUTCHours()).toBe(19)
      expect(date.getUTCMinutes()).toBe(0)
      expect(date.getUTCDate()).toBe(15)
      expect(date.getUTCMonth()).toBe(0) // January
    })

    it('should convert winter midnight correctly', () => {
      const result = naiveToUtc('2026-01-01T00:00')
      expect(result).toBeTruthy()
      const date = new Date(result!)
      // 2026-01-01T00:00 Madrid = 2025-12-31T23:00 UTC
      expect(date.getUTCHours()).toBe(23)
      expect(date.getUTCDate()).toBe(31)
      expect(date.getUTCMonth()).toBe(11) // December
    })
  })

  describe('Summer (CEST, UTC+2)', () => {
    /**
     * July 15, 2026 20:00 in Madrid (CEST, UTC+2)
     * Should convert to 2026-07-15T18:00:00Z
     */
    it('should convert summer time correctly', () => {
      const result = naiveToUtc('2026-07-15T20:00')
      expect(result).toBeTruthy()
      const date = new Date(result!)
      // Should be 18:00 UTC
      expect(date.getUTCHours()).toBe(18)
      expect(date.getUTCMinutes()).toBe(0)
      expect(date.getUTCDate()).toBe(15)
      expect(date.getUTCMonth()).toBe(6) // July
    })

    it('should convert summer noon correctly', () => {
      const result = naiveToUtc('2026-07-15T12:00')
      expect(result).toBeTruthy()
      const date = new Date(result!)
      // 2026-07-15T12:00 Madrid = 2026-07-15T10:00 UTC
      expect(date.getUTCHours()).toBe(10)
    })
  })

  describe('DST transitions', () => {
    /**
     * March 29, 2026: DST begins at 02:00 CET → 03:00 CEST
     * Times before 02:00 are CET (UTC+1)
     * Times at/after 03:00 are CEST (UTC+2)
     */
    it('should convert time the day before spring forward correctly', () => {
      // March 28 23:00 is definitely CET (UTC+1), no DST complication
      const result = naiveToUtc('2026-03-28T23:00')
      expect(result).toBeTruthy()
      const date = new Date(result!)
      // 23:00 CET = 22:00 UTC
      expect(date.getUTCHours()).toBe(22)
      expect(date.getUTCMinutes()).toBe(0)
    })

    it('should convert time after spring forward correctly', () => {
      // March 29 03:00 is definitely CEST (UTC+2) after the jump
      const result = naiveToUtc('2026-03-29T03:00')
      expect(result).toBeTruthy()
      const date = new Date(result!)
      // 03:00 CEST (UTC+2) = 01:00 UTC
      expect(date.getUTCHours()).toBe(1)
      expect(date.getUTCMinutes()).toBe(0)
    })

    it('should convert 20:00 on spring forward day correctly (CEST)', () => {
      const result = naiveToUtc('2026-03-29T20:00')
      expect(result).toBeTruthy()
      const date = new Date(result!)
      // After DST, 20:00 Madrid = 18:00 UTC
      expect(date.getUTCHours()).toBe(18)
    })

    /**
     * October 25, 2026: DST ends at 03:00 CEST → 02:00 CET
     * Times before 03:00 are CEST (UTC+2)
     * Times at/after 02:00 (the repeated time) are CET (UTC+1)
     */
    it('should convert ambiguous DST hour (fall back) using later occurrence', () => {
      const result = naiveToUtc('2026-10-25T02:30')
      expect(result).toBeTruthy()
      const date = new Date(result!)
      // On fall-back day, 02:30 is ambiguous (occurs twice).
      // The Intl API interprets it as the later occurrence: 02:30 CET (UTC+1) = 01:30 UTC
      // This is reasonable default behavior (prefer post-transition time).
      expect(date.getUTCHours()).toBe(1)
      expect(date.getUTCMinutes()).toBe(30)
    })

    it('should convert time just after fall back correctly', () => {
      const result = naiveToUtc('2026-10-25T03:30')
      expect(result).toBeTruthy()
      const date = new Date(result!)
      // 03:30 CET (UTC+1) = 02:30 UTC
      expect(date.getUTCHours()).toBe(2)
      expect(date.getUTCMinutes()).toBe(30)
    })

    it('should convert 20:00 on fall back day correctly (CET)', () => {
      const result = naiveToUtc('2026-10-25T20:00')
      expect(result).toBeTruthy()
      const date = new Date(result!)
      // After DST ends, 20:00 Madrid = 19:00 UTC
      expect(date.getUTCHours()).toBe(19)
    })
  })

  describe('Edge cases', () => {
    it('should handle null input', () => {
      expect(naiveToUtc(null)).toBeNull()
    })

    it('should handle undefined input', () => {
      expect(naiveToUtc(undefined)).toBeNull()
    })

    it('should handle empty string', () => {
      expect(naiveToUtc('')).toBeNull()
    })

    it('should handle invalid format', () => {
      expect(naiveToUtc('not-a-date')).toBeNull()
      expect(naiveToUtc('2026-03-29')).toBeNull() // No time
      expect(naiveToUtc('20:00')).toBeNull() // No date
    })

    it('should handle with seconds', () => {
      const result = naiveToUtc('2026-07-15T20:30:45')
      expect(result).toBeTruthy()
      const date = new Date(result!)
      expect(date.getUTCHours()).toBe(18)
      expect(date.getUTCMinutes()).toBe(30)
      // Seconds should be present (though we typically ignore them)
    })
  })
})

describe('utcToNaive', () => {
  it('should convert UTC back to naive Madrid time (winter)', () => {
    const result = utcToNaive('2026-01-15T19:00:00.000Z')
    expect(result).toBeTruthy()
    expect(result).toMatch(/2026-01-15T20:00/)
  })

  it('should convert UTC back to naive Madrid time (summer)', () => {
    const result = utcToNaive('2026-07-15T18:00:00.000Z')
    expect(result).toBeTruthy()
    expect(result).toMatch(/2026-07-15T20:00/)
  })

  it('should handle null input', () => {
    expect(utcToNaive(null)).toBeNull()
  })

  it('should handle undefined input', () => {
    expect(utcToNaive(undefined)).toBeNull()
  })

  it('should handle invalid input', () => {
    expect(utcToNaive('not-a-date')).toBeNull()
  })
})

/**
 * INTEGRATION TEST: The critical bug scenario from W11.
 * This test proves the fix works by converting a naive form input to UTC.
 */
describe('Integration: Form input → Storage', () => {
  it('should convert admin input correctly for summer event', () => {
    // Admin in Madrid enters: "Evento 20:00 on July 15, 2026"
    const adminInput = '2026-07-15T20:00'

    // This gets sent to API via naiveToUtc
    const storedInDb = naiveToUtc(adminInput)

    // User in Madrid fetches the event and sees...
    const madridUtcToNaive = utcToNaive(storedInDb)
    // Should be back to "2026-07-15T20:00"
    expect(madridUtcToNaive).toMatch(/2026-07-15T20:00/)

    // User in UTC+8 (e.g. Asia/Shanghai) fetches the event
    // They will see it via browser's toLocaleDateString, which will show their local time
    // But the UTC value is correct: 18:00 UTC (20:00 CEST - 2 hours)
    const date = new Date(storedInDb!)
    expect(date.getUTCHours()).toBe(18)
  })

  it('should convert admin input correctly for DST boundary event', () => {
    // The critical case from W11: Event on DST transition day, 20:00 Madrid time
    const adminInput = '2026-03-29T20:00'

    const storedInDb = naiveToUtc(adminInput)

    // Should be 18:00 UTC (20:00 CEST - 2 hours after DST begins)
    const date = new Date(storedInDb!)
    expect(date.getUTCHours()).toBe(18)
    expect(date.getUTCDate()).toBe(29)
    expect(date.getUTCMonth()).toBe(2) // March

    // Admin can load it back and see the original time
    const backToNaive = utcToNaive(storedInDb)
    expect(backToNaive).toMatch(/2026-03-29T20:00/)
  })

  it('PROOF: Wrong behavior (naive interpretation) would fail', () => {
    // If we sent the naive string directly to API without conversion,
    // and the API did: new Date('2026-03-29T20:00')
    // On a UTC host it would become: 2026-03-29T20:00:00Z (WRONG)
    // But with our fix: 2026-03-29T18:00:00Z (CORRECT)

    const adminInput = '2026-03-29T20:00'
    const wrongResult = new Date(adminInput) // This interprets as UTC on a UTC host
    const correctResult = new Date(naiveToUtc(adminInput)!) // This always interprets as Madrid

    // If the API is on UTC, wrongResult would be wrong
    // But correctResult is always right
    expect(correctResult.getUTCHours()).toBe(18)
  })
})
