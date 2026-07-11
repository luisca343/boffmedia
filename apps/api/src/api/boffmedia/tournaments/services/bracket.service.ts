import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { TournamentsRepository } from '../repositories/tournaments.repository';
import { MatchesService } from './matches.service';
import {
  computeStandings,
  matchesForPhaseChain,
  standingsForEntrants,
} from '../standings.util';
import {
  Tournament,
  TournamentParticipant,
  TournamentPhase,
} from '@/_db/schema/Tournaments';
import { GenerateBracketDto, SeedingMode } from '../dto/generate-bracket.dto';
import type { MatchBracket, MatchSlot } from '../tournaments.types';

@Injectable()
export class BracketService {
  constructor(
    private readonly repo: TournamentsRepository,
    private readonly matches: MatchesService,
  ) {}

  async generate(t: Tournament, dto: GenerateBracketDto): Promise<void> {
    if (t.status === 'completed' || t.status === 'cancelled') {
      throw new BadRequestException('Tournament is closed');
    }
    const phases = await this.repo.listPhases(t.id);
    const live = phases.find((p) => p.status === 'live');

    // No live phase yet → activate phase 1: seed the active participants and
    // freeze them as this phase's entrants, then build its structure.
    if (!live) {
      const first = phases[0];
      if (!first) throw new BadRequestException('Tournament has no phases');
      const active = (await this.repo.listParticipants(t.id)).filter(
        (p) => p.status === 'active',
      );
      if (t.format !== 'leaderboard' && active.length < 2) {
        throw new BadRequestException('Need at least 2 active participants');
      }
      const orderedIds = await this.seed(active, dto);
      await this.repo.addPhaseEntrants(
        orderedIds.map((pid, i) => ({
          phaseId: first.id,
          participantId: pid,
          seed: i + 1,
        })),
      );
      await this.buildPhase(t, first, orderedIds, dto);
      await this.repo.updatePhase(first.id, { status: 'live' });
      await this.repo.update(t.id, { status: 'live' });
      return;
    }

    // A phase is live: swiss next round, or the groups knockout second call.
    const orderedIds = (await this.repo.listPhaseEntrants(live.id)).map(
      (e) => e.participantId,
    );
    await this.buildPhase(t, live, orderedIds, dto);
    await this.repo.update(t.id, { status: 'live' });
  }

  /**
   * Build the structure for one phase from its ordered entrant ids, tagging the
   * new matches with the phase. Reused by phase-1 activation (generate) and by
   * the advancement service when it opens the next phase. Legacy `groups`
   * tournaments (always single-phase) keep their whole-tournament code path.
   */
  async buildPhase(
    t: Tournament,
    phase: TournamentPhase,
    orderedIds: number[],
    dto: GenerateBracketDto,
  ): Promise<void> {
    const format = t.format === 'groups' ? 'groups' : phase.format;
    switch (format) {
      case 'leaderboard':
        break; // ranking metric only — no structural matches
      case 'single':
        await this.assertPhaseRegenerable(phase.id, dto.force);
        await this.wipePhase(phase.id);
        await this.buildSingleElim(t.id, orderedIds, 'winners');
        break;
      case 'roundrobin':
        await this.assertPhaseRegenerable(phase.id, dto.force);
        await this.wipePhase(phase.id);
        await this.buildLeague(t.id, orderedIds);
        break;
      case 'double':
        await this.assertPhaseRegenerable(phase.id, dto.force);
        await this.wipePhase(phase.id);
        await this.buildDouble(t.id, orderedIds);
        break;
      case 'groups': {
        const active = (await this.repo.listParticipants(t.id)).filter(
          (p) => p.status === 'active',
        );
        await this.buildGroupsOrKnockout(t, active, dto);
        break;
      }
      case 'swiss':
        await this.buildSwiss(t, phase, orderedIds, dto);
        break;
    }
    await this.repo.assignOrphanMatchesToPhase(t.id, phase.id);
  }

