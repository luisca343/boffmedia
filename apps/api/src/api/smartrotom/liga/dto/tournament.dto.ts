import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsDate,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTournamentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsInt()
  @Min(2)
  @Type(() => Number)
  maxParticipants: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class TournamentRegistrationDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  tournamentId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  playerUuid: string;
}
