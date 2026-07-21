import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseDto } from '@api/_utils/dto/base.dto';
import { POST_TYPES, REACTION_TYPES } from '../types/rooker.types';
import type { RookerPostType, RookerReactionType } from '../types/rooker.types';

// Every @Body DTO extends BaseDto: `server` must survive ValidationPipe's
// forbidNonWhitelisted, and MinecraftMiddleware 403s any non-GET without it.

export const HANDLE_REGEX = /^[a-z0-9_]{3,32}$/;

export class FeedQueryDto {
  @ApiPropertyOptional({ description: 'Viewer UUID — drives the `me` block' })
  @IsOptional()
  @IsUUID()
  uuid?: string;

  @ApiPropertyOptional({ enum: ['parati', 'siguiendo'], default: 'parati' })
  @IsOptional()
  @IsIn(['parati', 'siguiendo'])
  tab?: 'parati' | 'siguiendo' = 'parati';

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

export class ViewerQueryDto {
  @ApiPropertyOptional({ description: 'Viewer UUID — drives the `me` block' })
  @IsOptional()
  @IsUUID()
  uuid?: string;
}

export class CreatePostDto extends BaseDto {
  @ApiProperty({ description: 'Author UUID' })
  @IsUUID()
  uuid: string;

  @ApiPropertyOptional({ maxLength: 280 })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  text?: string;

  @ApiPropertyOptional({ enum: POST_TYPES, default: 'text' })
  @IsOptional()
  @IsIn(POST_TYPES as readonly string[])
  type?: RookerPostType = 'text';

  @ApiPropertyOptional({ description: 'Parent trino id — makes this a reply' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;

  @ApiPropertyOptional({ maxLength: 512 })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  mediaUrl?: string;

  @ApiPropertyOptional({ description: 'rotom_pokedex row id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  captureId?: number;

  @ApiPropertyOptional({ description: 'rotom_replays row id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  replayId?: number;
}

export class ActorDto extends BaseDto {
  @ApiProperty({ description: 'Acting user UUID' })
  @IsUUID()
  uuid: string;
}

export class ReactDto extends BaseDto {
  @ApiProperty({ description: 'Acting user UUID' })
  @IsUUID()
  uuid: string;

  @ApiProperty({ enum: REACTION_TYPES })
  @IsIn(REACTION_TYPES as readonly string[])
  type: RookerReactionType;
}

export class FollowDto extends BaseDto {
  @ApiProperty({ description: 'Follower UUID' })
  @IsUUID()
  uuid: string;

  @ApiProperty({ description: 'UUID being followed' })
  @IsUUID()
  targetUuid: string;
}

export class UpdateProfileDto extends BaseDto {
  @ApiProperty({ description: 'Owner UUID' })
  @IsUUID()
  uuid: string;

  @ApiPropertyOptional({ example: 'ash_ketchum', pattern: '^[a-z0-9_]{3,32}$' })
  @IsOptional()
  @IsString()
  @Matches(HANDLE_REGEX, {
    message: 'handle must match ^[a-z0-9_]{3,32}$',
  })
  handle?: string;

  @ApiPropertyOptional({ maxLength: 48 })
  @IsOptional()
  @IsString()
  @MaxLength(48)
  displayName?: string;

  @ApiPropertyOptional({ maxLength: 280 })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  link?: string;

  @ApiPropertyOptional({
    description: 'Species id — must be caught in the owner’s pokédex',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  partnerPokemonId?: number;
}

export class ProfileQueryDto {
  @ApiPropertyOptional({ description: 'Viewer UUID — drives isFollowedByMe' })
  @IsOptional()
  @IsUUID()
  viewer?: string;
}

export class MeQueryDto {
  @ApiProperty({ description: "The signed-in trainer's UUID" })
  @IsUUID()
  uuid: string;
}

export class ProfilePostsQueryDto {
  @ApiPropertyOptional({
    enum: ['trinos', 'capturas', 'combates', 'media'],
    default: 'trinos',
  })
  @IsOptional()
  @IsIn(['trinos', 'capturas', 'combates', 'media'])
  tab?: 'trinos' | 'capturas' | 'combates' | 'media' = 'trinos';

  @ApiPropertyOptional({ description: 'Viewer UUID — drives the `me` block' })
  @IsOptional()
  @IsUUID()
  uuid?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

export class TrendsQueryDto {
  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class SuggestionsQueryDto {
  @ApiPropertyOptional({
    description: 'Viewer UUID — excludes already-followed',
  })
  @IsOptional()
  @IsUUID()
  uuid?: string;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 5;
}

export class SearchQueryDto {
  @ApiProperty({ description: 'Search term' })
  @IsString()
  @MaxLength(64)
  q: string;

  @ApiPropertyOptional({ description: 'Viewer UUID — drives the `me` block' })
  @IsOptional()
  @IsUUID()
  uuid?: string;
}

export class InboxQueryDto {
  @ApiProperty({ description: 'User UUID' })
  @IsUUID()
  uuid: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

export class BookmarksQueryDto {
  @ApiProperty({ description: 'User UUID' })
  @IsUUID()
  uuid: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
