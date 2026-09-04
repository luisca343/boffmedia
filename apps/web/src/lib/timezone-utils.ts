/**
 * Timezone utilities for event date handling.
 *
 * All events in Boffmedia are scheduled in Europe/Madrid timezone.
 * The admin enters times via datetime-local input (naive ISO string).
 * We must convert these to UTC before sending to the API.
 *
 * Example: Admin enters "2026-03-29T20:00" (wall-clock 20:00 in Madrid)
 * Conversion: "2026-03-29T20:00" Madrid → "2026-03-29T18:00:00Z" UTC (CEST, UTC+2)
 *            or "2026-01-15T20:00" Madrid → "2026-01-15T19:00:00Z" UTC (CET, UTC+1)
 */

/**
 * Convert a naive ISO datetime string (from datetime-local input) to UTC.
 * Interprets the input as Europe/Madrid time and returns the equivalent UTC instant.
 *
 * @param naiveIso - ISO string without timezone: "2026-03-29T20:00" or "2026-03-29T20:00:00"
 * @returns ISO string with Z suffix representing the UTC instant, or null if input is falsy
 *
 * Example:
 *   naiveToUtc("2026-03-29T20:00") → "2026-03-29T18:00:00.000Z" (summer, UTC+2)
 *   naiveToUtc("2026-01-15T20:00") → "2026-01-15T19:00:00.000Z" (winter, UTC+1)
 */
export function naiveToUtc(naiveIso: string | null | undefined): string | null {
  if (!naiveIso) return null;

  try {
    // Parse "2026-03-29T20:00" or "2026-03-29T20:00:00"
    const [datePart, timePart] = naiveIso.split("T");
    if (!datePart || !timePart) return null;

    const [yearStr, monthStr, dayStr] = datePart.split("-");
    const [hourStr, minuteStr] = timePart.split(":");

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
      return null;
    }

    // Create a UTC date as if the naive string was UTC
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

    // Use Intl to find what time this UTC date represents in Madrid
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(utcDate);
    const partMap: Record<string, string> = {};
    parts.forEach((p) => {
      partMap[p.type] = p.value;
    });

    const madridYear = parseInt(partMap.year, 10);
    const madridMonth = parseInt(partMap.month, 10);
    const madridDay = parseInt(partMap.day, 10);
    const madridHour = parseInt(partMap.hour, 10);
    const madridMinute = parseInt(partMap.minute, 10);

    // The offset is how far the represented Madrid time is from the desired Madrid time.
    // utcDate currently represents (madridYear, madridMonth, madridDay, madridHour, madridMinute) in Madrid
    // But we want it to represent (year, month, day, hour, minute) in Madrid
    // So: offset = represented - desired (in UTC terms)

    const intermediate = new Date(
      Date.UTC(madridYear, madridMonth - 1, madridDay, madridHour, madridMinute, 0)
    );
    // How far is the represented time from the desired time?
    const offsetMs = intermediate.getTime() - utcDate.getTime();

    // The correct UTC instant is the one that, when offset is applied, shows the right Madrid time
    const correctUtc = new Date(utcDate.getTime() - offsetMs);

    // Return as ISO string with Z suffix
    return correctUtc.toISOString();
  } catch {
    return null;
  }
}

/**
 * Convert a UTC instant back to naive Madrid wall-clock time.
 * Used when loading events for editing in the form.
 *
 * @param utcIso - ISO string with Z suffix: "2026-03-29T18:00:00.000Z"
 * @returns Naive ISO string: "2026-03-29T20:00" (as it would appear in Madrid)
 */
export function utcToNaive(utcIso: string | null | undefined): string | null {
  if (!utcIso) return null;

  try {
    const date = new Date(utcIso);
    if (isNaN(date.getTime())) return null;

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const partMap: Record<string, string> = {};
    parts.forEach((p) => {
      partMap[p.type] = p.value;
    });

    const year = partMap.year;
    const month = partMap.month;
    const day = partMap.day;
    const hour = partMap.hour;
    const minute = partMap.minute;

    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch {
    return null;
  }
}
