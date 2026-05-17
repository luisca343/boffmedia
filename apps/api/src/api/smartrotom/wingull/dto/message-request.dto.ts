import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class MessageRequestDto {
  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Player UUID',
  })
  @IsUUID()
  uuid: string;

  @ApiProperty({ example: 'Hello, trainer!', description: 'Message to send' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
