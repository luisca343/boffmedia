import { IsString, IsNotEmpty } from 'class-validator';

export class ArceusspeakDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsNotEmpty()
  format: string;
}
