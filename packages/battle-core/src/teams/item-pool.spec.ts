import { describe, expect, it } from 'vitest';

import { legalItemsFor } from './item-pool.js';
import { registerBattleMods } from '../mods/register.js';

registerBattleMods();

describe('legalItemsFor', () => {
  it('uses the regulation Dex, including mod-only items with num 0', () => {
    const result = legalItemsFor('gen9championsvgc2026regmc');
    const ids = result.items.map((item) => item.id);

    expect(result.known).toBe(true);
    expect(ids).toContain('golisopite');
    expect(result.items.find((item) => item.id === 'golisopite')?.name).toBe('Golisopite');
    expect(ids).not.toContain('assaultvest');
  });

  it('keeps retired regulation entries out while all current regulations remain queryable', () => {
    for (const format of ['gen9championsvgc2026regma', 'gen9championsvgc2026regmb']) {
      const result = legalItemsFor(format);

      expect(result.known).toBe(true);
      expect(result.items.map((item) => item.id)).not.toContain('golisopite');
      expect(result.items.map((item) => item.id)).not.toContain('assaultvest');
    }
  });

  it('keeps the same item legal in a format that permits it', () => {
    const result = legalItemsFor('gen9ou');

    expect(result.known).toBe(true);
    expect(result.items.map((item) => item.id)).toContain('assaultvest');
  });

  it('returns a deterministic, duplicate-free pool', () => {
    const result = legalItemsFor('gen9championsvgc2026regmc');
    const ids = result.items.map((item) => item.id);
    const sorted = [...result.items].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

    expect(result.items).toEqual(sorted);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('does not turn an unknown format into an empty legal pool', () => {
    expect(legalItemsFor('gen9notarealformat')).toEqual({ items: [], known: false });
  });
});