  // ── seeding ───────────────────────────────────────────────────────────────
  private async seed(
    participants: TournamentParticipant[],
    dto: GenerateBracketDto,
  ): Promise<number[]> {
    const mode: SeedingMode = dto.seeding ?? 'as-seeded';
    const ordered = [...participants];
    if (mode === 'random') {
      for (let i = ordered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
      }
    } else if (mode === 'as-seeded') {
      ordered.sort(
        (a, b) =>
          (a.seed ?? Number.MAX_SAFE_INTEGER) -
            (b.seed ?? Number.MAX_SAFE_INTEGER) || a.id - b.id,
      );
    } else {
      ordered.sort((a, b) => a.id - b.id); // as-added (registration order)
    }
    const ids: number[] = [];
    for (let i = 0; i < ordered.length; i++) {
      await this.repo.updateParticipant(ordered[i].id, { seed: i + 1 });
      ids.push(ordered[i].id);
    }
    return ids;
  }

  private nextPow2(n: number): number {
    let p = 1;
    while (p < n) p *= 2;
    return Math.max(2, p);
  }

  /** Standard bracket seed slot order (1-indexed seeds), length = size. */
  private seedSlots(size: number): number[] {
    let slots = [1, 2];
    while (slots.length < size) {
      const sum = slots.length * 2 + 1;
      const next: number[] = [];
      for (const s of slots) {
        next.push(s);
        next.push(sum - s);
      }
      slots = next;
    }
    return slots;
  }

  private async wipe(tournamentId: number): Promise<void> {
    await this.repo.deleteMatches(tournamentId);
    await this.repo.deleteGroups(tournamentId);
    await this.repo.update(tournamentId, { championParticipantId: null });
  }

  /** Refuse to wipe a bracket that already holds recorded results unless forced. */
  private async assertRegenerable(
    tournamentId: number,
    force?: boolean,
  ): Promise<void> {
    if (force) return;
    const existing = await this.repo.listMatches(tournamentId);
    if (existing.some((m) => m.status === 'completed' || m.status === 'bye')) {
      throw new BadRequestException(
        'Regenerating discards recorded results — pass force:true to confirm',
      );
    }
  }

  /** Drop just one phase's matches (multi-phase safe — leaves earlier phases). */
  private async wipePhase(phaseId: number): Promise<void> {
    await this.repo.deleteMatchesByPhase(phaseId);
  }

  private async assertPhaseRegenerable(
    phaseId: number,
    force?: boolean,
  ): Promise<void> {
    if (force) return;
    const existing = await this.repo.listMatchesByPhase(phaseId);
    if (existing.some((m) => m.status === 'completed' || m.status === 'bye')) {
      throw new BadRequestException(
        'Regenerating discards recorded results — pass force:true to confirm',
      );
    }
  }

  // ── single elimination (reused by double for the winners bracket) ──────────
  private async buildSingleElim(
    tournamentId: number,
    ids: number[],
    bracket: MatchBracket,
  ): Promise<number[][]> {
    const n = ids.length;
    const size = this.nextPow2(n);
    const rounds = Math.log2(size);
    const slots = this.seedSlots(size);
    const pidForSeed = (s: number) => (s <= n ? ids[s - 1] : null);

    const matchIds: number[][] = [];
    for (let r = 0; r < rounds; r++) {
      const count = size / 2 ** (r + 1);
      const row: number[] = [];
      for (let p = 0; p < count; p++) {
        row.push(
          await this.repo.insertMatch({
            tournamentId,
            bracket,
            roundNumber: r + 1,
            position: p,
            status: 'pending',
          }),
        );
      }
      matchIds.push(row);
    }

    for (let r = 0; r < rounds - 1; r++) {
      for (let p = 0; p < matchIds[r].length; p++) {
        await this.repo.updateMatch(matchIds[r][p], {
          nextMatchId: matchIds[r + 1][p >> 1],
          nextMatchSlot: p % 2 === 0 ? 'top' : 'bot',
        });
      }
    }

    for (let p = 0; p < matchIds[0].length; p++) {
      await this.repo.updateMatch(matchIds[0][p], {
        topParticipantId: pidForSeed(slots[2 * p]),
        botParticipantId: pidForSeed(slots[2 * p + 1]),
      });
    }

    // Resolve first-round byes (auto-advance the lone competitor) and mark full
    // pairings ready. A settle() call propagates the bye winner onward.
    for (let p = 0; p < matchIds[0].length; p++) {
      const m = await this.repo.findMatch(matchIds[0][p]);
      if (!m) continue;
      const hasTop = m.topParticipantId != null;
      const hasBot = m.botParticipantId != null;
      if (hasTop && hasBot) {
        await this.repo.setMatchStatus(m.id, 'ready');
      } else if (hasTop || hasBot) {
        await this.matches.settle(m, {
          winnerId: (m.topParticipantId ?? m.botParticipantId)!,
          loserId: null,
          topScore: null,
          botScore: null,
          status: 'bye',
        });
      }
    }
    return matchIds;
  }

