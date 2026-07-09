import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SharexUploadDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;
}
