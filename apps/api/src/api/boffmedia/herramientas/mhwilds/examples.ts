export const CharmRankExample = {
  status: 200,
  message: 'Charm ranks found successfully',
  data: {
    charm: {
      id: 1,
      gameId: -2084662144,
    },
    name: 'Amuleto antiviento I',
    description: 'Amuleto que otorga la habilidad "antiviento".',
    level: 1,
    rarity: 4,
    skills: [
      {
        skill: {
          id: 34,
          name: 'Antiviento',
        },
        level: 1,
        description:
          'Anula las ráfagas de viento menores y reduce a la mitad el efecto de las ráfagas mayores.',
        id: 77,
      },
    ],
    crafting: {
      charmRank: {
        id: 1,
      },
      craftable: true,
      materials: [
        {
          item: {
            id: 53,
            gameId: 55,
            rarity: 4,
            name: 'Dragonita',
            description:
              'Mineral obtenido de afloramientos. Es muy codiciado por los forjadores de armaduras por su durabilidad.',
            value: 480,
            carryLimit: 10,
            recipes: [],
          },
          quantity: 2,
          id: 1656,
        },
        {
          item: {
            id: 355,
            gameId: 391,
            rarity: 4,
            name: 'Piel Doshaguma G.',
            description:
              'Piel de Doshaguma Guardián, gruesa y resistente. Presenta un patrón blanco inconfundible.',
            value: 750,
            carryLimit: 99,
            recipes: [],
          },
          quantity: 2,
          id: 1657,
        },
        {
          item: {
            id: 357,
            gameId: 393,
            rarity: 4,
            name: 'Colmillo Doshaguma G.',
            description:
              'Colmillo de Doshaguma Guardián. Es tan duro que puede soportar la saliva ácida del Doshaguma.',
            value: 1100,
            carryLimit: 99,
            recipes: [],
          },
          quantity: 1,
          id: 1658,
        },
        {
          item: {
            id: 459,
            gameId: 504,
            rarity: 4,
            name: 'Piel de Congalala',
            description:
              'El pelaje rosa de un Congalala. Los mechones de pelo mullido son un material ideal para ropa.',
            value: 280,
            carryLimit: 99,
            recipes: [],
          },
          quantity: 1,
          id: 1659,
        },
      ],
      zennyCost: 1500,
      id: 1,
    },
    id: 1,
  },
};
