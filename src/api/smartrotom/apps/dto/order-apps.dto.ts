import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderAppsRequest } from '../types/app.types';

class AppOrderItem {
  @ApiProperty({ description: 'The app ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'The order position' })
  @IsNumber()
  order: number;
}

export class OrderAppDto implements OrderAppsRequest {
  @ApiProperty({ 
    description: 'The new order of the apps',
    type: [AppOrderItem]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppOrderItem)
  newOrder: { id: number; order: number }[];

  @ApiProperty({ description: 'The UUID of the user' })
  @IsString()
  uuid: string;
}