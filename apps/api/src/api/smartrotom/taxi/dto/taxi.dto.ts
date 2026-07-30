import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';

export class TakeTripDto extends BaseDto {
  @ApiProperty({ example: 'carretera', description: 'Taxi stop to travel to' })
  @IsString()
  @MaxLength(64)
  stopId: string;

  @ApiProperty({
    required: false,
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description:
      'Passenger. Optional and ignored for a signed-in caller, who always travels as themselves.',
  })
  @IsOptional()
  @IsUUID()
  uuid?: string;
}

export class AdminTeleportDto extends BaseDto {
  @ApiProperty({
    example: 'carretera',
    description: 'Taxi stop to move the player to',
  })
  @IsString()
  @MaxLength(64)
  stopId: string;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description:
      'The player being moved. Required — this is not a self-service action.',
  })
  @IsUUID()
  uuid: string;

  @ApiProperty({
    required: false,
    description:
      'Why they were moved. Recorded in the audit trail and whispered to the player.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
