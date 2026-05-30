import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlotHistoryEntryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  town: string;

  @ApiProperty()
  plotNumber: number;

  @ApiPropertyOptional()
  previousOwnerUuid?: string;

  @ApiPropertyOptional()
  previousOwnerUsername?: string;

  @ApiPropertyOptional()
  newOwnerUuid?: string;

  @ApiPropertyOptional()
  newOwnerUsername?: string;

  @ApiPropertyOptional()
  changedAt?: Date;
}
