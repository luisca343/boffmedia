import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateGameDto {
  @ApiProperty({ 
    description: 'The title of the game',
    example: 'Minecraft'
  })
  @IsString()
  @MaxLength(255)
  title: string;
  
  @ApiProperty({ 
    description: 'The description of the game',
    example: 'A sandbox video game developed by Mojang Studios'
  })
  @IsString()
  description: string;
  
  @ApiProperty({ 
    description: 'The icon URL for the game',
    example: '/icons/minecraft.png'
  })
  @IsString()
  @MaxLength(500)
  icon: string;

  @ApiProperty({ 
    description: 'Whether the game is active',
    example: 1,
    required: false
  })
  @IsOptional()
  active?: number;
}