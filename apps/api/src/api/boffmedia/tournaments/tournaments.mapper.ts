import {
  TournamentParticipant,
  TournamentRosterMember,
} from '@/_db/schema/BoffMediaTournaments';
import { Competitor, RosterMember } from './entities/competitor.entity';

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

export function toCompetitor(
  p: TournamentParticipant,
  roster?: TournamentRosterMember[],
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
  };
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
