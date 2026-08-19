import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Length, IsBoolean } from 'class-validator';

export class CreateAppDto extends BaseDto {
  @ApiProperty({
    description: 'The name of the app',
    example: 'Pokedex',
  })
  @IsString()
  @Length(1, 32)
  name: string;

  @ApiProperty({
    description: 'The URL of the app',
    required: false,
    example: 'pokedex',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({
    description: 'The active status of the app',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