  // ── round-robin (league) ────────────────────────────────────────────────────
  private roundRobinRounds(ids: number[]): [number, number][][] {
    const arr: (number | null)[] = [...ids];
    if (arr.length % 2 === 1) arr.push(null); // odd → one bye per round
    const n = arr.length;
    const rounds: [number, number][][] = [];
    for (let r = 0; r < n - 1; r++) {
      const pairs: [number, number][] = [];
      for (let i = 0; i < n / 2; i++) {
        const a = arr[i];
        const b = arr[n - 1 - i];
        if (a != null && b != null) pairs.push([a, b]);
      }
      rounds.push(pairs);
      arr.splice(1, 0, arr.pop()!); // rotate, first element fixed
    }
    return rounds;
  }

  private async buildLeague(
    tournamentId: number,
    ids: number[],
    bracket: MatchBracket = 'league',
    groupId?: number,
  ): Promise<void> {
    const rounds = this.roundRobinRounds(ids);
    for (let r = 0; r < rounds.length; r++) {
      for (let p = 0; p < rounds[r].length; p++) {
        const [a, b] = rounds[r][p];
        await this.repo.insertMatch({
          tournamentId,
          bracket,
          groupId: groupId ?? null,
          roundNumber: r + 1,
          position: p,
          topParticipantId: a,
          botParticipantId: b,
          status: 'ready',
        });
      }
    }
  }

  // ── groups (group stage → then knockout on a second generate call) ──────────
  private async buildGroupsOrKnockout(
    t: Tournament,
    active: TournamentParticipant[],
    dto: GenerateBracketDto,
  ): Promise<void> {
    const groups = await this.repo.listGroups(t.id);

    if (groups.length === 0) {
      await this.assertRegenerable(t.id, dto.force);
      await this.wipe(t.id);
      const ids = await this.seed(active, dto);
      const groupCount = Math.max(
        1,
        dto.groupCount ?? t.groupCount ?? Math.max(1, Math.round(ids.length / 4)),
      );
      const advance = dto.advanceCount ?? t.advanceCount ?? 2;

      const groupIds: number[] = [];
      for (let g = 0; g < groupCount; g++) {
        groupIds.push(
          await this.repo.createGroup({
            tournamentId: t.id,
            name: `Grupo ${String.fromCharCode(65 + g)}`,
            advanceCount: advance,
            order: g,
          }),
        );
      }

      // Snake-seed participants across groups (balanced strength).
      const members: number[][] = groupIds.map(() => []);
      let gi = 0;
      let dir = 1;
      for (const pid of ids) {
        members[gi].push(pid);
        await this.repo.updateParticipant(pid, { groupId: groupIds[gi] });
        gi += dir;
        if (gi >= groupCount) {
          gi = groupCount - 1;
          dir = -1;
        } else if (gi < 0) {
          gi = 0;
          dir = 1;
        }
      }

      for (let g = 0; g < groupCount; g++) {
        if (members[g].length >= 2) {
          await this.buildLeague(t.id, members[g], 'group', groupIds[g]);
        }
      }
      return;
    }

    // Second call: seed a single-elim knockout from group advancers.
    const all = await this.repo.listMatches(t.id);
    if (all.some((m) => m.bracket === 'winners')) {
      throw new BadRequestException('Knockout already generated');
    }
    const groupMatches = all.filter((m) => m.bracket === 'group');
    if (groupMatches.some((m) => m.status !== 'completed')) {
      throw new BadRequestException('Finish every group match first');
    }

    // Advancers: top N of each group, cross-seeded (winners then runners-up …).
    const advancersByRank: number[][] = [];
    for (const g of groups) {
      const memberIds = active
        .filter((p) => p.groupId === g.id)
        .map((p) => p.id);
      const standings = computeStandings(
        memberIds,
        groupMatches.filter((m) => m.groupId === g.id),
      );
      const take = standings.slice(0, g.advanceCount).map((s) => s.participantId);
      take.forEach((pid, rank) => {
        (advancersByRank[rank] ??= []).push(pid);
      });
    }
    const knockoutIds = advancersByRank.flat();
    if (knockoutIds.length >= 2) {
      await this.buildSingleElim(t.id, knockoutIds, 'winners');
    }
  }

