import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateForumPostDto {
  @ApiProperty({
    example: 'Prueba a subir la velocidad base...',
    minLength: 1,
    maxLength: 20000,
    description: 'Body of the reply (markdown)',
  })
  @IsString()
  @Length(1, 20000)
  body: string;
}
