import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, Length } from 'class-validator';

export class CreateAppDto {
  @ApiProperty({ 
    description: 'The name of the app',
    example: 'Chess Master'
  })
  @IsString()
  @Length(1, 32)
  name: string;

  @ApiProperty({ 
    description: 'The URL of the app', 
    required: false,
    example: 'https://example.com/chess-app'
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ 
    description: 'The active status of the app (0 = inactive, 1 = active)', 
    required: false,
    example: 1
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  active?: number;
}