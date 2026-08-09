import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PARTICIPANT_STATUS } from '@/_db/schema/BoffMediaEvents';

export class SetEventStatusDto {
  @ApiProperty({ enum: ['upcoming', 'active', 'completed'] })
  @IsEnum(['upcoming', 'active', 'completed'])
  status: 'upcoming' | 'active' | 'completed';
}

export class SetParticipantStatusDto {
  @ApiProperty({
    enum: Object.values(PARTICIPANT_STATUS),
    description:
      'Membership status. `registered` and `confirmed` both entitle the player to the event pack; `declined` and `removed` do not.',
  })
  @IsEnum(Object.values(PARTICIPANT_STATUS))
  status: (typeof PARTICIPANT_STATUS)[keyof typeof PARTICIPANT_STATUS];
}

export class CreateEventInviteDto {
  @ApiPropertyOptional({
    description: 'ISO date after which the code stops working.',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'How many players may redeem this code.',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000)
  maxUses?: number;
}

export class RedeemEventInviteDto {
  @ApiProperty({ description: 'The invitation code.' })
  @IsString()
  @MaxLength(32)
  code: string;
}
