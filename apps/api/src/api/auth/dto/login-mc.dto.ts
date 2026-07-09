import { IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginMcDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsUUID()
  uuid: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  world: string;
}
