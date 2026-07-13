import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { POST_TYPES, REACTION_TYPES } from '../types/rooker.types';

export class RookerReactionCountsEntity {
  @ApiProperty({ example: 3 }) heart: number;
  @ApiProperty({ example: 1 }) pokeball: number;
  @ApiProperty({ example: 0 }) choque: number;
  @ApiProperty({ example: 0 }) shiny: number;
  @ApiProperty({ example: 2 }) fuego: number;
}

export class RookerPostAuthorEntity {
  @ApiProperty() uuid: string;
  @ApiProperty({ example: 'Luisca' }) username: string;

  @ApiPropertyOptional({ nullable: true, example: 'luisca' })
  handle: string | null;

  @ApiPropertyOptional({ nullable: true }) displayName: string | null;
  @ApiPropertyOptional({ nullable: true }) partnerPokemonId: number | null;

  @ApiProperty({
    example: false,
    description: 'Always false — no verification system exists yet.',
  })
  isVerified: boolean;
}

export class RookerPostCountsEntity {
  @ApiProperty({ example: 2 }) replies: number;
  @ApiProperty({ example: 1 }) retrinos: number;
  @ApiProperty({ type: RookerReactionCountsEntity })
  reactions: RookerReactionCountsEntity;
}

export class RookerPostViewerStateEntity {
  @ApiPropertyOptional({ enum: REACTION_TYPES, nullable: true })
  reaction: string | null;

  @ApiProperty({ example: false }) retrino: boolean;
  @ApiProperty({ example: false }) bookmark: boolean;
}

export class RookerPostCaptureEntity {
  @ApiProperty({ example: 25 }) pokemonId: number;
  @ApiProperty({ example: 'none' }) formId: string;
  @ApiProperty({ example: 'none' }) paletteId: string;

  @ApiProperty({
    example: false,
    description: 'Derived: paletteId !== "none".',
  })
  shiny: boolean;

  @ApiPropertyOptional({ nullable: true }) caughtAt: Date | null;
}

export class RookerPostBattleEntity {
  @ApiProperty({ example: 12 }) replayId: number;
  @ApiProperty() side1: string;
  @ApiProperty() side2: string;
  @ApiPropertyOptional({ nullable: true }) winner: string | null;
  @ApiPropertyOptional({ nullable: true }) createdAt: Date | null;
}

export class RookerPostEntity {
  @ApiProperty({ example: 1 }) id: number;
  @ApiProperty({ type: RookerPostAuthorEntity }) author: RookerPostAuthorEntity;

  @ApiPropertyOptional({ nullable: true, maxLength: 280 })
  text: string | null;

  @ApiProperty({ enum: POST_TYPES, example: 'text' }) type: string;
  @ApiPropertyOptional({ nullable: true }) createdAt: Date | null;
  @ApiProperty({ example: false }) pinned: boolean;
  @ApiPropertyOptional({ nullable: true }) parentId: number | null;

  @ApiProperty({ type: RookerPostCountsEntity })
  counts: RookerPostCountsEntity;

  @ApiProperty({
    type: RookerPostViewerStateEntity,
    description:
      'Always present. Defaults (reaction:null, retrino:false, bookmark:false) when no viewer uuid was passed.',
  })
  me: RookerPostViewerStateEntity;

  @ApiPropertyOptional({ type: RookerPostCaptureEntity, nullable: true })
  capture: RookerPostCaptureEntity | null;

  @ApiPropertyOptional({ type: RookerPostBattleEntity, nullable: true })
  battle: RookerPostBattleEntity | null;

  @ApiPropertyOptional({ nullable: true }) mediaUrl: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 'luisca',
    description:
      'Handle of the followee whose retrino surfaced this post in the "siguiendo" feed; null otherwise.',
  })
  retrinoBy: string | null;
}

export class RookerFeedEntity {
  @ApiProperty({ type: [RookerPostEntity] }) items: RookerPostEntity[];
  @ApiProperty({ example: true }) hasMore: boolean;
}

export class RookerThreadEntity {
  @ApiProperty({ type: RookerPostEntity }) post: RookerPostEntity;
  @ApiProperty({ type: [RookerPostEntity] }) replies: RookerPostEntity[];
}

