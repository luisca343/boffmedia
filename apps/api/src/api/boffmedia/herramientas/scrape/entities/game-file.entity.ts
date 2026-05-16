import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GameFileEntry {
  @ApiProperty({
    example: 'Super Mario 3D Land (USA).3ds',
    description: 'Name of the game file',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example:
      'https://myrient.erista.me/files/No-Intro/Nintendo%20-%20Nintendo%203DS%20(Decrypted)/Super%20Mario%203D%20Land%20(USA).3ds',
    description: 'Direct download link to the file',
  })
  @IsString()
  link: string;

  @ApiProperty({
    example: '1.2 GiB',
    description: 'File size as reported on the page',
  })
  @IsString()
  size: string;
}
