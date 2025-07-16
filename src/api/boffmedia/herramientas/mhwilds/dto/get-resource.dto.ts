import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Locale } from '../enums/locale.enum';

export class GetResourceDto extends BaseDto {
  @ApiProperty({ 
    description: 'Language/locale for the data',
    example: Locale.SPANISH,
    default: Locale.SPANISH,
    required: false,
    enum: Locale,
    enumName: 'Locale'
  })
  @IsOptional()
  @IsString()
  @IsEnum(Locale)
  locale?: Locale = Locale.SPANISH;
}