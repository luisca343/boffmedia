import { IsUUID, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMainAccountDto {
  @ApiProperty()
  @IsUUID()
  uuid: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;
}
