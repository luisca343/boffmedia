/**
 * The HUD adapter must never throw. It runs inside a React render, so an
 * exception here is not a wrong badge — it is the whole battle canvas
 * unmounting mid-turn with nothing on screen to explain it.
 */
import { describe, it, expect } from 'vitest';

import { toBSXMon } from '../toBSXMon';
import { makeSession, feed, OPENING } from './helpers';

describe('toBSXMon — a forme the battle\'s gen view does not carry', () => {
  it('survives |detailschange| to a forme missing from gen 9', async () => {
    const { session } = makeSession();
    await feed(session, OPENING);
    // Legal protocol, illegal species FOR THIS GENERATION's dex view: the
    // client happily records the details and `Pokemon#species` then resolves
    // to undefined for every read afterwards.
    await feed(session, ['|detailschange|p1a: Pikachu|Charizard-Mega-X, L50, M']);

    const active = session.battle.p1.active[0]!;
    expect(active.speciesForme).toBe('Charizard-Mega-X');
    // The precondition this test exists for — if the client ever starts
    // resolving it, the guard is still correct but this case is no longer the
    // one being covered.
    expect(active.species).toBeUndefined();

    const mon = toBSXMon(active);
    expect(mon).not.toBeNull();
    // The unrestricted Dex knows the forme even though the gen view does not.
    expect(mon!.types).toEqual(['Fire', 'Dragon']);
    expect(mon!.stats.atk).toBeGreaterThan(0);
    expect(mon!.name).toBe('Pikachu');
  });

  it('still reads a normal Pokémon straight from the client', async () => {
    const { session } = makeSession();
    await feed(session, OPENING);
    const mon = toBSXMon(session.battle.p2.active[0]!)!;
    expect(mon.types).toEqual(['Ground', 'Rock']);
    expect(mon.hpCur).toBe(250);
    expect(mon.hpMax).toBe(250);
    expect(mon.gender).toBe('M');
    // `searchid` is what the HP bar keys its memory on — it must be there.
    expect(mon.searchid).toContain('p2: Rhydon');
    expect(mon.volatiles).toEqual([]);
    expect(mon.protect).toBe(false);
  });
});
