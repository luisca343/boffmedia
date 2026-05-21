import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class BatchUsersRequestDto extends BaseDto {
  @ApiProperty({
    description: 'Array of user UUIDs',
    example: [
      '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      '12345678-1234-1234-1234-123456789012',
    ],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  @ArrayMinSize(1)
  uuids: string[];
}
