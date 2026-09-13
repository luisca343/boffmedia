import {
  attachMhwildsArmorSetGameIds,
  isMhwildsResourceIdentityCompatible,
  mhwildsResourceIdentity,
} from './mhwilds.repository';

describe('MH Wilds resource identity validation', () => {
  const armorSeed = [
    {
      id: 1,
      name: 'Ajarakan Helm α',
      kind: 'head',
      armorSet: { id: 130, name: 'Ajarakan α' },
    },
  ];

  it('includes the nested armor set in the stable identity', () => {
    expect(mhwildsResourceIdentity('armor', armorSeed[0])).toContain('130');
    expect(
      isMhwildsResourceIdentityCompatible('armor', armorSeed, [
        {
          ...armorSeed[0],
          armorSet: { id: 19, name: 'Nerscylla α' },
        },
      ]),
    ).toBe(false);
    expect(
      isMhwildsResourceIdentityCompatible(
        'armor',
        [
          {
            ...armorSeed[0],
            armorSet: { id: 130, gameId: 1254402048, name: 'Ajarakan' },
          },
        ],
        [
          {
            ...armorSeed[0],
            armorSet: { id: 130, gameId: 3633, name: 'Akuma α' },
          },
        ],
      ),
    ).toBe(false);
  });

  it('allows newly added rows while rejecting duplicate ids', () => {
    expect(
      isMhwildsResourceIdentityCompatible('armor', armorSeed, [
        ...armorSeed,
        {
          id: 2,
          name: 'New Helm',
          kind: 'head',
          armorSet: { id: 999, name: 'New Set' },
        },
      ]),
    ).toBe(true);
    expect(
      isMhwildsResourceIdentityCompatible('armor', armorSeed, [
        armorSeed[0],
        armorSeed[0],
      ]),
    ).toBe(false);
  });

  it('protects weapon kind/game id joins as well', () => {
    const seed = [
      { id: 10, name: 'Iron Sword', kind: 'long-sword', gameId: 42 },
    ];
    expect(
      isMhwildsResourceIdentityCompatible('weapons', seed, [
        { ...seed[0], kind: 'great-sword' },
      ]),
    ).toBe(false);
    expect(
      isMhwildsResourceIdentityCompatible('weapons', seed, [{ ...seed[0] }]),
    ).toBe(true);
  });

  it('validates armor-set crosswalks by id and gameId, not localized names', () => {
    const seed = [{ id: 130, gameId: 1254402048 }];
    expect(
      isMhwildsResourceIdentityCompatible('armor-sets', seed, [
        { id: 130, gameId: 1254402048, name: 'Ajarakan α' },
      ]),
    ).toBe(true);
    expect(
      isMhwildsResourceIdentityCompatible('armor-sets', seed, [
        { id: 130, gameId: 3633, name: 'Akuma α' },
      ]),
    ).toBe(false);
  });

  it('joins armor stubs by database id but exposes the stable gameId', () => {
    const [armor] = attachMhwildsArmorSetGameIds(
      [{ id: 588, kind: 'head', armorSet: { id: 153, name: 'Akuma α' } }],
      [{ id: 153, gameId: 3633, name: 'Akuma α' }],
    );
    expect(armor?.armorSet).toEqual({
      id: 153,
      name: 'Akuma α',
      gameId: 3633,
    });
  });

  it('does not attach an ambiguous game id from a duplicate set crosswalk', () => {
    const [armor] = attachMhwildsArmorSetGameIds(
      [{ id: 1, kind: 'head', armorSet: { id: 130, name: 'Ajarakan α' } }],
      [
        { id: 130, gameId: 1254402048 },
        { id: 130, gameId: 3633 },
      ],
    );
    expect(armor?.armorSet).toEqual({ id: 130, name: 'Ajarakan α' });
  });
});
