export const questTypes = [
    { value: "0", label: "Rescue client" },
    { value: "1", label: "Rescue target" },
    { value: "2", label: "Escort to target" },
    { value: "3", label: "Explore with client" },
    { value: "4", label: "Prospect with client" },
    { value: "5", label: "Guide client" },
    { value: "6", label: "Find target item" },
    { value: "7", label: "Deliver target item" },
    { value: "8", label: "Search for client" },
    { value: "9", label: "Steal from target" },
    { value: "12", label: "Challenge Request" },
    { value: "13", label: "Treasure hunt" },
]

export enum questTypeEnum {
    RESCUE_CLIENT = 0,
    RESCUE_TARGET = 1,
    ESCORT_TO_TARGET = 2,
    EXPLORE_WITH_CLIENT = 3,
    PROSPECT_WITH_CLIENT = 4,
    GUIDE_CLIENT = 5,
    FIND_TARGET_ITEM = 6,
    DELIVER_TARGET_ITEM = 7,
    SEARCH_FOR_CLIENT = 8,
    STEAL_FROM_TARGET = 9,
    CHALLENGE_REQUEST = 12,
    TREASURE_HUNT = 13,
}