import { ApiProperty } from '@nestjs/swagger';
import { BoffMediaUserEntity } from './user.entity';
import { SmartRotomUserEntity } from './full-user.entity';
import { StarbankAccountEntity } from './user-with-integrations.entity';

export class IntegratedUserCreationResultEntity {
  @ApiProperty({
    description: 'Created BoffMedia user',
    type: BoffMediaUserEntity,
  })
  boffMediaUser: BoffMediaUserEntity;

  @ApiProperty({
    description: 'Created or linked SmartRotom user',
    type: SmartRotomUserEntity,
    nullable: true,
  })
  smartRotomUser: SmartRotomUserEntity | null;

  @ApiProperty({
    description: 'Created Starbank accounts',
    type: [StarbankAccountEntity],
  })
  starbankAccounts: StarbankAccountEntity[];

  @ApiProperty({
    example: true,
    description: 'Whether BoffMedia user was newly created',
  })
  isNewBoffMediaUser: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether SmartRotom user was newly created',
  })
  isNewSmartRotomUser: boolean;
}
