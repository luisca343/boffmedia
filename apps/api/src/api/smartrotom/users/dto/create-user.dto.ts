import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, Length } from 'class-validator';

export class CreateSmartrotomUserDto extends BaseDto {
  @ApiProperty({
    description: 'UUID of the user',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'Username of the user',
    example: 'PlayerName123',
  })
  @IsString()
  @Length(3, 16)
  username: string;

  @ApiProperty({
    description: 'World of the user',
    required: false,
    example: 'survival',
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  world?: string;
}
