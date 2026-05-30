import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export type DenunciaCategory = 'griefing' | 'theft' | 'dispute' | 'other';
export type DenunciaStatus = 'pending' | 'reviewing' | 'resolved';

export class CreateDenunciaDto {
  @ApiProperty({ example: 'abc123-...', description: 'UUID of the player filing the report' })
  @IsString()
  reporterUuid: string;

  @ApiProperty({ example: 'Steve', description: 'Username of the player filing the report' })
  @IsString()
  @MaxLength(32)
  reporterUsername: string;

  @ApiPropertyOptional({ example: 'def456-...', description: 'UUID of the accused player' })
  @IsOptional()
  @IsString()
  accusedUuid?: string;

  @ApiPropertyOptional({ example: 'Creeper', description: 'Username of the accused player' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  accusedUsername?: string;

  @ApiProperty({ example: 'pueblo_mizu', description: 'Town where the incident occurred' })
  @IsString()
  @MaxLength(64)
  town: string;

  @ApiPropertyOptional({ example: 3, description: 'Plot number involved' })
  @IsOptional()
  @IsInt()
  plotNumber?: number;

  @ApiProperty({ enum: ['griefing', 'theft', 'dispute', 'other'], example: 'griefing' })
  @IsEnum(['griefing', 'theft', 'dispute', 'other'])
  category: DenunciaCategory;

  @ApiProperty({ example: 'My crops were destroyed overnight.' })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;
}

export class UpdateDenunciaStatusDto {
  @ApiProperty({ enum: ['pending', 'reviewing', 'resolved'] })
  @IsEnum(['pending', 'reviewing', 'resolved'])
  status: DenunciaStatus;

  @ApiPropertyOptional({ example: 'Admin_Player' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  resolvedBy?: string;

  @ApiPropertyOptional({ example: 'Reviewed and resolved after investigation.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class DenunciaDto {
  @ApiProperty() id: number;
  @ApiProperty() reporterUuid: string;
  @ApiProperty() reporterUsername: string;
  @ApiPropertyOptional() accusedUuid?: string;
  @ApiPropertyOptional() accusedUsername?: string;
  @ApiProperty() town: string;
  @ApiPropertyOptional() plotNumber?: number;
  @ApiProperty({ enum: ['griefing', 'theft', 'dispute', 'other'] }) category: DenunciaCategory;
  @ApiProperty() description: string;
  @ApiProperty({ enum: ['pending', 'reviewing', 'resolved'] }) status: DenunciaStatus;
  @ApiPropertyOptional() createdAt?: Date;
  @ApiPropertyOptional() updatedAt?: Date;
  @ApiPropertyOptional() resolvedBy?: string;
  @ApiPropertyOptional() resolvedAt?: Date;
  @ApiPropertyOptional() notes?: string;
}
