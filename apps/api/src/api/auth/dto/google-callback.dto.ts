import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class GoogleCallbackDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;
}