  // ── double elimination (winners + losers + grand final) ─────────────────────
  private async buildDouble(tournamentId: number, ids: number[]): Promise<void> {
    const wb = await this.buildSingleElim(tournamentId, ids, 'winners');
    const k = wb.length; // number of winners-bracket rounds

    if (k < 2) return; // 2 players → WB final is effectively the whole thing

    // Losers-bracket round sizes: minor/major pattern. For k WB rounds the LB
    // has 2(k-1) rounds; odd LB rounds receive WB dropouts, even ones consolidate.
    const lb: number[][] = [];
    const lbRoundCount = 2 * (k - 1);
    for (let r = 0; r < lbRoundCount; r++) {
      // sizes: [N/4, N/4, N/8, N/8, …, 1, 1] → derived from the pair count
      const count = 2 ** (k - 2 - Math.floor(r / 2));
      const row: number[] = [];
      for (let p = 0; p < count; p++) {
        row.push(
          await this.repo.insertMatch({
            tournamentId,
            bracket: 'losers',
            roundNumber: r + 1,
            position: p,
            status: 'pending',
          }),
        );
      }
      lb.push(row);
    }

    // Wire LB winner-advance links. Odd LB rounds *consolidate* (two LB winners
    // meet, count halves: p → p>>1, alternating slots); even LB rounds *keep* the
    // count (each LB winner takes the top slot of the next major round, whose bot
    // slot receives the incoming WB dropout).
    for (let r = 0; r < lb.length - 1; r++) {
      const consolidates = r % 2 === 1;
      for (let p = 0; p < lb[r].length; p++) {
        const nextPos = consolidates ? p >> 1 : p;
        const nextSlot: MatchSlot = consolidates
          ? p % 2 === 0
            ? 'top'
            : 'bot'
          : 'top';
        await this.repo.updateMatch(lb[r][p], {
          nextMatchId: lb[r + 1][nextPos],
          nextMatchSlot: nextSlot,
        });
      }
    }

    // Grand final.
    const grandId = await this.repo.insertMatch({
      tournamentId,
      bracket: 'grand',
      roundNumber: 1,
      position: 0,
      status: 'pending',
    });
    // WB champion → grand final top; LB champion → grand final bot.
    await this.repo.updateMatch(wb[k - 1][0], {
      nextMatchId: grandId,
      nextMatchSlot: 'top',
    });
    await this.repo.updateMatch(lb[lb.length - 1][0], {
      nextMatchId: grandId,
      nextMatchSlot: 'bot',
    });

    // Route WB losers into the LB.
    // WB round 1 losers → LB round 1 (minor). WB round r (>=2) losers → LB
    // round 2r-2 (major, bot slot).
    for (let p = 0; p < wb[0].length; p++) {
      await this.repo.updateMatch(wb[0][p], {
        loserNextMatchId: lb[0][p >> 1],
        loserNextMatchSlot: p % 2 === 0 ? 'top' : 'bot',
      });
    }
    for (let r = 1; r < k; r++) {
      const lbRound = 2 * r - 1; // 0-indexed major round
      for (let p = 0; p < wb[r].length; p++) {
        await this.repo.updateMatch(wb[r][p], {
          loserNextMatchId: lb[lbRound][p],
          loserNextMatchSlot: 'bot',
        });
      }
    }

    await this.resolveLbByes(wb, lb, grandId);
  }

