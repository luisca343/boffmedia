import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsNumber, ValidateBy, ValidationArguments, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

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

class OrderItemDto {
  @ApiProperty({ 
    description: 'App ID',
    example: 1
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

export class OrderAppDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa'
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({ 
    description: 'Array of apps with their new order',
    example: [
      { id: 1, order: 1 },
      { id: 2, order: 2 },
      { id: 3, order: 3 }
    ],
    type: [OrderItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  order: { id: number | string; order: number }[];
}