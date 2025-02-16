import { ApiProperty } from '@nestjs/swagger';

export class CreateGameDto {
    @ApiProperty({ description: 'The title of the event' })
    title: string;
    
    @ApiProperty({ description: 'The description of the event' })
    description: string;
    
    @ApiProperty({ description: 'The icon URL for the game' })
    icon: string;
}