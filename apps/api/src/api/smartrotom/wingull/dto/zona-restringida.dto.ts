import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ZonaRestringidaDto {
  @ApiProperty({ description: 'Town where the zone is located' })
  town: string;

  @ApiProperty({ description: 'Region type from WorldGuard' })
  type: string;

  @ApiProperty({ description: 'Zone type label (same as type)' })
  zoneType: string;

  @ApiPropertyOptional({ description: 'Plot/region number if applicable' })
  number?: number;

  @ApiPropertyOptional({ description: 'Center X coordinate' })
  centerX?: number;

  @ApiPropertyOptional({ description: 'Center Z coordinate' })
  centerZ?: number;

  @ApiPropertyOptional({ description: 'Owner UUID if any' })
  ownerUuid?: string;
}
