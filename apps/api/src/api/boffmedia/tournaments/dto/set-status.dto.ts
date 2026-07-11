import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TOURNAMENT_STATUS } from '@/_db/schema/Tournaments';
import type { TournamentStatus } from '../tournaments.types';

export class SetStatusDto {
  @ApiProperty({ enum: Object.values(TOURNAMENT_STATUS) })
  @IsEnum(TOURNAMENT_STATUS)
  status: TournamentStatus;
}
