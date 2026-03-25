import { ApiProperty } from '@nestjs/swagger';

export class UserStatisticsEntity {
  @ApiProperty({ 
    example: 150, 
    description: 'Total number of BoffMedia users' 
  })
  totalUsers: number;

  @ApiProperty({ 
    example: 120, 
    description: 'Users with SmartRotom integration' 
  })
  usersWithSmartRotom: number;

  @ApiProperty({ 
    example: 80, 
    description: 'Users with Starbank accounts' 
  })
  usersWithStarbank: number;

  @ApiProperty({ 
    example: 30, 
    description: 'Users with Google authentication' 
  })
  usersWithGoogle: number;

  @ApiProperty({ 
    example: 45, 
    description: 'Users with assigned roles' 
  })
  usersWithRoles: number;
}