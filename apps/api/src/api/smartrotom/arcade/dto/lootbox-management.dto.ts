import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';

export class GiveLootboxDto extends BaseDto {
  @ApiProperty({
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({
    description: 'Lootbox type ID',
    example: 'trainer_box',
  })
  @IsNotEmpty()
  @IsString()
  lootboxType: string;

  @ApiProperty({
    description: 'Amount of lootboxes to give',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;
}
