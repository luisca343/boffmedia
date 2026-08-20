import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SharexUploadDto {
  @ApiProperty({
    description:
      "The uploader's ShareX token, issued by an admin via POST /sharex/tokens. " +
      'Named `key` because that is the field name existing ShareX uploader ' +
      'configs already send. It authenticates the request AND identifies who ' +
      'uploaded — the image row stores the token it came from.',
    example: 'a3f1…',
  })
  @IsString()
  @IsNotEmpty()
  key: string;
}
