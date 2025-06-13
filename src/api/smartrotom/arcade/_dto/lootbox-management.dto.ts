import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

export class GiveLootboxDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa'
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({ 
    description: 'Lootbox type ID',
    example: 'trainer_box'
  })
  @IsNotEmpty()
  @IsString()
  lootboxType: string;

  @ApiProperty({ 
    description: 'Amount of lootboxes to give',
    required: false,
    example: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;
}