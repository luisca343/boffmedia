/**
 * The Showdown relay's half of the transport contract.
 *
 * Two things were wrong and both are checked here: a request was handled TWICE
 * on a canvas remount (H3 — the hook stashed it and the session replayed it),
 * and a room adopted from the lobby had its log replayed with `battle.add`
 * while `psLines` aliased the module-level array, so the saved replay carried
 * every line twice (H4). Plus the rqid that was simply never sent (H2).
 */

import { describe, expect, it } from 'vitest';

import { ShowdownBaseSession } from '../../engine/ShowdownBaseSession';
import { OPENING, makeField, makeSpy, settle, waitFor } from '../../engine/__tests__/helpers';

/** The relay socket, as much of it as `ShowdownBaseSession` uses. */
function fakeRelay() {
  const sent: Array<{ event: string; payload: any }> = [];
  return { sent, emit: (event: string, payload: any) => { sent.push({ event, payload }); } };
}

const REQUEST = (rqid: number) =>
  `|request|${JSON.stringify({
    rqid,
    active: [{ moves: [{ move: 'Thunderbolt', id: 'thunderbolt' }] }],
    side: { id: 'p1', name: 'Alice', pokemon: [] },
  })}`;

function makeSession(roomId = 'battle-gen9ou-1') {
  const spy = makeSpy();
  const relay = fakeRelay();
  const session = new ShowdownBaseSession(roomId, spy.callbacks, relay as any);
  session.setAcceleration(8);
  session.setViewerName('Alice');
  session.initScene(makeField(), 0);
  return { session, spy, relay };
}

async function drain(session: ShowdownBaseSession) {
  await waitFor(() => !(session as any).processing && (session as any).lineBuffer.length === 0);
  await settle(5);
}

describe('ShowdownBaseSession — requests', () => {
  it('prompts ONCE for the same rqid delivered twice', async () => {
    const { session, spy } = makeSession();
    for (const line of OPENING) session.addLine(line);
    session.addLine(REQUEST(4));
    await drain(session);
    expect(spy.requests).toHaveLength(1);

    // PS re-sends the pending request on a `/undo`, on a re-join, and inside
    // the log of an `|init|battle`. Every one of those used to open a second
    // prompt, and the second flipped the session into `waiting` behind a turn
    // that had already been answered.
    session.addLine(REQUEST(4));
    await drain(session);
    expect(spy.requests).toHaveLength(1);
    expect(session.pendingRequests).toHaveLength(0);
  });

  it('sends the rqid with the choice', async () => {
    const { session, relay } = makeSession();
    for (const line of OPENING) session.addLine(line);
    session.addLine(REQUEST(7));
    await drain(session);

    session.makeChoice('move 1', relay as any);
    expect(relay.sent.at(-1)).toEqual({
      event: 'sendToShowdown',
      payload: 'battle-gen9ou-1|/choose move 1|7',
    });
  });

  it('accepts a choice that already carries the /choose prefix', async () => {
    const { session, relay } = makeSession();
    for (const line of OPENING) session.addLine(line);
    session.addLine(REQUEST(9));
    await drain(session);

    session.makeChoice('/choose switch 2', relay as any);
    expect(relay.sent.at(-1)!.payload).toBe('battle-gen9ou-1|/choose switch 2|9');
  });

  it('omits the rqid when there is none to send', () => {
    const { session, relay } = makeSession();
    session.makeChoice('move 1', relay as any);
    expect(relay.sent.at(-1)!.payload).toBe('battle-gen9ou-1|/choose move 1');
  });
});

describe('ShowdownBaseSession — adoption by resync', () => {
  it('leaves the log exactly as long as the lines it was given', async () => {
    const { session } = makeSession();
    const lines = [...OPENING, '|move|p1a: Pikachu|Thunderbolt|p2a: Rhydon', '|-damage|p2a: Rhydon|180/250', REQUEST(2)];

    session.resync(lines);
    await drain(session);

    // One entry per non-request line. The old adoption path replayed the log
    // with `battle.add` and aliased `psLines` to the shared array, so both grew
    // together and the saved replay doubled.
    expect(session.htmlLog).toHaveLength(lines.filter((l) => !l.startsWith('|request|')).length);
    expect(session.psLines).toEqual(lines);
    expect(session.battle.p2.active[0]!.hp).toBe(180);
  });

  it('is idempotent, and psLines never aliases its input', async () => {
    const { session } = makeSession();
    const lines = [...OPENING, '|-damage|p2a: Rhydon|180/250'];

    session.resync(lines);
    await drain(session);
    const first = session.htmlLog.length;

    session.resync(lines);
    await drain(session);

    expect(session.htmlLog).toHaveLength(first);
    expect(session.psLines).toHaveLength(lines.length);
    expect(session.psLines).not.toBe(lines);

    // A line arriving after the rebuild appends to the session's own record and
    // leaves the caller's array alone.
    session.addLine('|turn|2');
    expect(session.psLines).toHaveLength(lines.length + 1);
    expect(lines).toHaveLength(12);
  });

  it('re-prompts after a re-join, because the log carries the pending request', async () => {
    const { session, spy } = makeSession();
    for (const line of OPENING) session.addLine(line);
    session.addLine(REQUEST(3));
    await drain(session);
    expect(spy.requests).toHaveLength(1);

    // `/join <roomid>` -> `|init|battle` + the whole log, including the last
    // `|request|`. The rebuild starts from a clean rqid ledger, so the player
    // gets their move list back rather than a battle they cannot act in.
    session.resync([...OPENING, REQUEST(3)]);
    await drain(session);
    expect(spy.requests).toHaveLength(2);
    expect((spy.requests[1] as any).rqid).toBe(3);
  });
});
