import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class AnatomyPointDto {
  @ApiProperty({ minimum: 0, maximum: 100, example: 42.5 })
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(100)
  x!: number;

  @ApiProperty({ minimum: 0, maximum: 100, example: 37.25 })
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(100)
  y!: number;
}

export class AnatomyCalloutDto {
  @ApiProperty({ example: 'leftTop' })
  @IsString()
  @Matches(/^[A-Za-z][A-Za-z0-9_-]{0,31}$/)
  slotKey!: string;

  @ApiProperty({ type: AnatomyPointDto })
  @ValidateNested()
  @Type(() => AnatomyPointDto)
  target!: AnatomyPointDto;
}

export class SaveAnatomyOverrideDto {
  @ApiProperty({ example: -758250816 })
  @IsInt()
  fixedId!: number;

  @ApiProperty({ example: '00' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{1,16}$/)
  variantId!: string;

  @ApiProperty({ type: [AnatomyCalloutDto] })
  @IsArray()
  @ArrayMaxSize(32)
  @ValidateNested({ each: true })
  @Type(() => AnatomyCalloutDto)
  callouts!: AnatomyCalloutDto[];
}
