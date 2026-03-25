import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class GetSeriesSetsDto extends BaseDto {
  @ApiProperty({ 
    description: 'Series ID',
    example: 'A1'
  })
  @IsString()
  seriesId: string;

  @ApiProperty({ 
    description: 'Language locale',
    example: 'en',
    enum: ['en', 'es'],
    required: false
  })
  @IsOptional()
  @IsIn(['en', 'es'])
  locale?: string = 'en';
}
