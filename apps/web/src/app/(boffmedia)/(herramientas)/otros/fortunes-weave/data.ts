export const FORTUNES_WEAVE_SOURCE_URL = "https://www.polygon.com/fire-emblem-fortunes-weave-recruitable-characters-all-support-level/"

export const ROUTE_IDS = ["cai", "dietrich", "theodora", "leda"] as const
export type RouteId = (typeof ROUTE_IDS)[number]

export const ROUTES: { id: RouteId; name: string }[] = [
  { id: "cai", name: "Cai" },
  { id: "dietrich", name: "Dietrich" },
  { id: "theodora", name: "Theodora" },
  { id: "leda", name: "Leda" },
]

export const RECRUITMENT_TYPES = ["auto","dialogue","gold","gold_paralogue","item","item_paralogue","paralogue","paralogue_dialogue","quest","quest_dialogue","support","unavailable"] as const
export type RecruitmentType = (typeof RECRUITMENT_TYPES)[number]

export type RecruitmentCondition =
  | { kind: "automatic" }
  | { kind: "recruitmentTutorial" }
  | { kind: "automaticChapter"; chapter: number }
  | { kind: "paralogue"; name: string }
  | { kind: "pay"; amount: number }
  | { kind: "recruitmentQuest" }
  | { kind: "questCount"; count: number }
  | { kind: "completeQuest"; name: string }
  | { kind: "giveItem"; count: number; item: string }
  | { kind: "suitableItem" }
  | { kind: "answerYesThreeTimes" }
  | { kind: "chooseTails" }
  | { kind: "answerOptions"; options: string[] }
  | { kind: "negotiatePayment" }
  | { kind: "answerQuestionThreeTimes" }

export interface RouteRecruitment {
  available: boolean
  initiallyRecruited: boolean
  type: RecruitmentType
  supportLevel: number | null
  renownLevel: number | null
  conditions: RecruitmentCondition[]
  searchText: string
}

export interface WeaveCharacter {
  id: string
  name: string
  routes: Record<RouteId, RouteRecruitment>
}

