import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ description: 'UUID of the user' })
  @IsString()
  uuid: string;

  @ApiProperty({ description: 'Name of the account' })
  @IsString()
  name: string;
}