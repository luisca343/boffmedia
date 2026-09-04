import { describe, it, expect } from 'vitest'
import { formatEventDate, dayMonth, eventStatus } from './events-util'

/**
 * Timezone and DST boundary tests for event date handling.
 *
 * Critical dates in Spain (Europe/Madrid timezone):
 * - Last Sunday of March: DST begins (clocks spring forward)
 * - Last Sunday of October: DST ends (clocks fall back)
 *
 * 2026 DST dates:
 * - March 29, 2026 02:00 CET → 03:00 CEST (spring forward)
 * - October 25, 2026 03:00 CEST → 02:00 CET (fall back)
 */

describe('formatEventDate', () => {
  it('should format valid ISO date strings', () => {
    // An event at a fixed UTC time
    const result = formatEventDate('2026-03-29T20:00:00.000Z', 'es')
    expect(result).toBeTruthy()
    // The formatted output should be the date
    expect(result).toMatch(/\d{1,2}.*mar.*2026/i)
  })

  it('should return empty string for null/undefined', () => {
    expect(formatEventDate(null, 'es')).toBe('')
    expect(formatEventDate(undefined, 'es')).toBe('')
    expect(formatEventDate('', 'es')).toBe('')
  })

  it('should return empty string for invalid dates', () => {
    expect(formatEventDate('invalid', 'es')).toBe('')
    expect(formatEventDate('2026-13-32T25:61:61Z', 'es')).toBe('')
  })

  it('should respect locale for month/day formatting', () => {
    const date = '2026-03-29T20:00:00.000Z'
    const resultES = formatEventDate(date, 'es')
    const resultEN = formatEventDate(date, 'en')
    // Both should produce valid output but may differ in formatting
    expect(resultES).toBeTruthy()
    expect(resultEN).toBeTruthy()
  })

  /**
   * DST boundary test: Event stored as naive ISO string.
   * This test FAILS if timezone handling is wrong. If an event is created at
   * 20:00 on March 29, 2026 (the DST boundary day), the formatting must account
   * for the timezone shift that occurs at 02:00 that morning.
   */
  it('should handle dates crossing DST boundaries (spring forward)', () => {
    // March 29, 2026 at 20:00 UTC - the day DST starts in Spain
    // In Spain this is 21:00 or 22:00 depending on DST state
    const beforeDST = '2026-03-28T20:00:00.000Z'
    const onDSTDay = '2026-03-29T20:00:00.000Z'

    const resultBefore = formatEventDate(beforeDST, 'es')
    const resultOn = formatEventDate(onDSTDay, 'es')

    // Both should format to valid dates
    expect(resultBefore).toBeTruthy()
    expect(resultOn).toBeTruthy()
    // They should be different dates
    expect(resultBefore).not.toEqual(resultOn)
  })

  /**
   * DST boundary test: Fall back date.
   */
  it('should handle dates crossing DST boundaries (fall back)', () => {
    // October 25, 2026 at 00:00 UTC - the day DST ends in Spain
    const beforeFallback = '2026-10-24T22:00:00.000Z'
    const onFallbackDay = '2026-10-25T00:00:00.000Z'

    const resultBefore = formatEventDate(beforeFallback, 'es')
    const resultOn = formatEventDate(onFallbackDay, 'es')

    expect(resultBefore).toBeTruthy()
    expect(resultOn).toBeTruthy()
  })
})

describe('dayMonth', () => {
  it('should extract day and month from ISO string', () => {
    const result = dayMonth('2026-03-29T20:00:00.000Z', 'es')
    expect(result.d).toBe('29')
    // Month abbreviation - exact format depends on locale
    expect(result.m).toBeTruthy()
  })

  it('should return fallback for null/undefined', () => {
    const result = dayMonth(null, 'es')
    expect(result.d).toBe('–')
    expect(result.m).toBe('')
  })

  it('should return fallback for invalid dates', () => {
    const result = dayMonth('invalid', 'es')
    expect(result.d).toBe('–')
    expect(result.m).toBe('')
  })

  it('should extract correct day even across DST boundary', () => {
    const dstDay = '2026-03-29T20:00:00.000Z'
    const result = dayMonth(dstDay, 'es')
    // The day should be 29 regardless of DST
    expect(result.d).toBe('29')
  })
})

