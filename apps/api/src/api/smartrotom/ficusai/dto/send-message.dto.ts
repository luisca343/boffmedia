import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { FicusMessageContentDto } from './ficus-message-content.dto';

export class SendMessageDto extends BaseDto {
  @ApiProperty({
    description: 'UUID of the player/user',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  uuid: string;

  @ApiProperty({
    description: 'Server identifier',
    example: '1ee7e5f6-8e50-4b49-9ee6-b26cc1b5f365',
  })
  @IsString()
  @IsNotEmpty()
  server: string;

  @ApiProperty({
    description: 'Message content to send',
    type: FicusMessageContentDto,
  })
  @ValidateNested()
  @Type(() => FicusMessageContentDto)
  mensaje: FicusMessageContentDto;
}
