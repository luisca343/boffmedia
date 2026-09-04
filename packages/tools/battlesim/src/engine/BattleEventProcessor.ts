import { Battle } from "@pkmn/client";
import { ArgType, BattleArgsKWArgsTypes, Protocol } from "@pkmn/protocol";
import { LogFormatter } from "@pkmn/view";
import { Scene } from "./Scene";
import { getEventPayload, EventPayload } from "./eventPayload";
import { AnimationRegistry, AnimationContext } from "./AnimationRegistry";
import type { BattleAudioState } from "./BattleAudio";
import type { TurnLedger } from "./TurnLedger";

export interface ProcessedBattleEvent {
  type: string;
  html: string;
  eventPayload: EventPayload;
  args: ArgType;
  kwArgs: BattleArgsKWArgsTypes;
}

const warn = (what: string, line: string, err: unknown) => {
  // Never silent. A swallowed handler error used to look exactly like a
  // Pokemon that simply refused to animate.
  console.warn(`[battlesim] ${what}`, line, err);
};

export interface BattleEventProcessorContext {
  scene: Scene;
  battle: Battle;
  /**
   * Which side the viewer is on. Read PER EVENT by `buildAnimationContext`,
   * so correcting it takes effect on the very next line without rebuilding
   * anything.
   */
  pov: 0 | 1;
  /**
   * The viewer's own player name, when it is knowable from the protocol.
   *
   * Set it and `pov` becomes SELF-CORRECTING: `|player|p2|You|` is applied to
   * the battle before the opening `|switch|` lines are animated, so the sides
   * are right from the first frame. Without it the pov has to be supplied from
   * outside and is therefore only as timely as whoever supplies it — which is
   * exactly how a Showdown battle ended up animating every move from the wrong
   * side (React laid the field out from the corrected pov while this context
   * was still on the initial guess of 0).
   *
   * Omitted by the local and PvP paths, which are told their side outright.
   */
  viewerName?: string | null;
  audioState?: BattleAudioState;
  /**
   * Resolves once React has painted the state this line produced. Supplied by
   * `BattleSession.awaitCommit`; the replay path leaves it out and gets a
   * no-op, because it drives the processor with no React in the loop.
   */
  commit?: () => Promise<void>;
  /** Shared with the session so the plates read the same record. */
  ledger?: TurnLedger;
}

const noCommit = () => Promise.resolve();

export class BattleEventProcessor {
  private formatter: LogFormatter;
  private animationRegistry: AnimationRegistry;

  constructor(public readonly context: BattleEventProcessorContext) {
    this.formatter = new LogFormatter(context.pov === 1 ? 'p2' : 'p1', context.battle);
    this.animationRegistry = new AnimationRegistry();
  }

  /**
   * Moves the viewer to the other side.
   *
   * The formatter goes with it: it was pinned to 'p1' regardless, so a player
   * on p2 read "Rhydon rival uses Earthquake" about their OWN Pokemon.
   */
  setPov(pov: 0 | 1): void {
    if (this.context.pov === pov) return;
    this.context.pov = pov;
    // MUTATED, never reconstructed. LogFormatter learns the player names from
    // the |player| lines it formats, not from the battle object — so a fresh
    // one mid-stream has already missed them and every later line reads
    // "Player 1" / "Player 2". Verified both ways against @pkmn/view.
    this.formatter.perspective = pov === 1 ? 'p2' : 'p1';
  }

  setViewerName(name: string | null): void {
    this.context.viewerName = name;
    this.syncPov();
  }

  /**
   * Rebinds the processor to a new scene without rebuilding it.
   *
   * A canvas remount used to construct a whole new processor, and with it a
   * fresh LogFormatter that had never seen the `|player|` lines — every line
   * after the remount read "Player 1" instead of the trainer's name.
   */
  setScene(scene: Scene): void {
    this.context.scene = scene;
  }

  setCommit(commit: (() => Promise<void>) | undefined): void {
    this.context.commit = commit;
  }

  setLedger(ledger: TurnLedger | undefined): void {
    this.context.ledger = ledger;
  }

  /** Resolves the pov from the battle's own player names. No-op without one. */
  private syncPov(): void {
    const me = this.context.viewerName?.trim();
    if (!me) return;
    const p2 = this.context.battle.p2?.name?.trim();
    const p1 = this.context.battle.p1?.name?.trim();
    // p2 is tested first and p1 only confirms: a spectator matches neither and
    // must stay on 0, which is also the answer while the names are still empty.
    if (p2 && p2 === me) this.setPov(1);
    else if (p1 && p1 === me) this.setPov(0);
  }

