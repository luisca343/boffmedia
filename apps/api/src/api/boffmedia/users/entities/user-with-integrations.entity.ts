import { ApiProperty } from '@nestjs/swagger';
import { BoffMediaUserEntity } from './user.entity';
import { SmartRotomUserEntity } from './full-user.entity';

export class StarbankAccountEntity {
  @ApiProperty({
    example: 1,
    description: 'Account ID',
  })
  id: number;

  @ApiProperty({
    example: 'main_account',
    description: 'Account type',
  })
  type: string;

  @ApiProperty({
    example: 1000.5,
    description: 'Account balance',
  })
  balance: number;
}

export class UserWithIntegrationsEntity {
  @ApiProperty({
    description: 'BoffMedia user data',
    type: BoffMediaUserEntity,
  })
  boffMediaUser: BoffMediaUserEntity;

  @ApiProperty({
    description: 'SmartRotom user data',
    type: SmartRotomUserEntity,
    nullable: true,
  })
  smartRotomUser: SmartRotomUserEntity | null;

  @ApiProperty({
    description: 'Starbank accounts',
    type: [StarbankAccountEntity],
  })
  starbankAccounts: StarbankAccountEntity[];

  @ApiProperty({
    description: 'User roles',
    type: [String],
  })
  roles: string[];
}