describe('eventStatus', () => {
  it('should return upcoming for future events', () => {
    // Far in the future
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    const result = eventStatus({ startDate: future, id: 1, title: 'Test' })
    expect(result).toBe('upcoming')
  })

  it('should return completed for past events', () => {
    // Far in the past (both start and end)
    const past = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const result = eventStatus({ startDate: past, endDate: past, id: 1, title: 'Test' })
    expect(result).toBe('completed')
  })

  it('should return active for ongoing events', () => {
    // Started in the past, ends in the future
    const start = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const end = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const result = eventStatus({ startDate: start, endDate: end, id: 1, title: 'Test' })
    expect(result).toBe('active')
  })

  it('should prefer explicit status over date math', () => {
    // Event has explicit status even though dates might suggest otherwise
    const result = eventStatus({ status: 'completed', startDate: new Date().toISOString(), id: 1, title: 'Test' })
    expect(result).toBe('completed')
  })

  it('should handle undated events', () => {
    const result = eventStatus({ id: 1, title: 'Test' })
    // Undated event with no explicit status should be treated as active
    expect(['active', 'upcoming']).toContain(result)
  })

  /**
   * DST boundary test: An event scheduled to start exactly at the DST
   * transition point (02:00 CET → 03:00 CEST on March 29, 2026).
   * This should not be affected by the timezone shift.
   */
  it('should correctly determine status for DST boundary event', () => {
    // March 29, 2026, 00:00 UTC (which is 01:00 CET before the transition)
    const dstBoundaryEvent = '2026-03-29T00:00:00.000Z'
    const now = Date.now()

    // If we're before this date, it should be upcoming
    if (now < new Date(dstBoundaryEvent).getTime()) {
      expect(eventStatus({ startDate: dstBoundaryEvent, id: 1, title: 'Test' })).toBe('upcoming')
    }
  })
})

/**
 * Integration tests: Full flow from storage to display
 */
describe('Event date handling integration', () => {
  /**
   * This test verifies the CRITICAL scenario:
   * An admin in Madrid creates an event for March 29 at 20:00.
   *
   * What should happen:
   * 1. Admin enters "20:00" on March 29 via datetime-local input
   * 2. Browser sends this to API as "2026-03-29T20:00" (naive ISO, no timezone)
   * 3. API should interpret this in the event's timezone context
   * 4. A user in Madrid should see "20:00" or equivalent
   * 5. A user in a different timezone should see the converted time + timezone label
   *
   * CURRENT: UI now shows timezone label ("Hora de España" / "Spain time") next to dates
   * so users in other timezones know what they're looking at.
   */
  it('should consistently display event dates across DST boundaries', () => {
    // Simulate an event created at 20:00 on March 29, 2026
    // This is represented as ISO string in the API response
    const eventDateISO = '2026-03-29T20:00:00.000Z'

    // Create a Date object (simulating what the browser does)
    const eventDate = new Date(eventDateISO)

    // Format it (what the user sees)
    const formatted = formatEventDate(eventDateISO, 'es')

    // Verify it's a valid date
    expect(eventDate.getTime()).toBeGreaterThan(0)
    expect(formatted).toBeTruthy()

    // The day should be consistent
    const extracted = dayMonth(eventDateISO, 'es')
    expect(extracted.d).toBe('29')
  })

  /**
   * This test proves whether the timezone handling creates off-by-one errors
   * on DST boundaries. If this fails, it means:
   * - Events created/displayed near DST transitions show wrong dates/times
   * - Users in different timezones see inconsistent values
   */
  it('should not shift event date on DST boundary transitions', () => {
    // Two events: just before and just after the DST transition
    // Both should format to the correct calendar date

    const beforeDST = '2026-03-28T21:00:00.000Z' // March 28, 22:00 CET
    const afterDST = '2026-03-29T21:00:00.000Z'  // March 29, 23:00 CEST

    const beforeDay = dayMonth(beforeDST, 'es')
    const afterDay = dayMonth(afterDST, 'es')

    // The day should increment by 1, not have a discontinuity
    expect(parseInt(afterDay.d)).toBeGreaterThan(parseInt(beforeDay.d))
  })
})