export class RookerProfileCountsEntity {
  @ApiProperty({ example: 12 }) posts: number;
  @ApiProperty({ example: 4 }) followers: number;
  @ApiProperty({ example: 7 }) following: number;
}

export class RookerTrainerStatsEntity {
  @ApiProperty({ example: 143, description: 'rotom_pokedex rows with caught_at' })
  captures: number;

  @ApiProperty({ example: 3, description: 'caught rows with palette_id <> "none"' })
  shinies: number;

  @ApiProperty({ example: 27, description: 'rotom_replays where side1|side2 = uuid' })
  battles: number;

  @ApiProperty({
    example: 12.4,
    description: 'distinct caught species / total species * 100, 1 decimal',
  })
  dexPct: number;
}

export class RookerProfileEntity {
  @ApiProperty() uuid: string;
  @ApiProperty({ example: 'Luisca' }) username: string;
  @ApiProperty({ example: 'luisca' }) handle: string;
  @ApiPropertyOptional({ nullable: true }) displayName: string | null;
  @ApiPropertyOptional({ nullable: true }) bio: string | null;
  @ApiPropertyOptional({ nullable: true }) link: string | null;
  @ApiPropertyOptional({ nullable: true }) partnerPokemonId: number | null;
  @ApiPropertyOptional({ nullable: true }) createdAt: Date | null;

  @ApiProperty({ type: RookerProfileCountsEntity })
  counts: RookerProfileCountsEntity;

  @ApiProperty({ type: RookerTrainerStatsEntity })
  stats: RookerTrainerStatsEntity;

  @ApiProperty({ example: false }) isFollowedByMe: boolean;
}

export class RookerTrendEntity {
  @ApiProperty({ example: 'shiny' }) tag: string;
  @ApiProperty({ example: 8 }) posts: number;
}

export class RookerTrendListEntity {
  @ApiProperty({ type: [RookerTrendEntity] }) items: RookerTrendEntity[];
}

export class RookerSuggestionEntity {
  @ApiProperty() uuid: string;
  @ApiProperty() username: string;
  @ApiProperty() handle: string;
  @ApiPropertyOptional({ nullable: true }) displayName: string | null;
  @ApiPropertyOptional({ nullable: true }) partnerPokemonId: number | null;
  @ApiProperty({ example: 3 }) followers: number;
}

export class RookerSuggestionListEntity {
  @ApiProperty({ type: [RookerSuggestionEntity] })
  items: RookerSuggestionEntity[];
}

export class RookerSearchEntity {
  @ApiProperty({ type: [RookerSuggestionEntity] })
  users: RookerSuggestionEntity[];

  @ApiProperty({ type: [RookerPostEntity] }) posts: RookerPostEntity[];
  @ApiProperty({ type: [RookerTrendEntity] }) tags: RookerTrendEntity[];
}

export class RookerFollowResultEntity {
  @ApiProperty({ example: true, description: 'State AFTER the toggle' })
  following: boolean;

  @ApiProperty({ example: 5, description: "Target's follower count after the toggle" })
  followers: number;
}

export class RookerNotificationEntity {
  @ApiProperty({ example: 1 }) id: number;
  @ApiProperty() userUuid: string;
  @ApiProperty({ example: 'rooker' }) type: string;
  @ApiProperty({ example: '@luisca respondió tu trino' }) title: string;
  @ApiProperty() body: string;

  @ApiPropertyOptional({ nullable: true, example: '/smartrotom/rooker/trino/12' })
  link: string | null;

  @ApiProperty({ example: 0 }) isRead: number;
  @ApiPropertyOptional({ nullable: true }) createdAt: Date | null;
}

export class RookerNotificationListEntity {
  @ApiProperty({ type: [RookerNotificationEntity] })
  items: RookerNotificationEntity[];

  @ApiProperty({ example: 4 }) total: number;
}

export class RookerDeleteResultEntity {
  @ApiProperty({ example: true }) ok: boolean;
  @ApiProperty({ example: 12 }) id: number;
}
