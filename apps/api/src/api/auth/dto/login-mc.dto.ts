import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class LoginMcDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsUUID()
  uuid: string;

  @IsString()
  @IsNotEmpty()
  world: string;
}
