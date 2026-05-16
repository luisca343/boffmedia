import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FicusMessageContentDto } from './ficus-message-content.dto';

export class CreateMessageDto extends BaseDto {
  @ApiProperty({
    description: 'UUID of the player/user',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'Message content',
    type: FicusMessageContentDto,
  })
  @ValidateNested()
  @Type(() => FicusMessageContentDto)
  content: FicusMessageContentDto;
}
