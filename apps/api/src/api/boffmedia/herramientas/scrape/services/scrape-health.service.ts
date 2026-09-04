import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

/**
 * Drift detection for the HTML scrapers.
 *
 * A scraper that stops matching does not fail. It returns an empty array, and
 * the tool renders "no ROMs" or "no books" — indistinguishable from a source
 * that genuinely has nothing. T7: the failure is invisible on both ends.
 *
 * The discriminator is the whole idea here, and a plain "N empty results in a
 * row" counter is not good enough: a quiet week on a real directory would trip
 * it, and a source that always returns one stale row would never trip it. What
 * actually separates the two cases is available in the SAME response —
 *
 *   candidates = things in the page that look like the rows we want
 *   extracted  = things the selectors actually produced
 *
 * If candidates > 0 and extracted === 0, the page has content and the
 * selectors missed it. That is drift, provable from one response, with no
 * waiting and no false positive from a quiet source. If both are zero, the
 * directory is simply empty and nothing is wrong.
 *
 * Consecutive strikes are still counted, but for reporting rather than for the
 * decision: `snapshot()` is what an operator or a /health route reads to see
 * which sources are drifting and since when.
 */

export interface ScrapeOutcome {
  /** Stable name of the source, e.g. `myrient`. Used as the report key. */
  source: string;
  /** The URL that was parsed, for the log line. */
  url: string;
  /** Row-like things the selectors produced. */
  extracted: number;
  /**
   * Row-like things present in the document by a looser, structure-independent
   * measure. Must be counted with a DIFFERENT selector than the one that
   * produced `extracted`, or this compares a thing to itself and can never
   * disagree.
   */
  candidates: number;
}

export interface SourceHealth {
  source: string;
  drifting: boolean;
  consecutiveDrift: number;
  lastDriftAt: Date | null;
  lastOkAt: Date | null;
  lastUrl: string | null;
}

@Injectable()
export class ScrapeHealthService {
  private readonly state = new Map<string, SourceHealth>();

  constructor(private readonly logger: Logger) {}

  private entry(source: string): SourceHealth {
    let e = this.state.get(source);
    if (!e) {
      e = {
        source,
        drifting: false,
        consecutiveDrift: 0,
        lastDriftAt: null,
        lastOkAt: null,
        lastUrl: null,
      };
      this.state.set(source, e);
    }
    return e;
  }

  /**
   * Record one parse. Returns true when this response is provable drift, so the
   * caller can answer "source unavailable" instead of "no results".
   */
  record(outcome: ScrapeOutcome): boolean {
    const e = this.entry(outcome.source);
    e.lastUrl = outcome.url;

    const drifted = outcome.extracted === 0 && outcome.candidates > 0;
    if (drifted) {
      e.consecutiveDrift += 1;
      e.drifting = true;
      e.lastDriftAt = new Date();
      this.logger.error(
        `scraper drift: ${outcome.source} parsed 0 rows from a page holding ` +
          `${outcome.candidates} candidate row(s) — the markup changed. ${outcome.url}`,
      );
      return true;
    }

    // An empty directory is not a success signal for the SELECTORS (they were
    // never exercised), so it clears nothing. Only a parse that produced rows
    // proves the scraper still works.
    if (outcome.extracted > 0) {
      e.consecutiveDrift = 0;
      e.drifting = false;
      e.lastOkAt = new Date();
    }
    return false;
  }

  /** Every source seen since boot. Read by operators; safe to expose. */
  snapshot(): SourceHealth[] {
    return [...this.state.values()].map((e) => ({ ...e }));
  }

  /** Test seam. */
  reset(): void {
    this.state.clear();
  }
}
