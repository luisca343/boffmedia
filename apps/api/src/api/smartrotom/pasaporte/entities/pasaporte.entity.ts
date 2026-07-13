import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ACHIEVEMENT_TIERS } from '@/_db/schema/SmartRotom';
import { SEASON_LADDER } from '@/_db/schema/SmartRotomPasaporte';

const TIER_KEYS = SEASON_LADDER.map((r) => r.key);

export class PasaporteProfileEntity {
  @ApiProperty() uuid: string;
  @ApiProperty({ example: 'Luisca' }) username: string;

  @ApiProperty({
    example: 'TRS-7741-K',
    description:
      'Deterministic in the uuid — printed on the carné and encoded in its QR. Never regenerated.',
  })
  trainerId: string;

  @ApiProperty({
    example: 'Fukitsu',
    description: "The trainer's world, or Fukitsu when they have none.",
  })
  region: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  memberSince: Date | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  createdAt: Date | null;

  @ApiProperty({
    example: 3,
    description:
      'Derived, never stored: completed achievements in the "Gimnasios" category — the badges earned.',
  })
  rank: number;

  @ApiProperty({
    example: 'Entrenador Veterano',
    description: 'Derived from completionPct: 90+ / 70+ / 40+ / 15+ / else Novato.',
  })
  title: string;

  @ApiProperty({
    example: 42,
    description: 'Derived: completed / total achievements * 100, rounded.',
  })
  completionPct: number;
}

export class PasaporteLogroEntity {
  @ApiProperty({ example: 'gym_roca' }) id: string;
  @ApiProperty({ example: 'Medalla Roca' }) name: string;
  @ApiProperty() description: string;
  @ApiPropertyOptional({ type: String, nullable: true }) icon: string | null;
  @ApiProperty({ example: 'Gimnasios' }) category: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  subcategory: string | null;
  @ApiProperty({ example: 1 }) target: number;
  @ApiProperty({ example: 0 }) order: number;

  @ApiProperty({ example: 1, description: '0 when the trainer never touched it.' })
  progress: number;

  @ApiProperty({ example: false }) completed: boolean;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  completedAt: Date | null;

  @ApiProperty({ example: 25, description: 'Curated by category — see the seed.' })
  points: number;

  @ApiProperty({ enum: ACHIEVEMENT_TIERS, example: 'plata' })
  tier: string;

  @ApiProperty({
    example: 12,
    description:
      'REAL rarity: % of players who completed it (distinct completers / distinct players), rounded, floored at 1. 100 when nobody plays yet.',
  })
  rarity: number;
}

export class PasaporteSeasonInfoEntity {
  @ApiProperty({ example: 1 }) id: number;
  @ApiProperty({ example: 7 }) number: number;
  @ApiProperty({ example: 'Ciclo de Otoño' }) name: string;
  @ApiProperty() startsAt: Date;
  @ApiProperty() endsAt: Date;
}

export class PasaporteStandingEntity {
  @ApiProperty({ example: 24, description: 'Battles fought inside the season window.' })
  battles: number;

  @ApiProperty({ example: 15 }) wins: number;
  @ApiProperty({ example: 9 }) losses: number;

  @ApiProperty({
    example: 3,
    description: 'Current consecutive wins, counting back from the most recent battle.',
  })
  streak: number;

  @ApiProperty({
    example: 192,
    description:
      'DERIVED, never stored: max(0, wins * 20 - losses * 12) over the season’s real replays.',
  })
  lp: number;

  @ApiProperty({
    example: 220,
    description: 'The highest lp reached walking the season’s battles chronologically.',
  })
  peakLp: number;

  @ApiProperty({ enum: TIER_KEYS, example: 'bronce' }) tierKey: string;
  @ApiProperty({ example: 'Bronce' }) tier: string;

  @ApiProperty({
    enum: ['I', 'II', 'III', 'IV'],
    example: 'II',
    description: 'How deep into the tier band the lp sits — the top quarter is I.',
  })
  division: string;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 200,
    description: 'lp needed for the next rung. Null at Maestro.',
  })
  nextAt: number | null;

  @ApiProperty({
    example: 4,
    description:
      '1-based position among every player with at least one battle this season, by derived lp. 0 when the trainer has not fought.',
  })
  regionRank: number;
}

export class PasaporteLadderRungEntity {
  @ApiProperty({ example: 'oro' }) key: string;
  @ApiProperty({ example: 'Oro' }) name: string;
  @ApiProperty({ example: 500 }) minLp: number;
}

export class PasaporteSeasonEntity {
  @ApiPropertyOptional({
    type: PasaporteSeasonInfoEntity,
    nullable: true,
    description: 'Null between cycles — the standing is then zeroed, not an error.',
  })
  season: PasaporteSeasonInfoEntity | null;

  @ApiProperty({ type: PasaporteStandingEntity })
  standing: PasaporteStandingEntity;

  @ApiProperty({
    type: [PasaporteLadderRungEntity],
    description: 'Shipped so the client never duplicates the ladder definition.',
  })
  ladder: PasaporteLadderRungEntity[];
}
