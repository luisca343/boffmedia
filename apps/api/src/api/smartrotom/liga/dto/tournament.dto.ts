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
import { BaseDto } from '@api/_utils/dto/base.dto';

export class CreateLigaTournamentDto extends BaseDto {
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

export class TournamentRegistrationDto extends BaseDto {
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
