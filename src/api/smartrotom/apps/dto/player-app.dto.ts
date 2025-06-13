import { ApiProperty } from '@nestjs/swagger';

export class PlayerAppDto {
  @ApiProperty({ description: 'The id of the app' })
    id: number;
    @ApiProperty({ description: 'The uuid of the player' })
    uuid: string;
}