  // Non-power-of-2 fields: WB round-1 byes produce fewer dropouts than the LB
  // round-1 slots expect, so some LB slots can never fill. Deadness originates
  // only from WB round-1 byes (every later WB round is a real match) and flows
  // forward through LB winner edges. Resolve it structurally: a phantom LB match
  // (both feeders dead) is marked `bye` and its own destination slot is killed;
  // a half-dead LB match reroutes its single live feeder straight to its
  // destination, skipping the phantom pairing — mirroring how buildSingleElim
  // auto-advances byes.
  private async resolveLbByes(
    wb: number[][],
    lb: number[][],
    grandId: number,
  ): Promise<void> {
    if (lb.length === 0) return;

    const deadTop: boolean[][] = lb.map((row) => row.map(() => false));
    const deadBot: boolean[][] = lb.map((row) => row.map(() => false));

    // Seed deadness from WB round-1 byes (loser of a bye never materialises).
    for (let p = 0; p < wb[0].length; p++) {
      const m = await this.repo.findMatch(wb[0][p]);
      if (m && m.status !== 'bye') continue;
      const q = p >> 1; // wb[0][p] loser → lb[0][q]
      if (p % 2 === 0) deadTop[0][q] = true;
      else deadBot[0][q] = true;
    }

    for (let r = 0; r < lb.length; r++) {
      for (let p = 0; p < lb[r].length; p++) {
        const dt = deadTop[r][p];
        const db = deadBot[r][p];
        if (!dt && !db) continue;
        const matchId = lb[r][p];
        const dest = this.lbWinnerDest(r, p, lb, grandId);

        if (dt && db) {
          // No competitor ever reaches this match — propagate deadness onward.
          await this.repo.setMatchStatus(matchId, 'bye');
          if (dest.id !== grandId) {
            const [dr, dp] = this.lbIndexOf(lb, dest.id);
            if (dr >= 0) {
              if (dest.slot === 'top') deadTop[dr][dp] = true;
              else deadBot[dr][dp] = true;
            }
          }
        } else {
          // One live feeder: reroute it straight past the phantom pairing.
          const liveSlot: MatchSlot = dt ? 'bot' : 'top';
          const feeder = this.lbFeeder(r, p, liveSlot, wb, lb);
          const patch =
            feeder.via === 'loser'
              ? { loserNextMatchId: dest.id, loserNextMatchSlot: dest.slot }
              : { nextMatchId: dest.id, nextMatchSlot: dest.slot };
          await this.repo.updateMatch(feeder.id, patch);
          await this.repo.setMatchStatus(matchId, 'bye');
        }
      }
    }
  }

  /** Where the winner of losers-bracket match lb[r][p] advances. */
  private lbWinnerDest(
    r: number,
    p: number,
    lb: number[][],
    grandId: number,
  ): { id: number; slot: MatchSlot } {
    if (r === lb.length - 1) return { id: grandId, slot: 'bot' };
    if (r % 2 === 0) return { id: lb[r + 1][p], slot: 'top' };
    return { id: lb[r + 1][p >> 1], slot: p % 2 === 0 ? 'top' : 'bot' };
  }

  /** The match (and edge kind) feeding one slot of losers-bracket match lb[r][p]. */
  private lbFeeder(
    r: number,
    p: number,
    slot: MatchSlot,
    wb: number[][],
    lb: number[][],
  ): { id: number; via: 'winner' | 'loser' } {
    if (r === 0) {
      return { id: wb[0][slot === 'top' ? 2 * p : 2 * p + 1], via: 'loser' };
    }
    if (r % 2 === 1) {
      // Major round: top = previous LB winner, bot = incoming WB dropout.
      return slot === 'top'
        ? { id: lb[r - 1][p], via: 'winner' }
        : { id: wb[(r + 1) / 2][p], via: 'loser' };
    }
    // Minor round: both slots consolidate previous LB winners.
    return { id: lb[r - 1][slot === 'top' ? 2 * p : 2 * p + 1], via: 'winner' };
  }

  private lbIndexOf(lb: number[][], id: number): [number, number] {
    for (let r = 0; r < lb.length; r++) {
      const p = lb[r].indexOf(id);
      if (p >= 0) return [r, p];
    }
    return [-1, -1];
  }

