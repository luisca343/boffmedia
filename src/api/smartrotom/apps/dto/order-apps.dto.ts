import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsNumber, ValidateBy, ValidationArguments, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseDto } from '@api/_shared/dto/base.dto';

// Custom validator for number or string
const IsNumberOrString = () => {
  return ValidateBy({
    name: 'isNumberOrString',
    validator: {
      validate: (value: any, args: ValidationArguments) => {
        return typeof value === 'number' || typeof value === 'string';
      },
      defaultMessage: (args: ValidationArguments) => {
        return `${args.property} must be a number or string`;
      },
    },
  });
};

class OrderItemDto extends BaseDto {
  @ApiProperty({ 
    description: 'App ID',
    example: 12
  })
  @IsNumberOrString()
  id: number | string;

  @ApiProperty({ 
    description: 'Display order position',
    example: 1
  })
  @IsNumber()
  order: number;
}

export class OrderAppDto extends BaseDto{
  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({ 
    description: 'Array of apps with their new order',
    example: [
      { id: 12, order: 1 },
      { id: 13, order: 2 },
      { id: 15, order: 3 }
    ],
    type: [OrderItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  order: { id: number | string; order: number }[];
}