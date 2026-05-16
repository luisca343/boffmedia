import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Locale } from '../enums/locale.enum';

export class GetWeaponTreeDto extends BaseDto {
  @ApiProperty({
    description: 'Language/locale for the data',
    example: Locale.SPANISH,
    default: Locale.SPANISH,
    required: false,
    enum: Locale,
    enumName: 'Locale',
  })
  @IsOptional()
  @IsString()
  @IsEnum(Locale)
  locale?: Locale = Locale.SPANISH;

  @ApiProperty({
    description: 'Include grouped by weapon kind',
    example: true,
    default: true,
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  @Type(() => Boolean)
  @IsBoolean()
  includeGrouped?: boolean = true;
}
