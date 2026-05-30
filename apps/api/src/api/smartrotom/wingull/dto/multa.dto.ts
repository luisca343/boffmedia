import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, MinLength, Min } from 'class-validator';

export type MultaStatus = 'pending' | 'paid' | 'cancelled';

export class CreateMultaDto {
  @ApiProperty({ example: 'abc123-uuid' })
  @IsString()
  playerUuid: string;

  @ApiProperty({ example: 'CoolPlayer' })
  @IsString()
  @MaxLength(32)
  playerUsername: string;

  @ApiProperty({ example: 5000, description: 'Fine amount in in-game currency' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Building in a restricted zone' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  reason: string;

  @ApiProperty({ example: 'Admin_Jose' })
  @IsString()
  @MaxLength(32)
  issuedBy: string;
}

export class UpdateMultaStatusDto {
  @ApiProperty({ enum: ['pending', 'paid', 'cancelled'] })
  @IsEnum(['pending', 'paid', 'cancelled'])
  status: MultaStatus;
}

export class MultaDto {
  @ApiProperty() id: number;
  @ApiProperty() playerUuid: string;
  @ApiProperty() playerUsername: string;
  @ApiProperty() amount: string;
  @ApiProperty() reason: string;
  @ApiProperty() issuedBy: string;
  @ApiPropertyOptional() issuedAt?: Date;
  @ApiProperty({ enum: ['pending', 'paid', 'cancelled'] }) status: MultaStatus;
  @ApiPropertyOptional() paidAt?: Date;
}
