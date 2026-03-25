import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, Min } from 'class-validator';

export class TrainerDefeatMoneyDto extends BaseDto {
  @ApiProperty({ 
    description: 'UUID of the trainer who won the battle',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsString()
  @IsUUID(4, { message: 'UUID must be a valid v4 UUID' })
  uuid: string;

  @ApiProperty({ 
    description: 'Amount of money to award for the victory in PokéDollars',
    example: 1500,
    minimum: 1
  })
  @IsNumber({}, { message: 'Money amount must be a number' })
  @Min(1, { message: 'Money amount must be at least 1 PokéDollar' })
  money: number;
}