// ---------------------------------------------------------------------------
// MangaScraperRegistry — single place to register/resolve manga scrapers.
//
// Adding a new scraper:
//   1. Implement IMangaScraper in a new file under scrapers/.
//   2. Add `new YourScraper()` to the `scrapers` array below.
// ---------------------------------------------------------------------------

import { Injectable } from '@nestjs/common';
import { IMangaScraper } from './scrapers/manga-scraper.interface';
import { NovelCoolScraper } from './scrapers/novelcool/novelcool.scraper';

@Injectable()
export class MangaScraperRegistry {
  private readonly scrapers: IMangaScraper[] = [
    new NovelCoolScraper(),
    // new MangaDexScraper(),  ← add future scrapers here
  ];

  /**
   * Returns the first scraper that can handle the given URL.
   * Throws if no scraper is registered for that host.
   */
  resolve(url: string): IMangaScraper {
    const scraper = this.scrapers.find(s => s.canHandle(url));
    if (!scraper) {
      throw new Error(
        `No manga scraper registered for URL: ${url}. ` +
        `Registered scrapers: ${this.scrapers.map(s => s.name).join(', ')}`,
      );
    }
    return scraper;
  }

  /** Returns all registered scrapers (useful for cross-source search). */
  getAll(): IMangaScraper[] {
    return [...this.scrapers];
  }
}
