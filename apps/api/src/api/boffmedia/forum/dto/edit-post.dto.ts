import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class EditPostDto {
  @ApiProperty({
    example: 'Edito para aclarar: me refería a la naturaleza, no al objeto.',
    minLength: 1,
    maxLength: 20000,
    description: 'New body for the post (markdown)',
  })
  @IsString()
  @Length(1, 20000)
  body: string;
}
