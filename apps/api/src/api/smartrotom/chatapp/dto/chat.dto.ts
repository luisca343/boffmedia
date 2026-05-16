import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsInt,
  IsEnum,
} from 'class-validator';

export enum ChatType {
  PUBLIC = 0,
  PRIVATE = 1,
  DIRECT = 2,
  GROUP = 3,
}

export class CreateChatDto extends BaseDto {
  @ApiProperty({
    description: 'UUID of the player creating the chat',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  player: string;

  @ApiProperty({
    description: 'Array of user UUIDs to add to the chat',
    example: [
      '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  users: string[];

  @ApiProperty({
    description: 'Name of the chat',
    example: 'My Group Chat',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Chat description',
    example: 'A chat for discussing game strategies',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Chat image URL',
    example: 'group_chat.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;
}

export class GetChatsDto {
  @ApiProperty({
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;
}

export class GetChatByIdDto {
  @ApiProperty({
    description: 'Chat ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  chatId: number;

  @ApiProperty({
    description: 'Requesting user UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;
}
