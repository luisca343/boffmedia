import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsInt,
  IsOptional,
  Min,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateArcadeStreakDto extends BaseDto {
  @ApiProperty({
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'Current streak count',
    example: 3,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  streak?: number = 0;

  @ApiProperty({
    description: 'Last claimed date',
    example: '2023-12-01T10:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  lastClaimed?: string;

  @ApiProperty({
    description: 'Last banner shown',
    example: 'christmas_2023',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastBanner?: string;

  @ApiProperty({
    description: 'Total claims made',
    example: 15,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalClaims?: number = 0;
}
