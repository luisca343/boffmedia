import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class GetUserAccountsDto extends BaseDto {
  @ApiProperty({
    description: 'UUID of the user',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsString()
  @IsUUID(4, { message: 'UUID must be a valid v4 UUID' })
  uuid: string;
}
