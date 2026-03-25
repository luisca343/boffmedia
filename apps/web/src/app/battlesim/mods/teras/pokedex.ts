import type {ModdedSpeciesDataTable} from '@pkmn/sim';

export const Pokedex: ModdedSpeciesDataTable = {
    "caterpie": {
      "num": 10,
      "name": "Caterpie",
      "baseForme": "",
      "types": [
        "Bug",
        ""
      ],
      "baseStats": {
        "hp": 45,
        "atk": 30,
        "def": 35,
        "spa": 20,
        "spd": 20,
        "spe": 45
      },
      "abilities": {
        "0": "Shield Dust",
        "H": "Run Away"
      },
      "weightkg": 2.9,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "Caterpie-Base",
        "Caterpie-Sakura"
      ],
      "formeOrder": [
        "Caterpie",
        "Caterpie-Base",
        "Caterpie-Sakura"
      ],
      "heightm": 0.034999999999999996,
      "evos": [
        "Metapod"
      ]
    },
    "caterpiesakura": {
      "num": 10,
      "name": "Caterpie-Sakura",
      "baseSpecies": "Caterpie",
      "forme": "Sakura",
      "types": [
        "Bug",
        "Fairy"
      ],
      "baseStats": {
        "hp": 45,
        "atk": 30,
        "def": 35,
        "spa": 20,
        "spd": 20,
        "spe": 45
      },
      "abilities": {
        "0": "Shield Dust",
        "H": "Run Away"
      },
      "weightkg": 2.9,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.034999999999999996,
      "evos": [
        "Metapod f:sakura"
      ],
      "changesFrom": "Caterpie"
    },
    "metapod": {
      "num": 11,
      "name": "Metapod",
      "baseForme": "",
      "types": [
        "Bug",
        ""
      ],
      "baseStats": {
        "hp": 50,
        "atk": 20,
        "def": 55,
        "spa": 25,
        "spd": 25,
        "spe": 30
      },
      "abilities": {
        "0": "Shed Skin"
      },
      "weightkg": 9.9,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "Metapod-Base",
        "Metapod-Sakura"
      ],
      "formeOrder": [
        "Metapod",
        "Metapod-Base",
        "Metapod-Sakura"
      ],
      "heightm": 0.06999999999999999,
      "prevo": "Caterpie",
      "evos": [
        "Butterfree"
      ]
    },
    "metapodsakura": {
      "num": 11,
      "name": "Metapod-Sakura",
      "baseSpecies": "Metapod",
      "forme": "Sakura",
      "types": [
        "Bug",
        "Fairy"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 20,
        "def": 55,
        "spa": 25,
        "spd": 25,
        "spe": 30
      },
      "abilities": {
        "0": "Shed Skin"
      },
      "weightkg": 9.9,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.06999999999999999,
      "prevo": "Caterpie",
      "evos": [
        "Butterfree f:sakura"
      ],
      "changesFrom": "Metapod"
    },
    "butterfree": {
      "num": 12,
      "name": "Butterfree",
      "baseForme": "",
      "types": [
        "Bug",
        "Flying"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 45,
        "def": 50,
        "spa": 90,
        "spd": 80,
        "spe": 70
      },
      "abilities": {
        "0": "Compound Eyes",
        "H": "Tinted Lens"
      },
      "weightkg": 32,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "Butterfree-Base",
        "Butterfree-Sakura"
      ],
      "formeOrder": [
        "Butterfree",
        "Butterfree-Base",
        "Butterfree-Sakura"
      ],
      "heightm": 0.06999999999999999,
      "prevo": "Metapod"
    },
    "butterfreegmax": {
      "num": 12,
      "name": "Butterfree-Gmax",
      "baseSpecies": "Butterfree",
      "forme": "Gmax",
      "types": [
        "Bug",
        "Flying"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 45,
        "def": 50,
        "spa": 90,
        "spd": 80,
        "spe": 70
      },
      "abilities": {
        "0": "Compound Eyes",
        "H": "Tinted Lens"
      },
      "weightkg": 32,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.06999999999999999,
      "prevo": "Metapod"
    },
    "butterfreesakura": {
      "num": 12,
      "name": "Butterfree-Sakura",
      "baseSpecies": "Butterfree",
      "forme": "Sakura",
      "types": [
        "Bug",
        "Fairy"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 45,
        "def": 50,
        "spa": 90,
        "spd": 80,
        "spe": 70
      },
      "abilities": {
        "0": "Compound Eyes",
        "H": "Tinted Lens"
      },
      "weightkg": 32,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.06999999999999999,
      "prevo": "Metapod",
      "changesFrom": "Butterfree"
    },
    "raichu": {
      "num": 26,
      "name": "Raichu",
      "baseForme": "",
      "types": [
        "Electric",
        ""
      ],
      "baseStats": {
        "hp": 60,
        "atk": 90,
        "def": 55,
        "spa": 90,
        "spd": 80,
        "spe": 110
      },
      "abilities": {
        "0": "Static",
        "H": "Lightning Rod"
      },
      "weightkg": 30,
      "eggGroups": [
        "FIELD",
        "FAIRY"
      ],
      "otherFormes": [
        "Raichu-Base",
        "Raichu-Alola",
        "Raichu-Omnitrix"
      ],
      "formeOrder": [
        "Raichu",
        "Raichu-Base",
        "Raichu-Alola",
        "Raichu-Omnitrix"
      ],
      "heightm": 0.1,
      "prevo": "Pikachu"
    },
    "raichualola": {
      "num": 26,
      "name": "Raichu-Alola",
      "baseSpecies": "Raichu",
      "forme": "Alola",
      "types": [
        "Electric",
        "Psychic"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 85,
        "def": 50,
        "spa": 95,
        "spd": 85,
        "spe": 110
      },
      "abilities": {
        "0": "Surge Surfer"
      },
      "weightkg": 21,
      "eggGroups": [
        "FIELD",
        "FAIRY"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Pikachu",
      "changesFrom": "Raichu"
    },
    "raichuomnitrix": {
      "num": 26,
      "name": "Raichu-Omnitrix",
      "baseSpecies": "Raichu",
      "forme": "Omnitrix",
      "types": [
        "Electric",
        "Dark"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 90,
        "def": 55,
        "spa": 90,
        "spd": 80,
        "spe": 110
      },
      "abilities": {
        "0": "Static",
        "H": "Lightning Rod"
      },
      "weightkg": 30,
      "eggGroups": [
        "FIELD",
        "FAIRY"
      ],
      "heightm": 0.1,
      "prevo": "Pikachu",
      "changesFrom": "Raichu"
    },
    "sandshrew": {
      "num": 27,
      "name": "Sandshrew",
      "baseForme": "",
      "types": [
        "Ground",
        ""
      ],
      "baseStats": {
        "hp": 50,
        "atk": 75,
        "def": 85,
        "spa": 20,
        "spd": 30,
        "spe": 40
      },
      "abilities": {
        "0": "Sand Veil",
        "H": "Sand Rush"
      },
      "weightkg": 12,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Sandshrew-Base",
        "Sandshrew-Alola"
      ],
      "formeOrder": [
        "Sandshrew",
        "Sandshrew-Base",
        "Sandshrew-Alola"
      ],
      "heightm": 0.06,
      "evos": [
        "Sandslash form:base",
        "Sandslash form:teras"
      ]
    },
    "sandshrewalola": {
      "num": 27,
      "name": "Sandshrew-Alola",
      "baseSpecies": "Sandshrew",
      "forme": "Alola",
      "types": [
        "Ice",
        "Steel"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 75,
        "def": 90,
        "spa": 10,
        "spd": 35,
        "spe": 40
      },
      "abilities": {
        "0": "Snow Cloak",
        "H": "Slush Rush"
      },
      "weightkg": 3.8,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.05,
      "evos": [
        "Sandslash form:alolan"
      ],
      "changesFrom": "Sandshrew"
    },
    "sandslash": {
      "num": 28,
      "name": "Sandslash",
      "baseForme": "",
      "types": [
        "Ground",
        ""
      ],
      "baseStats": {
        "hp": 75,
        "atk": 100,
        "def": 110,
        "spa": 45,
        "spd": 55,
        "spe": 65
      },
      "abilities": {
        "0": "Sand Veil",
        "H": "Sand Rush"
      },
      "weightkg": 29.5,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Sandslash-Base",
        "Sandslash-Alola",
        "Sandslash-Teras",
        "Sandslash-Omnitrix"
      ],
      "formeOrder": [
        "Sandslash",
        "Sandslash-Base",
        "Sandslash-Alola",
        "Sandslash-Teras",
        "Sandslash-Omnitrix"
      ],
      "heightm": 0.1,
      "prevo": "Sandshrew"
    },
    "sandslashalola": {
      "num": 28,
      "name": "Sandslash-Alola",
      "baseSpecies": "Sandslash",
      "forme": "Alola",
      "types": [
        "Ice",
        "Steel"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 100,
        "def": 120,
        "spa": 25,
        "spd": 65,
        "spe": 65
      },
      "abilities": {
        "0": "Snow Cloak",
        "H": "Slush Rush"
      },
      "weightkg": 3.8,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.15,
      "prevo": "Sandshrew",
      "changesFrom": "Sandslash"
    },
    "sandslashteras": {
      "num": 28,
      "name": "Sandslash-Teras",
      "baseSpecies": "Sandslash",
      "forme": "Teras",
      "types": [
        "Ice",
        "Ground"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 100,
        "def": 120,
        "spa": 25,
        "spd": 65,
        "spe": 65
      },
      "abilities": {
        "0": "Snow Cloak",
        "H": "Slush Rush"
      },
      "weightkg": 3.8,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.15,
      "prevo": "Sandshrew",
      "changesFrom": "Sandslash"
    },
    "sandslashomnitrix": {
      "num": 28,
      "name": "Sandslash-Omnitrix",
      "baseSpecies": "Sandslash",
      "forme": "Omnitrix",
      "types": [
        "Rock",
        "Fairy"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 100,
        "def": 120,
        "spa": 25,
        "spd": 65,
        "spe": 65
      },
      "abilities": {
        "0": "Snow Cloak",
        "H": "Slush Rush"
      },
      "weightkg": 3.8,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.15,
      "prevo": "Sandshrew",
      "changesFrom": "Sandslash"
    },
    "vulpix": {
      "num": 37,
      "name": "Vulpix",
      "baseForme": "",
      "types": [
        "Fire",
        ""
      ],
      "baseStats": {
        "hp": 38,
        "atk": 41,
        "def": 40,
        "spa": 50,
        "spd": 65,
        "spe": 65
      },
      "abilities": {
        "0": "Flash Fire",
        "H": "Drought"
      },
      "weightkg": 9.9,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Vulpix-Base",
        "Vulpix-Alola",
        "Vulpix-Sakura"
      ],
      "formeOrder": [
        "Vulpix",
        "Vulpix-Base",
        "Vulpix-Alola",
        "Vulpix-Sakura"
      ],
      "heightm": 0.05,
      "evos": [
        "Ninetales form:base"
      ]
    },
    "vulpixalola": {
      "num": 37,
      "name": "Vulpix-Alola",
      "baseSpecies": "Vulpix",
      "forme": "Alola",
      "types": [
        "Ice",
        ""
      ],
      "baseStats": {
        "hp": 38,
        "atk": 41,
        "def": 40,
        "spa": 50,
        "spd": 65,
        "spe": 65
      },
      "abilities": {
        "0": "Snow Cloak",
        "H": "Snow Warning"
      },
      "weightkg": 3.8,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.05,
      "evos": [
        "Ninetales form:alolan"
      ],
      "changesFrom": "Vulpix"
    },
    "vulpixsakura": {
      "num": 37,
      "name": "Vulpix-Sakura",
      "baseSpecies": "Vulpix",
      "forme": "Sakura",
      "types": [
        "Fire",
        "Fairy"
      ],
      "baseStats": {
        "hp": 38,
        "atk": 41,
        "def": 40,
        "spa": 50,
        "spd": 65,
        "spe": 65
      },
      "abilities": {
        "0": "Snow Cloak",
        "H": "Snow Warning"
      },
      "weightkg": 3.8,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.05,
      "evos": [
        "Ninetales form:sakura"
      ],
      "changesFrom": "Vulpix"
    },
    "ninetales": {
      "num": 38,
      "name": "Ninetales",
      "baseForme": "",
      "types": [
        "Fire",
        ""
      ],
      "baseStats": {
        "hp": 73,
        "atk": 76,
        "def": 75,
        "spa": 81,
        "spd": 100,
        "spe": 100
      },
      "abilities": {
        "0": "Flash Fire",
        "H": "Drought"
      },
      "weightkg": 19.9,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Ninetales-Base",
        "Ninetales-Alola",
        "Ninetales-Sakura"
      ],
      "formeOrder": [
        "Ninetales",
        "Ninetales-Base",
        "Ninetales-Alola",
        "Ninetales-Sakura"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Vulpix"
    },
    "ninetalesalola": {
      "num": 38,
      "name": "Ninetales-Alola",
      "baseSpecies": "Ninetales",
      "forme": "Alola",
      "types": [
        "Ice",
        "Fairy"
      ],
      "baseStats": {
        "hp": 73,
        "atk": 67,
        "def": 75,
        "spa": 81,
        "spd": 100,
        "spe": 109
      },
      "abilities": {
        "0": "Snow Cloak",
        "H": "Snow Warning"
      },
      "weightkg": 3.8,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Vulpix",
      "changesFrom": "Ninetales"
    },
    "ninetalessakura": {
      "num": 38,
      "name": "Ninetales-Sakura",
      "baseSpecies": "Ninetales",
      "forme": "Sakura",
      "types": [
        "Fire",
        "Fairy"
      ],
      "baseStats": {
        "hp": 73,
        "atk": 67,
        "def": 75,
        "spa": 81,
        "spd": 100,
        "spe": 109
      },
      "abilities": {
        "0": "Snow Cloak",
        "H": "Snow Warning"
      },
      "weightkg": 3.8,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Vulpix",
      "changesFrom": "Ninetales"
    },
    "meowth": {
      "num": 52,
      "name": "Meowth",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 40,
        "atk": 45,
        "def": 35,
        "spa": 40,
        "spd": 40,
        "spe": 90
      },
      "abilities": {
        "0": "Pickup",
        "1": "Technician",
        "H": "Unnerve"
      },
      "weightkg": 4.2,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Meowth-Base",
        "Meowth-Alola",
        "Meowth-Galar",
        "Meowth-RamAlbun"
      ],
      "formeOrder": [
        "Meowth",
        "Meowth-Base",
        "Meowth-Alola",
        "Meowth-Galar",
        "Meowth-RamAlbun"
      ],
      "heightm": 0.054000000000000006,
      "evos": [
        "Persian form:base"
      ]
    },
    "meowthalola": {
      "num": 52,
      "name": "Meowth-Alola",
      "baseSpecies": "Meowth",
      "forme": "Alola",
      "types": [
        "Dark",
        ""
      ],
      "baseStats": {
        "hp": 40,
        "atk": 35,
        "def": 35,
        "spa": 50,
        "spd": 40,
        "spe": 90
      },
      "abilities": {
        "0": "Pickup",
        "1": "Technician",
        "H": "Rattled"
      },
      "weightkg": 4.2,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.054000000000000006,
      "evos": [
        "Persian form:alolan"
      ],
      "changesFrom": "Meowth"
    },
    "meowthgalar": {
      "num": 52,
      "name": "Meowth-Galar",
      "baseSpecies": "Meowth",
      "forme": "Galar",
      "types": [
        "Steel",
        ""
      ],
      "baseStats": {
        "hp": 50,
        "atk": 65,
        "def": 55,
        "spa": 40,
        "spd": 40,
        "spe": 40
      },
      "abilities": {
        "0": "Pickup",
        "1": "Tough Claws",
        "H": "Unnerve"
      },
      "weightkg": 7.5,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.054000000000000006,
      "evos": [
        "Perrserker"
      ],
      "changesFrom": "Meowth"
    },
    "meowthgmax": {
      "num": 52,
      "name": "Meowth-Gmax",
      "baseSpecies": "Meowth",
      "forme": "Gmax",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 40,
        "atk": 45,
        "def": 35,
        "spa": 40,
        "spd": 40,
        "spe": 90
      },
      "abilities": {
        "0": "Pickup",
        "1": "Technician",
        "H": "Unnerve"
      },
      "weightkg": 4.2,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.1
    },
    "meowthramalbun": {
      "num": 52,
      "name": "Meowth-RamAlbun",
      "baseSpecies": "Meowth",
      "forme": "RamAlbun",
      "types": [
        "Dark",
        ""
      ],
      "baseStats": {
        "hp": 40,
        "atk": 35,
        "def": 35,
        "spa": 50,
        "spd": 40,
        "spe": 90
      },
      "abilities": {
        "0": "Pickup",
        "1": "Technician",
        "H": "Rattled"
      },
      "weightkg": 4.2,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.054000000000000006,
      "evos": [
        "Persian form:ramalbun"
      ],
      "changesFrom": "Meowth"
    },
    "persian": {
      "num": 53,
      "name": "Persian",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 65,
        "atk": 70,
        "def": 60,
        "spa": 65,
        "spd": 65,
        "spe": 115
      },
      "abilities": {
        "0": "Limber",
        "1": "Technician",
        "H": "Unnerve"
      },
      "weightkg": 32,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Persian-Base",
        "Persian-Alola",
        "Persian-RamAlbun"
      ],
      "formeOrder": [
        "Persian",
        "Persian-Base",
        "Persian-Alola",
        "Persian-RamAlbun"
      ],
      "heightm": 0.08,
      "prevo": "Meowth"
    },
    "persianalola": {
      "num": 53,
      "name": "Persian-Alola",
      "baseSpecies": "Persian",
      "forme": "Alola",
      "types": [
        "Dark",
        ""
      ],
      "baseStats": {
        "hp": 65,
        "atk": 60,
        "def": 60,
        "spa": 75,
        "spd": 65,
        "spe": 115
      },
      "abilities": {
        "0": "Fur Coat",
        "1": "Technician",
        "H": "Rattled"
      },
      "weightkg": 32,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.12,
      "prevo": "Meowth",
      "changesFrom": "Persian"
    },
    "persianramalbun": {
      "num": 53,
      "name": "Persian-RamAlbun",
      "baseSpecies": "Persian",
      "forme": "RamAlbun",
      "types": [
        "Psychic",
        ""
      ],
      "baseStats": {
        "hp": 65,
        "atk": 60,
        "def": 60,
        "spa": 75,
        "spd": 65,
        "spe": 115
      },
      "abilities": {
        "0": "Fur Coat",
        "1": "Technician",
        "H": "Rattled"
      },
      "weightkg": 32,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.12,
      "prevo": "Meowth",
      "changesFrom": "Persian"
    },
    "poliwrath": {
      "num": 62,
      "name": "Poliwrath",
      "baseForme": "",
      "types": [
        "Water",
        "Fighting"
      ],
      "baseStats": {
        "hp": 90,
        "atk": 95,
        "def": 95,
        "spa": 70,
        "spd": 90,
        "spe": 70
      },
      "abilities": {
        "0": "Water Absorb",
        "1": "Damp",
        "H": "Swift Swim"
      },
      "weightkg": 54,
      "eggGroups": [
        "WATER_ONE"
      ],
      "otherFormes": [
        "Poliwrath-Base",
        "Poliwrath-Omnitrix"
      ],
      "formeOrder": [
        "Poliwrath",
        "Poliwrath-Base",
        "Poliwrath-Omnitrix"
      ],
      "heightm": 0.1,
      "prevo": "Poliwhirl"
    },
    "poliwrathomnitrix": {
      "num": 62,
      "name": "Poliwrath-Omnitrix",
      "baseSpecies": "Poliwrath",
      "forme": "Omnitrix",
      "types": [
        "Water",
        "Fighting"
      ],
      "baseStats": {
        "hp": 90,
        "atk": 95,
        "def": 95,
        "spa": 70,
        "spd": 90,
        "spe": 70
      },
      "abilities": {
        "0": "Water Absorb",
        "1": "Damp",
        "H": "Swift Swim"
      },
      "weightkg": 54,
      "eggGroups": [
        "WATER_ONE"
      ],
      "heightm": 0.1,
      "prevo": "Poliwhirl",
      "changesFrom": "Poliwrath"
    },
    "machamp": {
      "num": 68,
      "name": "Machamp",
      "baseForme": "",
      "types": [
        "Fighting",
        ""
      ],
      "baseStats": {
        "hp": 90,
        "atk": 130,
        "def": 80,
        "spa": 65,
        "spd": 85,
        "spe": 55
      },
      "abilities": {
        "0": "Guts",
        "1": "No Guard",
        "H": "Steadfast"
      },
      "weightkg": 130,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "otherFormes": [
        "Machamp-Base",
        "Machamp-Omnitrix",
        "Machamp-Omnitrix-Gmax"
      ],
      "formeOrder": [
        "Machamp",
        "Machamp-Base",
        "Machamp-Omnitrix",
        "Machamp-Omnitrix-Gmax"
      ],
      "heightm": 0.2,
      "prevo": "Machoke"
    },
    "machampgmax": {
      "num": 68,
      "name": "Machamp-Gmax",
      "baseSpecies": "Machamp",
      "forme": "Gmax",
      "types": [
        "Fighting",
        ""
      ],
      "baseStats": {
        "hp": 90,
        "atk": 130,
        "def": 80,
        "spa": 65,
        "spd": 85,
        "spe": 55
      },
      "abilities": {
        "0": "Guts",
        "1": "No Guard",
        "H": "Steadfast"
      },
      "weightkg": 130,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "heightm": 0.16999999999999998,
      "prevo": "Machoke"
    },
    "machampomnitrix": {
      "num": 68,
      "name": "Machamp-Omnitrix",
      "baseSpecies": "Machamp",
      "forme": "Omnitrix",
      "types": [
        "Fighting",
        ""
      ],
      "baseStats": {
        "hp": 90,
        "atk": 130,
        "def": 80,
        "spa": 65,
        "spd": 85,
        "spe": 55
      },
      "abilities": {
        "0": "Guts",
        "1": "No Guard",
        "H": "Steadfast"
      },
      "weightkg": 130,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "heightm": 0.2,
      "prevo": "Machoke",
      "changesFrom": "Machamp"
    },
    "machampomnitrixgmax": {
      "num": 68,
      "name": "Machamp-Omnitrix-Gmax",
      "baseSpecies": "Machamp",
      "forme": "Omnitrix-Gmax",
      "types": [
        "Fighting",
        ""
      ],
      "baseStats": {
        "hp": 90,
        "atk": 130,
        "def": 80,
        "spa": 65,
        "spd": 85,
        "spe": 55
      },
      "abilities": {
        "0": "Guts",
        "1": "No Guard",
        "H": "Steadfast"
      },
      "weightkg": 130,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "heightm": 0.16999999999999998,
      "prevo": "Machoke",
      "changesFrom": "Machamp"
    },
    "tentacool": {
      "num": 72,
      "name": "Tentacool",
      "baseForme": "",
      "types": [
        "Water",
        "Poison"
      ],
      "baseStats": {
        "hp": 40,
        "atk": 40,
        "def": 35,
        "spa": 50,
        "spd": 100,
        "spe": 70
      },
      "abilities": {
        "0": "Clear Body",
        "1": "Liquid Ooze",
        "H": "Rain Dish"
      },
      "weightkg": 45.5,
      "eggGroups": [
        "WATER_THREE"
      ],
      "otherFormes": [
        "Tentacool-Base",
        "Tentacool-Pesadilla"
      ],
      "formeOrder": [
        "Tentacool",
        "Tentacool-Base",
        "Tentacool-Pesadilla"
      ],
      "heightm": 0.09,
      "evos": [
        "Tentacruel"
      ]
    },
    "tentacoolpesadilla": {
      "num": 72,
      "name": "Tentacool-Pesadilla",
      "baseSpecies": "Tentacool",
      "forme": "Pesadilla",
      "types": [
        "Dark",
        "Psychic"
      ],
      "baseStats": {
        "hp": 40,
        "atk": 40,
        "def": 35,
        "spa": 50,
        "spd": 100,
        "spe": 70
      },
      "abilities": {
        "0": "Clear Body",
        "1": "Liquid Ooze",
        "H": "Rain Dish"
      },
      "weightkg": 45.5,
      "eggGroups": [
        "WATER_THREE"
      ],
      "heightm": 0.09,
      "evos": [
        "Tentacruel f:pesadilla"
      ],
      "changesFrom": "Tentacool"
    },
    "tentacruel": {
      "num": 73,
      "name": "Tentacruel",
      "baseForme": "",
      "types": [
        "Water",
        "Poison"
      ],
      "baseStats": {
        "hp": 80,
        "atk": 70,
        "def": 65,
        "spa": 80,
        "spd": 120,
        "spe": 100
      },
      "abilities": {
        "0": "Clear Body",
        "1": "Liquid Ooze",
        "H": "Rain Dish"
      },
      "weightkg": 55,
      "eggGroups": [
        "WATER_THREE"
      ],
      "otherFormes": [
        "Tentacruel-Base",
        "Tentacruel-Pesadilla"
      ],
      "formeOrder": [
        "Tentacruel",
        "Tentacruel-Base",
        "Tentacruel-Pesadilla"
      ],
      "heightm": 0.18,
      "prevo": "Tentacool"
    },
    "tentacruelpesadilla": {
      "num": 73,
      "name": "Tentacruel-Pesadilla",
      "baseSpecies": "Tentacruel",
      "forme": "Pesadilla",
      "types": [
        "Water",
        "Poison"
      ],
      "baseStats": {
        "hp": 80,
        "atk": 70,
        "def": 65,
        "spa": 80,
        "spd": 120,
        "spe": 100
      },
      "abilities": {
        "0": "Clear Body",
        "1": "Liquid Ooze",
        "H": "Rain Dish"
      },
      "weightkg": 55,
      "eggGroups": [
        "WATER_THREE"
      ],
      "heightm": 0.18,
      "prevo": "Tentacool",
      "changesFrom": "Tentacruel"
    },
    "golem": {
      "num": 76,
      "name": "Golem",
      "baseForme": "",
      "types": [
        "Rock",
        "Ground"
      ],
      "baseStats": {
        "hp": 80,
        "atk": 120,
        "def": 130,
        "spa": 55,
        "spd": 65,
        "spe": 45
      },
      "abilities": {
        "0": "Rock Head",
        "1": "Sturdy",
        "H": "Sand Veil"
      },
      "weightkg": 300,
      "eggGroups": [
        "MINERAL"
      ],
      "otherFormes": [
        "Golem-Base",
        "Golem-Alola",
        "Golem-Omnitrix"
      ],
      "formeOrder": [
        "Golem",
        "Golem-Base",
        "Golem-Alola",
        "Golem-Omnitrix"
      ],
      "heightm": 0.1,
      "prevo": "Graveler"
    },
    "golemalola": {
      "num": 76,
      "name": "Golem-Alola",
      "baseSpecies": "Golem",
      "forme": "Alola",
      "types": [
        "Rock",
        "Electric"
      ],
      "baseStats": {
        "hp": 80,
        "atk": 120,
        "def": 130,
        "spa": 55,
        "spd": 65,
        "spe": 45
      },
      "abilities": {
        "0": "Magnet Pull",
        "1": "Sturdy",
        "H": "Galvanize"
      },
      "weightkg": 300,
      "eggGroups": [
        "MINERAL"
      ],
      "heightm": 0.1,
      "prevo": "Graveler",
      "changesFrom": "Golem"
    },
    "golemomnitrix": {
      "num": 76,
      "name": "Golem-Omnitrix",
      "baseSpecies": "Golem",
      "forme": "Omnitrix",
      "types": [
        "Rock",
        "Ground"
      ],
      "baseStats": {
        "hp": 80,
        "atk": 120,
        "def": 130,
        "spa": 55,
        "spd": 65,
        "spe": 45
      },
      "abilities": {
        "0": "Rock Head",
        "1": "Sturdy",
        "H": "Sand Veil"
      },
      "weightkg": 300,
      "eggGroups": [
        "MINERAL"
      ],
      "heightm": 0.1,
      "prevo": "Graveler",
      "changesFrom": "Golem"
    },
    "hypno": {
      "num": 97,
      "name": "Hypno",
      "baseForme": "",
      "types": [
        "Psychic",
        ""
      ],
      "baseStats": {
        "hp": 85,
        "atk": 73,
        "def": 70,
        "spa": 73,
        "spd": 115,
        "spe": 67
      },
      "abilities": {
        "0": "Insomnia",
        "1": "Forewarn",
        "H": "Inner Focus"
      },
      "weightkg": 75.6,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "otherFormes": [
        "Hypno-Base",
        "Hypno-Base"
      ],
      "formeOrder": [
        "Hypno",
        "Hypno-Base",
        "Hypno-Base"
      ],
      "heightm": 0.135,
      "prevo": "Drowzee"
    },
    "cubone": {
      "num": 104,
      "name": "Cubone",
      "baseForme": "",
      "types": [
        "Ground",
        ""
      ],
      "baseStats": {
        "hp": 50,
        "atk": 50,
        "def": 95,
        "spa": 40,
        "spd": 50,
        "spe": 35
      },
      "abilities": {
        "0": "Rock Head",
        "1": "Lightning Rod",
        "H": "Battle Armour"
      },
      "weightkg": 6.5,
      "eggGroups": [
        "MONSTER"
      ],
      "otherFormes": [
        "Cubone-Base",
        "Cubone-RamAlbun"
      ],
      "formeOrder": [
        "Cubone",
        "Cubone-Base",
        "Cubone-RamAlbun"
      ],
      "heightm": 0.043,
      "evos": [
        "Marowak form:alolan",
        "Marowak form:base"
      ]
    },
    "cuboneramalbun": {
      "num": 104,
      "name": "Cubone-RamAlbun",
      "baseSpecies": "Cubone",
      "forme": "RamAlbun",
      "types": [
        "Ground",
        "Ghost"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 50,
        "def": 95,
        "spa": 40,
        "spd": 50,
        "spe": 35
      },
      "abilities": {
        "0": "Rock Head",
        "1": "Lightning Rod",
        "H": "Battle Armour"
      },
      "weightkg": 6.5,
      "eggGroups": [
        "MONSTER"
      ],
      "heightm": 0.043,
      "evos": [
        "Marowak form:ramalbun"
      ],
      "changesFrom": "Cubone"
    },
    "marowak": {
      "num": 105,
      "name": "Marowak",
      "baseForme": "",
      "types": [
        "Ground",
        ""
      ],
      "baseStats": {
        "hp": 60,
        "atk": 80,
        "def": 110,
        "spa": 50,
        "spd": 80,
        "spe": 45
      },
      "abilities": {
        "0": "Rock Head",
        "1": "Lightning Rod",
        "H": "Battle Armour"
      },
      "weightkg": 45,
      "eggGroups": [
        "MONSTER"
      ],
      "otherFormes": [
        "Marowak-Base",
        "Marowak-Alola",
        "Marowak-RamAlbun"
      ],
      "formeOrder": [
        "Marowak",
        "Marowak-Base",
        "Marowak-Alola",
        "Marowak-RamAlbun"
      ],
      "heightm": 0.06999999999999999,
      "prevo": "Cubone"
    },
    "marowakalola": {
      "num": 105,
      "name": "Marowak-Alola",
      "baseSpecies": "Marowak",
      "forme": "Alola",
      "types": [
        "Fire",
        "Ghost"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 80,
        "def": 110,
        "spa": 50,
        "spd": 80,
        "spe": 45
      },
      "abilities": {
        "0": "Cursed Body",
        "1": "Lightning Rod",
        "H": "Rock Head"
      },
      "weightkg": 45,
      "eggGroups": [
        "MONSTER"
      ],
      "heightm": 0.09,
      "prevo": "Cubone",
      "changesFrom": "Marowak"
    },
    "marowakramalbun": {
      "num": 105,
      "name": "Marowak-RamAlbun",
      "baseSpecies": "Marowak",
      "forme": "RamAlbun",
      "types": [
        "Ground",
        "Ghost"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 80,
        "def": 110,
        "spa": 50,
        "spd": 80,
        "spe": 45
      },
      "abilities": {
        "0": "Rock Head",
        "1": "Lightning Rod",
        "H": "Battle Armour"
      },
      "weightkg": 45,
      "eggGroups": [
        "MONSTER"
      ],
      "heightm": 0.06999999999999999,
      "prevo": "Cubone",
      "changesFrom": "Marowak"
    },
    "staryu": {
      "num": 120,
      "name": "Staryu",
      "baseForme": "",
      "types": [
        "Water",
        ""
      ],
      "baseStats": {
        "hp": 30,
        "atk": 45,
        "def": 55,
        "spa": 70,
        "spd": 55,
        "spe": 85
      },
      "abilities": {
        "0": "Illuminate",
        "1": "Natural Cure",
        "H": "Analytic"
      },
      "weightkg": 34.5,
      "eggGroups": [
        "WATER_THREE"
      ],
      "otherFormes": [
        "Staryu-Base",
        "Staryu-Volcanic"
      ],
      "formeOrder": [
        "Staryu",
        "Staryu-Base",
        "Staryu-Volcanic"
      ],
      "heightm": 0.1,
      "evos": [
        "Starmie"
      ]
    },
    "staryuvolcanic": {
      "num": 120,
      "name": "Staryu-Volcanic",
      "baseSpecies": "Staryu",
      "forme": "Volcanic",
      "types": [
        "Rock",
        ""
      ],
      "baseStats": {
        "hp": 30,
        "atk": 45,
        "def": 55,
        "spa": 70,
        "spd": 55,
        "spe": 85
      },
      "abilities": {
        "0": "Illuminate",
        "1": "Natural Cure",
        "H": "Analytic"
      },
      "weightkg": 34.5,
      "eggGroups": [
        "WATER_THREE"
      ],
      "heightm": 0.1,
      "evos": [
        "Starmie f:volcanic"
      ],
      "changesFrom": "Staryu"
    },
    "starmie": {
      "num": 121,
      "name": "Starmie",
      "baseForme": "",
      "types": [
        "Water",
        "Psychic"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 75,
        "def": 85,
        "spa": 100,
        "spd": 85,
        "spe": 115
      },
      "abilities": {
        "0": "Illuminate",
        "1": "Natural Cure",
        "H": "Analytic"
      },
      "weightkg": 80,
      "eggGroups": [
        "WATER_THREE"
      ],
      "otherFormes": [
        "Starmie-Base",
        "Starmie-Volcanic"
      ],
      "formeOrder": [
        "Starmie",
        "Starmie-Base",
        "Starmie-Volcanic"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Staryu"
    },
    "starmievolcanic": {
      "num": 121,
      "name": "Starmie-Volcanic",
      "baseSpecies": "Starmie",
      "forme": "Volcanic",
      "types": [
        "Rock",
        "Psychic"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 75,
        "def": 85,
        "spa": 100,
        "spd": 85,
        "spe": 115
      },
      "abilities": {
        "0": "Illuminate",
        "1": "Natural Cure",
        "H": "Analytic"
      },
      "weightkg": 80,
      "eggGroups": [
        "WATER_THREE"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Staryu",
      "changesFrom": "Starmie"
    },
    "tauros": {
      "num": 128,
      "name": "Tauros",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 75,
        "atk": 100,
        "def": 95,
        "spa": 40,
        "spd": 70,
        "spe": 110
      },
      "abilities": {
        "0": "Intimidate",
        "1": "Anger Point",
        "H": "Sheer Force"
      },
      "weightkg": 88.4,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Tauros-Base",
        "Tauros-Paldea-Combat",
        "Tauros-Paldea-Blaze",
        "Tauros-Paldea-Aqua",
        "Tauros-RamAlbun"
      ],
      "formeOrder": [
        "Tauros",
        "Tauros-Base",
        "Tauros-Paldea-Combat",
        "Tauros-Paldea-Blaze",
        "Tauros-Paldea-Aqua",
        "Tauros-RamAlbun"
      ],
      "heightm": 0.16999999999999998
    },
    "taurospaldeacombat": {
      "num": 128,
      "name": "Tauros-Paldea-Combat",
      "baseSpecies": "Tauros",
      "forme": "Paldea-Combat",
      "types": [
        "Fighting",
        ""
      ],
      "baseStats": {
        "hp": 75,
        "atk": 110,
        "def": 105,
        "spa": 30,
        "spd": 70,
        "spe": 100
      },
      "abilities": {
        "0": "Intimidate",
        "1": "Anger Point",
        "H": "Cud Chew"
      },
      "weightkg": 115,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.13999999999999999,
      "changesFrom": "Tauros"
    },
    "taurospaldeablaze": {
      "num": 128,
      "name": "Tauros-Paldea-Blaze",
      "baseSpecies": "Tauros",
      "forme": "Paldea-Blaze",
      "types": [
        "Fighting",
        "Fire"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 110,
        "def": 105,
        "spa": 30,
        "spd": 70,
        "spe": 100
      },
      "abilities": {
        "0": "Intimidate",
        "1": "Anger Point",
        "H": "Cud Chew"
      },
      "weightkg": 85,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.13999999999999999,
      "changesFrom": "Tauros"
    },
    "taurospaldeaaqua": {
      "num": 128,
      "name": "Tauros-Paldea-Aqua",
      "baseSpecies": "Tauros",
      "forme": "Paldea-Aqua",
      "types": [
        "Fighting",
        "Water"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 110,
        "def": 105,
        "spa": 30,
        "spd": 70,
        "spe": 100
      },
      "abilities": {
        "0": "Intimidate",
        "1": "Anger Point",
        "H": "Cud Chew"
      },
      "weightkg": 110,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.13999999999999999,
      "changesFrom": "Tauros"
    },
    "taurosramalbun": {
      "num": 128,
      "name": "Tauros-RamAlbun",
      "baseSpecies": "Tauros",
      "forme": "RamAlbun",
      "types": [
        "Ground",
        ""
      ],
      "baseStats": {
        "hp": 75,
        "atk": 100,
        "def": 95,
        "spa": 40,
        "spd": 70,
        "spe": 110
      },
      "abilities": {
        "0": "Intimidate",
        "1": "Anger Point",
        "H": "Sheer Force"
      },
      "weightkg": 88.4,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.16999999999999998,
      "changesFrom": "Tauros"
    },
    "ditto": {
      "num": 132,
      "name": "Ditto",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 48,
        "atk": 48,
        "def": 48,
        "spa": 48,
        "spd": 48,
        "spe": 48
      },
      "abilities": {
        "0": "Limber",
        "H": "Imposter"
      },
      "weightkg": 4,
      "eggGroups": [
        "DITTO"
      ],
      "otherFormes": [
        "Ditto-Base",
        "Ditto-Omnitrix"
      ],
      "formeOrder": [
        "Ditto",
        "Ditto-Base",
        "Ditto-Omnitrix"
      ],
      "heightm": 0.025
    },
    "dittoomnitrix": {
      "num": 132,
      "name": "Ditto-Omnitrix",
      "baseSpecies": "Ditto",
      "forme": "Omnitrix",
      "types": [
        "Normal",
        "Electric"
      ],
      "baseStats": {
        "hp": 48,
        "atk": 48,
        "def": 48,
        "spa": 48,
        "spd": 48,
        "spe": 48
      },
      "abilities": {
        "0": "Limber",
        "H": "Imposter"
      },
      "weightkg": 4,
      "eggGroups": [
        "DITTO"
      ],
      "heightm": 0.025,
      "changesFrom": "Ditto"
    },
    "eevee": {
      "num": 133,
      "name": "Eevee",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 55,
        "atk": 55,
        "def": 50,
        "spa": 45,
        "spd": 65,
        "spe": 55
      },
      "abilities": {
        "0": "Run Away",
        "1": "Adaptability",
        "H": "Anticipation"
      },
      "weightkg": 6.5,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Eevee-Base"
      ],
      "formeOrder": [
        "Eevee",
        "Eevee-Base"
      ],
      "heightm": 0.09,
      "evos": [
        "Sylveon",
        "Vaporeon",
        "Jolteon",
        "Flareon",
        "Espeon",
        "Umbreon",
        "Leafeon",
        "Leafeon",
        "Glaceon",
        "Glaceon",
        "Carrion",
        "Nimbeon",
        "Sandeon",
        "Scorpeon",
        "Scaleon",
        "Guardeon",
        "Brawleon",
        "Crysteon"
      ]
    },
    "eeveegmax": {
      "num": 133,
      "name": "Eevee-Gmax",
      "baseSpecies": "Eevee",
      "forme": "Gmax",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 55,
        "atk": 55,
        "def": 50,
        "spa": 45,
        "spd": 65,
        "spe": 55
      },
      "abilities": {
        "0": "Run Away",
        "1": "Adaptability",
        "H": "Anticipation"
      },
      "weightkg": 6.5,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.09
    },
    "feraligatr": {
      "num": 160,
      "name": "Feraligatr",
      "baseForme": "",
      "types": [
        "Water",
        ""
      ],
      "baseStats": {
        "hp": 85,
        "atk": 105,
        "def": 100,
        "spa": 79,
        "spd": 83,
        "spe": 78
      },
      "abilities": {
        "0": "Torrent",
        "H": "Sheer Force"
      },
      "weightkg": 88.8,
      "eggGroups": [
        "MONSTER",
        "WATER_ONE"
      ],
      "otherFormes": [
        "Feraligatr-Base",
        "Feraligatr-Omnitrix"
      ],
      "formeOrder": [
        "Feraligatr",
        "Feraligatr-Base",
        "Feraligatr-Omnitrix"
      ],
      "heightm": 0.22999999999999998,
      "prevo": "Croconaw"
    },
    "feraligatromnitrix": {
      "num": 160,
      "name": "Feraligatr-Omnitrix",
      "baseSpecies": "Feraligatr",
      "forme": "Omnitrix",
      "types": [
        "Water",
        "Fighting"
      ],
      "baseStats": {
        "hp": 85,
        "atk": 105,
        "def": 100,
        "spa": 79,
        "spd": 83,
        "spe": 78
      },
      "abilities": {
        "0": "Torrent",
        "H": "Sheer Force"
      },
      "weightkg": 88.8,
      "eggGroups": [
        "MONSTER",
        "WATER_ONE"
      ],
      "heightm": 0.22999999999999998,
      "prevo": "Croconaw",
      "changesFrom": "Feraligatr"
    },
    "furret": {
      "num": 162,
      "name": "Furret",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 85,
        "atk": 76,
        "def": 64,
        "spa": 45,
        "spd": 55,
        "spe": 90
      },
      "abilities": {
        "0": "Run Away",
        "1": "Keen Eye",
        "H": "Frisk"
      },
      "weightkg": 32.5,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Furret-Base",
        "Furret-Omnitrix"
      ],
      "formeOrder": [
        "Furret",
        "Furret-Base",
        "Furret-Omnitrix"
      ],
      "heightm": 0.12,
      "prevo": "Sentret"
    },
    "furretomnitrix": {
      "num": 162,
      "name": "Furret-Omnitrix",
      "baseSpecies": "Furret",
      "forme": "Omnitrix",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 85,
        "atk": 76,
        "def": 64,
        "spa": 45,
        "spd": 55,
        "spe": 90
      },
      "abilities": {
        "0": "Run Away",
        "1": "Keen Eye",
        "H": "Frisk"
      },
      "weightkg": 32.5,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.12,
      "prevo": "Sentret",
      "changesFrom": "Furret"
    },
    "togepi": {
      "num": 175,
      "name": "Togepi",
      "baseForme": "",
      "types": [
        "Fairy",
        ""
      ],
      "baseStats": {
        "hp": 35,
        "atk": 20,
        "def": 65,
        "spa": 40,
        "spd": 65,
        "spe": 20
      },
      "abilities": {
        "0": "Hustle",
        "1": "Serene Grace",
        "H": "Super Luck"
      },
      "weightkg": 1.5,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "otherFormes": [
        "Togepi-Base",
        "Togepi-Pesadilla"
      ],
      "formeOrder": [
        "Togepi",
        "Togepi-Base",
        "Togepi-Pesadilla"
      ],
      "heightm": 0.03,
      "evos": [
        "Togetic"
      ]
    },
    "togepipesadilla": {
      "num": 175,
      "name": "Togepi-Pesadilla",
      "baseSpecies": "Togepi",
      "forme": "Pesadilla",
      "types": [
        "Dark",
        ""
      ],
      "baseStats": {
        "hp": 35,
        "atk": 20,
        "def": 65,
        "spa": 40,
        "spd": 65,
        "spe": 20
      },
      "abilities": {
        "0": "Hustle",
        "1": "Serene Grace",
        "H": "Super Luck"
      },
      "weightkg": 1.5,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "heightm": 0.03,
      "evos": [
        "Togetic f:pesadilla"
      ],
      "changesFrom": "Togepi"
    },
    "togetic": {
      "num": 176,
      "name": "Togetic",
      "baseForme": "",
      "types": [
        "Fairy",
        "Flying"
      ],
      "baseStats": {
        "hp": 55,
        "atk": 40,
        "def": 85,
        "spa": 80,
        "spd": 105,
        "spe": 40
      },
      "abilities": {
        "0": "Hustle",
        "1": "Serene Grace",
        "H": "Super Luck"
      },
      "weightkg": 3.2,
      "eggGroups": [
        "FLYING",
        "FAIRY"
      ],
      "otherFormes": [
        "Togetic-Base",
        "Togetic-Pesadilla"
      ],
      "formeOrder": [
        "Togetic",
        "Togetic-Base",
        "Togetic-Pesadilla"
      ],
      "heightm": 0.06999999999999999,
      "prevo": "Togepi",
      "evos": [
        "Togekiss"
      ]
    },
    "togeticpesadilla": {
      "num": 176,
      "name": "Togetic-Pesadilla",
      "baseSpecies": "Togetic",
      "forme": "Pesadilla",
      "types": [
        "Dark",
        "Flying"
      ],
      "baseStats": {
        "hp": 55,
        "atk": 40,
        "def": 85,
        "spa": 80,
        "spd": 105,
        "spe": 40
      },
      "abilities": {
        "0": "Hustle",
        "1": "Serene Grace",
        "H": "Super Luck"
      },
      "weightkg": 3.2,
      "eggGroups": [
        "FLYING",
        "FAIRY"
      ],
      "heightm": 0.06999999999999999,
      "prevo": "Togepi",
      "evos": [
        "Togekiss f:pesadilla"
      ],
      "changesFrom": "Togetic"
    },
    "sunflora": {
      "num": 192,
      "name": "Sunflora",
      "baseForme": "",
      "types": [
        "Grass",
        ""
      ],
      "baseStats": {
        "hp": 75,
        "atk": 75,
        "def": 55,
        "spa": 105,
        "spd": 85,
        "spe": 30
      },
      "abilities": {
        "0": "Chlorophyll",
        "1": "Solar Power",
        "H": "Early Bird"
      },
      "weightkg": 8.5,
      "eggGroups": [
        "GRASS"
      ],
      "otherFormes": [
        "Sunflora-Base",
        "Sunflora-Teras"
      ],
      "formeOrder": [
        "Sunflora",
        "Sunflora-Base",
        "Sunflora-Teras"
      ],
      "heightm": 0.08,
      "prevo": "Sunkern"
    },
    "sunflorateras": {
      "num": 192,
      "name": "Sunflora-Teras",
      "baseSpecies": "Sunflora",
      "forme": "Teras",
      "types": [
        "Grass",
        "Fire"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 75,
        "def": 55,
        "spa": 105,
        "spd": 85,
        "spe": 30
      },
      "abilities": {
        "0": "Chlorophyll",
        "1": "Solar Power",
        "H": "Early Bird"
      },
      "weightkg": 8.5,
      "eggGroups": [
        "GRASS"
      ],
      "heightm": 0.08,
      "prevo": "Sunkern",
      "changesFrom": "Sunflora"
    },
    "murkrow": {
      "num": 198,
      "name": "Murkrow",
      "baseForme": "",
      "types": [
        "Dark",
        "Flying"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 85,
        "def": 42,
        "spa": 85,
        "spd": 42,
        "spe": 91
      },
      "abilities": {
        "0": "Insomnia",
        "1": "Super Luck",
        "H": "Prankster"
      },
      "weightkg": 2.1,
      "eggGroups": [
        "FLYING"
      ],
      "otherFormes": [
        "Murkrow-Base",
        "Murkrow-Pesadilla"
      ],
      "formeOrder": [
        "Murkrow",
        "Murkrow-Base",
        "Murkrow-Pesadilla"
      ],
      "heightm": 0.05,
      "evos": [
        "Honchkrow"
      ]
    },
    "murkrowpesadilla": {
      "num": 198,
      "name": "Murkrow-Pesadilla",
      "baseSpecies": "Murkrow",
      "forme": "Pesadilla",
      "types": [
        "Dark",
        "Poison"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 85,
        "def": 42,
        "spa": 85,
        "spd": 42,
        "spe": 91
      },
      "abilities": {
        "0": "Insomnia",
        "1": "Super Luck",
        "H": "Prankster"
      },
      "weightkg": 2.1,
      "eggGroups": [
        "FLYING"
      ],
      "heightm": 0.05,
      "evos": [
        "Honchkrow form:pesadilla"
      ],
      "changesFrom": "Murkrow"
    },
    "girafarig": {
      "num": 203,
      "name": "Girafarig",
      "baseForme": "",
      "types": [
        "Normal",
        "Psychic"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 80,
        "def": 65,
        "spa": 90,
        "spd": 65,
        "spe": 85
      },
      "abilities": {
        "0": "Inner Focus",
        "1": "Early Bird",
        "H": "Sap Sipper"
      },
      "weightkg": 41.5,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Girafarig-Base",
        "Girafarig-Teras"
      ],
      "formeOrder": [
        "Girafarig",
        "Girafarig-Base",
        "Girafarig-Teras"
      ],
      "heightm": 0.12
    },
    "girafarigteras": {
      "num": 203,
      "name": "Girafarig-Teras",
      "baseSpecies": "Girafarig",
      "forme": "Teras",
      "types": [
        "Grass",
        "Fairy"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 80,
        "def": 65,
        "spa": 90,
        "spd": 65,
        "spe": 85
      },
      "abilities": {
        "0": "Inner Focus",
        "1": "Early Bird",
        "H": "Sap Sipper"
      },
      "weightkg": 41.5,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.12,
      "changesFrom": "Girafarig"
    },
    "scizor": {
      "num": 212,
      "name": "Scizor",
      "baseForme": "",
      "types": [
        "Bug",
        "Steel"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 130,
        "def": 100,
        "spa": 55,
        "spd": 80,
        "spe": 65
      },
      "abilities": {
        "0": "Swarm",
        "1": "Technician",
        "H": "Light Metal"
      },
      "weightkg": 118,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "Scizor-Base",
        "Scizor-Teras"
      ],
      "formeOrder": [
        "Scizor",
        "Scizor-Base",
        "Scizor-Teras"
      ],
      "heightm": 0.16,
      "prevo": "Scyther"
    },
    "scizormega": {
      "num": 212,
      "name": "Scizor-Mega",
      "baseSpecies": "Scizor",
      "forme": "Mega",
      "types": [
        "Bug",
        "Steel"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 150,
        "def": 140,
        "spa": 65,
        "spd": 100,
        "spe": 75
      },
      "abilities": {
        "0": "Technician"
      },
      "weightkg": 125,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.16,
      "prevo": "Scyther"
    },
    "scizorteras": {
      "num": 212,
      "name": "Scizor-Teras",
      "baseSpecies": "Scizor",
      "forme": "Teras",
      "types": [
        "Bug",
        "Steel"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 130,
        "def": 100,
        "spa": 55,
        "spd": 80,
        "spe": 65
      },
      "abilities": {
        "0": "Swarm",
        "1": "Technician",
        "H": "Light Metal"
      },
      "weightkg": 118,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.16,
      "prevo": "Scyther",
      "changesFrom": "Scizor"
    },
    "scizorterasmega": {
      "num": 212,
      "name": "Scizor-Teras-Mega",
      "baseSpecies": "Scizor",
      "forme": "Teras-Mega",
      "types": [
        "Bug",
        "Steel"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 150,
        "def": 140,
        "spa": 65,
        "spd": 100,
        "spe": 75
      },
      "abilities": {
        "0": "Technician"
      },
      "weightkg": 125,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.16,
      "prevo": "Scyther"
    },
    "ursaring": {
      "num": 217,
      "name": "Ursaring",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 90,
        "atk": 130,
        "def": 75,
        "spa": 75,
        "spd": 75,
        "spe": 55
      },
      "abilities": {
        "0": "Guts",
        "1": "Quick Feet",
        "H": "Unnerve"
      },
      "weightkg": 125.8,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Ursaring-Base"
      ],
      "formeOrder": [
        "Ursaring",
        "Ursaring-Base"
      ],
      "heightm": 0.18,
      "prevo": "Teddiursa",
      "evos": [
        "Ursaluna"
      ]
    },
    "slugma": {
      "num": 218,
      "name": "Slugma",
      "baseForme": "",
      "types": [
        "Fire",
        ""
      ],
      "baseStats": {
        "hp": 40,
        "atk": 40,
        "def": 40,
        "spa": 70,
        "spd": 40,
        "spe": 20
      },
      "abilities": {
        "0": "Magma Armor",
        "1": "Flame Body",
        "H": "Weak Armor"
      },
      "weightkg": 35,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "otherFormes": [
        "Slugma-Base"
      ],
      "formeOrder": [
        "Slugma",
        "Slugma-Base"
      ],
      "heightm": 0.06999999999999999,
      "evos": [
        "Magcargo",
        "Sandcargo"
      ]
    },
    "houndour": {
      "num": 228,
      "name": "Houndour",
      "baseForme": "",
      "types": [
        "Dark",
        "Fire"
      ],
      "baseStats": {
        "hp": 45,
        "atk": 60,
        "def": 30,
        "spa": 80,
        "spd": 50,
        "spe": 65
      },
      "abilities": {
        "0": "Early Bird",
        "1": "Flash Fire",
        "H": "Unnerve"
      },
      "weightkg": 10.8,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Houndour-Base",
        "Houndour-RamAlbun"
      ],
      "formeOrder": [
        "Houndour",
        "Houndour-Base",
        "Houndour-RamAlbun"
      ],
      "heightm": 0.06,
      "evos": [
        "Houndoom"
      ]
    },
    "houndourramalbun": {
      "num": 228,
      "name": "Houndour-RamAlbun",
      "baseSpecies": "Houndour",
      "forme": "RamAlbun",
      "types": [
        "Dark",
        ""
      ],
      "baseStats": {
        "hp": 45,
        "atk": 60,
        "def": 30,
        "spa": 80,
        "spd": 50,
        "spe": 65
      },
      "abilities": {
        "0": "Early Bird",
        "1": "Flash Fire",
        "H": "Unnerve"
      },
      "weightkg": 10.8,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.06,
      "evos": [
        "Houndoom f:ramalbun"
      ],
      "changesFrom": "Houndour"
    },
    "houndoom": {
      "num": 229,
      "name": "Houndoom",
      "baseForme": "",
      "types": [
        "Dark",
        "Fire"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 90,
        "def": 50,
        "spa": 110,
        "spd": 80,
        "spe": 95
      },
      "abilities": {
        "0": "Early Bird",
        "1": "Flash Fire",
        "H": "Unnerve"
      },
      "weightkg": 35,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Houndoom-Base",
        "Houndoom-RamAlbun",
        "Houndoom-Ramalbunmega"
      ],
      "formeOrder": [
        "Houndoom",
        "Houndoom-Base",
        "Houndoom-RamAlbun",
        "Houndoom-Ramalbunmega"
      ],
      "heightm": 0.12,
      "prevo": "Houndour"
    },
    "houndoommega": {
      "num": 229,
      "name": "Houndoom-Mega",
      "baseSpecies": "Houndoom",
      "forme": "Mega",
      "types": [
        "Dark",
        "Fire"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 90,
        "def": 90,
        "spa": 140,
        "spd": 90,
        "spe": 115
      },
      "abilities": {
        "0": "Solar Power"
      },
      "weightkg": 109.1,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.12,
      "prevo": "Houndour"
    },
    "houndoomramalbun": {
      "num": 229,
      "name": "Houndoom-RamAlbun",
      "baseSpecies": "Houndoom",
      "forme": "RamAlbun",
      "types": [
        "Dark",
        ""
      ],
      "baseStats": {
        "hp": 75,
        "atk": 90,
        "def": 50,
        "spa": 110,
        "spd": 80,
        "spe": 95
      },
      "abilities": {
        "0": "Early Bird",
        "1": "Flash Fire",
        "H": "Unnerve"
      },
      "weightkg": 35,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.12,
      "prevo": "Houndour",
      "changesFrom": "Houndoom"
    },
    "houndoomramalbunmega": {
      "num": 229,
      "name": "Houndoom-Ramalbunmega",
      "baseSpecies": "Houndoom",
      "forme": "Ramalbunmega",
      "types": [
        "Dark",
        "Fire"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 90,
        "def": 90,
        "spa": 140,
        "spd": 90,
        "spe": 115
      },
      "abilities": {
        "0": "Solar Power"
      },
      "weightkg": 109.1,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.12,
      "prevo": "Houndour",
      "changesFrom": "Houndoom"
    },
    "larvitar": {
      "num": 246,
      "name": "Larvitar",
      "baseForme": "",
      "types": [
        "Rock",
        "Ground"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 64,
        "def": 50,
        "spa": 45,
        "spd": 50,
        "spe": 41
      },
      "abilities": {
        "0": "Guts",
        "H": "Sand Veil"
      },
      "weightkg": 72,
      "eggGroups": [
        "MONSTER"
      ],
      "otherFormes": [
        "Larvitar-Base",
        "Larvitar-Volcanic"
      ],
      "formeOrder": [
        "Larvitar",
        "Larvitar-Base",
        "Larvitar-Volcanic"
      ],
      "heightm": 0.065,
      "evos": [
        "Pupitar"
      ]
    },
    "larvitarvolcanic": {
      "num": 246,
      "name": "Larvitar-Volcanic",
      "baseSpecies": "Larvitar",
      "forme": "Volcanic",
      "types": [
        "Rock",
        "Fire"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 64,
        "def": 50,
        "spa": 45,
        "spd": 50,
        "spe": 41
      },
      "abilities": {
        "0": "Guts",
        "H": "Sand Veil"
      },
      "weightkg": 72,
      "eggGroups": [
        "MONSTER"
      ],
      "heightm": 0.065,
      "evos": [
        "Pupitar f:volcanic"
      ],
      "changesFrom": "Larvitar"
    },
    "pupitar": {
      "num": 247,
      "name": "Pupitar",
      "baseForme": "",
      "types": [
        "Rock",
        "Ground"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 84,
        "def": 70,
        "spa": 65,
        "spd": 70,
        "spe": 51
      },
      "abilities": {
        "0": "Shed Skin"
      },
      "weightkg": 152,
      "eggGroups": [
        "MONSTER"
      ],
      "otherFormes": [
        "Pupitar-Base",
        "Pupitar-Volcanic"
      ],
      "formeOrder": [
        "Pupitar",
        "Pupitar-Base",
        "Pupitar-Volcanic"
      ],
      "heightm": 0.12,
      "prevo": "Larvitar",
      "evos": [
        "Tyranitar"
      ]
    },
    "pupitarvolcanic": {
      "num": 247,
      "name": "Pupitar-Volcanic",
      "baseSpecies": "Pupitar",
      "forme": "Volcanic",
      "types": [
        "Rock",
        "Fire"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 84,
        "def": 70,
        "spa": 65,
        "spd": 70,
        "spe": 51
      },
      "abilities": {
        "0": "Shed Skin"
      },
      "weightkg": 152,
      "eggGroups": [
        "MONSTER"
      ],
      "heightm": 0.12,
      "prevo": "Larvitar",
      "evos": [
        "Tyranitar f:volcanic"
      ],
      "changesFrom": "Pupitar"
    },
    "tyranitar": {
      "num": 248,
      "name": "Tyranitar",
      "baseForme": "",
      "types": [
        "Rock",
        "Dark"
      ],
      "baseStats": {
        "hp": 100,
        "atk": 134,
        "def": 110,
        "spa": 95,
        "spd": 100,
        "spe": 61
      },
      "abilities": {
        "0": "Sand Stream",
        "H": "Unnerve"
      },
      "weightkg": 255,
      "eggGroups": [
        "MONSTER"
      ],
      "otherFormes": [
        "Tyranitar-Base",
        "Tyranitar-Volcanic"
      ],
      "formeOrder": [
        "Tyranitar",
        "Tyranitar-Base",
        "Tyranitar-Volcanic"
      ],
      "heightm": 0.2,
      "prevo": "Pupitar"
    },
    "tyranitarmega": {
      "num": 248,
      "name": "Tyranitar-Mega",
      "baseSpecies": "Tyranitar",
      "forme": "Mega",
      "types": [
        "Rock",
        "Dark"
      ],
      "baseStats": {
        "hp": 100,
        "atk": 164,
        "def": 150,
        "spa": 95,
        "spd": 120,
        "spe": 71
      },
      "abilities": {
        "0": "Sand Stream"
      },
      "weightkg": 255,
      "eggGroups": [
        "MONSTER"
      ],
      "heightm": 0.25,
      "prevo": "Pupitar"
    },
    "tyranitarvolcanic": {
      "num": 248,
      "name": "Tyranitar-Volcanic",
      "baseSpecies": "Tyranitar",
      "forme": "Volcanic",
      "types": [
        "Rock",
        "Dark"
      ],
      "baseStats": {
        "hp": 100,
        "atk": 134,
        "def": 110,
        "spa": 95,
        "spd": 100,
        "spe": 61
      },
      "abilities": {
        "0": "Sand Stream",
        "H": "Unnerve"
      },
      "weightkg": 255,
      "eggGroups": [
        "MONSTER"
      ],
      "heightm": 0.2,
      "prevo": "Pupitar",
      "changesFrom": "Tyranitar"
    },
    "sceptile": {
      "num": 254,
      "name": "Sceptile",
      "baseForme": "",
      "types": [
        "Grass",
        ""
      ],
      "baseStats": {
        "hp": 70,
        "atk": 85,
        "def": 65,
        "spa": 105,
        "spd": 85,
        "spe": 120
      },
      "abilities": {
        "0": "Overgrow",
        "H": "Unburden"
      },
      "weightkg": 52.2,
      "eggGroups": [
        "MONSTER",
        "DRAGON"
      ],
      "otherFormes": [
        "Sceptile-Base",
        "Sceptile-Omnitrix"
      ],
      "formeOrder": [
        "Sceptile",
        "Sceptile-Base",
        "Sceptile-Omnitrix"
      ],
      "heightm": 0.16999999999999998,
      "prevo": "Grovyle"
    },
    "sceptileomnitrix": {
      "num": 254,
      "name": "Sceptile-Omnitrix",
      "baseSpecies": "Sceptile",
      "forme": "Omnitrix",
      "types": [
        "Dragon",
        "Electric"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 85,
        "def": 65,
        "spa": 105,
        "spd": 85,
        "spe": 120
      },
      "abilities": {
        "0": "Overgrow",
        "H": "Unburden"
      },
      "weightkg": 52.2,
      "eggGroups": [
        "MONSTER",
        "DRAGON"
      ],
      "heightm": 0.16999999999999998,
      "prevo": "Grovyle",
      "changesFrom": "Sceptile"
    },
    "sceptilemega": {
      "num": 254,
      "name": "Sceptile-Mega",
      "baseSpecies": "Sceptile",
      "forme": "Mega",
      "types": [
        "Grass",
        "Dragon"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 110,
        "def": 75,
        "spa": 145,
        "spd": 85,
        "spe": 145
      },
      "abilities": {
        "0": "Lightning Rod"
      },
      "weightkg": 55.2,
      "eggGroups": [
        "MONSTER",
        "DRAGON"
      ],
      "heightm": 0.25,
      "prevo": "Grovyle"
    },
    "ralts": {
      "num": 280,
      "name": "Ralts",
      "baseForme": "",
      "types": [
        "Psychic",
        "Fairy"
      ],
      "baseStats": {
        "hp": 28,
        "atk": 25,
        "def": 25,
        "spa": 45,
        "spd": 35,
        "spe": 40
      },
      "abilities": {
        "0": "Synchronize",
        "1": "Trace",
        "H": "Telepathy"
      },
      "weightkg": 6.6,
      "eggGroups": [
        "AMORPHOUS",
        "HUMAN_LIKE"
      ],
      "otherFormes": [
        "Ralts-Base",
        "Ralts-Teras"
      ],
      "formeOrder": [
        "Ralts",
        "Ralts-Base",
        "Ralts-Teras"
      ],
      "heightm": 0.04,
      "evos": [
        "Kirlia"
      ]
    },
    "raltsteras": {
      "num": 280,
      "name": "Ralts-Teras",
      "baseSpecies": "Ralts",
      "forme": "Teras",
      "types": [
        "Ghost",
        "Fairy"
      ],
      "baseStats": {
        "hp": 28,
        "atk": 25,
        "def": 25,
        "spa": 45,
        "spd": 35,
        "spe": 40
      },
      "abilities": {
        "0": "Synchronize",
        "1": "Trace",
        "H": "Telepathy"
      },
      "weightkg": 6.6,
      "eggGroups": [
        "AMORPHOUS",
        "HUMAN_LIKE"
      ],
      "heightm": 0.04,
      "evos": [
        "Kirlia"
      ],
      "changesFrom": "Ralts"
    },
    "kirlia": {
      "num": 281,
      "name": "Kirlia",
      "baseForme": "",
      "types": [
        "Psychic",
        "Fairy"
      ],
      "baseStats": {
        "hp": 38,
        "atk": 35,
        "def": 35,
        "spa": 65,
        "spd": 55,
        "spe": 50
      },
      "abilities": {
        "0": "Synchronize",
        "1": "Trace",
        "H": "Telepathy"
      },
      "weightkg": 20.2,
      "eggGroups": [
        "AMORPHOUS",
        "HUMAN_LIKE"
      ],
      "otherFormes": [
        "Kirlia-Base",
        "Kirlia-Teras"
      ],
      "formeOrder": [
        "Kirlia",
        "Kirlia-Base",
        "Kirlia-Teras"
      ],
      "heightm": 0.08,
      "prevo": "Ralts",
      "evos": [
        "Gardevoir",
        "Gallade"
      ]
    },
    "kirliateras": {
      "num": 281,
      "name": "Kirlia-Teras",
      "baseSpecies": "Kirlia",
      "forme": "Teras",
      "types": [
        "Ghost",
        "Fairy"
      ],
      "baseStats": {
        "hp": 38,
        "atk": 35,
        "def": 35,
        "spa": 65,
        "spd": 55,
        "spe": 50
      },
      "abilities": {
        "0": "Synchronize",
        "1": "Trace",
        "H": "Telepathy"
      },
      "weightkg": 20.2,
      "eggGroups": [
        "AMORPHOUS",
        "HUMAN_LIKE"
      ],
      "heightm": 0.08,
      "prevo": "Ralts",
      "evos": [
        "Gardevoir",
        "Gallade"
      ],
      "changesFrom": "Kirlia"
    },
    "gardevoir": {
      "num": 282,
      "name": "Gardevoir",
      "baseForme": "",
      "types": [
        "Psychic",
        "Fairy"
      ],
      "baseStats": {
        "hp": 68,
        "atk": 65,
        "def": 65,
        "spa": 125,
        "spd": 115,
        "spe": 80
      },
      "abilities": {
        "0": "Synchronize",
        "1": "Trace",
        "H": "Telepathy"
      },
      "weightkg": 48.4,
      "eggGroups": [
        "AMORPHOUS",
        "HUMAN_LIKE"
      ],
      "otherFormes": [
        "Gardevoir-Base",
        "Gardevoir-Teras"
      ],
      "formeOrder": [
        "Gardevoir",
        "Gardevoir-Base",
        "Gardevoir-Teras"
      ],
      "heightm": 0.15,
      "prevo": "Kirlia"
    },
    "gardevoirteras": {
      "num": 282,
      "name": "Gardevoir-Teras",
      "baseSpecies": "Gardevoir",
      "forme": "Teras",
      "types": [
        "Ghost",
        "Fairy"
      ],
      "baseStats": {
        "hp": 68,
        "atk": 65,
        "def": 65,
        "spa": 125,
        "spd": 115,
        "spe": 80
      },
      "abilities": {
        "0": "Synchronize",
        "1": "Trace",
        "H": "Telepathy"
      },
      "weightkg": 48.4,
      "eggGroups": [
        "AMORPHOUS",
        "HUMAN_LIKE"
      ],
      "heightm": 0.15,
      "prevo": "Kirlia",
      "changesFrom": "Gardevoir"
    },
    "gardevoirmega": {
      "num": 282,
      "name": "Gardevoir-Mega",
      "baseSpecies": "Gardevoir",
      "forme": "Mega",
      "types": [
        "Psychic",
        "Fairy"
      ],
      "baseStats": {
        "hp": 68,
        "atk": 85,
        "def": 65,
        "spa": 165,
        "spd": 135,
        "spe": 100
      },
      "abilities": {
        "0": "Pixilate"
      },
      "weightkg": 48.4,
      "eggGroups": [
        "AMORPHOUS",
        "HUMAN_LIKE"
      ],
      "heightm": 0.15,
      "prevo": "Kirlia"
    },
    "gardevoirterasmega": {
      "num": 282,
      "name": "Gardevoir-Teras-Mega",
      "baseSpecies": "Gardevoir",
      "forme": "Teras-Mega",
      "types": [
        "Psychic",
        "Fairy"
      ],
      "baseStats": {
        "hp": 68,
        "atk": 85,
        "def": 65,
        "spa": 165,
        "spd": 135,
        "spe": 100
      },
      "abilities": {
        "0": "Pixilate"
      },
      "weightkg": 48.4,
      "eggGroups": [
        "AMORPHOUS",
        "HUMAN_LIKE"
      ],
      "heightm": 0.15,
      "prevo": "Kirlia"
    },
    "ninjask": {
      "num": 291,
      "name": "Ninjask",
      "baseForme": "",
      "types": [
        "Bug",
        "Flying"
      ],
      "baseStats": {
        "hp": 61,
        "atk": 90,
        "def": 45,
        "spa": 50,
        "spd": 50,
        "spe": 160
      },
      "abilities": {
        "0": "Speed Boost",
        "H": "Infiltrator"
      },
      "weightkg": 12,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "Ninjask-Base"
      ],
      "formeOrder": [
        "Ninjask",
        "Ninjask-Base"
      ],
      "heightm": 0.1,
      "prevo": "Nincada"
    },
    "exploud": {
      "num": 295,
      "name": "Exploud",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 104,
        "atk": 91,
        "def": 63,
        "spa": 91,
        "spd": 73,
        "spe": 68
      },
      "abilities": {
        "0": "Soundproof",
        "H": "Scrappy"
      },
      "weightkg": 84,
      "eggGroups": [
        "MONSTER",
        "FIELD"
      ],
      "otherFormes": [
        "Exploud-Base",
        "Exploud-Omnitrix"
      ],
      "formeOrder": [
        "Exploud",
        "Exploud-Base",
        "Exploud-Omnitrix"
      ],
      "heightm": 0.15,
      "prevo": "Loudred"
    },
    "exploudomnitrix": {
      "num": 295,
      "name": "Exploud-Omnitrix",
      "baseSpecies": "Exploud",
      "forme": "Omnitrix",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 104,
        "atk": 91,
        "def": 63,
        "spa": 91,
        "spd": 73,
        "spe": 68
      },
      "abilities": {
        "0": "Soundproof",
        "H": "Scrappy"
      },
      "weightkg": 84,
      "eggGroups": [
        "MONSTER",
        "FIELD"
      ],
      "heightm": 0.15,
      "prevo": "Loudred",
      "changesFrom": "Exploud"
    },
    "makuhita": {
      "num": 296,
      "name": "Makuhita",
      "baseForme": "",
      "types": [
        "Fighting",
        ""
      ],
      "baseStats": {
        "hp": 72,
        "atk": 60,
        "def": 30,
        "spa": 20,
        "spd": 30,
        "spe": 25
      },
      "abilities": {
        "0": "Thick Fat",
        "1": "Guts",
        "H": "Sheer Force"
      },
      "weightkg": 86.4,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "otherFormes": [
        "Makuhita-Base",
        "Makuhita-Volcanic"
      ],
      "formeOrder": [
        "Makuhita",
        "Makuhita-Base",
        "Makuhita-Volcanic"
      ],
      "heightm": 0.1,
      "evos": [
        "Hariyama"
      ]
    },
    "makuhitavolcanic": {
      "num": 296,
      "name": "Makuhita-Volcanic",
      "baseSpecies": "Makuhita",
      "forme": "Volcanic",
      "types": [
        "Fighting",
        "Rock"
      ],
      "baseStats": {
        "hp": 72,
        "atk": 60,
        "def": 30,
        "spa": 20,
        "spd": 30,
        "spe": 25
      },
      "abilities": {
        "0": "Thick Fat",
        "1": "Guts",
        "H": "Sheer Force"
      },
      "weightkg": 86.4,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "heightm": 0.1,
      "evos": [
        "Hariyama form:volcanic"
      ],
      "changesFrom": "Makuhita"
    },
    "hariyama": {
      "num": 297,
      "name": "Hariyama",
      "baseForme": "",
      "types": [
        "Fighting",
        ""
      ],
      "baseStats": {
        "hp": 144,
        "atk": 120,
        "def": 60,
        "spa": 40,
        "spd": 60,
        "spe": 50
      },
      "abilities": {
        "0": "Thick Fat",
        "1": "Guts",
        "H": "Sheer Force"
      },
      "weightkg": 253.8,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "otherFormes": [
        "Hariyama-Base",
        "Hariyama-Volcanic"
      ],
      "formeOrder": [
        "Hariyama",
        "Hariyama-Base",
        "Hariyama-Volcanic"
      ],
      "heightm": 0.22999999999999998,
      "prevo": "Makuhita"
    },
    "hariyamavolcanic": {
      "num": 297,
      "name": "Hariyama-Volcanic",
      "baseSpecies": "Hariyama",
      "forme": "Volcanic",
      "types": [
        "Fighting",
        "Rock"
      ],
      "baseStats": {
        "hp": 144,
        "atk": 120,
        "def": 60,
        "spa": 40,
        "spd": 60,
        "spe": 50
      },
      "abilities": {
        "0": "Thick Fat",
        "1": "Guts",
        "H": "Sheer Force"
      },
      "weightkg": 253.8,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "heightm": 0.22999999999999998,
      "prevo": "Makuhita",
      "changesFrom": "Hariyama"
    },
    "sableye": {
      "num": 302,
      "name": "Sableye",
      "baseForme": "",
      "types": [
        "Dark",
        "Ghost"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 75,
        "def": 75,
        "spa": 65,
        "spd": 65,
        "spe": 50
      },
      "abilities": {
        "0": "Keen Eye",
        "1": "Stall",
        "H": "Prankster"
      },
      "weightkg": 11,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "otherFormes": [
        "Sableye-Base",
        "Sableye-Omnitrix",
        "Sableye-Omnitrixmega"
      ],
      "formeOrder": [
        "Sableye",
        "Sableye-Base",
        "Sableye-Omnitrix",
        "Sableye-Omnitrixmega"
      ],
      "heightm": 0.08499999999999999
    },
    "sableyeomnitrix": {
      "num": 302,
      "name": "Sableye-Omnitrix",
      "baseSpecies": "Sableye",
      "forme": "Omnitrix",
      "types": [
        "Normal",
        "Fairy"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 75,
        "def": 75,
        "spa": 65,
        "spd": 65,
        "spe": 50
      },
      "abilities": {
        "0": "Keen Eye",
        "1": "Stall",
        "H": "Prankster"
      },
      "weightkg": 11,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "heightm": 0.08499999999999999,
      "changesFrom": "Sableye"
    },
    "sableyemega": {
      "num": 302,
      "name": "Sableye-Mega",
      "baseSpecies": "Sableye",
      "forme": "Mega",
      "types": [
        "Dark",
        "Ghost"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 85,
        "def": 125,
        "spa": 85,
        "spd": 115,
        "spe": 20
      },
      "abilities": {
        "0": "Magic Bounce"
      },
      "weightkg": 161,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "heightm": 0.12
    },
    "sableyeomnitrixmega": {
      "num": 302,
      "name": "Sableye-Omnitrixmega",
      "baseSpecies": "Sableye",
      "forme": "Omnitrixmega",
      "types": [
        "Dark",
        "Ghost"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 85,
        "def": 125,
        "spa": 85,
        "spd": 115,
        "spe": 20
      },
      "abilities": {
        "0": "Magic Bounce"
      },
      "weightkg": 161,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "heightm": 0.12,
      "changesFrom": "Sableye"
    },
    "electrike": {
      "num": 309,
      "name": "Electrike",
      "baseForme": "",
      "types": [
        "Electric",
        ""
      ],
      "baseStats": {
        "hp": 40,
        "atk": 45,
        "def": 40,
        "spa": 65,
        "spd": 40,
        "spe": 65
      },
      "abilities": {
        "0": "Static",
        "1": "Lightning Rod",
        "H": "Minus"
      },
      "weightkg": 15.2,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Electrike-Base",
        "Electrike-RamAlbun"
      ],
      "formeOrder": [
        "Electrike",
        "Electrike-Base",
        "Electrike-RamAlbun"
      ],
      "heightm": 0.06,
      "evos": [
        "Manectric"
      ]
    },
    "electrikeramalbun": {
      "num": 309,
      "name": "Electrike-RamAlbun",
      "baseSpecies": "Electrike",
      "forme": "RamAlbun",
      "types": [
        "Electric",
        "Ground"
      ],
      "baseStats": {
        "hp": 40,
        "atk": 45,
        "def": 40,
        "spa": 65,
        "spd": 40,
        "spe": 65
      },
      "abilities": {
        "0": "Static",
        "1": "Lightning Rod",
        "H": "Minus"
      },
      "weightkg": 15.2,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.06,
      "evos": [
        "Manectric f:ramalbun"
      ],
      "changesFrom": "Electrike"
    },
    "manectric": {
      "num": 310,
      "name": "Manectric",
      "baseForme": "",
      "types": [
        "Electric",
        ""
      ],
      "baseStats": {
        "hp": 70,
        "atk": 75,
        "def": 60,
        "spa": 105,
        "spd": 60,
        "spe": 105
      },
      "abilities": {
        "0": "Static",
        "1": "Lightning Rod",
        "H": "Minus"
      },
      "weightkg": 40.2,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Manectric-Base",
        "Manectric-RamAlbun",
        "Manectric-Ramalbunmega"
      ],
      "formeOrder": [
        "Manectric",
        "Manectric-Base",
        "Manectric-RamAlbun",
        "Manectric-Ramalbunmega"
      ],
      "heightm": 0.15,
      "prevo": "Electrike"
    },
    "manectricmega": {
      "num": 310,
      "name": "Manectric-Mega",
      "baseSpecies": "Manectric",
      "forme": "Mega",
      "types": [
        "Electric",
        ""
      ],
      "baseStats": {
        "hp": 70,
        "atk": 75,
        "def": 80,
        "spa": 135,
        "spd": 80,
        "spe": 135
      },
      "abilities": {
        "0": "Intimidate"
      },
      "weightkg": 44,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.18,
      "prevo": "Electrike"
    },
    "manectricramalbun": {
      "num": 310,
      "name": "Manectric-RamAlbun",
      "baseSpecies": "Manectric",
      "forme": "RamAlbun",
      "types": [
        "Electric",
        "Ground"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 75,
        "def": 60,
        "spa": 105,
        "spd": 60,
        "spe": 105
      },
      "abilities": {
        "0": "Static",
        "1": "Lightning Rod",
        "H": "Minus"
      },
      "weightkg": 40.2,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.15,
      "prevo": "Electrike",
      "changesFrom": "Manectric"
    },
    "manectricramalbunmega": {
      "num": 310,
      "name": "Manectric-Ramalbunmega",
      "baseSpecies": "Manectric",
      "forme": "Ramalbunmega",
      "types": [
        "Electric",
        ""
      ],
      "baseStats": {
        "hp": 70,
        "atk": 75,
        "def": 80,
        "spa": 135,
        "spd": 80,
        "spe": 135
      },
      "abilities": {
        "0": "Intimidate"
      },
      "weightkg": 44,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.18,
      "prevo": "Electrike",
      "changesFrom": "Manectric"
    },
    "feebas": {
      "num": 349,
      "name": "Feebas",
      "baseForme": "",
      "types": [
        "Water",
        ""
      ],
      "baseStats": {
        "hp": 20,
        "atk": 15,
        "def": 20,
        "spa": 10,
        "spd": 55,
        "spe": 80
      },
      "abilities": {
        "0": "Swift Swim",
        "1": "Oblivious",
        "H": "Adaptability"
      },
      "weightkg": 7.4,
      "eggGroups": [
        "WATER_ONE",
        "DRAGON"
      ],
      "otherFormes": [
        "Feebas-Base",
        "Feebas-Astral"
      ],
      "formeOrder": [
        "Feebas",
        "Feebas-Base",
        "Feebas-Astral"
      ],
      "heightm": 0.045,
      "evos": [
        "Milotic",
        "Milotic"
      ]
    },
    "feebasastral": {
      "num": 349,
      "name": "Feebas-Astral",
      "baseSpecies": "Feebas",
      "forme": "Astral",
      "types": [
        "Water",
        "Psychic"
      ],
      "baseStats": {
        "hp": 20,
        "atk": 15,
        "def": 20,
        "spa": 10,
        "spd": 55,
        "spe": 80
      },
      "abilities": {
        "0": "Swift Swim",
        "1": "Oblivious",
        "H": "Adaptability"
      },
      "weightkg": 7.4,
      "eggGroups": [
        "WATER_ONE",
        "DRAGON"
      ],
      "heightm": 0.045,
      "evos": [
        "Milotic form:astral",
        "Milotic"
      ],
      "changesFrom": "Feebas"
    },
    "milotic": {
      "num": 350,
      "name": "Milotic",
      "baseForme": "",
      "types": [
        "Water",
        ""
      ],
      "baseStats": {
        "hp": 95,
        "atk": 60,
        "def": 79,
        "spa": 100,
        "spd": 125,
        "spe": 81
      },
      "abilities": {
        "0": "Marvel Scale",
        "1": "Competitive",
        "H": "Cute Charm"
      },
      "weightkg": 162,
      "eggGroups": [
        "WATER_ONE",
        "DRAGON"
      ],
      "otherFormes": [
        "Milotic-Base",
        "Milotic-Astral"
      ],
      "formeOrder": [
        "Milotic",
        "Milotic-Base",
        "Milotic-Astral"
      ],
      "heightm": 0.2,
      "prevo": "Feebas"
    },
    "miloticastral": {
      "num": 350,
      "name": "Milotic-Astral",
      "baseSpecies": "Milotic",
      "forme": "Astral",
      "types": [
        "Water",
        "Psychic"
      ],
      "baseStats": {
        "hp": 95,
        "atk": 60,
        "def": 79,
        "spa": 100,
        "spd": 125,
        "spe": 81
      },
      "abilities": {
        "0": "Marvel Scale",
        "1": "Competitive",
        "H": "Cute Charm"
      },
      "weightkg": 162,
      "eggGroups": [
        "WATER_ONE",
        "DRAGON"
      ],
      "heightm": 0.2,
      "prevo": "Feebas",
      "changesFrom": "Milotic"
    },
    "chimecho": {
      "num": 358,
      "name": "Chimecho",
      "baseForme": "",
      "types": [
        "Psychic",
        ""
      ],
      "baseStats": {
        "hp": 75,
        "atk": 50,
        "def": 80,
        "spa": 95,
        "spd": 90,
        "spe": 65
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 1,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "otherFormes": [
        "Chimecho-Base",
        "Chimecho-Pesadilla"
      ],
      "formeOrder": [
        "Chimecho",
        "Chimecho-Base",
        "Chimecho-Pesadilla"
      ],
      "heightm": 0.06,
      "prevo": "Chingling"
    },
    "chimechopesadilla": {
      "num": 358,
      "name": "Chimecho-Pesadilla",
      "baseSpecies": "Chimecho",
      "forme": "Pesadilla",
      "types": [
        "Psychic",
        "Ghost"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 50,
        "def": 80,
        "spa": 95,
        "spd": 90,
        "spe": 65
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 1,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.06,
      "prevo": "Chingling",
      "changesFrom": "Chimecho"
    },
    "beldum": {
      "num": 374,
      "name": "Beldum",
      "baseForme": "",
      "types": [
        "Steel",
        "Psychic"
      ],
      "baseStats": {
        "hp": 40,
        "atk": 55,
        "def": 80,
        "spa": 35,
        "spd": 60,
        "spe": 30
      },
      "abilities": {
        "0": "Clear Body",
        "H": "Light Metal"
      },
      "weightkg": 95.2,
      "eggGroups": [
        "MINERAL"
      ],
      "otherFormes": [
        "Beldum-Base",
        "Beldum-RamAlbun"
      ],
      "formeOrder": [
        "Beldum",
        "Beldum-Base",
        "Beldum-RamAlbun"
      ],
      "heightm": 0.05,
      "evos": [
        "Metang"
      ]
    },
    "beldumramalbun": {
      "num": 374,
      "name": "Beldum-RamAlbun",
      "baseSpecies": "Beldum",
      "forme": "RamAlbun",
      "types": [
        "Ground",
        "Psychic"
      ],
      "baseStats": {
        "hp": 40,
        "atk": 55,
        "def": 80,
        "spa": 35,
        "spd": 60,
        "spe": 30
      },
      "abilities": {
        "0": "Clear Body",
        "H": "Light Metal"
      },
      "weightkg": 95.2,
      "eggGroups": [
        "MINERAL"
      ],
      "heightm": 0.05,
      "evos": [
        "Metang f:ramalbun"
      ],
      "changesFrom": "Beldum"
    },
    "metang": {
      "num": 375,
      "name": "Metang",
      "baseForme": "",
      "types": [
        "Steel",
        "Psychic"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 75,
        "def": 100,
        "spa": 55,
        "spd": 80,
        "spe": 50
      },
      "abilities": {
        "0": "Clear Body",
        "H": "Light Metal"
      },
      "weightkg": 202.5,
      "eggGroups": [
        "MINERAL"
      ],
      "otherFormes": [
        "Metang-Base",
        "Metang-RamAlbun"
      ],
      "formeOrder": [
        "Metang",
        "Metang-Base",
        "Metang-RamAlbun"
      ],
      "heightm": 0.1,
      "prevo": "Beldum",
      "evos": [
        "Metagross"
      ]
    },
    "metangramalbun": {
      "num": 375,
      "name": "Metang-RamAlbun",
      "baseSpecies": "Metang",
      "forme": "RamAlbun",
      "types": [
        "Ground",
        "Psychic"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 75,
        "def": 100,
        "spa": 55,
        "spd": 80,
        "spe": 50
      },
      "abilities": {
        "0": "Clear Body",
        "H": "Light Metal"
      },
      "weightkg": 202.5,
      "eggGroups": [
        "MINERAL"
      ],
      "heightm": 0.1,
      "prevo": "Beldum",
      "evos": [
        "Metagross f:ramalbun"
      ],
      "changesFrom": "Metang"
    },
    "metagross": {
      "num": 376,
      "name": "Metagross",
      "baseForme": "",
      "types": [
        "Steel",
        "Psychic"
      ],
      "baseStats": {
        "hp": 80,
        "atk": 135,
        "def": 130,
        "spa": 95,
        "spd": 90,
        "spe": 70
      },
      "abilities": {
        "0": "Clear Body",
        "H": "Light Metal"
      },
      "weightkg": 550,
      "eggGroups": [
        "MINERAL"
      ],
      "otherFormes": [
        "Metagross-Base",
        "Metagross-RamAlbun",
        "Metagross-Ramalbunmega"
      ],
      "formeOrder": [
        "Metagross",
        "Metagross-Base",
        "Metagross-RamAlbun",
        "Metagross-Ramalbunmega"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Metang"
    },
    "metagrossmega": {
      "num": 376,
      "name": "Metagross-Mega",
      "baseSpecies": "Metagross",
      "forme": "Mega",
      "types": [
        "Steel",
        "Psychic"
      ],
      "baseStats": {
        "hp": 80,
        "atk": 145,
        "def": 150,
        "spa": 105,
        "spd": 110,
        "spe": 110
      },
      "abilities": {
        "0": "Tough Claws"
      },
      "weightkg": 942.9,
      "eggGroups": [
        "MINERAL"
      ],
      "heightm": 0.18,
      "prevo": "Metang"
    },
    "metagrossramalbun": {
      "num": 376,
      "name": "Metagross-RamAlbun",
      "baseSpecies": "Metagross",
      "forme": "RamAlbun",
      "types": [
        "Ground",
        "Psychic"
      ],
      "baseStats": {
        "hp": 80,
        "atk": 135,
        "def": 130,
        "spa": 95,
        "spd": 90,
        "spe": 70
      },
      "abilities": {
        "0": "Clear Body",
        "H": "Light Metal"
      },
      "weightkg": 550,
      "eggGroups": [
        "MINERAL"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Metang",
      "changesFrom": "Metagross"
    },
    "metagrossramalbunmega": {
      "num": 376,
      "name": "Metagross-Ramalbunmega",
      "baseSpecies": "Metagross",
      "forme": "Ramalbunmega",
      "types": [
        "Steel",
        "Psychic"
      ],
      "baseStats": {
        "hp": 80,
        "atk": 145,
        "def": 150,
        "spa": 105,
        "spd": 110,
        "spe": 110
      },
      "abilities": {
        "0": "Tough Claws"
      },
      "weightkg": 942.9,
      "eggGroups": [
        "MINERAL"
      ],
      "heightm": 0.18,
      "prevo": "Metang",
      "changesFrom": "Metagross"
    },
    "combee": {
      "num": 415,
      "name": "Combee",
      "baseForme": "",
      "types": [
        "Bug",
        "Flying"
      ],
      "baseStats": {
        "hp": 30,
        "atk": 30,
        "def": 42,
        "spa": 30,
        "spd": 42,
        "spe": 70
      },
      "abilities": {
        "0": "Honey Gather",
        "H": "Hustle"
      },
      "weightkg": 5.5,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "Combee-Base"
      ],
      "formeOrder": [
        "Combee",
        "Combee-Base"
      ],
      "heightm": 0.04,
      "evos": [
        "Vespiquen",
        "Vespiteer"
      ]
    },
    "buneary": {
      "num": 427,
      "name": "Buneary",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 55,
        "atk": 66,
        "def": 44,
        "spa": 44,
        "spd": 56,
        "spe": 85
      },
      "abilities": {
        "0": "Run Away",
        "1": "Klutz",
        "H": "Limber"
      },
      "weightkg": 5.5,
      "eggGroups": [
        "FIELD",
        "HUMAN_LIKE"
      ],
      "otherFormes": [
        "Buneary-Base",
        "Buneary-Teras"
      ],
      "formeOrder": [
        "Buneary",
        "Buneary-Base",
        "Buneary-Teras"
      ],
      "heightm": 0.06,
      "evos": [
        "Lopunny"
      ]
    },
    "bunearyteras": {
      "num": 427,
      "name": "Buneary-Teras",
      "baseSpecies": "Buneary",
      "forme": "Teras",
      "types": [
        "Normal",
        "Ghost"
      ],
      "baseStats": {
        "hp": 55,
        "atk": 66,
        "def": 44,
        "spa": 44,
        "spd": 56,
        "spe": 85
      },
      "abilities": {
        "0": "Run Away",
        "1": "Klutz",
        "H": "Limber"
      },
      "weightkg": 5.5,
      "eggGroups": [
        "FIELD",
        "HUMAN_LIKE"
      ],
      "heightm": 0.06,
      "evos": [
        "Lopunny f:teras"
      ],
      "changesFrom": "Buneary"
    },
    "lopunny": {
      "num": 428,
      "name": "Lopunny",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 65,
        "atk": 76,
        "def": 84,
        "spa": 54,
        "spd": 96,
        "spe": 105
      },
      "abilities": {
        "0": "Cute Charm",
        "1": "Klutz",
        "H": "Limber"
      },
      "weightkg": 33.3,
      "eggGroups": [
        "FIELD",
        "HUMAN_LIKE"
      ],
      "otherFormes": [
        "Lopunny-Base",
        "Lopunny-Teras"
      ],
      "formeOrder": [
        "Lopunny",
        "Lopunny-Base",
        "Lopunny-Teras"
      ],
      "heightm": 0.12,
      "prevo": "Buneary"
    },
    "lopunnymega": {
      "num": 428,
      "name": "Lopunny-Mega",
      "baseSpecies": "Lopunny",
      "forme": "Mega",
      "types": [
        "Normal",
        "Fighting"
      ],
      "baseStats": {
        "hp": 65,
        "atk": 136,
        "def": 94,
        "spa": 54,
        "spd": 96,
        "spe": 135
      },
      "abilities": {
        "0": "Scrappy"
      },
      "weightkg": 28.3,
      "eggGroups": [
        "FIELD",
        "HUMAN_LIKE"
      ],
      "heightm": 0.16,
      "prevo": "Buneary"
    },
    "lopunnyteras": {
      "num": 428,
      "name": "Lopunny-Teras",
      "baseSpecies": "Lopunny",
      "forme": "Teras",
      "types": [
        "Normal",
        "Ghost"
      ],
      "baseStats": {
        "hp": 65,
        "atk": 76,
        "def": 84,
        "spa": 54,
        "spd": 96,
        "spe": 105
      },
      "abilities": {
        "0": "Cute Charm",
        "1": "Klutz",
        "H": "Limber"
      },
      "weightkg": 33.3,
      "eggGroups": [
        "FIELD",
        "HUMAN_LIKE"
      ],
      "heightm": 0.12,
      "prevo": "Buneary",
      "changesFrom": "Lopunny"
    },
    "lopunnyterasmega": {
      "num": 428,
      "name": "Lopunny-Teras-Mega",
      "baseSpecies": "Lopunny",
      "forme": "Teras-Mega",
      "types": [
        "Ghost",
        "Fighting"
      ],
      "baseStats": {
        "hp": 65,
        "atk": 136,
        "def": 94,
        "spa": 54,
        "spd": 96,
        "spe": 135
      },
      "abilities": {
        "0": "Scrappy"
      },
      "weightkg": 28.3,
      "eggGroups": [
        "FIELD",
        "HUMAN_LIKE"
      ],
      "heightm": 0.16,
      "prevo": "Buneary"
    },
    "honchkrow": {
      "num": 430,
      "name": "Honchkrow",
      "baseForme": "",
      "types": [
        "Dark",
        "Flying"
      ],
      "baseStats": {
        "hp": 100,
        "atk": 125,
        "def": 52,
        "spa": 105,
        "spd": 52,
        "spe": 71
      },
      "abilities": {
        "0": "Insomnia",
        "1": "Super Luck",
        "H": "Moxie"
      },
      "weightkg": 27.3,
      "eggGroups": [
        "FLYING"
      ],
      "otherFormes": [
        "Honchkrow-Base",
        "Honchkrow-Pesadilla"
      ],
      "formeOrder": [
        "Honchkrow",
        "Honchkrow-Base",
        "Honchkrow-Pesadilla"
      ],
      "heightm": 0.09,
      "prevo": "Murkrow"
    },
    "honchkrowpesadilla": {
      "num": 430,
      "name": "Honchkrow-Pesadilla",
      "baseSpecies": "Honchkrow",
      "forme": "Pesadilla",
      "types": [
        "Dark",
        "Poison"
      ],
      "baseStats": {
        "hp": 100,
        "atk": 125,
        "def": 52,
        "spa": 105,
        "spd": 52,
        "spe": 71
      },
      "abilities": {
        "0": "Insomnia",
        "1": "Super Luck",
        "H": "Moxie"
      },
      "weightkg": 27.3,
      "eggGroups": [
        "FLYING"
      ],
      "heightm": 0.09,
      "prevo": "Murkrow",
      "changesFrom": "Honchkrow"
    },
    "glameow": {
      "num": 431,
      "name": "Glameow",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 49,
        "atk": 55,
        "def": 42,
        "spa": 42,
        "spd": 37,
        "spe": 85
      },
      "abilities": {
        "0": "Limber",
        "1": "Own Tempo",
        "H": "Keen Eye"
      },
      "weightkg": 3.9,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Glameow-Base"
      ],
      "formeOrder": [
        "Glameow",
        "Glameow-Base"
      ],
      "heightm": 0.08,
      "evos": [
        "Purugly"
      ]
    },
    "purugly": {
      "num": 432,
      "name": "Purugly",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 71,
        "atk": 82,
        "def": 64,
        "spa": 64,
        "spd": 59,
        "spe": 112
      },
      "abilities": {
        "0": "Thick Fat",
        "1": "Own Tempo",
        "H": "Defiant"
      },
      "weightkg": 43.8,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Purugly-Base",
        "Purugly-Teras"
      ],
      "formeOrder": [
        "Purugly",
        "Purugly-Base",
        "Purugly-Teras"
      ],
      "heightm": 0.13,
      "prevo": "Glameow"
    },
    "puruglyteras": {
      "num": 432,
      "name": "Purugly-Teras",
      "baseSpecies": "Purugly",
      "forme": "Teras",
      "types": [
        "Normal",
        "Steel"
      ],
      "baseStats": {
        "hp": 71,
        "atk": 82,
        "def": 64,
        "spa": 64,
        "spd": 59,
        "spe": 112
      },
      "abilities": {
        "0": "Thick Fat",
        "1": "Own Tempo",
        "H": "Defiant"
      },
      "weightkg": 43.8,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.13,
      "prevo": "Glameow",
      "changesFrom": "Purugly"
    },
    "spiritomb": {
      "num": 442,
      "name": "Spiritomb",
      "baseForme": "",
      "types": [
        "Ghost",
        "Dark"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 92,
        "def": 108,
        "spa": 92,
        "spd": 108,
        "spe": 35
      },
      "abilities": {
        "0": "Pressure",
        "H": "Infiltrator"
      },
      "weightkg": 108,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "otherFormes": [
        "Spiritomb-Base",
        "Spiritomb-Astral"
      ],
      "formeOrder": [
        "Spiritomb",
        "Spiritomb-Base",
        "Spiritomb-Astral"
      ],
      "heightm": 0.11000000000000001
    },
    "spiritombastral": {
      "num": 442,
      "name": "Spiritomb-Astral",
      "baseSpecies": "Spiritomb",
      "forme": "Astral",
      "types": [
        "Ghost",
        "Psychic"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 92,
        "def": 108,
        "spa": 92,
        "spd": 108,
        "spe": 35
      },
      "abilities": {
        "0": "Pressure",
        "H": "Infiltrator"
      },
      "weightkg": 108,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.11000000000000001,
      "changesFrom": "Spiritomb"
    },
    "riolu": {
      "num": 447,
      "name": "Riolu",
      "baseForme": "",
      "types": [
        "Fighting",
        ""
      ],
      "baseStats": {
        "hp": 40,
        "atk": 70,
        "def": 40,
        "spa": 35,
        "spd": 40,
        "spe": 60
      },
      "abilities": {
        "0": "Steadfast",
        "1": "Inner Focus",
        "H": "Prankster"
      },
      "weightkg": 20.2,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "otherFormes": [
        "Riolu-Base"
      ],
      "formeOrder": [
        "Riolu",
        "Riolu-Base"
      ],
      "heightm": 0.09,
      "evos": [
        "Lucario",
        "Lucario form:teras"
      ]
    },
    "lucario": {
      "num": 448,
      "name": "Lucario",
      "baseForme": "",
      "types": [
        "Fighting",
        "Steel"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 110,
        "def": 70,
        "spa": 115,
        "spd": 70,
        "spe": 90
      },
      "abilities": {
        "0": "Steadfast",
        "1": "Inner Focus",
        "H": "Justified"
      },
      "weightkg": 54,
      "eggGroups": [
        "FIELD",
        "HUMAN_LIKE"
      ],
      "otherFormes": [
        "Lucario-Base",
        "Lucario-Teras"
      ],
      "formeOrder": [
        "Lucario",
        "Lucario-Base",
        "Lucario-Teras"
      ],
      "heightm": 0.13,
      "prevo": "Riolu"
    },
    "lucariomega": {
      "num": 448,
      "name": "Lucario-Mega",
      "baseSpecies": "Lucario",
      "forme": "Mega",
      "types": [
        "Fighting",
        "Steel"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 145,
        "def": 88,
        "spa": 140,
        "spd": 70,
        "spe": 112
      },
      "abilities": {
        "0": "Adaptability"
      },
      "weightkg": 57.5,
      "eggGroups": [
        "FIELD",
        "HUMAN_LIKE"
      ],
      "heightm": 0.13,
      "prevo": "Riolu"
    },
    "lucarioteras": {
      "num": 448,
      "name": "Lucario-Teras",
      "baseSpecies": "Lucario",
      "forme": "Teras",
      "types": [
        "Fighting",
        "Steel"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 110,
        "def": 70,
        "spa": 115,
        "spd": 70,
        "spe": 90
      },
      "abilities": {
        "0": "Steadfast",
        "1": "Inner Focus",
        "H": "Justified"
      },
      "weightkg": 54,
      "eggGroups": [
        "FIELD",
        "HUMAN_LIKE"
      ],
      "heightm": 0.13,
      "prevo": "Riolu",
      "changesFrom": "Lucario"
    },
    "lucarioterasmega": {
      "num": 448,
      "name": "Lucario-Teras-Mega",
      "baseSpecies": "Lucario",
      "forme": "Teras-Mega",
      "types": [
        "Fighting",
        "Steel"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 145,
        "def": 88,
        "spa": 140,
        "spd": 70,
        "spe": 112
      },
      "abilities": {
        "0": "Adaptability"
      },
      "weightkg": 57.5,
      "eggGroups": [
        "FIELD",
        "HUMAN_LIKE"
      ],
      "heightm": 0.13,
      "prevo": "Riolu"
    },
    "carnivine": {
      "num": 455,
      "name": "Carnivine",
      "baseForme": "",
      "types": [
        "Grass",
        ""
      ],
      "baseStats": {
        "hp": 74,
        "atk": 100,
        "def": 72,
        "spa": 90,
        "spd": 72,
        "spe": 46
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 27,
      "eggGroups": [
        "GRASS"
      ],
      "otherFormes": [
        "Carnivine-Base",
        "Carnivine-Teras"
      ],
      "formeOrder": [
        "Carnivine",
        "Carnivine-Base",
        "Carnivine-Teras"
      ],
      "heightm": 0.13
    },
    "carnivineteras": {
      "num": 455,
      "name": "Carnivine-Teras",
      "baseSpecies": "Carnivine",
      "forme": "Teras",
      "types": [
        "Grass",
        ""
      ],
      "baseStats": {
        "hp": 74,
        "atk": 100,
        "def": 72,
        "spa": 90,
        "spd": 72,
        "spe": 46
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 27,
      "eggGroups": [
        "GRASS"
      ],
      "heightm": 0.13,
      "changesFrom": "Carnivine"
    },
    "togekiss": {
      "num": 468,
      "name": "Togekiss",
      "baseForme": "",
      "types": [
        "Fairy",
        "Flying"
      ],
      "baseStats": {
        "hp": 85,
        "atk": 50,
        "def": 95,
        "spa": 120,
        "spd": 115,
        "spe": 80
      },
      "abilities": {
        "0": "Hustle",
        "1": "Serene Grace",
        "H": "Super Luck"
      },
      "weightkg": 38,
      "eggGroups": [
        "FLYING",
        "FAIRY"
      ],
      "otherFormes": [
        "Togekiss-Base",
        "Togekiss-Pesadilla"
      ],
      "formeOrder": [
        "Togekiss",
        "Togekiss-Base",
        "Togekiss-Pesadilla"
      ],
      "heightm": 0.13999999999999999,
      "prevo": "Togetic"
    },
    "togekisspesadilla": {
      "num": 468,
      "name": "Togekiss-Pesadilla",
      "baseSpecies": "Togekiss",
      "forme": "Pesadilla",
      "types": [
        "Dark",
        "Flying"
      ],
      "baseStats": {
        "hp": 85,
        "atk": 50,
        "def": 95,
        "spa": 120,
        "spd": 115,
        "spe": 80
      },
      "abilities": {
        "0": "Hustle",
        "1": "Serene Grace",
        "H": "Super Luck"
      },
      "weightkg": 38,
      "eggGroups": [
        "FLYING",
        "FAIRY"
      ],
      "heightm": 0.13999999999999999,
      "prevo": "Togetic",
      "changesFrom": "Togekiss"
    },
    "gliscor": {
      "num": 472,
      "name": "Gliscor",
      "baseForme": "",
      "types": [
        "Ground",
        "Flying"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 95,
        "def": 125,
        "spa": 45,
        "spd": 75,
        "spe": 95
      },
      "abilities": {
        "0": "Hyper Cutter",
        "1": "Sand Veil",
        "H": "Poison Heal"
      },
      "weightkg": 42.5,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "Gliscor-Base",
        "Gliscor-Teras"
      ],
      "formeOrder": [
        "Gliscor",
        "Gliscor-Base",
        "Gliscor-Teras"
      ],
      "heightm": 0.2,
      "prevo": "Gligar"
    },
    "gliscorteras": {
      "num": 472,
      "name": "Gliscor-Teras",
      "baseSpecies": "Gliscor",
      "forme": "Teras",
      "types": [
        "Ground",
        "Flying"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 95,
        "def": 125,
        "spa": 45,
        "spd": 75,
        "spe": 95
      },
      "abilities": {
        "0": "Hyper Cutter",
        "1": "Sand Veil",
        "H": "Poison Heal"
      },
      "weightkg": 42.5,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.2,
      "prevo": "Gligar",
      "changesFrom": "Gliscor"
    },
    "gallade": {
      "num": 475,
      "name": "Gallade",
      "baseForme": "",
      "types": [
        "Psychic",
        "Fighting"
      ],
      "baseStats": {
        "hp": 68,
        "atk": 125,
        "def": 65,
        "spa": 65,
        "spd": 115,
        "spe": 80
      },
      "abilities": {
        "0": "Steadfast",
        "1": "Sharpness",
        "H": "Justified"
      },
      "weightkg": 52,
      "eggGroups": [
        "AMORPHOUS",
        "HUMAN_LIKE"
      ],
      "otherFormes": [
        "Gallade-Base",
        "Gallade-Teras"
      ],
      "formeOrder": [
        "Gallade",
        "Gallade-Base",
        "Gallade-Teras"
      ],
      "heightm": 0.16,
      "prevo": "Kirlia"
    },
    "galladeteras": {
      "num": 475,
      "name": "Gallade-Teras",
      "baseSpecies": "Gallade",
      "forme": "Teras",
      "types": [
        "Ghost",
        "Fighting"
      ],
      "baseStats": {
        "hp": 68,
        "atk": 125,
        "def": 65,
        "spa": 65,
        "spd": 115,
        "spe": 80
      },
      "abilities": {
        "0": "Steadfast",
        "1": "Sharpness",
        "H": "Justified"
      },
      "weightkg": 52,
      "eggGroups": [
        "AMORPHOUS",
        "HUMAN_LIKE"
      ],
      "heightm": 0.16,
      "prevo": "Kirlia",
      "changesFrom": "Gallade"
    },
    "gallademega": {
      "num": 475,
      "name": "Gallade-Mega",
      "baseSpecies": "Gallade",
      "forme": "Mega",
      "types": [
        "Psychic",
        "Fighting"
      ],
      "baseStats": {
        "hp": 68,
        "atk": 165,
        "def": 95,
        "spa": 65,
        "spd": 115,
        "spe": 110
      },
      "abilities": {
        "0": "Inner Focus"
      },
      "weightkg": 56.4,
      "eggGroups": [
        "AMORPHOUS",
        "HUMAN_LIKE"
      ],
      "heightm": 0.16,
      "prevo": "Kirlia"
    },
    "galladeterasmega": {
      "num": 475,
      "name": "Gallade-Teras-Mega",
      "baseSpecies": "Gallade",
      "forme": "Teras-Mega",
      "types": [
        "Psychic",
        "Fighting"
      ],
      "baseStats": {
        "hp": 68,
        "atk": 165,
        "def": 95,
        "spa": 65,
        "spd": 115,
        "spe": 110
      },
      "abilities": {
        "0": "Inner Focus"
      },
      "weightkg": 56.4,
      "eggGroups": [
        "AMORPHOUS",
        "HUMAN_LIKE"
      ],
      "heightm": 0.16,
      "prevo": "Kirlia"
    },
    "rotom": {
      "num": 479,
      "name": "Rotom",
      "baseForme": "",
      "types": [
        "Electric",
        "Ghost"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 50,
        "def": 77,
        "spa": 95,
        "spd": 77,
        "spe": 91
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 0.3,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "otherFormes": [
        "Rotom-Base",
        "Rotom-Heat",
        "Rotom-Wash",
        "Rotom-Frost",
        "Rotom-Fan",
        "Rotom-Mow",
        "Rotom-Astral",
        "Rotom-Astralheat",
        "Rotom-Astralwash",
        "Rotom-Astralfrost",
        "Rotom-Astralfan",
        "Rotom-Astralmow"
      ],
      "formeOrder": [
        "Rotom",
        "Rotom-Base",
        "Rotom-Heat",
        "Rotom-Wash",
        "Rotom-Frost",
        "Rotom-Fan",
        "Rotom-Mow",
        "Rotom-Astral",
        "Rotom-Astralheat",
        "Rotom-Astralwash",
        "Rotom-Astralfrost",
        "Rotom-Astralfan",
        "Rotom-Astralmow"
      ],
      "heightm": 0.05
    },
    "rotomheat": {
      "num": 479,
      "name": "Rotom-Heat",
      "baseSpecies": "Rotom",
      "forme": "Heat",
      "types": [
        "Electric",
        "Fire"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 65,
        "def": 107,
        "spa": 105,
        "spd": 107,
        "spe": 86
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 0.3,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.05,
      "changesFrom": "Rotom"
    },
    "rotomwash": {
      "num": 479,
      "name": "Rotom-Wash",
      "baseSpecies": "Rotom",
      "forme": "Wash",
      "types": [
        "Electric",
        "Water"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 65,
        "def": 107,
        "spa": 105,
        "spd": 107,
        "spe": 86
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 0.3,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.05,
      "changesFrom": "Rotom"
    },
    "rotomfrost": {
      "num": 479,
      "name": "Rotom-Frost",
      "baseSpecies": "Rotom",
      "forme": "Frost",
      "types": [
        "Electric",
        "Ice"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 65,
        "def": 107,
        "spa": 105,
        "spd": 107,
        "spe": 86
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 0.3,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.05,
      "changesFrom": "Rotom"
    },
    "rotomfan": {
      "num": 479,
      "name": "Rotom-Fan",
      "baseSpecies": "Rotom",
      "forme": "Fan",
      "types": [
        "Electric",
        "Flying"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 65,
        "def": 107,
        "spa": 105,
        "spd": 107,
        "spe": 86
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 0.3,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.05,
      "changesFrom": "Rotom"
    },
    "rotommow": {
      "num": 479,
      "name": "Rotom-Mow",
      "baseSpecies": "Rotom",
      "forme": "Mow",
      "types": [
        "Electric",
        "Grass"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 65,
        "def": 107,
        "spa": 105,
        "spd": 107,
        "spe": 86
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 0.3,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.05,
      "changesFrom": "Rotom"
    },
    "rotomastral": {
      "num": 479,
      "name": "Rotom-Astral",
      "baseSpecies": "Rotom",
      "forme": "Astral",
      "types": [
        "Psychic",
        "Ghost"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 50,
        "def": 77,
        "spa": 95,
        "spd": 77,
        "spe": 91
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 0.3,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.05,
      "changesFrom": "Rotom"
    },
    "rotomastralheat": {
      "num": 479,
      "name": "Rotom-Astralheat",
      "baseSpecies": "Rotom",
      "forme": "Astralheat",
      "types": [
        "Psychic",
        "Fire"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 65,
        "def": 107,
        "spa": 105,
        "spd": 107,
        "spe": 86
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 0.3,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.05,
      "changesFrom": "Rotom"
    },
    "rotomastralwash": {
      "num": 479,
      "name": "Rotom-Astralwash",
      "baseSpecies": "Rotom",
      "forme": "Astralwash",
      "types": [
        "Psychic",
        "Water"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 65,
        "def": 107,
        "spa": 105,
        "spd": 107,
        "spe": 86
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 0.3,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.05,
      "changesFrom": "Rotom"
    },
    "rotomastralfrost": {
      "num": 479,
      "name": "Rotom-Astralfrost",
      "baseSpecies": "Rotom",
      "forme": "Astralfrost",
      "types": [
        "Psychic",
        "Ice"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 65,
        "def": 107,
        "spa": 105,
        "spd": 107,
        "spe": 86
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 0.3,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.05,
      "changesFrom": "Rotom"
    },
    "rotomastralfan": {
      "num": 479,
      "name": "Rotom-Astralfan",
      "baseSpecies": "Rotom",
      "forme": "Astralfan",
      "types": [
        "Psychic",
        "Flying"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 65,
        "def": 107,
        "spa": 105,
        "spd": 107,
        "spe": 86
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 0.3,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.05,
      "changesFrom": "Rotom"
    },
    "rotomastralmow": {
      "num": 479,
      "name": "Rotom-Astralmow",
      "baseSpecies": "Rotom",
      "forme": "Astralmow",
      "types": [
        "Electric",
        "Grass"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 65,
        "def": 107,
        "spa": 105,
        "spd": 107,
        "spe": 86
      },
      "abilities": {
        "0": "Levitate"
      },
      "weightkg": 0.3,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.05,
      "changesFrom": "Rotom"
    },
    "patrat": {
      "num": 504,
      "name": "Patrat",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 45,
        "atk": 55,
        "def": 39,
        "spa": 35,
        "spd": 39,
        "spe": 42
      },
      "abilities": {
        "0": "Run Away",
        "1": "Keen Eye",
        "H": "Analytic"
      },
      "weightkg": 11.6,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Patrat-Base"
      ],
      "formeOrder": [
        "Patrat",
        "Patrat-Base"
      ],
      "heightm": 0.06,
      "evos": [
        "Watchog"
      ]
    },
    "watchog": {
      "num": 505,
      "name": "Watchog",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 60,
        "atk": 85,
        "def": 69,
        "spa": 60,
        "spd": 69,
        "spe": 77
      },
      "abilities": {
        "0": "Illuminate",
        "1": "Keen Eye",
        "H": "Analytic"
      },
      "weightkg": 27,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Watchog-Base"
      ],
      "formeOrder": [
        "Watchog",
        "Watchog-Base"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Patrat"
    },
    "purrloin": {
      "num": 509,
      "name": "Purrloin",
      "baseForme": "",
      "types": [
        "Dark",
        ""
      ],
      "baseStats": {
        "hp": 41,
        "atk": 50,
        "def": 37,
        "spa": 50,
        "spd": 37,
        "spe": 66
      },
      "abilities": {
        "0": "Limber",
        "1": "Unburden",
        "H": "Prankster"
      },
      "weightkg": 10.1,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Purrloin-Base",
        "Purrloin-RamAlbun"
      ],
      "formeOrder": [
        "Purrloin",
        "Purrloin-Base",
        "Purrloin-RamAlbun"
      ],
      "heightm": 0.1,
      "evos": [
        "Liepard"
      ]
    },
    "purrloinramalbun": {
      "num": 509,
      "name": "Purrloin-RamAlbun",
      "baseSpecies": "Purrloin",
      "forme": "RamAlbun",
      "types": [
        "Psychic",
        ""
      ],
      "baseStats": {
        "hp": 41,
        "atk": 50,
        "def": 37,
        "spa": 50,
        "spd": 37,
        "spe": 66
      },
      "abilities": {
        "0": "Limber",
        "1": "Unburden",
        "H": "Prankster"
      },
      "weightkg": 10.1,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.1,
      "evos": [
        "Liepard"
      ],
      "changesFrom": "Purrloin"
    },
    "liepard": {
      "num": 510,
      "name": "Liepard",
      "baseForme": "",
      "types": [
        "Dark",
        ""
      ],
      "baseStats": {
        "hp": 64,
        "atk": 88,
        "def": 50,
        "spa": 88,
        "spd": 50,
        "spe": 106
      },
      "abilities": {
        "0": "Limber",
        "1": "Unburden",
        "H": "Prankster"
      },
      "weightkg": 37.5,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Liepard-Base",
        "Liepard-RamAlbun"
      ],
      "formeOrder": [
        "Liepard",
        "Liepard-Base",
        "Liepard-RamAlbun"
      ],
      "heightm": 0.12,
      "prevo": "Purrloin"
    },
    "liepardramalbun": {
      "num": 510,
      "name": "Liepard-RamAlbun",
      "baseSpecies": "Liepard",
      "forme": "RamAlbun",
      "types": [
        "Psychic",
        ""
      ],
      "baseStats": {
        "hp": 64,
        "atk": 88,
        "def": 50,
        "spa": 88,
        "spd": 50,
        "spe": 106
      },
      "abilities": {
        "0": "Limber",
        "1": "Unburden",
        "H": "Prankster"
      },
      "weightkg": 37.5,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.12,
      "prevo": "Purrloin",
      "changesFrom": "Liepard"
    },
    "carracosta": {
      "num": 565,
      "name": "Carracosta",
      "baseForme": "",
      "types": [
        "Water",
        "Rock"
      ],
      "baseStats": {
        "hp": 74,
        "atk": 108,
        "def": 133,
        "spa": 83,
        "spd": 65,
        "spe": 32
      },
      "abilities": {
        "0": "Solid Rock",
        "1": "Sturdy",
        "H": "Swift Swim"
      },
      "weightkg": 81,
      "eggGroups": [
        "WATER_ONE",
        "WATER_THREE"
      ],
      "otherFormes": [
        "Carracosta-Base",
        "Carracosta-Omnitrix"
      ],
      "formeOrder": [
        "Carracosta",
        "Carracosta-Base",
        "Carracosta-Omnitrix"
      ],
      "heightm": 0.12,
      "prevo": "Tirtouga"
    },
    "carracostaomnitrix": {
      "num": 565,
      "name": "Carracosta-Omnitrix",
      "baseSpecies": "Carracosta",
      "forme": "Omnitrix",
      "types": [
        "Water",
        "Flying"
      ],
      "baseStats": {
        "hp": 74,
        "atk": 108,
        "def": 133,
        "spa": 83,
        "spd": 65,
        "spe": 32
      },
      "abilities": {
        "0": "Solid Rock",
        "1": "Sturdy",
        "H": "Swift Swim"
      },
      "weightkg": 81,
      "eggGroups": [
        "WATER_ONE",
        "WATER_THREE"
      ],
      "heightm": 0.12,
      "prevo": "Tirtouga",
      "changesFrom": "Carracosta"
    },
    "solosis": {
      "num": 577,
      "name": "Solosis",
      "baseForme": "",
      "types": [
        "Psychic",
        ""
      ],
      "baseStats": {
        "hp": 45,
        "atk": 30,
        "def": 40,
        "spa": 105,
        "spd": 50,
        "spe": 20
      },
      "abilities": {
        "0": "Overcoat",
        "1": "Magic Guard",
        "H": "Regenerator"
      },
      "weightkg": 1,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "otherFormes": [
        "Solosis-Base",
        "Solosis-Teras"
      ],
      "formeOrder": [
        "Solosis",
        "Solosis-Base",
        "Solosis-Teras"
      ],
      "heightm": 0.06,
      "evos": [
        "Duosion"
      ]
    },
    "solosisteras": {
      "num": 577,
      "name": "Solosis-Teras",
      "baseSpecies": "Solosis",
      "forme": "Teras",
      "types": [
        "Poison",
        ""
      ],
      "baseStats": {
        "hp": 45,
        "atk": 30,
        "def": 40,
        "spa": 105,
        "spd": 50,
        "spe": 20
      },
      "abilities": {
        "0": "Overcoat",
        "1": "Magic Guard",
        "H": "Regenerator"
      },
      "weightkg": 1,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.06,
      "evos": [
        "Duosion form:teras"
      ],
      "changesFrom": "Solosis"
    },
    "duosion": {
      "num": 578,
      "name": "Duosion",
      "baseForme": "",
      "types": [
        "Psychic",
        ""
      ],
      "baseStats": {
        "hp": 65,
        "atk": 40,
        "def": 50,
        "spa": 125,
        "spd": 60,
        "spe": 30
      },
      "abilities": {
        "0": "Overcoat",
        "1": "Magic Guard",
        "H": "Regenerator"
      },
      "weightkg": 8,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "otherFormes": [
        "Duosion-Base",
        "Duosion-Teras"
      ],
      "formeOrder": [
        "Duosion",
        "Duosion-Base",
        "Duosion-Teras"
      ],
      "heightm": 0.06999999999999999,
      "prevo": "Solosis",
      "evos": [
        "Reuniclus"
      ]
    },
    "duosionteras": {
      "num": 578,
      "name": "Duosion-Teras",
      "baseSpecies": "Duosion",
      "forme": "Teras",
      "types": [
        "Poison",
        ""
      ],
      "baseStats": {
        "hp": 65,
        "atk": 40,
        "def": 50,
        "spa": 125,
        "spd": 60,
        "spe": 30
      },
      "abilities": {
        "0": "Overcoat",
        "1": "Magic Guard",
        "H": "Regenerator"
      },
      "weightkg": 8,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.06999999999999999,
      "prevo": "Solosis",
      "evos": [
        "Reuniclus form:teras"
      ],
      "changesFrom": "Duosion"
    },
    "reuniclus": {
      "num": 579,
      "name": "Reuniclus",
      "baseForme": "",
      "types": [
        "Psychic",
        ""
      ],
      "baseStats": {
        "hp": 110,
        "atk": 65,
        "def": 75,
        "spa": 125,
        "spd": 85,
        "spe": 30
      },
      "abilities": {
        "0": "Overcoat",
        "1": "Magic Guard",
        "H": "Regenerator"
      },
      "weightkg": 20.1,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "otherFormes": [
        "Reuniclus-Base",
        "Reuniclus-Teras"
      ],
      "formeOrder": [
        "Reuniclus",
        "Reuniclus-Base",
        "Reuniclus-Teras"
      ],
      "heightm": 0.09,
      "prevo": "Duosion"
    },
    "reuniclusteras": {
      "num": 579,
      "name": "Reuniclus-Teras",
      "baseSpecies": "Reuniclus",
      "forme": "Teras",
      "types": [
        "Poison",
        ""
      ],
      "baseStats": {
        "hp": 110,
        "atk": 65,
        "def": 75,
        "spa": 125,
        "spd": 85,
        "spe": 30
      },
      "abilities": {
        "0": "Overcoat",
        "1": "Magic Guard",
        "H": "Regenerator"
      },
      "weightkg": 20.1,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.09,
      "prevo": "Duosion",
      "changesFrom": "Reuniclus"
    },
    "joltik": {
      "num": 595,
      "name": "Joltik",
      "baseForme": "",
      "types": [
        "Bug",
        "Electric"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 47,
        "def": 50,
        "spa": 57,
        "spd": 50,
        "spe": 65
      },
      "abilities": {
        "0": "Compound Eyes",
        "1": "Unnerve",
        "H": "Swarm"
      },
      "weightkg": 0.6,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "Joltik-Base",
        "Joltik-Sakura"
      ],
      "formeOrder": [
        "Joltik",
        "Joltik-Base",
        "Joltik-Sakura"
      ],
      "heightm": 0.02,
      "evos": [
        "Galvantula"
      ]
    },
    "joltiksakura": {
      "num": 595,
      "name": "Joltik-Sakura",
      "baseSpecies": "Joltik",
      "forme": "Sakura",
      "types": [
        "Bug",
        "Fairy"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 47,
        "def": 50,
        "spa": 57,
        "spd": 50,
        "spe": 65
      },
      "abilities": {
        "0": "Compound Eyes",
        "1": "Unnerve",
        "H": "Swarm"
      },
      "weightkg": 0.6,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.02,
      "evos": [
        "Galvantula f:sakura"
      ],
      "changesFrom": "Joltik"
    },
    "galvantula": {
      "num": 596,
      "name": "Galvantula",
      "baseForme": "",
      "types": [
        "Bug",
        "Electric"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 77,
        "def": 60,
        "spa": 97,
        "spd": 60,
        "spe": 108
      },
      "abilities": {
        "0": "Compound Eyes",
        "1": "Unnerve",
        "H": "Swarm"
      },
      "weightkg": 14.3,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "Galvantula-Base",
        "Galvantula-Sakura"
      ],
      "formeOrder": [
        "Galvantula",
        "Galvantula-Base",
        "Galvantula-Sakura"
      ],
      "heightm": 0.08,
      "prevo": "Joltik"
    },
    "galvantulasakura": {
      "num": 596,
      "name": "Galvantula-Sakura",
      "baseSpecies": "Galvantula",
      "forme": "Sakura",
      "types": [
        "Bug",
        "Fairy"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 77,
        "def": 60,
        "spa": 97,
        "spd": 60,
        "spe": 108
      },
      "abilities": {
        "0": "Compound Eyes",
        "1": "Unnerve",
        "H": "Swarm"
      },
      "weightkg": 14.3,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.08,
      "prevo": "Joltik",
      "changesFrom": "Galvantula"
    },
    "litwick": {
      "num": 607,
      "name": "Litwick",
      "baseForme": "",
      "types": [
        "Ghost",
        "Fire"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 30,
        "def": 55,
        "spa": 65,
        "spd": 55,
        "spe": 20
      },
      "abilities": {
        "0": "Flash Fire",
        "1": "Flame Body",
        "H": "Infiltrator"
      },
      "weightkg": 3.1,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "otherFormes": [
        "Litwick-Base",
        "Litwick-Teras"
      ],
      "formeOrder": [
        "Litwick",
        "Litwick-Base",
        "Litwick-Teras"
      ],
      "heightm": 0.05,
      "evos": [
        "Lampent"
      ]
    },
    "litwickteras": {
      "num": 607,
      "name": "Litwick-Teras",
      "baseSpecies": "Litwick",
      "forme": "Teras",
      "types": [
        "Psychic",
        "Fire"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 30,
        "def": 55,
        "spa": 65,
        "spd": 55,
        "spe": 20
      },
      "abilities": {
        "0": "Flash Fire",
        "1": "Flame Body",
        "H": "Infiltrator"
      },
      "weightkg": 3.1,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.05,
      "evos": [
        "Lampent form:teras"
      ],
      "changesFrom": "Litwick"
    },
    "lampent": {
      "num": 608,
      "name": "Lampent",
      "baseForme": "",
      "types": [
        "Ghost",
        "Fire"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 40,
        "def": 60,
        "spa": 95,
        "spd": 60,
        "spe": 55
      },
      "abilities": {
        "0": "Flash Fire",
        "1": "Flame Body",
        "H": "Infiltrator"
      },
      "weightkg": 13,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "otherFormes": [
        "Lampent-Base",
        "Lampent-Teras"
      ],
      "formeOrder": [
        "Lampent",
        "Lampent-Base",
        "Lampent-Teras"
      ],
      "heightm": 0.16,
      "prevo": "Litwick",
      "evos": [
        "Chandelure"
      ]
    },
    "lampentteras": {
      "num": 608,
      "name": "Lampent-Teras",
      "baseSpecies": "Lampent",
      "forme": "Teras",
      "types": [
        "Psychic",
        "Fire"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 40,
        "def": 60,
        "spa": 95,
        "spd": 60,
        "spe": 55
      },
      "abilities": {
        "0": "Flash Fire",
        "1": "Flame Body",
        "H": "Infiltrator"
      },
      "weightkg": 13,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.16,
      "prevo": "Litwick",
      "evos": [
        "Chandelure form:teras"
      ],
      "changesFrom": "Lampent"
    },
    "chandelure": {
      "num": 609,
      "name": "Chandelure",
      "baseForme": "",
      "types": [
        "Ghost",
        "Fire"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 55,
        "def": 90,
        "spa": 145,
        "spd": 90,
        "spe": 80
      },
      "abilities": {
        "0": "Flash Fire",
        "1": "Flame Body",
        "H": "Infiltrator"
      },
      "weightkg": 34.3,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "otherFormes": [
        "Chandelure-Base",
        "Chandelure-Teras"
      ],
      "formeOrder": [
        "Chandelure",
        "Chandelure-Base",
        "Chandelure-Teras"
      ],
      "heightm": 0.16,
      "prevo": "Lampent"
    },
    "chandelureteras": {
      "num": 609,
      "name": "Chandelure-Teras",
      "baseSpecies": "Chandelure",
      "forme": "Teras",
      "types": [
        "Psychic",
        "Fire"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 55,
        "def": 90,
        "spa": 145,
        "spd": 90,
        "spe": 80
      },
      "abilities": {
        "0": "Flash Fire",
        "1": "Flame Body",
        "H": "Infiltrator"
      },
      "weightkg": 34.3,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "heightm": 0.16,
      "prevo": "Lampent",
      "changesFrom": "Chandelure"
    },
    "larvesta": {
      "num": 636,
      "name": "Larvesta",
      "baseForme": "",
      "types": [
        "Bug",
        "Fire"
      ],
      "baseStats": {
        "hp": 55,
        "atk": 85,
        "def": 55,
        "spa": 50,
        "spd": 55,
        "spe": 60
      },
      "abilities": {
        "0": "Flame Body",
        "H": "Swarm"
      },
      "weightkg": 28.8,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "Larvesta-Base",
        "Larvesta-RamAlbun"
      ],
      "formeOrder": [
        "Larvesta",
        "Larvesta-Base",
        "Larvesta-RamAlbun"
      ],
      "heightm": 0.08,
      "evos": [
        "Volcarona"
      ]
    },
    "larvestaramalbun": {
      "num": 636,
      "name": "Larvesta-RamAlbun",
      "baseSpecies": "Larvesta",
      "forme": "RamAlbun",
      "types": [
        "Bug",
        "Ground"
      ],
      "baseStats": {
        "hp": 55,
        "atk": 85,
        "def": 55,
        "spa": 50,
        "spd": 55,
        "spe": 60
      },
      "abilities": {
        "0": "Flame Body",
        "H": "Swarm"
      },
      "weightkg": 28.8,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.08,
      "evos": [
        "Volcarona f:ramalbun"
      ],
      "changesFrom": "Larvesta"
    },
    "volcarona": {
      "num": 637,
      "name": "Volcarona",
      "baseForme": "",
      "types": [
        "Bug",
        "Fire"
      ],
      "baseStats": {
        "hp": 85,
        "atk": 60,
        "def": 65,
        "spa": 135,
        "spd": 105,
        "spe": 100
      },
      "abilities": {
        "0": "Flame Body",
        "H": "Swarm"
      },
      "weightkg": 46,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "Volcarona-Base",
        "Volcarona-RamAlbun"
      ],
      "formeOrder": [
        "Volcarona",
        "Volcarona-Base",
        "Volcarona-RamAlbun"
      ],
      "heightm": 0.12,
      "prevo": "Larvesta"
    },
    "volcaronaramalbun": {
      "num": 637,
      "name": "Volcarona-RamAlbun",
      "baseSpecies": "Volcarona",
      "forme": "RamAlbun",
      "types": [
        "Bug",
        "Ground"
      ],
      "baseStats": {
        "hp": 85,
        "atk": 60,
        "def": 65,
        "spa": 135,
        "spd": 105,
        "spe": 100
      },
      "abilities": {
        "0": "Flame Body",
        "H": "Swarm"
      },
      "weightkg": 46,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.12,
      "prevo": "Larvesta",
      "changesFrom": "Volcarona"
    },
    "bunnelby": {
      "num": 659,
      "name": "Bunnelby",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 38,
        "atk": 36,
        "def": 38,
        "spa": 32,
        "spd": 36,
        "spe": 57
      },
      "abilities": {
        "0": "Pickup",
        "1": "Cheek Pouch",
        "H": "Huge Power"
      },
      "weightkg": 5,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Bunnelby-Base",
        "Bunnelby-Sakura"
      ],
      "formeOrder": [
        "Bunnelby",
        "Bunnelby-Base",
        "Bunnelby-Sakura"
      ],
      "heightm": 0.11000000000000001,
      "evos": [
        "Diggersby"
      ]
    },
    "bunnelbysakura": {
      "num": 659,
      "name": "Bunnelby-Sakura",
      "baseSpecies": "Bunnelby",
      "forme": "Sakura",
      "types": [
        "Fairy",
        ""
      ],
      "baseStats": {
        "hp": 38,
        "atk": 36,
        "def": 38,
        "spa": 32,
        "spd": 36,
        "spe": 57
      },
      "abilities": {
        "0": "Pickup",
        "1": "Cheek Pouch",
        "H": "Huge Power"
      },
      "weightkg": 5,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.11000000000000001,
      "evos": [
        "Diggersby f:sakura"
      ],
      "changesFrom": "Bunnelby"
    },
    "diggersby": {
      "num": 660,
      "name": "Diggersby",
      "baseForme": "",
      "types": [
        "Normal",
        "Ground"
      ],
      "baseStats": {
        "hp": 85,
        "atk": 56,
        "def": 77,
        "spa": 50,
        "spd": 77,
        "spe": 78
      },
      "abilities": {
        "0": "Pickup",
        "1": "Cheek Pouch",
        "H": "Huge Power"
      },
      "weightkg": 42.4,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Diggersby-Base",
        "Diggersby-Sakura"
      ],
      "formeOrder": [
        "Diggersby",
        "Diggersby-Base",
        "Diggersby-Sakura"
      ],
      "heightm": 0.18,
      "prevo": "Bunnelby"
    },
    "diggersbysakura": {
      "num": 660,
      "name": "Diggersby-Sakura",
      "baseSpecies": "Diggersby",
      "forme": "Sakura",
      "types": [
        "Fairy",
        "Ground"
      ],
      "baseStats": {
        "hp": 85,
        "atk": 56,
        "def": 77,
        "spa": 50,
        "spd": 77,
        "spe": 78
      },
      "abilities": {
        "0": "Pickup",
        "1": "Cheek Pouch",
        "H": "Huge Power"
      },
      "weightkg": 42.4,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.18,
      "prevo": "Bunnelby",
      "changesFrom": "Diggersby"
    },
    "inkay": {
      "num": 686,
      "name": "Inkay",
      "baseForme": "",
      "types": [
        "Dark",
        "Psychic"
      ],
      "baseStats": {
        "hp": 53,
        "atk": 54,
        "def": 53,
        "spa": 37,
        "spd": 46,
        "spe": 45
      },
      "abilities": {
        "0": "Suction Cups",
        "1": "Contrary",
        "H": "Infiltrator"
      },
      "weightkg": 3.5,
      "eggGroups": [
        "WATER_ONE",
        "WATER_TWO"
      ],
      "otherFormes": [
        "Inkay-Base",
        "Inkay-Teras"
      ],
      "formeOrder": [
        "Inkay",
        "Inkay-Base",
        "Inkay-Teras"
      ],
      "heightm": 0.06999999999999999,
      "evos": [
        "Malamar"
      ]
    },
    "inkayteras": {
      "num": 686,
      "name": "Inkay-Teras",
      "baseSpecies": "Inkay",
      "forme": "Teras",
      "types": [
        "Water",
        "Psychic"
      ],
      "baseStats": {
        "hp": 53,
        "atk": 54,
        "def": 53,
        "spa": 37,
        "spd": 46,
        "spe": 45
      },
      "abilities": {
        "0": "Suction Cups",
        "1": "Contrary",
        "H": "Infiltrator"
      },
      "weightkg": 3.5,
      "eggGroups": [
        "WATER_ONE",
        "WATER_TWO"
      ],
      "heightm": 0.06999999999999999,
      "evos": [
        "Malamar"
      ],
      "changesFrom": "Inkay"
    },
    "malamar": {
      "num": 687,
      "name": "Malamar",
      "baseForme": "",
      "types": [
        "Dark",
        "Psychic"
      ],
      "baseStats": {
        "hp": 86,
        "atk": 92,
        "def": 88,
        "spa": 68,
        "spd": 75,
        "spe": 73
      },
      "abilities": {
        "0": "Suction Cups",
        "1": "Contrary",
        "H": "Infiltrator"
      },
      "weightkg": 47,
      "eggGroups": [
        "WATER_ONE",
        "WATER_TWO"
      ],
      "otherFormes": [
        "Malamar-Base",
        "Malamar-Teras"
      ],
      "formeOrder": [
        "Malamar",
        "Malamar-Base",
        "Malamar-Teras"
      ],
      "heightm": 0.2,
      "prevo": "Inkay"
    },
    "malamarteras": {
      "num": 687,
      "name": "Malamar-Teras",
      "baseSpecies": "Malamar",
      "forme": "Teras",
      "types": [
        "Water",
        "Psychic"
      ],
      "baseStats": {
        "hp": 86,
        "atk": 92,
        "def": 88,
        "spa": 68,
        "spd": 75,
        "spe": 73
      },
      "abilities": {
        "0": "Suction Cups",
        "1": "Contrary",
        "H": "Infiltrator"
      },
      "weightkg": 47,
      "eggGroups": [
        "WATER_ONE",
        "WATER_TWO"
      ],
      "heightm": 0.2,
      "prevo": "Inkay",
      "changesFrom": "Malamar"
    },
    "trevenant": {
      "num": 709,
      "name": "Trevenant",
      "baseForme": "",
      "types": [
        "Ghost",
        "Grass"
      ],
      "baseStats": {
        "hp": 85,
        "atk": 110,
        "def": 76,
        "spa": 65,
        "spd": 82,
        "spe": 56
      },
      "abilities": {
        "0": "Natural Cure",
        "1": "Frisk",
        "H": "Harvest"
      },
      "weightkg": 71,
      "eggGroups": [
        "GRASS",
        "AMORPHOUS"
      ],
      "otherFormes": [
        "Trevenant-Base",
        "Trevenant-Teras",
        "Trevenant-Teras"
      ],
      "formeOrder": [
        "Trevenant",
        "Trevenant-Base",
        "Trevenant-Teras",
        "Trevenant-Teras"
      ],
      "heightm": 0.15,
      "prevo": "Phantump"
    },
    "trevenantteras": {
      "num": 709,
      "name": "Trevenant-Teras",
      "baseSpecies": "Trevenant",
      "forme": "Teras",
      "types": [
        "Ghost",
        "Steel"
      ],
      "baseStats": {
        "hp": 85,
        "atk": 110,
        "def": 76,
        "spa": 65,
        "spd": 82,
        "spe": 56
      },
      "abilities": {
        "0": "Natural Cure",
        "1": "Frisk",
        "H": "Harvest"
      },
      "weightkg": 71,
      "eggGroups": [
        "GRASS",
        "AMORPHOUS"
      ],
      "heightm": 0.15,
      "prevo": "Phantump",
      "changesFrom": "Trevenant"
    },
    "bergmite": {
      "num": 712,
      "name": "Bergmite",
      "baseForme": "",
      "types": [
        "Ice",
        ""
      ],
      "baseStats": {
        "hp": 55,
        "atk": 69,
        "def": 85,
        "spa": 32,
        "spd": 35,
        "spe": 28
      },
      "abilities": {
        "0": "Own Tempo",
        "1": "Ice Body",
        "H": "Sturdy"
      },
      "weightkg": 99.5,
      "eggGroups": [
        "MONSTER",
        "MINERAL"
      ],
      "otherFormes": [
        "Bergmite-Base",
        "Bergmite-Volcanic"
      ],
      "formeOrder": [
        "Bergmite",
        "Bergmite-Base",
        "Bergmite-Volcanic"
      ],
      "heightm": 0.08,
      "evos": [
        "Avalugg",
        "Avalugg form:hisuian"
      ]
    },
    "bergmitevolcanic": {
      "num": 712,
      "name": "Bergmite-Volcanic",
      "baseSpecies": "Bergmite",
      "forme": "Volcanic",
      "types": [
        "Rock",
        "Fire"
      ],
      "baseStats": {
        "hp": 55,
        "atk": 69,
        "def": 85,
        "spa": 32,
        "spd": 35,
        "spe": 28
      },
      "abilities": {
        "0": "Own Tempo",
        "1": "Ice Body",
        "H": "Sturdy"
      },
      "weightkg": 99.5,
      "eggGroups": [
        "MONSTER",
        "MINERAL"
      ],
      "heightm": 0.08,
      "evos": [
        "Avalugg form:volcanic"
      ],
      "changesFrom": "Bergmite"
    },
    "avalugg": {
      "num": 713,
      "name": "Avalugg",
      "baseForme": "",
      "types": [
        "Ice",
        ""
      ],
      "baseStats": {
        "hp": 95,
        "atk": 117,
        "def": 184,
        "spa": 44,
        "spd": 46,
        "spe": 28
      },
      "abilities": {
        "0": "Own Tempo",
        "1": "Ice Body",
        "H": "Sturdy"
      },
      "weightkg": 505,
      "eggGroups": [
        "MONSTER",
        "MINERAL"
      ],
      "otherFormes": [
        "Avalugg-Base",
        "Avalugg-Hisui",
        "Avalugg-Volcanic"
      ],
      "formeOrder": [
        "Avalugg",
        "Avalugg-Base",
        "Avalugg-Hisui",
        "Avalugg-Volcanic"
      ],
      "heightm": 0.12,
      "prevo": "Bergmite"
    },
    "avalugghisui": {
      "num": 713,
      "name": "Avalugg-Hisui",
      "baseSpecies": "Avalugg",
      "forme": "Hisui",
      "types": [
        "Ice",
        "Rock"
      ],
      "baseStats": {
        "hp": 95,
        "atk": 127,
        "def": 184,
        "spa": 34,
        "spd": 36,
        "spe": 38
      },
      "abilities": {
        "0": "Strong Jaw",
        "1": "Ice Body",
        "H": "Sturdy"
      },
      "weightkg": 505.5,
      "eggGroups": [
        "MINERAL",
        "MONSTER"
      ],
      "heightm": 0.13999999999999999,
      "prevo": "Bergmite",
      "changesFrom": "Avalugg"
    },
    "avaluggvolcanic": {
      "num": 713,
      "name": "Avalugg-Volcanic",
      "baseSpecies": "Avalugg",
      "forme": "Volcanic",
      "types": [
        "Rock",
        "Fire"
      ],
      "baseStats": {
        "hp": 95,
        "atk": 117,
        "def": 184,
        "spa": 44,
        "spd": 46,
        "spe": 28
      },
      "abilities": {
        "0": "Own Tempo",
        "1": "Ice Body",
        "H": "Sturdy"
      },
      "weightkg": 505,
      "eggGroups": [
        "MONSTER",
        "MINERAL"
      ],
      "heightm": 0.12,
      "prevo": "Bergmite",
      "changesFrom": "Avalugg"
    },
    "incineroar": {
      "num": 727,
      "name": "Incineroar",
      "baseForme": "",
      "types": [
        "Fire",
        "Dark"
      ],
      "baseStats": {
        "hp": 95,
        "atk": 115,
        "def": 90,
        "spa": 80,
        "spd": 90,
        "spe": 60
      },
      "abilities": {
        "0": "Blaze",
        "H": "Intimidate"
      },
      "weightkg": 83,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Incineroar-Base",
        "Incineroar-Omnitrix",
        "Incineroar-Teras"
      ],
      "formeOrder": [
        "Incineroar",
        "Incineroar-Base",
        "Incineroar-Omnitrix",
        "Incineroar-Teras"
      ],
      "heightm": 0.16999999999999998,
      "prevo": "Torracat"
    },
    "incineroaromnitrix": {
      "num": 727,
      "name": "Incineroar-Omnitrix",
      "baseSpecies": "Incineroar",
      "forme": "Omnitrix",
      "types": [
        "Fighting",
        "Flying"
      ],
      "baseStats": {
        "hp": 95,
        "atk": 115,
        "def": 90,
        "spa": 80,
        "spd": 90,
        "spe": 60
      },
      "abilities": {
        "0": "Blaze",
        "H": "Intimidate"
      },
      "weightkg": 83,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.16999999999999998,
      "prevo": "Torracat",
      "changesFrom": "Incineroar"
    },
    "incineroarteras": {
      "num": 727,
      "name": "Incineroar-Teras",
      "baseSpecies": "Incineroar",
      "forme": "Teras",
      "types": [
        "Fire",
        "Dark"
      ],
      "baseStats": {
        "hp": 95,
        "atk": 115,
        "def": 90,
        "spa": 80,
        "spd": 90,
        "spe": 60
      },
      "abilities": {
        "0": "Blaze",
        "H": "Intimidate"
      },
      "weightkg": 83,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.16999999999999998,
      "prevo": "Torracat",
      "changesFrom": "Incineroar"
    },
    "lycanroc": {
      "num": 745,
      "name": "Lycanroc",
      "baseForme": "Midday",
      "types": [
        "Rock",
        ""
      ],
      "baseStats": {
        "hp": 75,
        "atk": 115,
        "def": 65,
        "spa": 55,
        "spd": 65,
        "spe": 112
      },
      "abilities": {
        "0": "Keen Eye",
        "1": "Sand Rush",
        "H": "Steadfast"
      },
      "weightkg": 25,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Lycanroc-Midnight",
        "Lycanroc-Dusk",
        "Lycanroc-Astralmidday",
        "Lycanroc-Astralmidnight",
        "Lycanroc-Astraldusk"
      ],
      "formeOrder": [
        "Lycanroc",
        "Lycanroc-Midnight",
        "Lycanroc-Dusk",
        "Lycanroc-Astralmidday",
        "Lycanroc-Astralmidnight",
        "Lycanroc-Astraldusk"
      ],
      "heightm": 0.1,
      "prevo": "Rockruff"
    },
    "lycanrocmidnight": {
      "num": 745,
      "name": "Lycanroc-Midnight",
      "baseSpecies": "Lycanroc",
      "forme": "Midnight",
      "types": [
        "Rock",
        ""
      ],
      "baseStats": {
        "hp": 85,
        "atk": 115,
        "def": 75,
        "spa": 55,
        "spd": 75,
        "spe": 82
      },
      "abilities": {
        "0": "Keen Eye",
        "1": "Vital Spirit",
        "H": "No Guard"
      },
      "weightkg": 25,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.16,
      "prevo": "Rockruff",
      "changesFrom": "Lycanroc"
    },
    "lycanrocdusk": {
      "num": 745,
      "name": "Lycanroc-Dusk",
      "baseSpecies": "Lycanroc",
      "forme": "Dusk",
      "types": [
        "Rock",
        ""
      ],
      "baseStats": {
        "hp": 75,
        "atk": 117,
        "def": 65,
        "spa": 55,
        "spd": 65,
        "spe": 110
      },
      "abilities": {
        "0": "Tough Claws"
      },
      "weightkg": 25,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.1,
      "prevo": "Rockruff",
      "changesFrom": "Lycanroc"
    },
    "lycanrocastralmidday": {
      "num": 745,
      "name": "Lycanroc-Astralmidday",
      "baseSpecies": "Lycanroc",
      "forme": "Astralmidday",
      "types": [
        "Psychic",
        "Rock"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 115,
        "def": 65,
        "spa": 55,
        "spd": 65,
        "spe": 112
      },
      "abilities": {
        "0": "Keen Eye",
        "1": "Sand Rush",
        "H": "Steadfast"
      },
      "weightkg": 25,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.1,
      "prevo": "Rockruff",
      "changesFrom": "Lycanroc"
    },
    "lycanrocastralmidnight": {
      "num": 745,
      "name": "Lycanroc-Astralmidnight",
      "baseSpecies": "Lycanroc",
      "forme": "Astralmidnight",
      "types": [
        "Rock",
        ""
      ],
      "baseStats": {
        "hp": 85,
        "atk": 115,
        "def": 75,
        "spa": 55,
        "spd": 75,
        "spe": 82
      },
      "abilities": {
        "0": "Keen Eye",
        "1": "Vital Spirit",
        "H": "No Guard"
      },
      "weightkg": 25,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.16,
      "prevo": "Rockruff",
      "changesFrom": "Lycanroc"
    },
    "lycanrocastraldusk": {
      "num": 745,
      "name": "Lycanroc-Astraldusk",
      "baseSpecies": "Lycanroc",
      "forme": "Astraldusk",
      "types": [
        "Rock",
        ""
      ],
      "baseStats": {
        "hp": 75,
        "atk": 117,
        "def": 65,
        "spa": 55,
        "spd": 65,
        "spe": 110
      },
      "abilities": {
        "0": "Tough Claws"
      },
      "weightkg": 25,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.1,
      "prevo": "Rockruff",
      "changesFrom": "Lycanroc"
    },
    "mareanie": {
      "num": 747,
      "name": "Mareanie",
      "baseForme": "",
      "types": [
        "Poison",
        "Water"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 53,
        "def": 62,
        "spa": 43,
        "spd": 52,
        "spe": 45
      },
      "abilities": {
        "0": "Merciless",
        "1": "Limber",
        "H": "Regenerator"
      },
      "weightkg": 8,
      "eggGroups": [
        "WATER_ONE"
      ],
      "otherFormes": [
        "Mareanie-Base",
        "Mareanie-Teras"
      ],
      "formeOrder": [
        "Mareanie",
        "Mareanie-Base",
        "Mareanie-Teras"
      ],
      "heightm": 0.06,
      "evos": [
        "Toxapex"
      ]
    },
    "mareanieteras": {
      "num": 747,
      "name": "Mareanie-Teras",
      "baseSpecies": "Mareanie",
      "forme": "Teras",
      "types": [
        "Poison",
        "Grass"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 53,
        "def": 62,
        "spa": 43,
        "spd": 52,
        "spe": 45
      },
      "abilities": {
        "0": "Merciless",
        "1": "Limber",
        "H": "Regenerator"
      },
      "weightkg": 8,
      "eggGroups": [
        "WATER_ONE"
      ],
      "heightm": 0.06,
      "evos": [
        "Toxapex form:teras"
      ],
      "changesFrom": "Mareanie"
    },
    "toxapex": {
      "num": 748,
      "name": "Toxapex",
      "baseForme": "",
      "types": [
        "Poison",
        "Water"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 63,
        "def": 152,
        "spa": 53,
        "spd": 142,
        "spe": 35
      },
      "abilities": {
        "0": "Merciless",
        "1": "Limber",
        "H": "Regenerator"
      },
      "weightkg": 14.5,
      "eggGroups": [
        "WATER_ONE"
      ],
      "otherFormes": [
        "Toxapex-Base",
        "Toxapex-Teras"
      ],
      "formeOrder": [
        "Toxapex",
        "Toxapex-Base",
        "Toxapex-Teras"
      ],
      "heightm": 0.09,
      "prevo": "Mareanie"
    },
    "toxapexteras": {
      "num": 748,
      "name": "Toxapex-Teras",
      "baseSpecies": "Toxapex",
      "forme": "Teras",
      "types": [
        "Poison",
        "Grass"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 63,
        "def": 152,
        "spa": 53,
        "spd": 142,
        "spe": 35
      },
      "abilities": {
        "0": "Merciless",
        "1": "Limber",
        "H": "Regenerator"
      },
      "weightkg": 14.5,
      "eggGroups": [
        "WATER_ONE"
      ],
      "heightm": 0.09,
      "prevo": "Mareanie",
      "changesFrom": "Toxapex"
    },
    "shiinotic": {
      "num": 756,
      "name": "Shiinotic",
      "baseForme": "",
      "types": [
        "Grass",
        "Fairy"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 45,
        "def": 80,
        "spa": 90,
        "spd": 100,
        "spe": 30
      },
      "abilities": {
        "0": "Illuminate",
        "1": "Effect Spore",
        "H": "Rain Dish"
      },
      "weightkg": 11.5,
      "eggGroups": [
        "GRASS"
      ],
      "otherFormes": [
        "Shiinotic-Base",
        "Shiinotic-Teras"
      ],
      "formeOrder": [
        "Shiinotic",
        "Shiinotic-Base",
        "Shiinotic-Teras"
      ],
      "heightm": 0.13,
      "prevo": "Morelull"
    },
    "shiinoticteras": {
      "num": 756,
      "name": "Shiinotic-Teras",
      "baseSpecies": "Shiinotic",
      "forme": "Teras",
      "types": [
        "Normal",
        "Fairy"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 45,
        "def": 80,
        "spa": 90,
        "spd": 100,
        "spe": 30
      },
      "abilities": {
        "0": "Illuminate",
        "1": "Effect Spore",
        "H": "Rain Dish"
      },
      "weightkg": 11.5,
      "eggGroups": [
        "GRASS"
      ],
      "heightm": 0.13,
      "prevo": "Morelull",
      "changesFrom": "Shiinotic"
    },
    "togedemaru": {
      "num": 777,
      "name": "Togedemaru",
      "baseForme": "",
      "types": [
        "Electric",
        "Steel"
      ],
      "baseStats": {
        "hp": 65,
        "atk": 98,
        "def": 63,
        "spa": 40,
        "spd": 73,
        "spe": 96
      },
      "abilities": {
        "0": "Iron Barbs",
        "1": "Lightning Rod",
        "H": "Sturdy"
      },
      "weightkg": 3.3,
      "eggGroups": [
        "FIELD",
        "FAIRY"
      ],
      "otherFormes": [
        "Togedemaru-Base"
      ],
      "formeOrder": [
        "Togedemaru",
        "Togedemaru-Base"
      ],
      "heightm": 0.05
    },
    "marshadow": {
      "num": 802,
      "name": "Marshadow",
      "baseForme": "",
      "types": [
        "Fighting",
        "Ghost"
      ],
      "baseStats": {
        "hp": 90,
        "atk": 125,
        "def": 80,
        "spa": 90,
        "spd": 90,
        "spe": 125
      },
      "abilities": {
        "0": "Technician"
      },
      "weightkg": 22.2,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "otherFormes": [
        "Marshadow-Base",
        "Marshadow-Zenith",
        "Marshadow-Omnitrix"
      ],
      "formeOrder": [
        "Marshadow",
        "Marshadow-Base",
        "Marshadow-Zenith",
        "Marshadow-Omnitrix"
      ],
      "heightm": 0.08
    },
    "marshadowzenith": {
      "num": 802,
      "name": "Marshadow-Zenith",
      "baseSpecies": "Marshadow",
      "forme": "Zenith",
      "types": [
        "Fighting",
        "Ghost"
      ],
      "baseStats": {
        "hp": 90,
        "atk": 125,
        "def": 80,
        "spa": 90,
        "spd": 90,
        "spe": 125
      },
      "abilities": {
        "0": "Technician"
      },
      "weightkg": 22.2,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "heightm": 0.08,
      "changesFrom": "Marshadow"
    },
    "marshadowomnitrix": {
      "num": 802,
      "name": "Marshadow-Omnitrix",
      "baseSpecies": "Marshadow",
      "forme": "Omnitrix",
      "types": [
        "Fire",
        "Grass"
      ],
      "baseStats": {
        "hp": 90,
        "atk": 125,
        "def": 80,
        "spa": 90,
        "spd": 90,
        "spe": 125
      },
      "abilities": {
        "0": "Technician"
      },
      "weightkg": 22.2,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "heightm": 0.08,
      "changesFrom": "Marshadow"
    },
    "melmetal": {
      "num": 809,
      "name": "Melmetal",
      "baseForme": "",
      "types": [
        "Steel",
        ""
      ],
      "baseStats": {
        "hp": 135,
        "atk": 143,
        "def": 143,
        "spa": 80,
        "spd": 65,
        "spe": 34
      },
      "abilities": {
        "0": "Iron Fist"
      },
      "weightkg": 800,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "otherFormes": [
        "Melmetal-Base",
        "Melmetal-Omnitrix"
      ],
      "formeOrder": [
        "Melmetal",
        "Melmetal-Base",
        "Melmetal-Omnitrix"
      ],
      "heightm": 0.2,
      "prevo": "Meltan"
    },
    "melmetalgmax": {
      "num": 809,
      "name": "Melmetal-Gmax",
      "baseSpecies": "Melmetal",
      "forme": "Gmax",
      "types": [
        "Steel",
        ""
      ],
      "baseStats": {
        "hp": 135,
        "atk": 143,
        "def": 143,
        "spa": 80,
        "spd": 65,
        "spe": 34
      },
      "abilities": {
        "0": "Iron Fist"
      },
      "weightkg": 800,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "heightm": 0.22000000000000003,
      "prevo": "Meltan"
    },
    "melmetalomnitrix": {
      "num": 809,
      "name": "Melmetal-Omnitrix",
      "baseSpecies": "Melmetal",
      "forme": "Omnitrix",
      "types": [
        "Steel",
        ""
      ],
      "baseStats": {
        "hp": 135,
        "atk": 143,
        "def": 143,
        "spa": 80,
        "spd": 65,
        "spe": 34
      },
      "abilities": {
        "0": "Iron Fist"
      },
      "weightkg": 800,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "heightm": 0.2,
      "prevo": "Meltan",
      "changesFrom": "Melmetal"
    },
    "drizzile": {
      "num": 817,
      "name": "Drizzile",
      "baseForme": "",
      "types": [
        "Water",
        ""
      ],
      "baseStats": {
        "hp": 65,
        "atk": 60,
        "def": 55,
        "spa": 95,
        "spd": 55,
        "spe": 90
      },
      "abilities": {
        "0": "Torrent",
        "H": "Sniper"
      },
      "weightkg": 11.5,
      "eggGroups": [
        "WATER_ONE",
        "FIELD"
      ],
      "otherFormes": [
        "Drizzile-Base"
      ],
      "formeOrder": [
        "Drizzile",
        "Drizzile-Base"
      ],
      "heightm": 0.06,
      "prevo": "Sobble",
      "evos": [
        "Inteleon"
      ]
    },
    "inteleon": {
      "num": 818,
      "name": "Inteleon",
      "baseForme": "",
      "types": [
        "Water",
        ""
      ],
      "baseStats": {
        "hp": 70,
        "atk": 85,
        "def": 65,
        "spa": 125,
        "spd": 65,
        "spe": 120
      },
      "abilities": {
        "0": "Torrent",
        "H": "Sniper"
      },
      "weightkg": 45.2,
      "eggGroups": [
        "WATER_ONE",
        "FIELD"
      ],
      "otherFormes": [
        "Inteleon-Base",
        "Inteleon-Teras"
      ],
      "formeOrder": [
        "Inteleon",
        "Inteleon-Base",
        "Inteleon-Teras"
      ],
      "heightm": 0.16,
      "prevo": "Drizzile"
    },
    "inteleongmax": {
      "num": 818,
      "name": "Inteleon-Gmax",
      "baseSpecies": "Inteleon",
      "forme": "Gmax",
      "types": [
        "Water",
        ""
      ],
      "baseStats": {
        "hp": 70,
        "atk": 85,
        "def": 65,
        "spa": 125,
        "spd": 65,
        "spe": 120
      },
      "abilities": {
        "0": "Torrent",
        "H": "Sniper"
      },
      "weightkg": 45.2,
      "eggGroups": [
        "WATER_ONE",
        "FIELD"
      ],
      "heightm": 0.16,
      "prevo": "Drizzile"
    },
    "inteleonteras": {
      "num": 818,
      "name": "Inteleon-Teras",
      "baseSpecies": "Inteleon",
      "forme": "Teras",
      "types": [
        "Water",
        ""
      ],
      "baseStats": {
        "hp": 70,
        "atk": 85,
        "def": 65,
        "spa": 125,
        "spd": 65,
        "spe": 120
      },
      "abilities": {
        "0": "Torrent",
        "H": "Sniper"
      },
      "weightkg": 45.2,
      "eggGroups": [
        "WATER_ONE",
        "FIELD"
      ],
      "heightm": 0.16,
      "prevo": "Drizzile",
      "changesFrom": "Inteleon"
    },
    "rookidee": {
      "num": 821,
      "name": "Rookidee",
      "baseForme": "",
      "types": [
        "Flying",
        ""
      ],
      "baseStats": {
        "hp": 38,
        "atk": 47,
        "def": 35,
        "spa": 33,
        "spd": 35,
        "spe": 57
      },
      "abilities": {
        "0": "Keen Eye",
        "1": "Unnerve",
        "H": "Big Pecks"
      },
      "weightkg": 1.8,
      "eggGroups": [
        "FLYING"
      ],
      "otherFormes": [
        "Rookidee-Base",
        "Rookidee-Volcanic"
      ],
      "formeOrder": [
        "Rookidee",
        "Rookidee-Base",
        "Rookidee-Volcanic"
      ],
      "heightm": 0.025,
      "evos": [
        "Corvisquire"
      ]
    },
    "rookideevolcanic": {
      "num": 821,
      "name": "Rookidee-Volcanic",
      "baseSpecies": "Rookidee",
      "forme": "Volcanic",
      "types": [
        "Flying",
        "Rock"
      ],
      "baseStats": {
        "hp": 38,
        "atk": 47,
        "def": 35,
        "spa": 33,
        "spd": 35,
        "spe": 57
      },
      "abilities": {
        "0": "Keen Eye",
        "1": "Unnerve",
        "H": "Big Pecks"
      },
      "weightkg": 1.8,
      "eggGroups": [
        "FLYING"
      ],
      "heightm": 0.025,
      "evos": [
        "Corvisquire f:volcanic"
      ],
      "changesFrom": "Rookidee"
    },
    "corvisquire": {
      "num": 822,
      "name": "Corvisquire",
      "baseForme": "",
      "types": [
        "Flying",
        ""
      ],
      "baseStats": {
        "hp": 68,
        "atk": 67,
        "def": 55,
        "spa": 43,
        "spd": 55,
        "spe": 77
      },
      "abilities": {
        "0": "Keen Eye",
        "1": "Unnerve",
        "H": "Big Pecks"
      },
      "weightkg": 16,
      "eggGroups": [
        "FLYING"
      ],
      "otherFormes": [
        "Corvisquire-Base",
        "Corvisquire-Volcanic"
      ],
      "formeOrder": [
        "Corvisquire",
        "Corvisquire-Base",
        "Corvisquire-Volcanic"
      ],
      "heightm": 0.065,
      "prevo": "Rookidee",
      "evos": [
        "Corviknight"
      ]
    },
    "corvisquirevolcanic": {
      "num": 822,
      "name": "Corvisquire-Volcanic",
      "baseSpecies": "Corvisquire",
      "forme": "Volcanic",
      "types": [
        "Flying",
        "Rock"
      ],
      "baseStats": {
        "hp": 68,
        "atk": 67,
        "def": 55,
        "spa": 43,
        "spd": 55,
        "spe": 77
      },
      "abilities": {
        "0": "Keen Eye",
        "1": "Unnerve",
        "H": "Big Pecks"
      },
      "weightkg": 16,
      "eggGroups": [
        "FLYING"
      ],
      "heightm": 0.065,
      "prevo": "Rookidee",
      "evos": [
        "Corviknight f:volcanic"
      ],
      "changesFrom": "Corvisquire"
    },
    "corviknight": {
      "num": 823,
      "name": "Corviknight",
      "baseForme": "",
      "types": [
        "Flying",
        "Steel"
      ],
      "baseStats": {
        "hp": 98,
        "atk": 87,
        "def": 105,
        "spa": 53,
        "spd": 85,
        "spe": 67
      },
      "abilities": {
        "0": "Pressure",
        "1": "Unnerve",
        "H": "Mirror Armor"
      },
      "weightkg": 75,
      "eggGroups": [
        "FLYING"
      ],
      "otherFormes": [
        "Corviknight-Base",
        "Corviknight-Volcanic",
        "Corviknight-Volcanicgmax"
      ],
      "formeOrder": [
        "Corviknight",
        "Corviknight-Base",
        "Corviknight-Volcanic",
        "Corviknight-Volcanicgmax"
      ],
      "heightm": 0.16999999999999998,
      "prevo": "Corvisquire"
    },
    "corviknightgmax": {
      "num": 823,
      "name": "Corviknight-Gmax",
      "baseSpecies": "Corviknight",
      "forme": "Gmax",
      "types": [
        "Flying",
        "Steel"
      ],
      "baseStats": {
        "hp": 98,
        "atk": 87,
        "def": 105,
        "spa": 53,
        "spd": 85,
        "spe": 67
      },
      "abilities": {
        "0": "Pressure",
        "1": "Unnerve",
        "H": "Mirror Armor"
      },
      "weightkg": 75,
      "eggGroups": [
        "FLYING"
      ],
      "heightm": 0.3,
      "prevo": "Corvisquire"
    },
    "corviknightvolcanic": {
      "num": 823,
      "name": "Corviknight-Volcanic",
      "baseSpecies": "Corviknight",
      "forme": "Volcanic",
      "types": [
        "Flying",
        "Rock"
      ],
      "baseStats": {
        "hp": 98,
        "atk": 87,
        "def": 105,
        "spa": 53,
        "spd": 85,
        "spe": 67
      },
      "abilities": {
        "0": "Pressure",
        "1": "Unnerve",
        "H": "Mirror Armor"
      },
      "weightkg": 75,
      "eggGroups": [
        "FLYING"
      ],
      "heightm": 0.16999999999999998,
      "prevo": "Corvisquire",
      "changesFrom": "Corviknight"
    },
    "corviknightvolcanicgmax": {
      "num": 823,
      "name": "Corviknight-Volcanicgmax",
      "baseSpecies": "Corviknight",
      "forme": "Volcanicgmax",
      "types": [
        "Flying",
        "Steel"
      ],
      "baseStats": {
        "hp": 98,
        "atk": 87,
        "def": 105,
        "spa": 53,
        "spd": 85,
        "spe": 67
      },
      "abilities": {
        "0": "Pressure",
        "1": "Unnerve",
        "H": "Mirror Armor"
      },
      "weightkg": 75,
      "eggGroups": [
        "FLYING"
      ],
      "heightm": 0.3,
      "prevo": "Corvisquire",
      "changesFrom": "Corviknight"
    },
    "nickit": {
      "num": 827,
      "name": "Nickit",
      "baseForme": "",
      "types": [
        "Dark",
        ""
      ],
      "baseStats": {
        "hp": 40,
        "atk": 28,
        "def": 28,
        "spa": 47,
        "spd": 52,
        "spe": 50
      },
      "abilities": {
        "0": "Run Away",
        "1": "Unburden",
        "H": "Stakeout"
      },
      "weightkg": 8.9,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Nickit-Base",
        "Nickit-Sakura"
      ],
      "formeOrder": [
        "Nickit",
        "Nickit-Base",
        "Nickit-Sakura"
      ],
      "heightm": 0.05,
      "evos": [
        "Thievul"
      ]
    },
    "nickitsakura": {
      "num": 827,
      "name": "Nickit-Sakura",
      "baseSpecies": "Nickit",
      "forme": "Sakura",
      "types": [
        "Fairy",
        ""
      ],
      "baseStats": {
        "hp": 40,
        "atk": 28,
        "def": 28,
        "spa": 47,
        "spd": 52,
        "spe": 50
      },
      "abilities": {
        "0": "Run Away",
        "1": "Unburden",
        "H": "Stakeout"
      },
      "weightkg": 8.9,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.05,
      "evos": [
        "Thievul f:sakura"
      ],
      "changesFrom": "Nickit"
    },
    "thievul": {
      "num": 828,
      "name": "Thievul",
      "baseForme": "",
      "types": [
        "Dark",
        ""
      ],
      "baseStats": {
        "hp": 70,
        "atk": 58,
        "def": 58,
        "spa": 87,
        "spd": 92,
        "spe": 90
      },
      "abilities": {
        "0": "Run Away",
        "1": "Unburden",
        "H": "Stakeout"
      },
      "weightkg": 19.9,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Thievul-Base",
        "Thievul-Sakura"
      ],
      "formeOrder": [
        "Thievul",
        "Thievul-Base",
        "Thievul-Sakura"
      ],
      "heightm": 0.1,
      "prevo": "Nickit"
    },
    "thievulsakura": {
      "num": 828,
      "name": "Thievul-Sakura",
      "baseSpecies": "Thievul",
      "forme": "Sakura",
      "types": [
        "Fairy",
        ""
      ],
      "baseStats": {
        "hp": 70,
        "atk": 58,
        "def": 58,
        "spa": 87,
        "spd": 92,
        "spe": 90
      },
      "abilities": {
        "0": "Run Away",
        "1": "Unburden",
        "H": "Stakeout"
      },
      "weightkg": 19.9,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.1,
      "prevo": "Nickit",
      "changesFrom": "Thievul"
    },
    "wooloo": {
      "num": 831,
      "name": "Wooloo",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 42,
        "atk": 40,
        "def": 55,
        "spa": 40,
        "spd": 45,
        "spe": 48
      },
      "abilities": {
        "0": "Fluffy",
        "1": "Run Away",
        "H": "Bulletproof"
      },
      "weightkg": 6,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Wooloo-Base",
        "Wooloo-Shorn",
        "Wooloo-Astral",
        "Wooloo-Astralshorn"
      ],
      "formeOrder": [
        "Wooloo",
        "Wooloo-Base",
        "Wooloo-Shorn",
        "Wooloo-Astral",
        "Wooloo-Astralshorn"
      ],
      "heightm": 0.06999999999999999,
      "evos": [
        "Dubwool"
      ]
    },
    "woolooshorn": {
      "num": 831,
      "name": "Wooloo-Shorn",
      "baseSpecies": "Wooloo",
      "forme": "Shorn",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 42,
        "atk": 40,
        "def": 55,
        "spa": 40,
        "spd": 45,
        "spe": 48
      },
      "abilities": {
        "0": "Fluffy",
        "1": "Run Away",
        "H": "Bulletproof"
      },
      "weightkg": 6,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.06999999999999999,
      "changesFrom": "Wooloo"
    },
    "woolooastral": {
      "num": 831,
      "name": "Wooloo-Astral",
      "baseSpecies": "Wooloo",
      "forme": "Astral",
      "types": [
        "Psychic",
        ""
      ],
      "baseStats": {
        "hp": 42,
        "atk": 40,
        "def": 55,
        "spa": 40,
        "spd": 45,
        "spe": 48
      },
      "abilities": {
        "0": "Fluffy",
        "1": "Run Away",
        "H": "Bulletproof"
      },
      "weightkg": 6,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.06999999999999999,
      "evos": [
        "Dubwool f:astral"
      ],
      "changesFrom": "Wooloo"
    },
    "woolooastralshorn": {
      "num": 831,
      "name": "Wooloo-Astralshorn",
      "baseSpecies": "Wooloo",
      "forme": "Astralshorn",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 42,
        "atk": 40,
        "def": 55,
        "spa": 40,
        "spd": 45,
        "spe": 48
      },
      "abilities": {
        "0": "Fluffy",
        "1": "Run Away",
        "H": "Bulletproof"
      },
      "weightkg": 6,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.06999999999999999,
      "changesFrom": "Wooloo"
    },
    "dubwool": {
      "num": 832,
      "name": "Dubwool",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 72,
        "atk": 80,
        "def": 100,
        "spa": 60,
        "spd": 90,
        "spe": 88
      },
      "abilities": {
        "0": "Fluffy",
        "1": "Steadfast",
        "H": "Bulletproof"
      },
      "weightkg": 43,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Dubwool-Base",
        "Dubwool-Shorn",
        "Dubwool-Astral",
        "Dubwool-Astralshorn"
      ],
      "formeOrder": [
        "Dubwool",
        "Dubwool-Base",
        "Dubwool-Shorn",
        "Dubwool-Astral",
        "Dubwool-Astralshorn"
      ],
      "heightm": 0.12,
      "prevo": "Wooloo"
    },
    "dubwoolshorn": {
      "num": 832,
      "name": "Dubwool-Shorn",
      "baseSpecies": "Dubwool",
      "forme": "Shorn",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 72,
        "atk": 80,
        "def": 100,
        "spa": 60,
        "spd": 90,
        "spe": 88
      },
      "abilities": {
        "0": "Fluffy",
        "1": "Steadfast",
        "H": "Bulletproof"
      },
      "weightkg": 43,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.12,
      "prevo": "Wooloo",
      "changesFrom": "Dubwool"
    },
    "dubwoolastral": {
      "num": 832,
      "name": "Dubwool-Astral",
      "baseSpecies": "Dubwool",
      "forme": "Astral",
      "types": [
        "Psychic",
        ""
      ],
      "baseStats": {
        "hp": 72,
        "atk": 80,
        "def": 100,
        "spa": 60,
        "spd": 90,
        "spe": 88
      },
      "abilities": {
        "0": "Fluffy",
        "1": "Steadfast",
        "H": "Bulletproof"
      },
      "weightkg": 43,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.12,
      "prevo": "Wooloo",
      "changesFrom": "Dubwool"
    },
    "dubwoolastralshorn": {
      "num": 832,
      "name": "Dubwool-Astralshorn",
      "baseSpecies": "Dubwool",
      "forme": "Astralshorn",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 72,
        "atk": 80,
        "def": 100,
        "spa": 60,
        "spd": 90,
        "spe": 88
      },
      "abilities": {
        "0": "Fluffy",
        "1": "Steadfast",
        "H": "Bulletproof"
      },
      "weightkg": 43,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.12,
      "prevo": "Wooloo",
      "changesFrom": "Dubwool"
    },
    "hatenna": {
      "num": 856,
      "name": "Hatenna",
      "baseForme": "",
      "types": [
        "Psychic",
        ""
      ],
      "baseStats": {
        "hp": 42,
        "atk": 30,
        "def": 45,
        "spa": 56,
        "spd": 53,
        "spe": 39
      },
      "abilities": {
        "0": "Healer",
        "1": "Anticipation",
        "H": "Magic Bounce"
      },
      "weightkg": 3.4,
      "eggGroups": [
        "FAIRY"
      ],
      "otherFormes": [
        "Hatenna-Base",
        "Hatenna-Astral"
      ],
      "formeOrder": [
        "Hatenna",
        "Hatenna-Base",
        "Hatenna-Astral"
      ],
      "heightm": 0.06,
      "evos": [
        "Hattrem"
      ]
    },
    "hatennaastral": {
      "num": 856,
      "name": "Hatenna-Astral",
      "baseSpecies": "Hatenna",
      "forme": "Astral",
      "types": [
        "Psychic",
        "Dark"
      ],
      "baseStats": {
        "hp": 42,
        "atk": 30,
        "def": 45,
        "spa": 56,
        "spd": 53,
        "spe": 39
      },
      "abilities": {
        "0": "Healer",
        "1": "Anticipation",
        "H": "Magic Bounce"
      },
      "weightkg": 3.4,
      "eggGroups": [
        "FAIRY"
      ],
      "heightm": 0.06,
      "evos": [
        "Hattrem f:astral"
      ],
      "changesFrom": "Hatenna"
    },
    "hattrem": {
      "num": 857,
      "name": "Hattrem",
      "baseForme": "",
      "types": [
        "Psychic",
        ""
      ],
      "baseStats": {
        "hp": 57,
        "atk": 40,
        "def": 65,
        "spa": 86,
        "spd": 73,
        "spe": 49
      },
      "abilities": {
        "0": "Healer",
        "1": "Anticipation",
        "H": "Magic Bounce"
      },
      "weightkg": 4.8,
      "eggGroups": [
        "FAIRY"
      ],
      "otherFormes": [
        "Hattrem-Base",
        "Hattrem-Astral"
      ],
      "formeOrder": [
        "Hattrem",
        "Hattrem-Base",
        "Hattrem-Astral"
      ],
      "heightm": 0.1,
      "prevo": "Hatenna",
      "evos": [
        "Hatterene"
      ]
    },
    "hattremastral": {
      "num": 857,
      "name": "Hattrem-Astral",
      "baseSpecies": "Hattrem",
      "forme": "Astral",
      "types": [
        "Psychic",
        "Dark"
      ],
      "baseStats": {
        "hp": 57,
        "atk": 40,
        "def": 65,
        "spa": 86,
        "spd": 73,
        "spe": 49
      },
      "abilities": {
        "0": "Healer",
        "1": "Anticipation",
        "H": "Magic Bounce"
      },
      "weightkg": 4.8,
      "eggGroups": [
        "FAIRY"
      ],
      "heightm": 0.1,
      "prevo": "Hatenna",
      "evos": [
        "Hatterene f:astral"
      ],
      "changesFrom": "Hattrem"
    },
    "hatterene": {
      "num": 858,
      "name": "Hatterene",
      "baseForme": "",
      "types": [
        "Psychic",
        "Fairy"
      ],
      "baseStats": {
        "hp": 57,
        "atk": 90,
        "def": 95,
        "spa": 136,
        "spd": 103,
        "spe": 29
      },
      "abilities": {
        "0": "Healer",
        "1": "Anticipation",
        "H": "Magic Bounce"
      },
      "weightkg": 5.1,
      "eggGroups": [
        "FAIRY"
      ],
      "otherFormes": [
        "Hatterene-Base",
        "Hatterene-Astral"
      ],
      "formeOrder": [
        "Hatterene",
        "Hatterene-Base",
        "Hatterene-Astral"
      ],
      "heightm": 0.18,
      "prevo": "Hattrem"
    },
    "hatterenegmax": {
      "num": 858,
      "name": "Hatterene-Gmax",
      "baseSpecies": "Hatterene",
      "forme": "Gmax",
      "types": [
        "Psychic",
        "Fairy"
      ],
      "baseStats": {
        "hp": 57,
        "atk": 90,
        "def": 95,
        "spa": 136,
        "spd": 103,
        "spe": 29
      },
      "abilities": {
        "0": "Healer",
        "1": "Anticipation",
        "H": "Magic Bounce"
      },
      "weightkg": 5.1,
      "eggGroups": [
        "FAIRY"
      ],
      "heightm": 0.18,
      "prevo": "Hattrem"
    },
    "hattereneastral": {
      "num": 858,
      "name": "Hatterene-Astral",
      "baseSpecies": "Hatterene",
      "forme": "Astral",
      "types": [
        "Psychic",
        "Dark"
      ],
      "baseStats": {
        "hp": 57,
        "atk": 90,
        "def": 95,
        "spa": 136,
        "spd": 103,
        "spe": 29
      },
      "abilities": {
        "0": "Healer",
        "1": "Anticipation",
        "H": "Magic Bounce"
      },
      "weightkg": 5.1,
      "eggGroups": [
        "FAIRY"
      ],
      "heightm": 0.18,
      "prevo": "Hattrem",
      "changesFrom": "Hatterene"
    },
    "runerigus": {
      "num": 867,
      "name": "Runerigus",
      "baseForme": "",
      "types": [
        "Ground",
        "Ghost"
      ],
      "baseStats": {
        "hp": 58,
        "atk": 95,
        "def": 145,
        "spa": 50,
        "spd": 105,
        "spe": 30
      },
      "abilities": {
        "0": "Wandering Spirit"
      },
      "weightkg": 66.6,
      "eggGroups": [
        "MINERAL",
        "AMORPHOUS"
      ],
      "otherFormes": [
        "Runerigus-Base",
        "Runerigus-RamAlbun"
      ],
      "formeOrder": [
        "Runerigus",
        "Runerigus-Base",
        "Runerigus-RamAlbun"
      ],
      "heightm": 0.13999999999999999,
      "prevo": "Yamask"
    },
    "runerigusramalbun": {
      "num": 867,
      "name": "Runerigus-RamAlbun",
      "baseSpecies": "Runerigus",
      "forme": "RamAlbun",
      "types": [
        "Psychic",
        "Ghost"
      ],
      "baseStats": {
        "hp": 58,
        "atk": 95,
        "def": 145,
        "spa": 50,
        "spd": 105,
        "spe": 30
      },
      "abilities": {
        "0": "Wandering Spirit"
      },
      "weightkg": 66.6,
      "eggGroups": [
        "MINERAL",
        "AMORPHOUS"
      ],
      "heightm": 0.13999999999999999,
      "prevo": "Yamask",
      "changesFrom": "Runerigus"
    },
    "frosmoth": {
      "num": 873,
      "name": "Frosmoth",
      "baseForme": "",
      "types": [
        "Ice",
        "Bug"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 65,
        "def": 60,
        "spa": 125,
        "spd": 90,
        "spe": 65
      },
      "abilities": {
        "0": "Shield Dust",
        "H": "Ice Scales"
      },
      "weightkg": 42,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "Frosmoth-Base",
        "Frosmoth-Omnitrix"
      ],
      "formeOrder": [
        "Frosmoth",
        "Frosmoth-Base",
        "Frosmoth-Omnitrix"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Snom"
    },
    "frosmothomnitrix": {
      "num": 873,
      "name": "Frosmoth-Omnitrix",
      "baseSpecies": "Frosmoth",
      "forme": "Omnitrix",
      "types": [
        "Ice",
        "Ghost"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 65,
        "def": 60,
        "spa": 125,
        "spd": 90,
        "spe": 65
      },
      "abilities": {
        "0": "Shield Dust",
        "H": "Ice Scales"
      },
      "weightkg": 42,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Snom",
      "changesFrom": "Frosmoth"
    },
    "stonjourner": {
      "num": 874,
      "name": "Stonjourner",
      "baseForme": "",
      "types": [
        "Rock",
        ""
      ],
      "baseStats": {
        "hp": 100,
        "atk": 125,
        "def": 135,
        "spa": 20,
        "spd": 20,
        "spe": 70
      },
      "abilities": {
        "0": "Power Spot"
      },
      "weightkg": 520,
      "eggGroups": [
        "MINERAL"
      ],
      "otherFormes": [
        "Stonjourner-Base",
        "Stonjourner-Volcanic"
      ],
      "formeOrder": [
        "Stonjourner",
        "Stonjourner-Base",
        "Stonjourner-Volcanic"
      ],
      "heightm": 0.2
    },
    "stonjournervolcanic": {
      "num": 874,
      "name": "Stonjourner-Volcanic",
      "baseSpecies": "Stonjourner",
      "forme": "Volcanic",
      "types": [
        "Rock",
        "Fire"
      ],
      "baseStats": {
        "hp": 100,
        "atk": 125,
        "def": 135,
        "spa": 20,
        "spd": 20,
        "spe": 70
      },
      "abilities": {
        "0": "Power Spot"
      },
      "weightkg": 520,
      "eggGroups": [
        "MINERAL"
      ],
      "heightm": 0.2,
      "changesFrom": "Stonjourner"
    },
    "dreepy": {
      "num": 885,
      "name": "Dreepy",
      "baseForme": "",
      "types": [
        "Dragon",
        "Ghost"
      ],
      "baseStats": {
        "hp": 28,
        "atk": 60,
        "def": 30,
        "spa": 40,
        "spd": 30,
        "spe": 82
      },
      "abilities": {
        "0": "Clear Body",
        "1": "Infiltrator",
        "H": "Cursed Body"
      },
      "weightkg": 2,
      "eggGroups": [
        "AMORPHOUS",
        "DRAGON"
      ],
      "otherFormes": [
        "Dreepy-Base",
        "Dreepy-Pesadilla"
      ],
      "formeOrder": [
        "Dreepy",
        "Dreepy-Base",
        "Dreepy-Pesadilla"
      ],
      "heightm": 0.045,
      "evos": [
        "Drakloak"
      ]
    },
    "dreepypesadilla": {
      "num": 885,
      "name": "Dreepy-Pesadilla",
      "baseSpecies": "Dreepy",
      "forme": "Pesadilla",
      "types": [
        "Ghost",
        ""
      ],
      "baseStats": {
        "hp": 28,
        "atk": 60,
        "def": 30,
        "spa": 40,
        "spd": 30,
        "spe": 82
      },
      "abilities": {
        "0": "Clear Body",
        "1": "Infiltrator",
        "H": "Cursed Body"
      },
      "weightkg": 2,
      "eggGroups": [
        "AMORPHOUS",
        "DRAGON"
      ],
      "heightm": 0.045,
      "evos": [
        "Drakloak form:pesadilla"
      ],
      "changesFrom": "Dreepy"
    },
    "drakloak": {
      "num": 886,
      "name": "Drakloak",
      "baseForme": "",
      "types": [
        "Dragon",
        "Ghost"
      ],
      "baseStats": {
        "hp": 68,
        "atk": 80,
        "def": 50,
        "spa": 60,
        "spd": 50,
        "spe": 102
      },
      "abilities": {
        "0": "Clear Body",
        "1": "Infiltrator",
        "H": "Cursed Body"
      },
      "weightkg": 11,
      "eggGroups": [
        "AMORPHOUS",
        "DRAGON"
      ],
      "otherFormes": [
        "Drakloak-Base",
        "Drakloak-Pesadilla"
      ],
      "formeOrder": [
        "Drakloak",
        "Drakloak-Base",
        "Drakloak-Pesadilla"
      ],
      "heightm": 0.16,
      "prevo": "Dreepy",
      "evos": [
        "Dragapult"
      ]
    },
    "drakloakpesadilla": {
      "num": 886,
      "name": "Drakloak-Pesadilla",
      "baseSpecies": "Drakloak",
      "forme": "Pesadilla",
      "types": [
        "Ghost",
        ""
      ],
      "baseStats": {
        "hp": 68,
        "atk": 80,
        "def": 50,
        "spa": 60,
        "spd": 50,
        "spe": 102
      },
      "abilities": {
        "0": "Clear Body",
        "1": "Infiltrator",
        "H": "Cursed Body"
      },
      "weightkg": 11,
      "eggGroups": [
        "AMORPHOUS",
        "DRAGON"
      ],
      "heightm": 0.16,
      "prevo": "Dreepy",
      "evos": [
        "Dragapult f:pesadilla"
      ],
      "changesFrom": "Drakloak"
    },
    "dragapult": {
      "num": 887,
      "name": "Dragapult",
      "baseForme": "",
      "types": [
        "Dragon",
        "Ghost"
      ],
      "baseStats": {
        "hp": 88,
        "atk": 120,
        "def": 75,
        "spa": 100,
        "spd": 75,
        "spe": 142
      },
      "abilities": {
        "0": "Clear Body",
        "1": "Infiltrator",
        "H": "Cursed Body"
      },
      "weightkg": 50,
      "eggGroups": [
        "AMORPHOUS",
        "DRAGON"
      ],
      "otherFormes": [
        "Dragapult-Base",
        "Dragapult-Pesadilla"
      ],
      "formeOrder": [
        "Dragapult",
        "Dragapult-Base",
        "Dragapult-Pesadilla"
      ],
      "heightm": 0.19,
      "prevo": "Dreepy"
    },
    "dragapultpesadilla": {
      "num": 887,
      "name": "Dragapult-Pesadilla",
      "baseSpecies": "Dragapult",
      "forme": "Pesadilla",
      "types": [
        "Ghost",
        ""
      ],
      "baseStats": {
        "hp": 88,
        "atk": 120,
        "def": 75,
        "spa": 100,
        "spd": 75,
        "spe": 142
      },
      "abilities": {
        "0": "Clear Body",
        "1": "Infiltrator",
        "H": "Cursed Body"
      },
      "weightkg": 50,
      "eggGroups": [
        "AMORPHOUS",
        "DRAGON"
      ],
      "heightm": 0.19,
      "prevo": "Dreepy",
      "changesFrom": "Dragapult"
    },
    "kleavor": {
      "num": 900,
      "name": "Kleavor",
      "baseForme": "",
      "types": [
        "Bug",
        "Rock"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 135,
        "def": 95,
        "spa": 45,
        "spd": 70,
        "spe": 85
      },
      "abilities": {
        "0": "Swarm",
        "1": "Sheer Force",
        "H": "Sharpness"
      },
      "weightkg": 89,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "Kleavor-Base",
        "Kleavor-Omnitrix"
      ],
      "formeOrder": [
        "Kleavor",
        "Kleavor-Base",
        "Kleavor-Omnitrix"
      ],
      "heightm": 0.18,
      "prevo": "Scyther"
    },
    "kleavoromnitrix": {
      "num": 900,
      "name": "Kleavor-Omnitrix",
      "baseSpecies": "Kleavor",
      "forme": "Omnitrix",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 70,
        "atk": 135,
        "def": 95,
        "spa": 45,
        "spd": 70,
        "spe": 85
      },
      "abilities": {
        "0": "Swarm",
        "1": "Sheer Force",
        "H": "Sharpness"
      },
      "weightkg": 89,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.18,
      "prevo": "Scyther",
      "changesFrom": "Kleavor"
    },
    "floragato": {
      "num": 907,
      "name": "Floragato",
      "baseForme": "",
      "types": [
        "Grass",
        ""
      ],
      "baseStats": {
        "hp": 61,
        "atk": 80,
        "def": 63,
        "spa": 60,
        "spd": 63,
        "spe": 83
      },
      "abilities": {
        "0": "Overgrow",
        "H": "Protean"
      },
      "weightkg": 12.2,
      "eggGroups": [
        "FIELD",
        "GRASS"
      ],
      "otherFormes": [
        "Floragato-Base",
        "Floragato-Chasanova"
      ],
      "formeOrder": [
        "Floragato",
        "Floragato-Base",
        "Floragato-Chasanova"
      ],
      "heightm": 0.15,
      "prevo": "Sprigatito",
      "evos": [
        "Meowscarada"
      ]
    },
    "floragatochasanova": {
      "num": 907,
      "name": "Floragato-Chasanova",
      "baseSpecies": "Floragato",
      "forme": "Chasanova",
      "types": [
        "Grass",
        ""
      ],
      "baseStats": {
        "hp": 61,
        "atk": 80,
        "def": 63,
        "spa": 60,
        "spd": 63,
        "spe": 83
      },
      "abilities": {
        "0": "Overgrow",
        "H": "Protean"
      },
      "weightkg": 12.2,
      "eggGroups": [
        "FIELD",
        "GRASS"
      ],
      "heightm": 0.15,
      "prevo": "Sprigatito",
      "changesFrom": "Floragato"
    },
    "lokix": {
      "num": 920,
      "name": "Lokix",
      "baseForme": "",
      "types": [
        "Bug",
        "Dark"
      ],
      "baseStats": {
        "hp": 71,
        "atk": 102,
        "def": 78,
        "spa": 52,
        "spd": 55,
        "spe": 92
      },
      "abilities": {
        "0": "Swarm",
        "H": "Tinted Lens"
      },
      "weightkg": 17.5,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "Lokix-Base",
        "Lokix-Omnitrix"
      ],
      "formeOrder": [
        "Lokix",
        "Lokix-Base",
        "Lokix-Omnitrix"
      ],
      "heightm": 0.1,
      "prevo": "Nymble"
    },
    "lokixomnitrix": {
      "num": 920,
      "name": "Lokix-Omnitrix",
      "baseSpecies": "Lokix",
      "forme": "Omnitrix",
      "types": [
        "Bug",
        "Flying"
      ],
      "baseStats": {
        "hp": 71,
        "atk": 102,
        "def": 78,
        "spa": 52,
        "spd": 55,
        "spe": 92
      },
      "abilities": {
        "0": "Swarm",
        "H": "Tinted Lens"
      },
      "weightkg": 17.5,
      "eggGroups": [
        "BUG"
      ],
      "heightm": 0.1,
      "prevo": "Nymble",
      "changesFrom": "Lokix"
    },
    "garganacl": {
      "num": 934,
      "name": "Garganacl",
      "baseForme": "",
      "types": [
        "Rock",
        ""
      ],
      "baseStats": {
        "hp": 100,
        "atk": 100,
        "def": 130,
        "spa": 45,
        "spd": 90,
        "spe": 35
      },
      "abilities": {
        "0": "Purifying Salt",
        "1": "Sturdy",
        "H": "Clear Body"
      },
      "weightkg": 240,
      "eggGroups": [
        "MINERAL"
      ],
      "otherFormes": [
        "Garganacl-Base"
      ],
      "formeOrder": [
        "Garganacl",
        "Garganacl-Base"
      ],
      "heightm": 0.18,
      "prevo": "Naclstack"
    },
    "grafaiai": {
      "num": 945,
      "name": "Grafaiai",
      "baseForme": "",
      "types": [
        "Poison",
        "Normal"
      ],
      "baseStats": {
        "hp": 63,
        "atk": 95,
        "def": 65,
        "spa": 80,
        "spd": 72,
        "spe": 110
      },
      "abilities": {
        "0": "Unburden",
        "1": "Poison Touch",
        "H": "Prankster"
      },
      "weightkg": 27.2,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Grafaiai-Base",
        "Grafaiai-Omnitrix"
      ],
      "formeOrder": [
        "Grafaiai",
        "Grafaiai-Base",
        "Grafaiai-Omnitrix"
      ],
      "heightm": 0.08,
      "prevo": "Shroodle"
    },
    "grafaiaiomnitrix": {
      "num": 945,
      "name": "Grafaiai-Omnitrix",
      "baseSpecies": "Grafaiai",
      "forme": "Omnitrix",
      "types": [
        "Bug",
        "Normal"
      ],
      "baseStats": {
        "hp": 63,
        "atk": 95,
        "def": 65,
        "spa": 80,
        "spd": 72,
        "spe": 110
      },
      "abilities": {
        "0": "Unburden",
        "1": "Poison Touch",
        "H": "Prankster"
      },
      "weightkg": 27.2,
      "eggGroups": [
        "FIELD"
      ],
      "heightm": 0.08,
      "prevo": "Shroodle",
      "changesFrom": "Grafaiai"
    },
    "tinkatuff": {
      "num": 958,
      "name": "Tinkatuff",
      "baseForme": "",
      "types": [
        "Fairy",
        "Steel"
      ],
      "baseStats": {
        "hp": 65,
        "atk": 55,
        "def": 55,
        "spa": 45,
        "spd": 82,
        "spe": 78
      },
      "abilities": {
        "0": "Mold Breaker",
        "1": "Own Tempo",
        "H": "Pickpocket"
      },
      "weightkg": 59.1,
      "eggGroups": [
        "FAIRY"
      ],
      "otherFormes": [
        "Tinkatuff-Base"
      ],
      "formeOrder": [
        "Tinkatuff",
        "Tinkatuff-Base"
      ],
      "heightm": 0.04,
      "prevo": "Tinkatink",
      "evos": [
        "Tinkaton",
        "Tinkaglaze form:strawberry",
        "Tinkaglaze form:blueberry",
        "Tinkaglaze form:kiwi"
      ]
    },
    "dondozo": {
      "num": 977,
      "name": "Dondozo",
      "baseForme": "",
      "types": [
        "Water",
        ""
      ],
      "baseStats": {
        "hp": 150,
        "atk": 100,
        "def": 115,
        "spa": 65,
        "spd": 65,
        "spe": 35
      },
      "abilities": {
        "0": "Unaware",
        "1": "Oblivious",
        "H": "Water Veil"
      },
      "weightkg": 220,
      "eggGroups": [
        "WATER_TWO"
      ],
      "otherFormes": [
        "Dondozo-Base"
      ],
      "formeOrder": [
        "Dondozo",
        "Dondozo-Base"
      ],
      "heightm": 0.4
    },
    "traffikrab": {
      "num": 3011,
      "name": "Traffikrab",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 65,
        "atk": 45,
        "def": 60,
        "spa": 45,
        "spd": 90,
        "spe": 75
      },
      "abilities": {
        "0": "Fluffy",
        "1": "Shell Armour",
        "H": "Clear Body"
      },
      "weightkg": 20.5,
      "eggGroups": [
        "MINERAL"
      ],
      "otherFormes": [
        "Traffikrab-Base"
      ],
      "formeOrder": [
        "Traffikrab",
        "Traffikrab-Base"
      ],
      "heightm": 0.04,
      "evos": [
        "Lobstacle"
      ]
    },
    "lobstacle": {
      "num": 3013,
      "name": "Lobstacle",
      "baseForme": "",
      "types": [
        "Steel",
        ""
      ],
      "baseStats": {
        "hp": 90,
        "atk": 90,
        "def": 120,
        "spa": 60,
        "spd": 120,
        "spe": 45
      },
      "abilities": {
        "0": "Suction Cups",
        "1": "Fluffy",
        "H": "Unaware"
      },
      "weightkg": 400,
      "eggGroups": [
        "MINERAL"
      ],
      "otherFormes": [
        "Lobstacle-Base"
      ],
      "formeOrder": [
        "Lobstacle",
        "Lobstacle-Base"
      ],
      "heightm": 0.23500000000000001,
      "prevo": "Traffikrab"
    },
    "ironflight": {
      "num": 9010,
      "name": "IronFlight",
      "baseForme": "",
      "types": [
        "Bug",
        "Flying"
      ],
      "baseStats": {
        "hp": 105,
        "atk": 50,
        "def": 77,
        "spa": 128,
        "spd": 88,
        "spe": 122
      },
      "abilities": {
        "0": "Compound Eyes",
        "H": "Tinted Lens"
      },
      "weightkg": 32,
      "eggGroups": [
        "BUG"
      ],
      "otherFormes": [
        "IronFlight-Base"
      ],
      "formeOrder": [
        "IronFlight",
        "IronFlight-Base"
      ],
      "heightm": 0.06999999999999999,
      "prevo": "Metapod"
    },
    "brutalking": {
      "num": 9011,
      "name": "BrutalKing",
      "baseForme": "",
      "types": [
        "Poison",
        "Dark"
      ],
      "baseStats": {
        "hp": 100,
        "atk": 135,
        "def": 81,
        "spa": 43,
        "spd": 89,
        "spe": 122
      },
      "abilities": {
        "0": "Protosynthesis"
      },
      "weightkg": 120.4,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "otherFormes": [
        "BrutalKing-Base"
      ],
      "formeOrder": [
        "BrutalKing",
        "BrutalKing-Base"
      ],
      "heightm": 0.13
    },
    "ironsmog": {
      "num": 9012,
      "name": "IronSmog",
      "baseForme": "",
      "types": [
        "Poison",
        "Psychic"
      ],
      "baseStats": {
        "hp": 100,
        "atk": 60,
        "def": 102,
        "spa": 122,
        "spd": 81,
        "spe": 105
      },
      "abilities": {
        "0": "Quark Drive"
      },
      "weightkg": 120.4,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "otherFormes": [
        "IronSmog-Base"
      ],
      "formeOrder": [
        "IronSmog",
        "IronSmog-Base"
      ],
      "heightm": 0.13
    },
    "ironboom": {
      "num": 9014,
      "name": "Ironboom",
      "baseForme": "",
      "types": [
        "Electric",
        "Dark"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 110,
        "def": 70,
        "spa": 110,
        "spd": 70,
        "spe": 150
      },
      "abilities": {
        "0": "Quark Drive"
      },
      "weightkg": 250.5,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "otherFormes": [
        "Ironboom-Base"
      ],
      "formeOrder": [
        "Ironboom",
        "Ironboom-Base"
      ],
      "heightm": 0.13
    },
    "winterbrute": {
      "num": 9015,
      "name": "WinterBrute",
      "baseForme": "",
      "types": [
        "Ice",
        "Fairy"
      ],
      "baseStats": {
        "hp": 180,
        "atk": 135,
        "def": 100,
        "spa": 55,
        "spd": 80,
        "spe": 20
      },
      "abilities": {
        "0": "Protosynthesis"
      },
      "weightkg": 512.25,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "otherFormes": [
        "WinterBrute-Base"
      ],
      "formeOrder": [
        "WinterBrute",
        "WinterBrute-Base"
      ],
      "heightm": 0.13
    },
    "tyrantbeetle": {
      "num": 9016,
      "name": "TyrantBeetle",
      "baseForme": "",
      "types": [
        "Fighting",
        "Flying"
      ],
      "baseStats": {
        "hp": 105,
        "atk": 140,
        "def": 95,
        "spa": 60,
        "spd": 95,
        "spe": 100
      },
      "abilities": {
        "0": "Protosynthesis"
      },
      "weightkg": 250.5,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "otherFormes": [
        "TyrantBeetle-Base"
      ],
      "formeOrder": [
        "TyrantBeetle",
        "TyrantBeetle-Base"
      ],
      "heightm": 0.13
    },
    "mosquito": {
      "num": 9020,
      "name": "Mosquito",
      "baseForme": "",
      "types": [
        "Rock",
        "Grass"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 90,
        "def": 55,
        "spa": 90,
        "spd": 80,
        "spe": 110
      },
      "abilities": {
        "0": "Rock Head",
        "H": "Rock Head"
      },
      "weightkg": 30,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Mosquito-Base"
      ],
      "formeOrder": [
        "Mosquito",
        "Mosquito-Base"
      ],
      "heightm": 0.1,
      "evos": [
        "Pollo",
        "Espinosaurio",
        "Triceratops"
      ]
    },
    "pollo": {
      "num": 9021,
      "name": "Pollo",
      "baseForme": "",
      "types": [
        "Rock",
        "Grass"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 90,
        "def": 55,
        "spa": 90,
        "spd": 80,
        "spe": 110
      },
      "abilities": {
        "0": "Rock Head",
        "H": "Rock Head"
      },
      "weightkg": 30,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Pollo-Base"
      ],
      "formeOrder": [
        "Pollo",
        "Pollo-Base"
      ],
      "heightm": 0.1,
      "prevo": "Mosquito"
    },
    "espinosaurio": {
      "num": 9022,
      "name": "Espinosaurio",
      "baseForme": "",
      "types": [
        "Rock",
        "Grass"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 90,
        "def": 55,
        "spa": 90,
        "spd": 80,
        "spe": 110
      },
      "abilities": {
        "0": "Rock Head",
        "H": "Rock Head"
      },
      "weightkg": 30,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Espinosaurio-Base"
      ],
      "formeOrder": [
        "Espinosaurio",
        "Espinosaurio-Base"
      ],
      "heightm": 0.1,
      "prevo": "Mosquito"
    },
    "triceratops": {
      "num": 9023,
      "name": "Triceratops",
      "baseForme": "",
      "types": [
        "Rock",
        "Grass"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 90,
        "def": 55,
        "spa": 90,
        "spd": 80,
        "spe": 110
      },
      "abilities": {
        "0": "Rock Head",
        "H": "Rock Head"
      },
      "weightkg": 30,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Triceratops-Base"
      ],
      "formeOrder": [
        "Triceratops",
        "Triceratops-Base"
      ],
      "heightm": 0.1,
      "prevo": "Mosquito"
    },
    "vespiteer": {
      "num": 9101,
      "name": "Vespiteer",
      "baseForme": "",
      "types": [
        "Bug",
        "Fighting"
      ],
      "baseStats": {
        "hp": 50,
        "atk": 112,
        "def": 80,
        "spa": 60,
        "spd": 70,
        "spe": 102
      },
      "abilities": {
        "0": "Swarm",
        "H": "Dauntless Shield"
      },
      "weightkg": 250.5,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "otherFormes": [
        "Vespiteer-Base"
      ],
      "formeOrder": [
        "Vespiteer",
        "Vespiteer-Base"
      ],
      "heightm": 0.13,
      "prevo": "Combee"
    },
    "slugsa": {
      "num": 9200,
      "name": "Slugsa",
      "baseForme": "",
      "types": [
        "Ground",
        ""
      ],
      "baseStats": {
        "hp": 40,
        "atk": 40,
        "def": 40,
        "spa": 70,
        "spd": 40,
        "spe": 20
      },
      "abilities": {
        "0": "Magma Armor",
        "1": "Flame Body",
        "H": "Weak Armor"
      },
      "weightkg": 35,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "otherFormes": [
        "Slugsa-Base"
      ],
      "formeOrder": [
        "Slugsa",
        "Slugsa-Base"
      ],
      "heightm": 0.06999999999999999,
      "evos": [
        "Sandcargo"
      ]
    },
    "sandcargo": {
      "num": 9201,
      "name": "Sandcargo",
      "baseForme": "",
      "types": [
        "Water",
        "Ground"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 50,
        "def": 120,
        "spa": 90,
        "spd": 80,
        "spe": 30
      },
      "abilities": {
        "0": "Magma Armor",
        "1": "Flame Body",
        "H": "Weak Armor"
      },
      "weightkg": 55,
      "eggGroups": [
        "AMORPHOUS"
      ],
      "otherFormes": [
        "Sandcargo-Base"
      ],
      "formeOrder": [
        "Sandcargo",
        "Sandcargo-Base"
      ],
      "heightm": 0.08499999999999999,
      "prevo": "Slugsa"
    },
    "tinkaglaze": {
      "num": 9590,
      "name": "Tinkaglaze",
      "baseForme": "Strawberry",
      "types": [
        "Fairy",
        "Fire"
      ],
      "baseStats": {
        "hp": 85,
        "atk": 75,
        "def": 77,
        "spa": 70,
        "spd": 105,
        "spe": 94
      },
      "abilities": {
        "0": "Mold Breaker",
        "1": "Own Tempo",
        "H": "Pickpocket"
      },
      "weightkg": 112.8,
      "eggGroups": [
        "FAIRY"
      ],
      "otherFormes": [
        "Tinkaglaze-Kiwi",
        "Tinkaglaze-secondaryberry"
      ],
      "formeOrder": [
        "Tinkaglaze",
        "Tinkaglaze-Kiwi",
        "Tinkaglaze-secondaryberry"
      ],
      "heightm": 0.04,
      "prevo": "Tinkatuff"
    },
    "tinkaglazekiwi": {
      "num": 9590,
      "name": "Tinkaglaze-Kiwi",
      "baseSpecies": "Tinkaglaze",
      "forme": "Kiwi",
      "types": [
        "Fairy",
        "Grass"
      ],
      "baseStats": {
        "hp": 85,
        "atk": 75,
        "def": 77,
        "spa": 70,
        "spd": 105,
        "spe": 94
      },
      "abilities": {
        "0": "Mold Breaker",
        "1": "Own Tempo",
        "H": "Pickpocket"
      },
      "weightkg": 112.8,
      "eggGroups": [
        "FAIRY"
      ],
      "heightm": 0.04,
      "prevo": "Tinkatuff",
      "changesFrom": "Tinkaglaze"
    },
    "tinkaglazeblueberry": {
      "num": 9590,
      "name": "Tinkaglaze-secondaryberry",
      "baseSpecies": "Tinkaglaze",
      "forme": "Blueberry",
      "types": [
        "Fairy",
        "Water"
      ],
      "baseStats": {
        "hp": 85,
        "atk": 75,
        "def": 77,
        "spa": 70,
        "spd": 105,
        "spe": 94
      },
      "abilities": {
        "0": "Mold Breaker",
        "1": "Own Tempo",
        "H": "Pickpocket"
      },
      "weightkg": 112.8,
      "eggGroups": [
        "FAIRY"
      ],
      "heightm": 0.04,
      "prevo": "Tinkatuff",
      "changesFrom": "Tinkaglaze"
    },
    "scorpeon": {
      "num": 9591,
      "name": "Scorpeon",
      "baseForme": "",
      "types": [
        "Poison",
        ""
      ],
      "baseStats": {
        "hp": 95,
        "atk": 65,
        "def": 60,
        "spa": 65,
        "spd": 130,
        "spe": 110
      },
      "abilities": {
        "0": "Water Absorb",
        "H": "Hydration"
      },
      "weightkg": 29,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Scorpeon-Base"
      ],
      "formeOrder": [
        "Scorpeon",
        "Scorpeon-Base"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Eevee"
    },
    "scaleon": {
      "num": 9592,
      "name": "Scaleon",
      "baseForme": "",
      "types": [
        "Dragon",
        ""
      ],
      "baseStats": {
        "hp": 65,
        "atk": 110,
        "def": 65,
        "spa": 130,
        "spd": 60,
        "spe": 95
      },
      "abilities": {
        "0": "Water Absorb",
        "H": "Hydration"
      },
      "weightkg": 29,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Scaleon-Base"
      ],
      "formeOrder": [
        "Scaleon",
        "Scaleon-Base"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Eevee"
    },
    "guardeon": {
      "num": 9593,
      "name": "Guardeon",
      "baseForme": "",
      "types": [
        "Steel",
        ""
      ],
      "baseStats": {
        "hp": 110,
        "atk": 65,
        "def": 130,
        "spa": 65,
        "spd": 95,
        "spe": 60
      },
      "abilities": {
        "0": "Water Absorb",
        "H": "Hydration"
      },
      "weightkg": 29,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Guardeon-Base"
      ],
      "formeOrder": [
        "Guardeon",
        "Guardeon-Base"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Eevee"
    },
    "brawleon": {
      "num": 9594,
      "name": "Brawleon",
      "baseForme": "",
      "types": [
        "Fighting",
        ""
      ],
      "baseStats": {
        "hp": 110,
        "atk": 130,
        "def": 95,
        "spa": 65,
        "spd": 65,
        "spe": 60
      },
      "abilities": {
        "0": "Water Absorb",
        "H": "Hydration"
      },
      "weightkg": 29,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Brawleon-Base"
      ],
      "formeOrder": [
        "Brawleon",
        "Brawleon-Base"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Eevee"
    },
    "crysteon": {
      "num": 9595,
      "name": "Crysteon",
      "baseForme": "",
      "types": [
        "Rock",
        ""
      ],
      "baseStats": {
        "hp": 95,
        "atk": 110,
        "def": 130,
        "spa": 60,
        "spd": 65,
        "spe": 65
      },
      "abilities": {
        "0": "Water Absorb",
        "H": "Hydration"
      },
      "weightkg": 29,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Crysteon-Base"
      ],
      "formeOrder": [
        "Crysteon",
        "Crysteon-Base"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Eevee"
    },
    "carrion": {
      "num": 9596,
      "name": "Carrion",
      "baseForme": "",
      "types": [
        "Ghost",
        ""
      ],
      "baseStats": {
        "hp": 130,
        "atk": 65,
        "def": 95,
        "spa": 65,
        "spd": 110,
        "spe": 60
      },
      "abilities": {
        "0": "Cursed Body",
        "H": "Pressure"
      },
      "weightkg": 15,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Carrion-Base"
      ],
      "formeOrder": [
        "Carrion",
        "Carrion-Base"
      ],
      "heightm": 0.04,
      "prevo": "Eevee"
    },
    "nimbeon": {
      "num": 9597,
      "name": "Nimbeon",
      "baseForme": "",
      "types": [
        "Flying",
        ""
      ],
      "baseStats": {
        "hp": 60,
        "atk": 65,
        "def": 65,
        "spa": 110,
        "spd": 65,
        "spe": 130
      },
      "abilities": {
        "0": "Natural Cure",
        "H": "Cloud Nine"
      },
      "weightkg": 20.6,
      "eggGroups": [
        "FLYING",
        "FIELD"
      ],
      "otherFormes": [
        "Nimbeon-Base"
      ],
      "formeOrder": [
        "Nimbeon",
        "Nimbeon-Base"
      ],
      "heightm": 0.08,
      "prevo": "Eevee"
    },
    "sandeon": {
      "num": 9598,
      "name": "Sandeon",
      "baseForme": "",
      "types": [
        "Ground",
        ""
      ],
      "baseStats": {
        "hp": 65,
        "atk": 60,
        "def": 65,
        "spa": 130,
        "spd": 65,
        "spe": 110
      },
      "abilities": {
        "0": "Water Absorb",
        "H": "Hydration"
      },
      "weightkg": 29,
      "eggGroups": [
        "FIELD"
      ],
      "otherFormes": [
        "Sandeon-Base"
      ],
      "formeOrder": [
        "Sandeon",
        "Sandeon-Base"
      ],
      "heightm": 0.11000000000000001,
      "prevo": "Eevee"
    },
    "mktini": {
      "num": 10002,
      "name": "MkTini",
      "baseForme": "",
      "types": [
        "Dragon",
        "Steel"
      ],
      "baseStats": {
        "hp": 41,
        "atk": 64,
        "def": 45,
        "spa": 50,
        "spd": 50,
        "spe": 50
      },
      "abilities": {
        "0": "Shed Skin",
        "H": "Marvel Scale"
      },
      "weightkg": 3.3,
      "eggGroups": [
        "WATER_ONE",
        "DRAGON"
      ],
      "otherFormes": [
        "MkTini-Base"
      ],
      "formeOrder": [
        "MkTini",
        "MkTini-Base"
      ],
      "heightm": 0.09,
      "evos": [
        "MkAir"
      ]
    },
    "mkair": {
      "num": 10003,
      "name": "MkAir",
      "baseForme": "",
      "types": [
        "Dragon",
        "Steel"
      ],
      "baseStats": {
        "hp": 61,
        "atk": 84,
        "def": 65,
        "spa": 70,
        "spd": 70,
        "spe": 70
      },
      "abilities": {
        "0": "Shed Skin",
        "H": "Marvel Scale"
      },
      "weightkg": 16.5,
      "eggGroups": [
        "WATER_ONE",
        "DRAGON"
      ],
      "otherFormes": [
        "MkAir-Base"
      ],
      "formeOrder": [
        "MkAir",
        "MkAir-Base"
      ],
      "heightm": 0.13999999999999999,
      "prevo": "MkTini",
      "evos": [
        "MkNite"
      ]
    },
    "mknite": {
      "num": 10004,
      "name": "MkNite",
      "baseForme": "",
      "types": [
        "Dragon",
        "Steel"
      ],
      "baseStats": {
        "hp": 91,
        "atk": 134,
        "def": 95,
        "spa": 100,
        "spd": 100,
        "spe": 80
      },
      "abilities": {
        "0": "Inner Focus",
        "H": "Multiscale"
      },
      "weightkg": 210,
      "eggGroups": [
        "WATER_ONE",
        "DRAGON"
      ],
      "otherFormes": [
        "MkNite-Base"
      ],
      "formeOrder": [
        "MkNite",
        "MkNite-Base"
      ],
      "heightm": 0.22000000000000003,
      "prevo": "MkAir"
    },
    "gizor": {
      "num": 10005,
      "name": "Gizor",
      "baseForme": "",
      "types": [
        "Steel",
        "Psychic"
      ],
      "baseStats": {
        "hp": 57,
        "atk": 24,
        "def": 86,
        "spa": 24,
        "spd": 86,
        "spe": 23
      },
      "abilities": {
        "0": "Levitate",
        "1": "Heatproof",
        "H": "Heavy Metal"
      },
      "weightkg": 60.5,
      "eggGroups": [
        "MINERAL"
      ],
      "otherFormes": [
        "Gizor-Base"
      ],
      "formeOrder": [
        "Gizor",
        "Gizor-Base"
      ],
      "heightm": 0.08,
      "evos": [
        "Giazong"
      ]
    },
    "giazong": {
      "num": 10006,
      "name": "Giazong",
      "baseForme": "",
      "types": [
        "Steel",
        "Psychic"
      ],
      "baseStats": {
        "hp": 67,
        "atk": 89,
        "def": 116,
        "spa": 79,
        "spd": 116,
        "spe": 33
      },
      "abilities": {
        "0": "Levitate",
        "1": "Heatproof",
        "H": "Heavy Metal"
      },
      "weightkg": 187,
      "eggGroups": [
        "MINERAL"
      ],
      "otherFormes": [
        "Giazong-Base"
      ],
      "formeOrder": [
        "Giazong",
        "Giazong-Base"
      ],
      "heightm": 0.15,
      "prevo": "Gizor"
    },
    "fractooth": {
      "num": 10007,
      "name": "Fractooth",
      "baseForme": "",
      "types": [
        "Water",
        "Ice"
      ],
      "baseStats": {
        "hp": 85,
        "atk": 90,
        "def": 80,
        "spa": 40,
        "spd": 45,
        "spe": 50
      },
      "abilities": {
        "0": "Water Veil",
        "1": "Ice Body",
        "H": "Slush Rush"
      },
      "weightkg": 6.9,
      "eggGroups": [
        "WATER_THREE"
      ],
      "otherFormes": [
        "Fractooth-Base"
      ],
      "formeOrder": [
        "Fractooth",
        "Fractooth-Base"
      ],
      "heightm": 0.072,
      "evos": [
        "Frostodon",
        "Frostodon"
      ]
    },
    "frostodon": {
      "num": 10008,
      "name": "Frostodon",
      "baseForme": "",
      "types": [
        "Water",
        "Ice"
      ],
      "baseStats": {
        "hp": 105,
        "atk": 130,
        "def": 100,
        "spa": 60,
        "spd": 65,
        "spe": 70
      },
      "abilities": {
        "0": "Water Veil",
        "1": "Ice Body",
        "H": "Slush Rush"
      },
      "weightkg": 6.9,
      "eggGroups": [
        "WATER_THREE"
      ],
      "otherFormes": [
        "Frostodon-Base"
      ],
      "formeOrder": [
        "Frostodon",
        "Frostodon-Base"
      ],
      "heightm": 0.12,
      "prevo": "Fractooth"
    },
    "itzaludon": {
      "num": 10009,
      "name": "Itzaludon",
      "baseForme": "",
      "types": [
        "Steel",
        "Dragon"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 95,
        "def": 115,
        "spa": 120,
        "spd": 50,
        "spe": 85
      },
      "abilities": {
        "0": "Light Metal",
        "1": "Heavy Metal",
        "H": "Stalwart"
      },
      "weightkg": 40,
      "eggGroups": [
        "MINERAL",
        "DRAGON"
      ],
      "otherFormes": [
        "Itzaludon-Base"
      ],
      "formeOrder": [
        "Itzaludon",
        "Itzaludon-Base"
      ],
      "heightm": 0.13999999999999999
    },
    "thillarudon": {
      "num": 10010,
      "name": "Thillarudon",
      "baseForme": "",
      "types": [
        "Steel",
        "Dragon"
      ],
      "baseStats": {
        "hp": 70,
        "atk": 95,
        "def": 115,
        "spa": 120,
        "spd": 50,
        "spe": 85
      },
      "abilities": {
        "0": "Light Metal",
        "1": "Heavy Metal",
        "H": "Stalwart"
      },
      "weightkg": 40,
      "eggGroups": [
        "MINERAL",
        "DRAGON"
      ],
      "otherFormes": [
        "Thillarudon-Base"
      ],
      "formeOrder": [
        "Thillarudon",
        "Thillarudon-Base"
      ],
      "heightm": 0.13999999999999999,
      "prevo": "Itzaludon"
    },
    "cococute": {
      "num": 10012,
      "name": "Cococute",
      "baseForme": "",
      "types": [
        "Grass",
        "Water"
      ],
      "baseStats": {
        "hp": 60,
        "atk": 40,
        "def": 80,
        "spa": 60,
        "spd": 45,
        "spe": 40
      },
      "abilities": {
        "0": "Chlorophyll",
        "H": "Harvest"
      },
      "weightkg": 2.5,
      "eggGroups": [
        "GRASS"
      ],
      "otherFormes": [
        "Cococute-Base"
      ],
      "formeOrder": [
        "Cococute",
        "Cococute-Base"
      ],
      "heightm": 0.06,
      "evos": [
        "Cocoareca"
      ]
    },
    "cocoareca": {
      "num": 10013,
      "name": "Cocoareca",
      "baseForme": "",
      "types": [
        "Grass",
        "Water"
      ],
      "baseStats": {
        "hp": 95,
        "atk": 95,
        "def": 85,
        "spa": 125,
        "spd": 75,
        "spe": 55
      },
      "abilities": {
        "0": "Chlorophyll",
        "H": "Harvest"
      },
      "weightkg": 120,
      "eggGroups": [
        "GRASS"
      ],
      "otherFormes": [
        "Cocoareca-Base"
      ],
      "formeOrder": [
        "Cocoareca",
        "Cocoareca-Base"
      ],
      "heightm": 0.24,
      "prevo": "Cococute",
      "evos": [
        "Cocolada"
      ]
    },
    "cocolada": {
      "num": 10014,
      "name": "Cocolada",
      "baseForme": "",
      "types": [
        "Grass",
        "Water"
      ],
      "baseStats": {
        "hp": 95,
        "atk": 95,
        "def": 85,
        "spa": 125,
        "spd": 75,
        "spe": 55
      },
      "abilities": {
        "0": "Chlorophyll",
        "H": "Harvest"
      },
      "weightkg": 120,
      "eggGroups": [
        "GRASS"
      ],
      "otherFormes": [
        "Cocolada-Base"
      ],
      "formeOrder": [
        "Cocolada",
        "Cocolada-Base"
      ],
      "heightm": 0.24,
      "prevo": "Cococute"
    },
    "noxel": {
      "num": 10015,
      "name": "Noxel",
      "baseForme": "",
      "types": [
        "Electric",
        "Dark"
      ],
      "baseStats": {
        "hp": 40,
        "atk": 38,
        "def": 35,
        "spa": 54,
        "spd": 35,
        "spe": 40
      },
      "abilities": {
        "0": "Rattled",
        "1": "Static",
        "H": "Klutz"
      },
      "weightkg": 11,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "otherFormes": [
        "Noxel-Base"
      ],
      "formeOrder": [
        "Noxel",
        "Noxel-Base"
      ],
      "heightm": 0.06999999999999999,
      "evos": [
        "Punktricity form:amped",
        "Punktricity form:lowkey"
      ]
    },
    "punktricity": {
      "num": 10016,
      "name": "Punktricity",
      "baseForme": "Amped",
      "types": [
        "Electric",
        "Dark"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 98,
        "def": 70,
        "spa": 114,
        "spd": 70,
        "spe": 75
      },
      "abilities": {
        "0": "Punk Rock",
        "1": "Plus",
        "H": "Technician"
      },
      "weightkg": 40,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "otherFormes": [
        "Punktricity-Lowkey"
      ],
      "formeOrder": [
        "Punktricity",
        "Punktricity-Lowkey"
      ],
      "heightm": 0.16,
      "prevo": "Noxel"
    },
    "punktricitylowkey": {
      "num": 10016,
      "name": "Punktricity-Lowkey",
      "baseSpecies": "Punktricity",
      "forme": "Lowkey",
      "types": [
        "Electric",
        "Dark"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 98,
        "def": 70,
        "spa": 114,
        "spd": 70,
        "spe": 75
      },
      "abilities": {
        "0": "Punk Rock",
        "1": "Minus",
        "H": "Technician"
      },
      "weightkg": 40,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "heightm": 0.16,
      "prevo": "Toxel",
      "changesFrom": "Punktricity"
    },
    "punktricitygmax": {
      "num": 10016,
      "name": "Punktricity-Gmax",
      "baseSpecies": "Punktricity",
      "forme": "Gmax",
      "types": [
        "Electric",
        "Dark"
      ],
      "baseStats": {
        "hp": 75,
        "atk": 98,
        "def": 70,
        "spa": 114,
        "spd": 70,
        "spe": 75
      },
      "abilities": {
        "0": "Punk Rock",
        "1": "Plus",
        "H": "Technician"
      },
      "weightkg": 40,
      "eggGroups": [
        "HUMAN_LIKE"
      ],
      "heightm": 0.16,
      "prevo": "Noxel"
    },
    "porygont": {
      "num": 10017,
      "gen": 9,
      "name": "PorygonT",
      "baseForme": "",
      "types": [
        "Normal",
        ""
      ],
      "baseStats": {
        "hp": 115,
        "atk": 90,
        "def": 105,
        "spa": 125,
        "spd": 105,
        "spe": 60
      },
      "abilities": {
        "0": "Trace",
        "1": "Download",
        "H": "Analytic"
      },
      "weightkg": 36.5,
      "eggGroups": [
        "UNDISCOVERED"
      ],
      "otherFormes": [
        "PorygonT-Base"
      ],
      "formeOrder": [
        "PorygonT",
        "PorygonT-Base"
      ],
      "heightm": 0.06
    }
  }