import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsIn, IsArray } from 'class-validator';

export class CreatePresetDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() regulationId: string;
  @ApiProperty() @IsString() exportString: string;
  @ApiProperty({ type: 'array' }) @IsArray() slots: any[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() userId?: number;
}

export class CreateSessionDto {
  @ApiProperty() @IsString() id: string;
  @ApiProperty() @IsString() label: string;
  @ApiProperty({ enum: ['BO1', 'BO3'] }) @IsIn(['BO1', 'BO3']) format: 'BO1' | 'BO3';
  @ApiProperty() @IsString() regulationId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() activePresetId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() startElo?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() userId?: number;
}

export class CreateMatchDto {
  @ApiProperty() @IsString() id: string;
  @ApiProperty() @IsString() sessionId: string;
  @ApiProperty({ enum: ['BO1', 'BO3'] }) @IsIn(['BO1', 'BO3']) format: 'BO1' | 'BO3';
  @ApiProperty() myTeam: any;
  @ApiProperty() opponentTeam: any;
  @ApiPropertyOptional() @IsOptional() @IsNumber() userId?: number;
}

export class UpdateMatchDto {
  @ApiPropertyOptional() @IsOptional() myTeam?: any;
  @ApiPropertyOptional() @IsOptional() opponentTeam?: any;
  @ApiPropertyOptional({ enum: ['win', 'loss', 'draw'] })
  @IsOptional() @IsIn(['win', 'loss', 'draw']) result?: 'win' | 'loss' | 'draw';
  @ApiPropertyOptional() @IsOptional() @IsNumber() eloChange?: number;
  @ApiPropertyOptional() @IsOptional() notes?: any[];
  @ApiPropertyOptional() @IsOptional() @IsString() completedAt?: string;
}
