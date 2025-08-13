import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class UploadNpcImageDto extends BaseDto {
  @ApiProperty({ 
    description: 'NPC name',
    example: 'professor_oak'
  })
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'NPC name can only contain letters, numbers, underscores, and hyphens'
  })
  npcName: string;

  @ApiProperty({ 
    description: 'Base64 encoded PNG image',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
  })
  @IsString()
  @Matches(/^data:image\/png;base64,/, {
    message: 'Image must be a base64 encoded PNG'
  })
  image: string;
}