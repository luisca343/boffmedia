import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { RosterMemberDto } from './add-participant.dto';

/**
 * Self-registration by a logged-in user. Identity comes from the JWT; the body
 * only carries display overrides (team name / roster for team tournaments).
 */
export class RegisterParticipantDto {
  @ApiPropertyOptional({
    description: 'Display name override (team name for team tournaments).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(16)
  tag?: string;

  @ApiPropertyOptional({ description: 'ISO alpha-2 country code.' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({ type: [RosterMemberDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RosterMemberDto)
  roster?: RosterMemberDto[];
}
