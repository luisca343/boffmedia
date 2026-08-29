import {
  TournamentParticipant,
  TournamentRosterMember,
} from '@/_db/schema/BoffMediaTournaments';
import { Competitor, RosterMember } from './entities/competitor.entity';
import { TeamsheetMonDto } from './dto/teamsheet.dto';

/** ISO alpha-2 country code → regional-indicator flag emoji (null if invalid). */
export function flagEmoji(country: string | null): string | null {
  if (!country) return null;
  const cc = country.toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return null;
  const BASE = 0x1f1e6; // 🇦
  return String.fromCodePoint(
    BASE + (cc.charCodeAt(0) - 65),
    BASE + (cc.charCodeAt(1) - 65),
  );
}

export function toRosterMember(r: TournamentRosterMember): RosterMember {
  return { id: r.id, userId: r.userId, name: r.name, role: r.role };
}

/**
 * Viewer-scoped extras. Both default to null, so every caller that does not
 * deliberately pass them (the match page, the public participants list) cannot
 * leak a sheet by omission.
 */
export interface CompetitorExtras {
  teamsheet?: TeamsheetMonDto[] | null;
  entryGaps?: string[] | null;
}

export function toCompetitor(
  p: TournamentParticipant,
  roster?: TournamentRosterMember[],
  extras?: CompetitorExtras,
): Competitor {
  return {
    id: String(p.id),
    kind: p.kind,
    name: p.name,
    tag: p.tag,
    country: p.country,
    flag: flagEmoji(p.country),
    seed: p.seed,
    status: p.status,
    checkedIn: p.checkedInAt != null,
    hue: p.hue,
    avatar: p.avatar,
    score: p.score,
    verified: p.verified,
    roster: roster && roster.length ? roster.map(toRosterMember) : undefined,
    teamsheet: extras?.teamsheet ?? null,
    entryGaps: extras?.entryGaps ?? null,
  };
}

/**
 * Stored teamsheet JSON → mons, or null when the participant has none.
 *
 * The column is free-form JSON written by an older writer, so a corrupt row
 * reads as "no teamsheet" rather than breaking the whole payload it sits in.
 */
export function parseTeamsheet(
  p: TournamentParticipant | undefined | null,
): TeamsheetMonDto[] | null {
  if (!p?.teamsheet) return null;
  try {
    const mons = JSON.parse(p.teamsheet) as TeamsheetMonDto[];
    return Array.isArray(mons) && mons.length ? mons : null;
  } catch {
    return null;
  }
}

/** Slugify a tournament name (ascii, dash-separated, lowercased). */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}