  // ── swiss (round 1 on first call, next round on subsequent calls) ────────────
  private async buildSwiss(
    t: Tournament,
    phase: TournamentPhase,
    orderedIds: number[],
    dto: GenerateBracketDto,
  ): Promise<void> {
    const all = await this.repo.listMatches(t.id);
    // Scope to THIS phase's swiss matches (Day 1 and Day 2 are separate phases).
    const swiss = all.filter(
      (m) => m.bracket === 'swiss' && m.phaseId === phase.id,
    );
    const target =
      phase.rounds ??
      dto.rounds ??
      Math.ceil(Math.log2(Math.max(2, orderedIds.length)));

    // Round 1 pairs the frozen entrant order (top half vs bottom half).
    if (swiss.length === 0) {
      const half = Math.ceil(orderedIds.length / 2);
      await this.pairSwissRound(
        t.id,
        1,
        orderedIds
          .slice(0, half)
          .map((a, i) => [a, orderedIds[i + half] ?? null] as const),
      );
      return;
    }

    const maxRound = Math.max(...swiss.map((m) => m.roundNumber));
    if (maxRound >= target) {
      throw new BadRequestException('All Swiss rounds have been generated');
    }
    if (
      swiss
        .filter((m) => m.roundNumber === maxRound)
        .some((m) => m.status !== 'completed' && m.status !== 'bye')
    ) {
      throw new BadRequestException('Finish the current Swiss round first');
    }

    // Standings drive the next pairing: this phase's matches plus any carried
    // records from earlier phases. Compute over the whole field (so carried
    // records stay complete), then restrict to this phase's entrants.
    const phases = await this.repo.listPhases(t.id);
    const chainMatches = matchesForPhaseChain(phase.id, phases, all);
    const allIds = (await this.repo.listParticipants(t.id)).map((p) => p.id);
    const ranked = standingsForEntrants(
      orderedIds,
      allIds,
      chainMatches,
      phase.tiebreakProfile,
    );

    const played = new Set<string>();
    const priorByes = new Set<number>();
    for (const m of swiss) {
      if (m.topParticipantId != null && m.botParticipantId != null) {
        played.add(this.pairKey(m.topParticipantId, m.botParticipantId));
      }
      if (m.status === 'bye' && m.topParticipantId != null) {
        priorByes.add(m.topParticipantId);
      }
    }
    const pairing = this.swissPairing(
      ranked.map((r) => r.participantId),
      played,
      priorByes,
    );
    await this.pairSwissRound(t.id, maxRound + 1, pairing);
  }

  private async pairSwissRound(
    tournamentId: number,
    roundNumber: number,
    pairs: readonly (readonly [number, number | null])[],
  ): Promise<void> {
    let pos = 0;
    for (const [a, b] of pairs) {
      const id = await this.repo.insertMatch({
        tournamentId,
        bracket: 'swiss',
        roundNumber,
        position: pos++,
        topParticipantId: a,
        botParticipantId: b,
        status: b == null ? 'bye' : 'ready',
      });
      if (b == null) {
        const m = await this.repo.findMatch(id);
        if (m) {
          await this.matches.settle(m, {
            winnerId: a,
            loserId: null,
            topScore: 1,
            botScore: 0,
            status: 'bye',
          });
        }
      }
    }
  }

  private pairKey(a: number, b: number): string {
    return a < b ? `${a}-${b}` : `${b}-${a}`;
  }

  /** Greedy Swiss pairing over a standings-ordered list, avoiding rematches. */
  private swissPairing(
    ordered: number[],
    played: Set<string>,
    priorByes: Set<number> = new Set(),
  ): (readonly [number, number | null])[] {
    const pool = [...ordered];
    const pairs: (readonly [number, number | null])[] = [];

    // Odd field → the bye goes to the lowest-ranked player who has not had one
    // yet (pull them out before pairing so they never displace a rematch check).
    let byePlayer: number | null = null;
    if (pool.length % 2 === 1) {
      let idx = -1;
      for (let i = pool.length - 1; i >= 0; i--) {
        if (!priorByes.has(pool[i])) {
          idx = i;
          break;
        }
      }
      if (idx === -1) idx = pool.length - 1; // everyone already had one → lowest
      byePlayer = pool.splice(idx, 1)[0];
    }

    while (pool.length > 1) {
      const a = pool.shift()!;
      let idx = pool.findIndex((b) => !played.has(this.pairKey(a, b)));
      if (idx === -1) idx = 0; // forced rematch when no fresh opponent remains
      const b = pool.splice(idx, 1)[0];
      pairs.push([a, b]);
    }
    if (byePlayer != null) pairs.push([byePlayer, null]);
    return pairs;
  }
}
