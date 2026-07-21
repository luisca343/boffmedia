import { Injectable, NotFoundException } from '@nestjs/common';
import { SEASON_LADDER, SeasonTierKey } from '@/_db/schema/SmartRotomPasaporte';
import { PasaporteRepository } from './pasaporte.repository';
import {
  DEFAULT_REGION,
  LogroView,
  ProfileView,
  SeasonBattle,
  SeasonStanding,
  SeasonView,
} from './types/pasaporte.types';

// The derived LP score. There is NO lp column anywhere — a standing is a pure function
// of the season's real battle results, recomputed on every read.
const LP_PER_WIN = 20;
const LP_PER_LOSS = 12;

const REGION_MAX = 32;
const TRAINER_ID_ATTEMPTS = 8;

const DIVISIONS = ['I', 'II', 'III', 'IV'] as const;

// Completion % → the title printed under the trainer's name.
const TITLES: { min: number; title: string }[] = [
  { min: 90, title: 'Maestro Pokémon' },
  { min: 70, title: 'Entrenador de Élite' },
  { min: 40, title: 'Entrenador Veterano' },
  { min: 15, title: 'Entrenador' },
];
const DEFAULT_TITLE = 'Novato';

// `rotom_users.world` is the Minecraft world the player is in, and on this server that
// is the vanilla name — "world", "world_nether". Printing that under REGIÓN on a
// passport is nonsense: it is a server implementation detail, not a place the trainer
// has been. Treat the vanilla names as "no region recorded" and fall back to the
// in-fiction default. A real region only appears here if the server actually names its
// worlds after the regions.
const VANILLA_WORLDS = new Set([
  'world',
  'overworld',
  'world_nether',
  'world_the_end',
  'nether',
  'the_end',
]);

const earliest = (a: Date | null, b: Date | null): Date | null => {
  if (!a) return b;
  if (!b) return a;
  return a.getTime() <= b.getTime() ? a : b;
};

@Injectable()
export class PasaporteService {
  constructor(private readonly repo: PasaporteRepository) {}

  // ==================== PROFILE ====================

  // The passport provisions itself on first read: a trainer who never opened the app
  // still has to be addressable by uuid, exactly like Rooker hands every rotom_user a
  // handle. Nothing here is a score, so creating it costs nothing.
  async getProfile(uuid: string): Promise<ProfileView> {
    const user = await this.repo.findUser(uuid);
    if (!user) throw new NotFoundException(`Trainer ${uuid} not found`);

    let profile = await this.repo.findProfile(uuid);

    if (!profile) {
      const world = user.world?.trim();
      const region =
        world && !VANILLA_WORLDS.has(world.toLowerCase())
          ? world.slice(0, REGION_MAX)
          : DEFAULT_REGION;

      await this.repo.createProfile({
        uuid,
        trainerId: await this.issueTrainerId(uuid),
        region,
        // memberSince is left to the DB default (CURRENT_TIMESTAMP), but it is NOT what
        // we print — see below.
      });
      profile = await this.repo.findProfile(uuid);
      if (!profile) {
        throw new NotFoundException(
          `Could not provision a passport for ${uuid}`,
        );
      }
    }

    const totals = await this.repo.achievementTotals(uuid);
    const completionPct =
      totals.total > 0
        ? Math.round((totals.completed / totals.total) * 100)
        : 0;

    // "Miembro desde" is DERIVED, not the row's birthday. The passport row is created the
    // first time the trainer opens the app, so `profile.memberSince` is when they looked
    // at their passport — for a player who has been on the server since 2023 it would
    // print today's date on the carné, which is simply a lie. `rotom_users` has no join
    // date, so the earliest thing we can actually prove about a trainer is the first
    // achievement they completed. Take whichever is earlier; fall back to the row only
    // for a trainer with no history at all.
    const firstSeen = await this.repo.firstActivityAt(uuid);
    const memberSince = earliest(firstSeen, profile.memberSince);

    return {
      uuid: profile.uuid,
      username: user.username,
      trainerId: profile.trainerId,
      region: profile.region,
      memberSince,
      createdAt: profile.createdAt ?? null,
      // `rank` is the badge count: completed achievements in the Gimnasios category.
      rank: totals.badges,
      title: this.titleFor(completionPct),
      completionPct,
    };
  }

  // ==================== LOGROS ====================

  async getLogros(uuid: string): Promise<LogroView[]> {
    return this.repo.findLogros(uuid);
  }

  // ==================== SEASON ====================

  async getSeason(uuid: string): Promise<SeasonView> {
    const user = await this.repo.findUser(uuid);
    if (!user) throw new NotFoundException(`Trainer ${uuid} not found`);

    const season = await this.repo.findActiveSeason();

    // No cycle running is a legitimate state (between seasons), not an error.
    if (!season) {
      return {
        season: null,
        standing: this.emptyStanding(),
        ladder: SEASON_LADDER,
      };
    }

    const [battles, leaderboard] = await Promise.all([
      this.repo.seasonBattles(
        uuid,
        user.username,
        season.startsAt,
        season.endsAt,
      ),
      this.repo.seasonLeaderboard(season.startsAt, season.endsAt),
    ]);

    const position = leaderboard.findIndex((r) => r.uuid === uuid);

    return {
      season: {
        id: season.id,
        number: season.number,
        name: season.name,
        startsAt: season.startsAt,
        endsAt: season.endsAt,
      },
      standing: {
        ...this.standingFrom(battles),
        // 0 when the trainer has not fought this season — they are not on the board.
        regionRank: position >= 0 ? position + 1 : 0,
      },
      ladder: SEASON_LADDER,
    };
  }

