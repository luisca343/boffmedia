import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { ScrapeHealthService } from './scrape-health.service';

/**
 * The value of this service is entirely in what it does NOT report. A drift
 * detector that cries wolf on a quiet source gets switched off within a week,
 * so the empty-directory case matters more than the drift case.
 */
describe('ScrapeHealthService', () => {
  let health: ScrapeHealthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ScrapeHealthService,
        { provide: Logger, useValue: { error: jest.fn(), log: jest.fn() } },
      ],
    }).compile();
    health = module.get(ScrapeHealthService);
  });

  const parse = (extracted: number, candidates: number) =>
    health.record({
      source: 'myrient',
      url: 'https://x/dir/',
      extracted,
      candidates,
    });

  it('reports drift when the page has rows and the selectors found none', () => {
    expect(parse(0, 42)).toBe(true);
  });

  it('does NOT report drift for a genuinely empty directory', () => {
    // Nothing in the page, nothing extracted: the selectors were never
    // exercised, so there is no evidence either way and silence is correct.
    expect(parse(0, 0)).toBe(false);
    expect(health.snapshot()[0].drifting).toBe(false);
  });

  it('does not report drift on a normal parse', () => {
    expect(parse(120, 130)).toBe(false);
  });

  it('clears the drift flag only once rows are extracted again', () => {
    parse(0, 42);
    expect(health.snapshot()[0].drifting).toBe(true);

    // An empty directory must not be mistaken for a recovery — the selectors
    // still have not proven they work.
    parse(0, 0);
    expect(health.snapshot()[0].drifting).toBe(true);
    expect(health.snapshot()[0].consecutiveDrift).toBe(1);

    parse(7, 9);
    const after = health.snapshot()[0];
    expect(after.drifting).toBe(false);
    expect(after.consecutiveDrift).toBe(0);
    expect(after.lastOkAt).toBeInstanceOf(Date);
  });

  it('counts consecutive drift for reporting', () => {
    parse(0, 5);
    parse(0, 5);
    parse(0, 5);
    expect(health.snapshot()[0].consecutiveDrift).toBe(3);
    expect(health.snapshot()[0].lastDriftAt).toBeInstanceOf(Date);
  });

  it('tracks sources independently', () => {
    health.record({ source: 'myrient', url: 'u', extracted: 0, candidates: 3 });
    health.record({
      source: 'novelcool',
      url: 'u',
      extracted: 10,
      candidates: 10,
    });
    const byName = Object.fromEntries(
      health.snapshot().map((s) => [s.source, s]),
    );
    expect(byName.myrient.drifting).toBe(true);
    expect(byName.novelcool.drifting).toBe(false);
  });
});
