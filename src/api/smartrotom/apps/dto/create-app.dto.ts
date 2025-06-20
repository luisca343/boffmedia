import { BaseDto } from '@api/_shared/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, Length } from 'class-validator';
import { AppStatus } from '../enums/app-status.enum';

export class CreateAppDto extends BaseDto {
  @ApiProperty({ 
    description: 'The name of the app',
    example: 'Pokedex'
  })
  @IsString()
  @Length(1, 32)
  name: string;

  @ApiProperty({ 
    description: 'The URL of the app', 
    required: false,
    example: 'pokedex'
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ 
    description: 'The active status of the app', 
    required: false,
    example: AppStatus.ACTIVE,
    enum: AppStatus
  })
  @IsOptional()
  @IsEnum(AppStatus)
  active?: AppStatus;
}