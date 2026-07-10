import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, Length } from 'class-validator';

export class CreateThreadDto {
  @ApiProperty({ example: 3, description: 'Id of the category to post in' })
  @IsInt()
  @IsPositive()
  categoryId: number;

  @ApiProperty({
    example: '¿Cómo optimizo mi equipo?',
    minLength: 3,
    maxLength: 200,
    description: 'Thread title',
  })
  @IsString()
  @Length(3, 200)
  title: string;

  @ApiProperty({
    example: 'Llevo un rato dándole vueltas y no consigo...',
    minLength: 1,
    maxLength: 20000,
    description: 'Body of the original post (markdown)',
  })
  @IsString()
  @Length(1, 20000)
  body: string;
}
