import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class GetSetCardsDto extends BaseDto {
  @ApiProperty({
    description: 'Set ID',
    example: 'A1',
  })
  @IsString()
  setId: string;

  @ApiProperty({
    description: 'Language locale',
    example: 'en',
    enum: ['en', 'es'],
    required: false,
  })
  @IsOptional()
  @IsIn(['en', 'es'])
  locale?: string = 'en';
}
