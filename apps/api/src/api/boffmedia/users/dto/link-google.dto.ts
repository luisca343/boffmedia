import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class LinkGoogleDto {
  @ApiProperty({
    example: '110169484474386276334',
    description:
      "Google's stable user id (`sub`), verified via OAuth by the web.",
  })
  @IsString()
  @Length(1, 255)
  googleId: string;
}
