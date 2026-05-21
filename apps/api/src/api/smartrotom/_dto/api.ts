import { ApiProperty } from '@nestjs/swagger';

export class PostDto {
  @ApiProperty({ description: 'The name of the Minecraft server' })
  server: string;
}