export const CHARACTERS: WeaveCharacter[] = [
  {
    "id": "cai",
    "name": "Cai",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      },
      "dietrich": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "theodora": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "leda": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      }
    }
  },
  {
    "id": "tialla",
    "name": "Tialla",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold_paralogue",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Cai"
          },
          {
            "kind": "pay",
            "amount": 3000
          }
        ],
        "searchText": "Support 3; Renown 9; Clear Cai's Paralogue; Pay 3,000G"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold_paralogue",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Cai"
          },
          {
            "kind": "pay",
            "amount": 3000
          }
        ],
        "searchText": "Support 3; Renown 10; Clear Cai's Paralogue; Pay 3,000G"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "gold_paralogue",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Cai"
          },
          {
            "kind": "pay",
            "amount": 3000
          }
        ],
        "searchText": "Support 3; Renown 8; Clear Cai's Paralogue; Pay 3,000G"
      }
    }
  },
  {
    "id": "peter",
    "name": "Peter",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 8; Complete recruitment quest"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 7; Complete recruitment quest"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 10; Complete recruitment quest"
      }
    }
  },
  {
    "id": "ultand",
    "name": "Ultand",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automaticChapter",
            "chapter": 6
          }
        ],
        "searchText": "Automatic in Chapter 6"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 5,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 5; Complete recruitment quest"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 6; Complete recruitment quest"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 8; Complete recruitment quest"
      }
    }
  },
  {
    "id": "gaitz",
    "name": "Gaitz",
    "routes": {
      "cai": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "paralogue",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Bertrand"
          },
          {
            "kind": "completeQuest",
            "name": "They Have Lost"
          }
        ],
        "searchText": "Support 3; Renown 10; Clear Bertrand's Paralogue; Complete They Have Lost"
      },
      "theodora": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "leda": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      }
    }
  },
  {
    "id": "jester",
    "name": "Jester",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "questCount",
            "count": 3
          }
        ],
        "searchText": "Support 3; Renown 10; Complete 3 quests"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "questCount",
            "count": 3
          }
        ],
        "searchText": "Support 3; Renown 6; Complete 3 quests"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "questCount",
            "count": 3
          }
        ],
        "searchText": "Support 3; Renown 9; Complete 3 quests"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "questCount",
            "count": 3
          }
        ],
        "searchText": "Support 3; Renown 10; Complete 3 quests"
      }
    }
  },
  {
    "id": "goliath",
    "name": "Goliath",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Giant's Meat"
          }
        ],
        "searchText": "Support 3; Renown 7; Give 3 Giant's Meat"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Giant's Meat"
          }
        ],
        "searchText": "Support 3; Renown 6; Give 3 Giant's Meat"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Giant's Meat"
          }
        ],
        "searchText": "Support 3; Renown 9; Give 3 Giant's Meat"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Giant's Meat"
          }
        ],
        "searchText": "Support 3; Renown 10; Give 3 Giant's Meat"
      }
    }
  },
  {
    "id": "dante",
    "name": "Dante",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "pay",
            "amount": 8000
          }
        ],
        "searchText": "Support 3; Renown 10; Pay 8,000G"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 2,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "pay",
            "amount": 8000
          }
        ],
        "searchText": "Support 2; Renown 8; Pay 8,000G"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "pay",
            "amount": 8000
          }
        ],
        "searchText": "Support 3; Renown 6; Pay 8,000G"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "pay",
            "amount": 8000
          }
        ],
        "searchText": "Support 3; Renown 10; Pay 8,000G"
      }
    }
  },
  {
    "id": "dietrich",
    "name": "Dietrich",
    "routes": {
      "cai": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      },
      "theodora": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "leda": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      }
    }
  },
  {
    "id": "fabio",
    "name": "Fabio",
    "routes": {
      "cai": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      },
      "theodora": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item_paralogue",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Dietrich"
          },
          {
            "kind": "completeQuest",
            "name": "They Have Lost"
          },
          {
            "kind": "suitableItem"
          }
        ],
        "searchText": "Support 3; Renown 9; Clear Dietrich's Paralogue; Complete They Have Lost; Give suitable item"
      }
    }
  },
  {
    "id": "esmeralda",
    "name": "Esmeralda",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 7; Complete recruitment quest"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 9; Complete recruitment quest"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 6; Complete recruitment quest"
      }
    }
  },
  {
    "id": "mikaela",
    "name": "Mikaela",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 5,
        "conditions": [
          {
            "kind": "pay",
            "amount": 3000
          }
        ],
        "searchText": "Support 3; Renown 5; Pay 3,000G"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "pay",
            "amount": 3000
          }
        ],
        "searchText": "Support 3; Renown 8; Pay 3,000G"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "pay",
            "amount": 3000
          }
        ],
        "searchText": "Support 3; Renown 6; Pay 3,000G"
      }
    }
  },
  {
    "id": "diego",
    "name": "Diego",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "paralogue",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Orchel"
          }
        ],
        "searchText": "Support 3; Renown 10; Clear Orchel's Paralogue"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "paralogue",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Orchel"
          }
        ],
        "searchText": "Support 3; Renown 9; Clear Orchel's Paralogue"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "paralogue",
        "supportLevel": 2,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Orchel"
          }
        ],
        "searchText": "Support 2; Renown 8; Clear Orchel's Paralogue"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "paralogue",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Orchel"
          }
        ],
        "searchText": "Support 3; Renown 8; Clear Orchel's Paralogue"
      }
    }
  },
  {
    "id": "loretta",
    "name": "Loretta",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Iron Swords"
          }
        ],
        "searchText": "Support 3; Renown 7; Give 3 Iron Swords"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Iron Swords"
          }
        ],
        "searchText": "Support 3; Renown 9; Give 3 Iron Swords"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 5,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Iron Swords"
          }
        ],
        "searchText": "Support 3; Renown 5; Give 3 Iron Swords"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 5,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Iron Swords"
          }
        ],
        "searchText": "Support 3; Renown 5; Give 3 Iron Swords"
      }
    }
  },
  {
    "id": "seteth",
    "name": "Seteth",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 6; Complete recruitment quest"
      },
      "dietrich": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 6; Complete recruitment quest"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 10; Complete recruitment quest"
      }
    }
  },
  {
    "id": "ninae",
    "name": "Ninae",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 1,
            "item": "Paradise Fish"
          }
        ],
        "searchText": "Support 3; Renown 6; Give 1 Paradise Fish"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 1,
            "item": "Paradise Fish"
          }
        ],
        "searchText": "Support 3; Renown 8; Give 1 Paradise Fish"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 1,
            "item": "Paradise Fish"
          }
        ],
        "searchText": "Support 3; Renown 6; Give 1 Paradise Fish"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 1,
            "item": "Paradise Fish"
          }
        ],
        "searchText": "Support 3; Renown 8; Give 1 Paradise Fish"
      }
    }
  },
  {
    "id": "theodora",
    "name": "Theodora",
    "routes": {
      "cai": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "dietrich": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      },
      "leda": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      }
    }
  },
  {
    "id": "bonaventure",
    "name": "Bonaventure",
    "routes": {
      "cai": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "dietrich": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      },
      "leda": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      }
    }
  },
  {
    "id": "tobias",
    "name": "Tobias",
    "routes": {
      "cai": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "dietrich": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      },
      "leda": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      }
    }
  },
  {
    "id": "lilian",
    "name": "Lilian",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 2,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "pay",
            "amount": 5000
          }
        ],
        "searchText": "Support 2; Renown 8; Pay 5,000G"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 2,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "pay",
            "amount": 5000
          }
        ],
        "searchText": "Support 2; Renown 8; Pay 5,000G"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 2,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "pay",
            "amount": 5000
          }
        ],
        "searchText": "Support 2; Renown 7; Pay 5,000G"
      }
    }
  },
  {
    "id": "lysander",
    "name": "Lysander",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 5,
            "item": "Iron Spears"
          }
        ],
        "searchText": "Support 3; Renown 8; Give 5 Iron Spears"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 5,
            "item": "Iron Spears"
          }
        ],
        "searchText": "Support 3; Renown 6; Give 5 Iron Spears"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 5,
            "item": "Iron Spears"
          }
        ],
        "searchText": "Support 3; Renown 7; Give 5 Iron Spears"
      }
    }
  },
  {
    "id": "ursula",
    "name": "Ursula",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "paralogue_dialogue",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Talimun"
          },
          {
            "kind": "answerYesThreeTimes"
          }
        ],
        "searchText": "Support 3; Renown 10; Clear Talimun's Paralogue; Answer Yes three times"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "paralogue_dialogue",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Talimun"
          },
          {
            "kind": "answerYesThreeTimes"
          }
        ],
        "searchText": "Support 3; Renown 7; Clear Talimun's Paralogue; Answer Yes three times"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "paralogue_dialogue",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Talimun"
          },
          {
            "kind": "answerYesThreeTimes"
          }
        ],
        "searchText": "Support 3; Renown 9; Clear Talimun's Paralogue; Answer Yes three times"
      },
      "leda": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      }
    }
  },
  {
    "id": "ludia",
    "name": "Ludia",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 9; Complete recruitment quest"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 9; Complete recruitment quest"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 7; Complete recruitment quest"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 7; Complete recruitment quest"
      }
    }
  },
  {
    "id": "simon",
    "name": "Simon",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "dialogue",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "chooseTails"
          }
        ],
        "searchText": "Support 3; Renown 8; Choose Tails"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "dialogue",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "chooseTails"
          }
        ],
        "searchText": "Support 3; Renown 7; Choose Tails"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "dialogue",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "chooseTails"
          }
        ],
        "searchText": "Support 3; Renown 7; Choose Tails"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "dialogue",
        "supportLevel": 3,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "chooseTails"
          }
        ],
        "searchText": "Support 3; Renown 6; Choose Tails"
      }
    }
  },
  {
    "id": "fianna",
    "name": "Fianna",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "pay",
            "amount": 3000
          }
        ],
        "searchText": "Support 3; Renown 8; Pay 3,000G"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "pay",
            "amount": 3000
          }
        ],
        "searchText": "Support 3; Renown 7; Pay 3,000G"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "pay",
            "amount": 3000
          }
        ],
        "searchText": "Support 3; Renown 9; Pay 3,000G"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 5,
        "conditions": [
          {
            "kind": "pay",
            "amount": 3000
          }
        ],
        "searchText": "Support 3; Renown 5; Pay 3,000G"
      }
    }
  },
  {
    "id": "leda",
    "name": "Leda",
    "routes": {
      "cai": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "dietrich": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "theodora": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      }
    }
  },
  {
    "id": "buccar",
    "name": "Buccar",
    "routes": {
      "cai": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "paralogue",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Leda"
          }
        ],
        "searchText": "Support 3; Renown 8; Clear Leda's Paralogue"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "paralogue",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Leda"
          }
        ],
        "searchText": "Support 3; Renown 8; Clear Leda's Paralogue"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      }
    }
  },
  {
    "id": "sirocco",
    "name": "Sirocco",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 9; Complete recruitment quest"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 3; Renown 9; Complete recruitment quest"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 1,
        "renownLevel": 5,
        "conditions": [
          {
            "kind": "recruitmentQuest"
          }
        ],
        "searchText": "Support 1; Renown 5; Complete recruitment quest"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      }
    }
  },
  {
    "id": "olympia",
    "name": "Olympia",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "questCount",
            "count": 3
          }
        ],
        "searchText": "Support 3; Renown 8; Complete 3 quests"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "questCount",
            "count": 3
          }
        ],
        "searchText": "Support 3; Renown 6; Complete 3 quests"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "questCount",
            "count": 3
          }
        ],
        "searchText": "Support 3; Renown 9; Complete 3 quests"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      }
    }
  },
  {
    "id": "mu",
    "name": "Mu",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Glirmosa"
          }
        ],
        "searchText": "Support 3; Renown 9; Give 3 Glirmosa"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Glirmosa"
          }
        ],
        "searchText": "Support 3; Renown 7; Give 3 Glirmosa"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Glirmosa"
          }
        ],
        "searchText": "Support 3; Renown 9; Give 3 Glirmosa"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "automatic"
          }
        ],
        "searchText": "Automatic"
      }
    }
  },
  {
    "id": "nezha",
    "name": "Nezha",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Sandworm Meat"
          }
        ],
        "searchText": "Support 3; Renown 6; Give 3 Sandworm Meat"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Sandworm Meat"
          }
        ],
        "searchText": "Support 3; Renown 10; Give 3 Sandworm Meat"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 2,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Sandworm Meat"
          }
        ],
        "searchText": "Support 2; Renown 6; Give 3 Sandworm Meat"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Sandworm Meat"
          }
        ],
        "searchText": "Support 3; Renown 9; Give 3 Sandworm Meat"
      }
    }
  },
  {
    "id": "sha-lan",
    "name": "Sha Lan",
    "routes": {
      "cai": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "paralogue_dialogue",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Anatolia"
          },
          {
            "kind": "answerOptions",
            "options": [
              "Saramis",
              "Da Mina",
              "Grounded Ship"
            ]
          }
        ],
        "searchText": "Support 3; Renown 10; Clear Anatolia's Paralogue; Answer Saramis / Da Mina / Grounded Ship"
      },
      "theodora": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "paralogue_dialogue",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Anatolia"
          },
          {
            "kind": "answerOptions",
            "options": [
              "Saramis",
              "Da Mina",
              "Grounded Ship"
            ]
          }
        ],
        "searchText": "Support 3; Renown 8; Clear Anatolia's Paralogue; Answer Saramis / Da Mina / Grounded Ship"
      }
    }
  },
  {
    "id": "dadao",
    "name": "Dadao",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 2,
            "item": "Kothar Gar"
          }
        ],
        "searchText": "Support 3; Renown 7; Give 2 Kothar Gar"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 2,
            "item": "Kothar Gar"
          }
        ],
        "searchText": "Support 3; Renown 10; Give 2 Kothar Gar"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 2,
        "renownLevel": 5,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 2,
            "item": "Kothar Gar"
          }
        ],
        "searchText": "Support 2; Renown 5; Give 2 Kothar Gar"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 2,
        "renownLevel": 5,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 2,
            "item": "Kothar Gar"
          }
        ],
        "searchText": "Support 2; Renown 5; Give 2 Kothar Gar"
      }
    }
  },
  {
    "id": "halvin",
    "name": "Halvin",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 5,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 10,
            "item": "Dates"
          }
        ],
        "searchText": "Support 3; Renown 5; Give 10 Dates"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 10,
            "item": "Dates"
          }
        ],
        "searchText": "Support 3; Renown 9; Give 10 Dates"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 10,
            "item": "Dates"
          }
        ],
        "searchText": "Support 3; Renown 7; Give 10 Dates"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 10,
            "item": "Dates"
          }
        ],
        "searchText": "Support 3; Renown 7; Give 10 Dates"
      }
    }
  },
  {
    "id": "guzran",
    "name": "Guzran",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "recruitmentTutorial"
          }
        ],
        "searchText": "Automatic (Recruitment Tutorial)"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [],
        "searchText": "Support 3; Renown 8"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [],
        "searchText": "Support 3; Renown 8"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "support",
        "supportLevel": 1,
        "renownLevel": 3,
        "conditions": [],
        "searchText": "Support 1; Renown 3"
      }
    }
  },
  {
    "id": "yang-jie",
    "name": "Yang Jie",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "dialogue",
        "supportLevel": 2,
        "renownLevel": 3,
        "conditions": [
          {
            "kind": "answerOptions",
            "options": [
              "Cheese",
              "Moon",
              "Potatoes"
            ]
          }
        ],
        "searchText": "Support 2; Renown 3; Answer Cheese / Moon / Potatoes"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "recruitmentTutorial"
          }
        ],
        "searchText": "Automatic (Recruitment Tutorial)"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "dialogue",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "answerOptions",
            "options": [
              "Cheese",
              "Moon",
              "Potatoes"
            ]
          }
        ],
        "searchText": "Support 3; Renown 9; Answer Cheese / Moon / Potatoes"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "dialogue",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "answerOptions",
            "options": [
              "Cheese",
              "Moon",
              "Potatoes"
            ]
          }
        ],
        "searchText": "Support 3; Renown 8; Answer Cheese / Moon / Potatoes"
      }
    }
  },
  {
    "id": "io",
    "name": "Io",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "pay",
            "amount": 4000
          }
        ],
        "searchText": "Support 3; Renown 10; Pay 4,000G"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 2,
        "renownLevel": 3,
        "conditions": [
          {
            "kind": "pay",
            "amount": 800
          }
        ],
        "searchText": "Support 2; Renown 3; Pay 800G"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "pay",
            "amount": 4000
          }
        ],
        "searchText": "Support 3; Renown 10; Pay 4,000G"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "gold",
        "supportLevel": 1,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "pay",
            "amount": 1500
          }
        ],
        "searchText": "Support 1; Renown 6; Pay 1,500G"
      }
    }
  },
  {
    "id": "peppe",
    "name": "Peppe",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "paralogue",
        "supportLevel": 1,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Bertrand"
          }
        ],
        "searchText": "Support 1; Renown 9; Clear Bertrand's Paralogue"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "paralogue",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Bertrand"
          }
        ],
        "searchText": "Support 3; Renown 8; Clear Bertrand's Paralogue"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "paralogue",
        "supportLevel": 2,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "paralogue",
            "name": "Bertrand"
          }
        ],
        "searchText": "Support 2; Renown 7; Clear Bertrand's Paralogue"
      },
      "leda": {
        "available": false,
        "initiallyRecruited": false,
        "type": "unavailable",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [],
        "searchText": "Not available"
      }
    }
  },
  {
    "id": "noctula",
    "name": "Noctula",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 1,
        "renownLevel": 4,
        "conditions": [],
        "searchText": "Support 1; Renown 4"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 1,
        "renownLevel": 6,
        "conditions": [],
        "searchText": "Support 1; Renown 6"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 1,
        "renownLevel": 3,
        "conditions": [],
        "searchText": "Support 1; Renown 3"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [],
        "searchText": "Support 3; Renown 8"
      }
    }
  },
  {
    "id": "sofia",
    "name": "Sofia",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [],
        "searchText": "Support 3; Renown 9"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [],
        "searchText": "Support 3; Renown 9"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "recruitmentTutorial"
          }
        ],
        "searchText": "Automatic (Recruitment Tutorial)"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "support",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [],
        "searchText": "Support 3; Renown 7"
      }
    }
  },
  {
    "id": "catania",
    "name": "Catania",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [],
        "searchText": "Support 3; Renown 10"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 1,
        "renownLevel": 8,
        "conditions": [],
        "searchText": "Support 1; Renown 8"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [],
        "searchText": "Support 3; Renown 7"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "auto",
        "supportLevel": null,
        "renownLevel": null,
        "conditions": [
          {
            "kind": "recruitmentTutorial"
          }
        ],
        "searchText": "Automatic (Recruitment Tutorial)"
      }
    }
  },
  {
    "id": "nydine",
    "name": "Nydine",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 1,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 2,
            "item": "Bronze Axes"
          }
        ],
        "searchText": "Support 1; Renown 6; Give 2 Bronze Axes"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 2,
        "renownLevel": 5,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 2,
            "item": "Bronze Axes"
          }
        ],
        "searchText": "Support 2; Renown 5; Give 2 Bronze Axes"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 5,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Iron Axes"
          }
        ],
        "searchText": "Support 3; Renown 5; Give 3 Iron Axes"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Iron Axes"
          }
        ],
        "searchText": "Support 3; Renown 10; Give 3 Iron Axes"
      }
    }
  },
  {
    "id": "zarcone",
    "name": "Zarcone",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "negotiatePayment"
          }
        ],
        "searchText": "Support 3; Renown 8; Negotiate payment"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "negotiatePayment"
          }
        ],
        "searchText": "Support 3; Renown 7; Negotiate payment"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 1,
        "renownLevel": 4,
        "conditions": [
          {
            "kind": "negotiatePayment"
          }
        ],
        "searchText": "Support 1; Renown 4; Negotiate payment"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "support",
        "supportLevel": 2,
        "renownLevel": 5,
        "conditions": [
          {
            "kind": "negotiatePayment"
          }
        ],
        "searchText": "Support 2; Renown 5; Negotiate payment"
      }
    }
  },
  {
    "id": "majide",
    "name": "Majide",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest_dialogue",
        "supportLevel": 2,
        "renownLevel": 5,
        "conditions": [
          {
            "kind": "answerQuestionThreeTimes"
          }
        ],
        "searchText": "Support 2; Renown 5; Answer question three times"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest_dialogue",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "answerQuestionThreeTimes"
          }
        ],
        "searchText": "Support 3; Renown 8; Answer question three times"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest_dialogue",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "answerQuestionThreeTimes"
          }
        ],
        "searchText": "Support 3; Renown 8; Answer question three times"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "quest_dialogue",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "answerQuestionThreeTimes"
          }
        ],
        "searchText": "Support 3; Renown 9; Answer question three times"
      }
    }
  },
  {
    "id": "benditz",
    "name": "Benditz",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [],
        "searchText": "Support 3; Renown 9"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 2,
        "renownLevel": 7,
        "conditions": [],
        "searchText": "Support 2; Renown 7"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 1,
        "renownLevel": 8,
        "conditions": [],
        "searchText": "Support 1; Renown 8"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "support",
        "supportLevel": 3,
        "renownLevel": 7,
        "conditions": [],
        "searchText": "Support 3; Renown 7"
      }
    }
  },
  {
    "id": "inyoni",
    "name": "Inyoni",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "pay",
            "amount": 6000
          }
        ],
        "searchText": "Support 3; Renown 8; Pay 6,000G"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "pay",
            "amount": 6000
          }
        ],
        "searchText": "Support 3; Renown 8; Pay 6,000G"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 1,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "pay",
            "amount": 4000
          }
        ],
        "searchText": "Support 1; Renown 9; Pay 4,000G"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "gold",
        "supportLevel": 1,
        "renownLevel": 7,
        "conditions": [
          {
            "kind": "pay",
            "amount": 3000
          }
        ],
        "searchText": "Support 1; Renown 7; Pay 3,000G"
      }
    }
  },
  {
    "id": "jasmine",
    "name": "Jasmine",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 1,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "pay",
            "amount": 2000
          }
        ],
        "searchText": "Support 1; Renown 8; Pay 2,000G"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "pay",
            "amount": 5000
          }
        ],
        "searchText": "Support 3; Renown 9; Pay 5,000G"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "gold",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "pay",
            "amount": 5000
          }
        ],
        "searchText": "Support 3; Renown 8; Pay 5,000G"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "gold",
        "supportLevel": 2,
        "renownLevel": 4,
        "conditions": [
          {
            "kind": "pay",
            "amount": 500
          }
        ],
        "searchText": "Support 2; Renown 4; Pay 500G"
      }
    }
  },
  {
    "id": "alexandra",
    "name": "Alexandra",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 2,
        "renownLevel": 7,
        "conditions": [],
        "searchText": "Support 2; Renown 7"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [],
        "searchText": "Support 3; Renown 8"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "support",
        "supportLevel": 1,
        "renownLevel": 6,
        "conditions": [],
        "searchText": "Support 1; Renown 6"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "support",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [],
        "searchText": "Support 3; Renown 10"
      }
    }
  },
  {
    "id": "nuzzuo",
    "name": "Nuzzuo",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 2,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Iron Bows"
          }
        ],
        "searchText": "Support 2; Renown 6; Give 3 Iron Bows"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 1,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 2,
            "item": "Iron Bows"
          }
        ],
        "searchText": "Support 1; Renown 9; Give 2 Iron Bows"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 1,
        "renownLevel": 6,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Iron Bows"
          }
        ],
        "searchText": "Support 1; Renown 6; Give 3 Iron Bows"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 9,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Iron Bows"
          }
        ],
        "searchText": "Support 3; Renown 9; Give 3 Iron Bows"
      }
    }
  },
  {
    "id": "kiroc",
    "name": "Kiroc",
    "routes": {
      "cai": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 8,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 8,
            "item": "Pure Water"
          }
        ],
        "searchText": "Support 3; Renown 8; Give 8 Pure Water"
      },
      "dietrich": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 1,
        "renownLevel": 4,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Pure Water"
          }
        ],
        "searchText": "Support 1; Renown 4; Give 3 Pure Water"
      },
      "theodora": {
        "available": true,
        "initiallyRecruited": false,
        "type": "item",
        "supportLevel": 3,
        "renownLevel": 10,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 8,
            "item": "Pure Water"
          }
        ],
        "searchText": "Support 3; Renown 10; Give 8 Pure Water"
      },
      "leda": {
        "available": true,
        "initiallyRecruited": true,
        "type": "item",
        "supportLevel": 1,
        "renownLevel": 4,
        "conditions": [
          {
            "kind": "giveItem",
            "count": 3,
            "item": "Pure Water"
          }
        ],
        "searchText": "Support 1; Renown 4; Give 3 Pure Water"
      }
    }
  }
]
