import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class MinecraftAccountDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsUUID()
  uuid: string;

  @IsString()
  @IsNotEmpty()
  world: string;
}
