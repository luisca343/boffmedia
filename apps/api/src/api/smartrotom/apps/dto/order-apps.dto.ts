import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BaseDto } from '@api/_utils/dto/base.dto';

class OrderItemDto {
  @ApiProperty({
    description: 'App ID',
    example: 12,
    oneOf: [{ type: 'string' }, { type: 'number' }],
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Display order position',
    example: 1,
  })
  @IsNumber()
  order: number;
}

export class OrderAppDto extends BaseDto {
  @ApiProperty({
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'Array of apps with their new order',
    example: [
      { id: 12, order: 1 },
      { id: 13, order: 2 },
      { id: 15, order: 3 },
    ],
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  order: { id: number | string; order: number }[];
}
