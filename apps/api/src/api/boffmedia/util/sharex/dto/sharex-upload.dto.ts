import { IsString, IsNotEmpty } from 'class-validator';

export class SharexUploadDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}
