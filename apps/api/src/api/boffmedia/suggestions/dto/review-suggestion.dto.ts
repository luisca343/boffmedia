import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReviewSuggestionDto {
  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  @IsEnum(['pending', 'approved', 'rejected'])
  status: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional({ example: 'Aprobado — lo publicamos la semana que viene.' })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
