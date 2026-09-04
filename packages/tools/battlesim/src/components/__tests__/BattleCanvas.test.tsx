import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import type { Battle } from '@pkmn/client';
import { BattleCanvas } from '../BattleCanvas';
import { feed, openBattle } from './helpers';

afterEach(cleanup);

/**
 * The canvas in its live stance, which is the only one that draws the field
 * (the replay stance shows a skeleton until a log arrives).
 *
 * The measured width is 0 in a headless DOM, and `BattleScaleProvider` falls
 * back to the authored 960 for exactly that reason — so every offset asserted
 * below is the field-space number itself, at scale 1.
 */
function renderCanvas(battle: Battle, pov: 0 | 1, revision = 1) {
  return render(<BattleCanvas battle={battle} pov={pov} revision={revision} liveMode liveStatus="active" />);
}

const hazardTops = (container: HTMLElement) =>
  [...container.querySelectorAll('img[src*="spikes"]')].map((n) => (n as HTMLElement).style.top);

describe('BattleCanvas hazards', () => {
  it('draws a side condition on the half of the field its owner is standing on, for both povs', () => {
    // Spikes on p1 — Alice's side.
    const battle = openBattle(['|-sidestart|p1: Alice|Spikes']);

    // Alice is watching: her own spikes are on the NEAR half (field y 300).
    const alice = renderCanvas(battle, 0);
    expect(hazardTops(alice.container)).toEqual(['300px']);
    cleanup();

    // Bob is watching the same battle: the same spikes are now the FAR half's
    // (field y 160). This is the regression — the canvas used to read
    // `battle.p1`/`battle.p2` directly, so player two saw every hazard mirrored
    // while the chip row beside it, which does swap, said the opposite.
    const bob = renderCanvas(battle, 1);
    expect(hazardTops(bob.container)).toEqual(['160px']);
  });

  it('stacks one node per layer of Spikes and never exceeds the art it has', () => {
    const battle = openBattle(['|-sidestart|p1: Alice|Spikes', '|-sidestart|p1: Alice|Spikes', '|-sidestart|p1: Alice|Spikes']);
    const { container } = renderCanvas(battle, 0);
    expect(container.querySelectorAll('img[src*="spikes"]')).toHaveLength(3);
  });

  it('draws no <img> for screens, and no broken src anywhere on the field', () => {
    const battle = openBattle([
      '|-sidestart|p1: Alice|Reflect',
      '|-sidestart|p1: Alice|move: Light Screen',
      '|-sidestart|p2: Bob|move: Tailwind',
      '|-sidestart|p2: Bob|Safeguard',
    ]);
    const { container } = renderCanvas(battle, 0);
    const srcs = [...container.querySelectorAll('img')].map((n) => (n as HTMLImageElement).getAttribute('src') ?? '');
    for (const id of ['reflect', 'lightscreen', 'tailwind', 'safeguard', 'mist', 'luckychant', 'auroraveil']) {
      expect(srcs.some((s) => s.includes(id))).toBe(false);
    }
    // …and the tint is there instead.
    expect(container.querySelector('[data-screen="reflect"]')).not.toBeNull();
    expect(container.querySelector('[data-screen="tailwind"]')).not.toBeNull();
  });
});

