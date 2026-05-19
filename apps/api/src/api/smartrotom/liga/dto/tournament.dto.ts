import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsDate,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(2)
  @Type(() => Number)
  maxParticipants: number;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsString()
  @IsOptional()
  description?: string;
}

export class TournamentRegistrationDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  tournamentId: number;

  @IsString()
  @IsNotEmpty()
  playerUuid: string;
}
