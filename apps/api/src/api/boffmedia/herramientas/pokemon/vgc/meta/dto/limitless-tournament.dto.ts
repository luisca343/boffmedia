import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LimitlessTournamentDto {
  @ApiProperty() id: number;
  @ApiProperty() limitlessId: string;
  @ApiProperty({ nullable: true }) name: string | null;
  @ApiProperty({ nullable: true }) date: string | null;
  @ApiProperty({ nullable: true }) format: string | null;
  @ApiProperty() regulationId: string;
  @ApiProperty({ nullable: true }) playerCount: number | null;
  @ApiProperty() status: string;
  @ApiProperty() progress: number;
  @ApiProperty() total: number;
  @ApiPropertyOptional({ nullable: true }) errorMessage?: string | null;
  @ApiProperty() fetchedAt: string;
}

export class LimitlessPlayerDto {
  @ApiProperty() playerSlug: string;
  @ApiProperty() playerName: string;
  @ApiProperty() placing: number;
  @ApiProperty() record: string;
  @ApiPropertyOptional() drop?: number | null;
  @ApiProperty() hasTeam: boolean;
}

export class ImportJobStatusDto {
  @ApiProperty() tournamentId: number;
  @ApiProperty() status: string;
  @ApiProperty() progress: number;
  @ApiProperty() total: number;
  @ApiPropertyOptional() errorMessage?: string;
}
