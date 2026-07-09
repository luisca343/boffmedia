import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LimitlessTournamentDto {
  @ApiProperty() id: number;
  @ApiProperty() limitlessId: string;
  @ApiProperty({ type: String, nullable: true }) name: string | null;
  @ApiProperty({ type: String, nullable: true }) date: string | null;
  @ApiProperty({ type: String, nullable: true }) format: string | null;
  @ApiProperty() regulationId: string;
  @ApiProperty({ type: Number, nullable: true }) playerCount: number | null;
  @ApiProperty() status: string;
  @ApiProperty() progress: number;
  @ApiProperty() total: number;
  @ApiPropertyOptional({ type: String, nullable: true }) errorMessage?:
    | string
    | null;
  @ApiProperty() fetchedAt: string;
}

export class LimitlessPlayerDto {
  @ApiProperty() playerSlug: string;
  @ApiProperty() playerName: string;
  @ApiProperty() placing: number;
  @ApiProperty() record: string;
  @ApiPropertyOptional({ type: Number, nullable: true }) drop?: number | null;
  @ApiProperty() hasTeam: boolean;
}

export class ImportJobStatusDto {
  @ApiProperty() tournamentId: number;
  @ApiProperty() status: string;
  @ApiProperty() progress: number;
  @ApiProperty() total: number;
  @ApiPropertyOptional() errorMessage?: string;
}
