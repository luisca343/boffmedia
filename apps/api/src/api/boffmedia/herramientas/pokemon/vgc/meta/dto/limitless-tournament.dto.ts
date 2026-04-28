import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LimitlessTournamentDto {
  @ApiProperty() id:           number;
  @ApiProperty() limitlessId:  string;
  @ApiProperty() name:         string;
  @ApiProperty() date:         string;
  @ApiProperty() format:       string;
  @ApiProperty() regulationId: string;
  @ApiProperty() playerCount:  number;
  @ApiProperty() status:       string;
  @ApiProperty() progress:     number;
  @ApiProperty() total:        number;
  @ApiPropertyOptional() errorMessage?: string;
  @ApiProperty() fetchedAt:    string;
}

export class LimitlessPlayerDto {
  @ApiProperty() playerSlug: string;
  @ApiProperty() playerName: string;
  @ApiProperty() placing:    number;
  @ApiProperty() record:     string;
  @ApiPropertyOptional() drop?: number | null;
  @ApiProperty() hasTeam:    boolean;
}

export class ImportJobStatusDto {
  @ApiProperty() tournamentId: number;
  @ApiProperty() status:       string;
  @ApiProperty() progress:     number;
  @ApiProperty() total:        number;
  @ApiPropertyOptional() errorMessage?: string;
}
