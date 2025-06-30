import { ApiProperty } from '@nestjs/swagger';

export class UserStatistics {
  @ApiProperty({ 
    description: 'Total number of users',
    example: 150
  })
  totalUsers: number;

  @ApiProperty({ 
    description: 'Number of users with accounts',
    example: 142
  })
  usersWithAccounts: number;

  @ApiProperty({ 
    description: 'Number of users without accounts',
    example: 8
  })
  usersWithoutAccounts: number;
}