  // ==================== DERIVATIONS ====================

  // The whole standing, walked out of the real battle list in chronological order.
  private standingFrom(
    battles: SeasonBattle[],
  ): Omit<SeasonStanding, 'regionRank'> {
    let wins = 0;
    let losses = 0;
    let peakLp = 0;

    for (const battle of battles) {
      if (battle.win) wins++;
      else losses++;
      // peak = the highest the derived score ever reached mid-season, so a player who
      // climbed and then fell keeps the evidence of the climb.
      peakLp = Math.max(peakLp, this.lpOf(wins, losses));
    }

    // Current win streak: count back from the most recent battle until the first loss.
    let streak = 0;
    for (let i = battles.length - 1; i >= 0; i--) {
      if (!battles[i].win) break;
      streak++;
    }

    const lp = this.lpOf(wins, losses);
    const rung = this.rungFor(lp);
    const next = SEASON_LADDER[rung.index + 1];

    return {
      battles: battles.length,
      wins,
      losses,
      streak,
      lp,
      peakLp,
      tierKey: rung.key,
      tier: rung.name,
      division: this.divisionFor(lp, rung.index),
      nextAt: next ? next.minLp : null,
    };
  }

  // Derived score — NOT stored, NOT awarded. Deterministic in the season's results.
  private lpOf(wins: number, losses: number): number {
    return Math.max(0, wins * LP_PER_WIN - losses * LP_PER_LOSS);
  }

  private rungFor(lp: number): {
    index: number;
    key: SeasonTierKey;
    name: string;
  } {
    let index = 0;
    for (let i = 0; i < SEASON_LADDER.length; i++) {
      if (lp >= SEASON_LADDER[i].minLp) index = i;
    }
    return {
      index,
      key: SEASON_LADDER[index].key,
      name: SEASON_LADDER[index].name,
    };
  }

  // Roman I–IV by how deep into the tier's band the LP sits — the TOP quarter is I.
  // The last rung has no band above it, so it is always I.
  private divisionFor(lp: number, index: number): string {
    const rung = SEASON_LADDER[index];
    const next = SEASON_LADDER[index + 1];
    if (!next) return DIVISIONS[0];

    const band = next.minLp - rung.minLp;
    if (band <= 0) return DIVISIONS[0];

    const progress = (lp - rung.minLp) / band;
    const quarter = Math.min(DIVISIONS.length - 1, Math.floor(progress * 4));
    return DIVISIONS[DIVISIONS.length - 1 - quarter];
  }

  private titleFor(completionPct: number): string {
    return TITLES.find((t) => completionPct >= t.min)?.title ?? DEFAULT_TITLE;
  }

  private emptyStanding(): SeasonStanding {
    const rung = SEASON_LADDER[0];
    return {
      battles: 0,
      wins: 0,
      losses: 0,
      streak: 0,
      lp: 0,
      peakLp: 0,
      tierKey: rung.key,
      tier: rung.name,
      division: DIVISIONS[DIVISIONS.length - 1],
      nextAt: SEASON_LADDER[1].minLp,
      regionRank: 0,
    };
  }

  // ==================== TRAINER ID ====================

  /**
   * The trainer id is DETERMINISTIC in the uuid — never random.
   *
   * It is printed on the carné and encoded in its QR, so it has to survive a wipe of
   * this table and come back identical. THIS HASH MUST NOT CHANGE: any tweak to the
   * mixing below reissues every id in the server and invalidates every printed carné
   * and every QR already in circulation.
   *
   * FNV-1a (32-bit), frozen.
   */
  private stableHash(input: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  // TRS-NNNN-X: four decimal digits and a letter, both from the same hash.
  private trainerIdFor(uuid: string, attempt: number): string {
    // attempt 0 IS the plain uuid — the id a trainer gets is the one their uuid maps to.
    const h = this.stableHash(attempt === 0 ? uuid : `${uuid}#${attempt}`);
    const digits = String(h % 10000).padStart(4, '0');
    const letter = String.fromCharCode(65 + (Math.floor(h / 10000) % 26));
    return `TRS-${digits}-${letter}`;
  }

  // 260k ids over a Minecraft server's population makes a collision unlikely but not
  // impossible, and the column is UNIQUE. A taken id falls through to the next
  // deterministic candidate for THIS uuid; once written, the row is the source of
  // truth and the id never moves again.
  private async issueTrainerId(uuid: string): Promise<string> {
    for (let attempt = 0; attempt < TRAINER_ID_ATTEMPTS; attempt++) {
      const candidate = this.trainerIdFor(uuid, attempt);
      const owner = await this.repo.trainerIdOwner(candidate);
      if (owner === null || owner === uuid) return candidate;
    }
    // Exhausting 8 deterministic candidates means the id space is saturated — that is a
    // real operational problem, not something to paper over with a random id.
    throw new NotFoundException(
      `Could not issue a trainer id for ${uuid} — the id space looks saturated`,
    );
  }
}
