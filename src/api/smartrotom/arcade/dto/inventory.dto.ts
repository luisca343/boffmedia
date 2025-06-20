import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GetInventoryDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({ 
    description: 'Filter by source type',
    required: false,
    example: 'arcade'
  })
  @IsOptional()
  @IsString()
  sourceType?: string;
}

export class AddInventoryItemDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({ description: 'Item ID', example: 'pixelmon:master_ball' })
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @ApiProperty({ description: 'Item type', example: 'ITEM' })
  @IsNotEmpty()
  @IsString()
  itemType: string;

  @ApiProperty({ description: 'Item name', example: 'Master Ball' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Amount to add', required: false, example: 1 })
  @IsOptional()
  @IsInt()
  amount?: number;

  @ApiProperty({ description: 'Source type', required: false, example: 'admin' })
  @IsOptional()
  @IsString()
  sourceType?: string;

  @ApiProperty({ description: 'Source ID', required: false, example: 123 })
  @IsOptional()
  @IsInt()
  sourceId?: number;

  @ApiProperty({ description: 'Item rarity', required: false, example: 'legendary' })
  @IsOptional()
  @IsString()
  rarity?: string;
}

export class ConsumeInventoryItemDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({ description: 'Item ID to consume', example: 'trainer_box' })
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @ApiProperty({ description: 'Amount to consume', required: false, example: 1 })
  @IsOptional()
  @IsInt()
  amount?: number = 1;
}

export class ClaimItemDto {
  @ApiProperty({ description: 'Item ID', example: 'pixelmon:master_ball' })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Item type', required: false, example: 'ITEM' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class ClaimInventoryItemsDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({ 
    description: 'Items to claim',
    type: [ClaimItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimItemDto)
  items: ClaimItemDto[];
}