  /**
   * Applies one line, with the pre-state hook.
   *
   * ORDER: `preApply` → `battle.add` → pov sync → ledger → (caller runs
   * `postApply` via `runAnimation`). Both hooks used to run after the state
   * change, which made "what was in this slot a moment ago" unanswerable.
   */
  async processLine(line: string): Promise<ProcessedBattleEvent> {
    const { args, kwArgs } = Protocol.parseBattleLine(line);
    const html = this.format(args, kwArgs as BattleArgsKWArgsTypes, line);
    const eventPayload = this.payload(args, kwArgs as BattleArgsKWArgsTypes, line);

    const ctx = this.buildAnimationContext(args, kwArgs as BattleArgsKWArgsTypes, eventPayload.payload);
    if (ctx) {
      try {
        await this.animationRegistry.runPreApply(ctx);
      } catch (e) {
        warn('preApply failed', line, e);
      }
    }

    this.apply(args, kwArgs as BattleArgsKWArgsTypes, line);

    return { type: args[0], html, eventPayload, args, kwArgs: kwArgs as BattleArgsKWArgsTypes };
  }

  /**
   * Applies one line with NO animation and NO awaiting — the resync path,
   * which rebuilds a whole battle from its log and must land on exactly the
   * state a live viewer would have had.
   */
  applySync(line: string): ProcessedBattleEvent {
    const { args, kwArgs } = Protocol.parseBattleLine(line);
    const html = this.format(args, kwArgs as BattleArgsKWArgsTypes, line);
    const eventPayload = this.payload(args, kwArgs as BattleArgsKWArgsTypes, line);
    this.apply(args, kwArgs as BattleArgsKWArgsTypes, line);
    return { type: args[0], html, eventPayload, args, kwArgs: kwArgs as BattleArgsKWArgsTypes };
  }

  async runAnimation(event: ProcessedBattleEvent): Promise<number> {
    const ctx = this.buildAnimationContext(event.args, event.kwArgs, event.eventPayload.payload);
    if (!ctx) return 0;
    try {
      return await this.animationRegistry.runPostApply(ctx);
    } catch (e) {
      warn('postApply failed', `|${String(event.args[0])}|`, e);
      // The pipeline continues: an animation is never allowed to stop state.
      return 0;
    }
  }

  private format(args: ArgType, kwArgs: BattleArgsKWArgsTypes, line: string): string {
    try {
      return this.formatter.formatHTML(args, kwArgs) ?? '';
    } catch (e) {
      warn('formatHTML failed', line, e);
      return '';
    }
  }

  private payload(args: ArgType, kwArgs: BattleArgsKWArgsTypes, line: string): EventPayload {
    try {
      // BEFORE `battle.add`: `-damage` reads the HP it is about to replace.
      return getEventPayload(args[0], args, kwArgs, this.context.battle);
    } catch (e) {
      warn('payload failed', line, e);
      return { type: args[0], payload: null };
    }
  }

  private apply(args: ArgType, kwArgs: BattleArgsKWArgsTypes, line: string): void {
    try {
      this.context.battle.add(args, kwArgs);
    } catch (e) {
      warn('battle.add failed', line, e);
    }
    // AFTER the line is applied and BEFORE the animation context is built, so
    // the `|player|` line that names us is already in `battle` and the switches
    // that follow it in the same frame animate on the right side.
    try {
      this.syncPov();
    } catch (e) {
      warn('syncPov failed', line, e);
    }
    try {
      this.context.ledger?.record(args, kwArgs, this.context.battle);
    } catch (e) {
      warn('ledger failed', line, e);
    }
  }

  private buildAnimationContext(
    args: ArgType,
    kwArgs: BattleArgsKWArgsTypes,
    data: any
  ): AnimationContext | null {
    const { scene, battle, pov, audioState, commit, ledger } = this.context;
    if (!scene) return null;
    return {
      scene,
      battle,
      args,
      kwArgs,
      data,
      pov,
      acceleration: scene.acceleration,
      skipAnims: scene.skipAnims,
      audioState,
      commit: commit ?? noCommit,
      ledger,
    };
  }
}
