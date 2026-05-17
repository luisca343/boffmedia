import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class CreateInviteBodyDto {
  @IsUUID()
  uuid: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}
