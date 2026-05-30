import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export type BuscadoSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BuscadoStatus = 'active' | 'resolved';

export class CreateBuscadoDto {
  @ApiProperty({ example: 'abc123-uuid' })
  @IsString()
  playerUuid: string;

  @ApiProperty({ example: 'Griefer99' })
  @IsString()
  @MaxLength(32)
  playerUsername: string;

  @ApiProperty({ example: 'Repeated griefing and harassment' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  offense: string;

  @ApiProperty({ enum: ['low', 'medium', 'high', 'critical'], example: 'high' })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity: BuscadoSeverity;

  @ApiProperty({ example: 'Admin_Jose' })
  @IsString()
  @MaxLength(32)
  reportedBy: string;

  @ApiPropertyOptional({ example: 'Known for repeated offenses in Pueblo Mizu' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateBuscadoStatusDto {
  @ApiProperty({ enum: ['active', 'resolved'] })
  @IsEnum(['active', 'resolved'])
  status: BuscadoStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class BuscadoDto {
  @ApiProperty() id: number;
  @ApiProperty() playerUuid: string;
  @ApiProperty() playerUsername: string;
  @ApiProperty() offense: string;
  @ApiProperty({ enum: ['low', 'medium', 'high', 'critical'] }) severity: BuscadoSeverity;
  @ApiProperty() reportedBy: string;
  @ApiPropertyOptional() reportedAt?: Date;
  @ApiProperty({ enum: ['active', 'resolved'] }) status: BuscadoStatus;
  @ApiPropertyOptional() notes?: string;
}
