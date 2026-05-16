import { ApiProperty } from '@nestjs/swagger';
import { WeaponEntity } from './weapon.entity';

export class WeaponTreeNodeEntity extends WeaponEntity {
  @ApiProperty({
    description: 'Child weapons in the upgrade tree',
    type: [WeaponTreeNodeEntity],
  })
  children: WeaponTreeNodeEntity[];
}

export class WeaponTreeEntity {
  @ApiProperty({
    description: 'Complete weapon upgrade tree',
    type: [WeaponTreeNodeEntity],
  })
  tree: WeaponTreeNodeEntity[];

  @ApiProperty({
    description: 'Weapons grouped by weapon kind',
    example: { 'sword-and-shield': [], 'great-sword': [] },
  })
  treeByKind: Record<string, WeaponTreeNodeEntity[]>;

  @ApiProperty({
    example: 150,
    description: 'Total number of weapons in the tree',
  })
  totalWeapons: number;

  @ApiProperty({
    description: 'Available weapon kinds',
    example: ['sword-and-shield', 'great-sword', 'hammer'],
    type: [String],
  })
  weaponKinds: string[];
}
