import { ApiProperty } from '@nestjs/swagger';

export class OficialDto {
  @ApiProperty({ description: 'Player UUID' })
  uuid: string;

  @ApiProperty({ description: 'Player username' })
  username: string;

  @ApiProperty({ description: 'Staff role name' })
  role: string;
}
