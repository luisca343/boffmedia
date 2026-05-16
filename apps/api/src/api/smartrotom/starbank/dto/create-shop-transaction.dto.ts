import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class CreateShopTransactionDto extends BaseDto {
  @ApiProperty({ description: 'UUID of the user' })
  @IsString()
  uuid: string;

  @ApiProperty({ description: 'Name of the NPC' })
  @IsString()
  npcName: string;

  @ApiProperty({ description: 'Name of the item' })
  @IsString()
  itemName: string;

  @ApiProperty({ description: 'Operation type (e.g., buy, sell)' })
  @IsString()
  operation: string;

  @ApiProperty({ description: 'Unit price of the item' })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ description: 'Count of the items' })
  @IsNumber()
  count: number;
}
