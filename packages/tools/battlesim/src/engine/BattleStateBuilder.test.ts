import { describe, it, expect } from "vitest";
import { BattleStateBuilder } from "./BattleStateBuilder";

/**
 * Audit B11 — the incremental cursor.
 *
 * THE ONLY THING THAT MATTERS HERE IS THAT IT IS STILL CORRECT. The change
 * makes a forward seek continue from where the previous one stopped instead of
 * replaying the log from line 0. That is a speed change whose failure mode is
 * a silently WRONG board, so every test below compares the incremental result
 * against a FRESH builder's result for the same turn — the same output, fewer
 * operations. A test that only asserted "it got faster" would not catch the
 * bug this optimisation can introduce.
 */

function makeLog(turns: number, linesPerTurn = 4): string[] {
  const l = [
    "|player|p1|Red",
    "|player|p2|Blue",
    "|teamsize|p1|1",
    "|teamsize|p2|1",
    "|gametype|singles",
    "|gen|9",
    "|start",
    "|switch|p1a: Pikachu|Pikachu, L50, M|100/100",
    "|switch|p2a: Blissey|Blissey, L50, F|100/100",
  ];
  for (let t = 1; t <= turns; t++) {
    l.push(`|turn|${t}`);
    for (let k = 0; k < linesPerTurn; k++) {
      l.push(`|move|p1a: Pikachu|Thunderbolt|p2a: Blissey`);
      l.push(`|-damage|p2a: Blissey|${Math.max(1, 100 - t)}/100`);
    }
  }
  return l;
}

function turnMap(lines: string[]): Map<number, number> {
  const m = new Map<number, number>();
  lines.forEach((line, i) => {
    const match = line.match(/\|turn\|(\d+)/);
    if (match) m.set(parseInt(match[1]), i);
  });
  return m;
}

/** A comparable summary of the board a seek produced. */
function snapshot(r: { battle: any; htmlLog: string[]; actionIndex: number }) {
  return {
    turn: r.battle.turn,
    actionIndex: r.actionIndex,
    logLength: r.htmlLog.length,
    p1: r.battle.p1?.active?.map((p: any) => p && `${p.speciesForme}:${p.hp}/${p.maxhp}`),
    p2: r.battle.p2?.active?.map((p: any) => p && `${p.speciesForme}:${p.hp}/${p.maxhp}`),
  };
}

const LINES = makeLog(20);
const MAP = turnMap(LINES);
const LAST = 20;

const fresh = (turn: number) =>
  snapshot(new BattleStateBuilder(LINES, MAP).buildStateUntilTurn(turn, LAST));

describe("BattleStateBuilder — incremental forward seek (B11)", () => {
  it("stepping forward matches a fresh rebuild at every turn", () => {
    const incremental = new BattleStateBuilder(LINES, MAP);
    for (let turn = 1; turn <= LAST; turn++) {
      expect(snapshot(incremental.buildStateUntilTurn(turn, LAST))).toEqual(fresh(turn));
    }
  });

  it("skipping forward over several turns matches a fresh rebuild", () => {
    const incremental = new BattleStateBuilder(LINES, MAP);
    for (const turn of [3, 4, 11, 12, 19]) {
      expect(snapshot(incremental.buildStateUntilTurn(turn, LAST))).toEqual(fresh(turn));
    }
  });

  it("seeking BACKWARD rebuilds and is still correct", () => {
    const b = new BattleStateBuilder(LINES, MAP);
    b.buildStateUntilTurn(18, LAST);
    // Backward cannot continue a cursor; it must fall back to a full rebuild.
    expect(snapshot(b.buildStateUntilTurn(4, LAST))).toEqual(fresh(4));
    // …and the cursor is usable again afterwards.
    expect(snapshot(b.buildStateUntilTurn(9, LAST))).toEqual(fresh(9));
  });

  it("re-seeking the SAME turn does not double-apply the log", () => {
    const b = new BattleStateBuilder(LINES, MAP);
    b.buildStateUntilTurn(7, LAST);
    expect(snapshot(b.buildStateUntilTurn(7, LAST))).toEqual(fresh(7));
  });

  it("seeking to the end (lastTurn + 1) matches a fresh rebuild", () => {
    const incremental = new BattleStateBuilder(LINES, MAP);
    incremental.buildStateUntilTurn(5, LAST);
    expect(snapshot(incremental.buildStateUntilTurn(LAST + 1, LAST))).toEqual(
      fresh(LAST + 1),
    );
  });

  it("a seek after buildSetupState still matches a fresh rebuild", () => {
    const b = new BattleStateBuilder(LINES, MAP);
    b.buildStateUntilTurn(15, LAST);
    b.buildSetupState();
    // NOTE ON WHAT THIS DOES AND DOES NOT PROVE: `buildSetupState` also nulls
    // the cursor, and that assignment is hygiene rather than a load-bearing
    // guard — continuing a turn-15 cursor forward to turn 18 would produce the
    // correct turn-18 board anyway, so no test can distinguish it. This asserts
    // the reachable property: setup does not corrupt a later seek.
    expect(snapshot(b.buildStateUntilTurn(18, LAST))).toEqual(fresh(18));
    expect(snapshot(b.buildStateUntilTurn(3, LAST))).toEqual(fresh(3));
  });

  it("stays correct even if the returned battle is advanced behind the cursor's back", () => {
    const b = new BattleStateBuilder(LINES, MAP);
    const at5 = b.buildStateUntilTurn(5, LAST);

    at5.battle.add("|turn|7");
    at5.battle.add("|-damage|p2a: Blissey|3/100");

    expect(snapshot(b.buildStateUntilTurn(9, LAST))).toEqual(fresh(9));
  });

  /*
   * HONEST NOTE ON THE DRIFT GUARD, so nobody reads the test above as proof.
   *
   * `canContinue` also checks `battle.turn === cursor.turn` and rebuilds if
   * they disagree. THAT CHECK IS NOT VERIFIED BY ANY TEST HERE, and it was
   * tried: deleting it leaves all eight green. The reason is that the protocol
   * is self-healing for exactly this. `|turn|N` sets the turn absolutely and
   * `|-damage|POKEMON|HP` sets HP absolutely, so replaying the following lines
   * overwrites whatever an external writer did, and the outcome matches a
   * rebuild either way.
   *
   * It is kept as defence for a future caller that mutates the instance in a
   * way the log does NOT overwrite, since its only cost when wrong is a
   * rebuild. But it is unverified defence, not a tested guarantee — the tests
   * that ARE load-bearing are the rebuild-comparison ones above, which fail
   * on a broken cursor (confirmed by breaking the continuation arithmetic and
   * watching four of them go red).
   */

  it("actually continues rather than rebuilding, on a forward seek", () => {
    // The performance claim, asserted as behaviour: a continued seek feeds only
    // the lines between the two turns, so its html log grows by that much
    // rather than being rebuilt from zero. (Same numbers, different work.)
    const b = new BattleStateBuilder(LINES, MAP);
    const a = b.buildStateUntilTurn(5, LAST);
    const lenAt5 = a.htmlLog.length;
    const c = b.buildStateUntilTurn(6, LAST);

    // Continuing appends to the SAME array instance the cursor holds.
    expect(c.htmlLog).toBe(a.htmlLog);
    expect(c.htmlLog.length).toBeGreaterThan(lenAt5);
  });
});
