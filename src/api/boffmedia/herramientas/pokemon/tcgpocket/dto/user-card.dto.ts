import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, Min } from 'class-validator';

export class AddUserCardDto {
  @ApiProperty({ description: 'User ID', example: 'user123' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Card ID', example: 'tcgp-A1-001' })
  @IsString()
  cardId: string;

  @ApiProperty({ description: 'Quantity to add', example: 1, minimum: 1 })
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class UpdateUserCardQuantityDto {
  @ApiProperty({ description: 'New quantity', example: 3, minimum: 0 })
  @IsNumber()
  @Min(0)
  quantity: number;
}