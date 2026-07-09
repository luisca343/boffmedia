import { ApiProperty } from '@nestjs/swagger';

export class CreateInviteDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  mc_username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;
}
