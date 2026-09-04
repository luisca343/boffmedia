import { describe, expect, it, vi } from 'vitest';
import { Scene } from '../Scene';
import { PokemonSprite } from '../PokemonSprite';
import { getOffset } from '../viewUtils';
import { makeBattle, makeField, settle } from './helpers';

function makeScene(acceleration = 1) {
  const battle = makeBattle();
  battle.add('|gametype|singles');
  const field = makeField();
  const scene = new Scene(battle, field);
  scene.setAcceleration(acceleration);
  return { scene, field, battle };
}

describe('Scene', () => {
  it('honours a queued delay instead of dropping it', async () => {
    const { scene } = makeScene();
    const sprite = new PokemonSprite(scene, 'p1a' as any);
    const started = Date.now();
    let fired = -1;
    await scene.collect(() => {
      sprite.delay(60);
      sprite.anim({ opacity: 0, time: 20 }, 'linear', () => { fired = Date.now() - started; });
    });
    // The whole point: the second step waited for the first.
    expect(fired).toBeGreaterThanOrEqual(60);
  });

  it('abandons a queued transition once the slot changes hands', async () => {
    const { scene } = makeScene();
    const sprite = new PokemonSprite(scene, 'p1a' as any);
    const done = vi.fn();
    const run = scene.collect(() => {
      sprite.anim({ opacity: 0, time: 20 }, 'linear');
      sprite.anim({ opacity: 1, time: 20 }, 'linear', done);
    });
    scene.bumpSlot('p1a');
    await run;
    await settle(80);
    expect(done).not.toHaveBeenCalled();
    expect(sprite.stale).toBe(true);
  });

  it('gives each call its own promise list', async () => {
    const { scene } = makeScene();
    const a = new PokemonSprite(scene, 'p1a' as any);
    const b = new PokemonSprite(scene, 'p2a' as any);
    const order: string[] = [];
    const slow = scene.collect(() => { a.anim({ opacity: 0, time: 120 }, 'linear', () => order.push('slow')); });
    const fast = scene.collect(() => { b.anim({ opacity: 0, time: 10 }, 'linear', () => order.push('fast')); });
    await fast;
    // The fast call must not have been truncated by, or truncate, the slow one.
    expect(order).toEqual(['fast']);
    await slow;
    expect(order).toEqual(['fast', 'slow']);
  });

  it('places both ends of a Poké Ball flight with the SAME offset', async () => {
    const { scene, field } = makeScene();
    const flight = scene.showEffect(
      'pokeball',
      { x: 100, y: 100, opacity: 0, scale: 0.5, time: 0 },
      { x: 100, y: 100, opacity: 1, scale: 0.7, time: 200 },
      'ballistic2',
      'fade',
    );
    await settle(0);
    const img = field.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    const startLeft = img.style.left;
    const startTop = img.style.top;
    // The ball is visible while it flies; it used to go from 0 opacity to 0.
    expect(img.style.opacity).toBe('0');
    await settle(60);
    expect(img.style.left).toBe(startLeft);
    expect(img.style.top).toBe(startTop);
    expect(img.style.opacity).toBe('1');
    expect(img.style.transition).toContain('cubic-bezier');
    await flight;
    expect(field.querySelector('img')).toBeNull();
  });

  it('skips every animation at skip speed', async () => {
    const { scene, field } = makeScene(8);
    expect(scene.skipAnims).toBe(true);
    expect(scene.animTime(1000)).toBe(0);
    await scene.showPopup('p1a' as any, 'x', 1000);
    await scene.showBanner('x', 1000);
    await scene.playRecall('p1a');
    await scene.playSummon('p1a');
    await scene.playFaint('p1a');
    await scene.playBattleAnim('tackle', 'p1a' as any, 'p2a' as any);
    expect(field.querySelectorAll('img')).toHaveLength(0);
    expect(field.querySelectorAll('div[aria-hidden]')).toHaveLength(0);
  });

  it('takes its own nodes and timers back on destroy', async () => {
    const { scene, field } = makeScene();
    void scene.showPopup('p1a' as any, 'hola', 800);
    await settle(0);
    expect(field.children.length).toBeGreaterThan(2);
    const generation = scene.generation;
    scene.destroy();
    expect(scene.generation).toBe(generation + 1);
    expect(field.querySelectorAll('[aria-hidden]')).toHaveLength(0);
    // A stale scene answers nothing and starts nothing.
    expect(scene.getPokemonElement('p1a')).toBeNull();
    await expect(scene.wait(50)).resolves.toBeUndefined();
  });

  it('reaches the inner wrapper for the crit shake, not the box the engine writes', () => {
    const { scene } = makeScene();
    const box = scene.getPokemonElement('p1a')!;
    const inner = scene.getPokemonInnerElement('p1a')!;
    expect(inner).toBeTruthy();
    expect(inner.parentElement).toBe(box);
  });

  it('bails instead of parking a sprite off-screen for an unknown slot', () => {
    const { scene } = makeScene();
    expect(getOffset(scene.battle, 'p1z', 1)).toBeNull();
    expect(scene.getPokemonElement('p1z')).toBeNull();
  });
});
