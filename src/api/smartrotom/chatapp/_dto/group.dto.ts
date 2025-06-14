import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ 
    description: 'Group ID',
    example: 1
  })
  @IsNotEmpty()
  @IsInt()
  groupId: number;

  @ApiProperty({ 
    description: 'UUID of user to add',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({ 
    description: 'UUID of user making the request',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsNotEmpty()
  @IsString()
  requestingUserUuid: string;
}

export class RemoveMemberDto {
  @ApiProperty({ 
    description: 'Group ID',
    example: 1
  })
  @IsNotEmpty()
  @IsInt()
  groupId: number;

  @ApiProperty({ 
    description: 'UUID of user to remove',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({ 
    description: 'UUID of user making the request',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsNotEmpty()
  @IsString()
  requestingUserUuid: string;
}