describe('BattleCanvas sprite identity', () => {
  it('mounts a NEW <img> on |detailschange| instead of patching the old one', async () => {
    const battle = openBattle(['|switch|p1a: Palafin|Palafin, L50, M|200/200']);
    const { container, rerender } = renderCanvas(battle, 0);
    const before = container.querySelector('#p1a img') as HTMLImageElement;
    expect(before).not.toBeNull();
    expect(before.src).toContain('palafin');

    feed(battle, ['|detailschange|p1a: Palafin|Palafin-Hero, L50, M']);
    await act(async () => {
      rerender(<BattleCanvas battle={battle} pov={0} revision={2} liveMode liveStatus="active" />);
    });

    const after = container.querySelector('#p1a img') as HTMLImageElement;
    // Node identity, not just `src`: an animated GIF whose src is patched in
    // place keeps showing the old frames until the new file decodes.
    expect(after).not.toBe(before);
    expect(after.src).toContain('palafin-hero');
  });

  it('keeps exactly one <img> per slot — the engine finds the sprite with querySelector', () => {
    const battle = openBattle();
    const { container } = renderCanvas(battle, 0);
    const slot = container.querySelector('#p1a') as HTMLElement;
    expect(slot.querySelectorAll('img')).toHaveLength(1);
    // …and the inner wrapper the crit shake targets is still the first child.
    expect((slot.firstElementChild as HTMLElement).className).toContain('relative');
  });

  it('mounts a switched-in Pokemon invisible, because the engine summons it', async () => {
    const battle = openBattle();
    const { container, rerender } = renderCanvas(battle, 0);
    // The opening lead is summoned too, so it starts hidden.
    expect((container.querySelector('#p1a') as HTMLElement).style.opacity).toBe('0');

    feed(battle, ['|switch|p1a: Rhydon|Rhydon, L50, M|250/250']);
    await act(async () => {
      rerender(<BattleCanvas battle={battle} pov={0} revision={2} liveMode liveStatus="active" />);
    });
    expect((container.querySelector('#p1a') as HTMLElement).style.opacity).toBe('0');
  });

  it('does NOT hide a forme change — nothing would ever fade it back in', async () => {
    const battle = openBattle(['|switch|p1a: Palafin|Palafin, L50, M|200/200']);
    const { container, rerender } = renderCanvas(battle, 0);
    // The slot's ident is recorded by the layout effect of that first commit,
    // so the next remount is judged on whether the IDENT changed — not on
    // whether the sprite did.
    feed(battle, ['|detailschange|p1a: Palafin|Palafin-Hero, L50, M']);
    await act(async () => {
      rerender(<BattleCanvas battle={battle} pov={0} revision={2} liveMode liveStatus="active" />);
    });
    expect((container.querySelector('#p1a') as HTMLElement).style.opacity).toBe('');
  });

  it('puts the gender in the sprite url — Pyroar F and Pyroar M are different art', () => {
    const female = openBattle();
    const f = renderCanvas(female, 0);
    const fSrc = (f.container.querySelector('#p1a img') as HTMLImageElement).getAttribute('src')!;
    cleanup();

    const male = openBattle();
    feed(male, ['|replace|p1a: Pyroar|Pyroar, L50, M|200/200']);
    const m = renderCanvas(male, 0);
    const mSrc = (m.container.querySelector('#p1a img') as HTMLImageElement).getAttribute('src')!;

    expect(fSrc).not.toBe(mSrc);
    expect(fSrc).toMatch(/pyroar-f/);
    expect(mSrc).toMatch(/pyroar\./);
  });
});

describe('BattleCanvas commit handshake', () => {
  it('reports each revision back to the session from a layout effect', async () => {
    const battle = openBattle();
    const onCommitted = vi.fn();
    const session = { onCommitted };
    const { rerender } = render(<BattleCanvas battle={battle} pov={0} revision={7} liveMode liveStatus="active" session={session} />);
    expect(onCommitted).toHaveBeenCalledWith(7);

    await act(async () => {
      rerender(<BattleCanvas battle={battle} pov={0} revision={8} liveMode liveStatus="active" session={session} />);
    });
    expect(onCommitted).toHaveBeenLastCalledWith(8);
  });

  it('renders without a session at all', () => {
    const battle = openBattle();
    expect(() => renderCanvas(battle, 0)).not.toThrow();
  });
});

describe('BattleCanvas field overlays', () => {
  it('draws the weather from battle.field, under the sprites', async () => {
    const battle = openBattle();
    const { container, rerender } = renderCanvas(battle, 0);
    expect(container.querySelector('[data-fx="weather:rain"]')).toBeNull();

    feed(battle, ['|-weather|RainDance']);
    await act(async () => {
      rerender(<BattleCanvas battle={battle} pov={0} revision={2} liveMode liveStatus="active" />);
    });
    const layer = container.querySelector('[data-bsim-field-layer]') as HTMLElement;
    expect(layer.querySelector('[data-fx="weather:rain"]')).not.toBeNull();
    expect(layer.className).toContain('z-0');
  });
});
