import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsIn } from 'class-validator';

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

  // Any non-COMPRA value is treated as VENTA, which mints money to the player.
  @ApiProperty({
    description:
      'Operation type: COMPRA (player pays) or VENTA (player is paid)',
    enum: ['COMPRA', 'VENTA'],
  })
  @IsIn(['COMPRA', 'VENTA'])
  operation: string;

  @ApiProperty({ description: 'Unit price of the item' })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ description: 'Count of the items' })
  @IsNumber()
  count: number;
}
