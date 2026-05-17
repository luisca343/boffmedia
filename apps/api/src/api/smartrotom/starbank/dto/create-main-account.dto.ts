import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class CreateMainAccountDto {
  @IsUUID()
  uuid: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}
