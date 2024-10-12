import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TrainerDefeatMoneyDto {
  @ApiProperty({ description: 'UUID of the user' })
  @IsString()
  uuid: string;

  @ApiProperty({ description: 'Amount of money to give' })
  money: number;
}