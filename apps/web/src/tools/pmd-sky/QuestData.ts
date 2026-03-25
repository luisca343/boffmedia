

export const missionTypes = [
    {name: "RESCUE_CLIENT", mainType: 0, specialType: 0, clientIsTarget: true},
    {name: "RESCUE_TARGET", mainType: 1, specialType: 0},
    {name: "ESCORT_TO_TARGET", mainType: 2, specialType: 0},
    
    {name: "EXLORE_WITH_CLIENT", mainType: 3, clientIsTarget: true, subTypes: [
        {name: "NORMAL", specialType: 0},
        {name: "SEALED_CHAMBER", specialType: 1, specialFloor: 165},
        {name: "GOLDEN_CHAMBER", specialType: 2, specialFloor: 111},
        {name: "NEW_DUNGEON", specialType: 3, advancedOnly: true}
    ]},
    
    {name: "PROSPECT_WITH_CLIENT", mainType: 4, specialType: 0, useTargetItem: true, clientIsTarget: true},
    {name: "GUIDE_CLIENT", mainType: 5, specialType: 0, clientIsTarget: true},
    {name: "FIND_TARGET_ITEM", mainType: 6, specialType: 0, useTargetItem: true, clientIsTarget: true},
    {name: "DELIVER_TARGET_ITEM", mainType: 7, specialType: 0, useTargetItem: true, clientIsTarget: true},
    {name: "SEARCH_FOR_CLIENT", mainType: 8, specialType: 0},
    
    {name: "STEAL_FROM_TARGET", mainType: 9, useTargetItem: true, subTypes: [
        {name: "NORMAL", specialType: 0},
        {name: "TARGET_HIDDEN", specialType: 1},
        {name: "TARGET_RUNS", specialType: 2}
    ]},
    
    /*
    {name: "Arrest client (Magnemite)", advancedOnly: true, mainType: 10, forceClient: 81, subTypes: [
        {name: "Normal", specialType: 0},
        {name: "Escort", specialType: 4},
        {name: "Special Floor (broken)", specialType: 6, useTarget2: true, specialFloorFromList: "thievesden"},
        {name: "Monster House", specialType: 7}
    ]},
    
    // This is the same list as above, just with Magnezone.
    {name: "Arrest client (Magnezone)", advancedOnly: true, mainType: 10, forceClient: 504, subTypes: [
        {name: "Normal", specialType: 0},
        {name: "Escort", specialType: 4},
        {name: "Special Floor (broken)", specialType: 6, useTarget2: true, specialFloorFromList: "thievesden"},
        {name: "Monster House", specialType: 7}
    ]},*/
    
    {name: "CHALLENGE_REQUEST", mainType: 11, subTypes: [
        {name: "NORMAL", specialType: 0, useTarget2: true, advancedOnly: true, specialFloorFromList: "challengerequest"},
        {name: "Mewtwo", specialType: 1, forceClient: 150, forceTarget: 150, specialFloor: 145},
        {name: "Entei", specialType: 2, forceClient: 271, forceTarget: 271, specialFloor: 146},
        {name: "Raikou", specialType: 3, forceClient: 270, forceTarget: 270, specialFloor: 147},
        {name: "Suicune", specialType: 4, forceClient: 272, forceTarget: 272, specialFloor: 148},
        {name: "Jirachi", specialType: 5, forceClient: 417, forceTarget: 417, specialFloor: 149}
    ]},
    
    // You can use any client/target but the game prefers them to be the same.
    {name: "TREASURE_HUNT", mainType: 12, specialType: 0, forceClient: 422, forceTarget: 422, specialFloorFromList: "treasurehunt", noReward: true}
    
    // Let's just use game-generated codes, these are all weird and pointless to generate and stuff.
    //{name: "Unlock seven treasures dungeon (broken)", mainType: 13, specialType: 0}
] as {
    name: string,
    mainType: number,
    specialType?: number,
    advancedOnly?: boolean,
    clientIsTarget?: boolean,
    forceClient?: number,
    forceTarget?: number,
    useTargetItem?: boolean,

    subTypes?: {
        name: string,
        specialType: number,
        specialFloor?: number,
        advancedOnly?: boolean,
        
        forceClient?: number,
        forceTarget?: number,

        useTarget2?: boolean,
        specialFloorFromList?: string,
        noReward?: boolean
    }[]
}[]

export function getQuestData(commonTrans: (key: string) => string): { label: string, value: string, specialType?: number, subTypes?: { label: string, value: number, specialFloor?: number }[] }[] {
    return missionTypes.map((type) => {
        return { 
            label: commonTrans(`questTypes.${type.name}`), 
            value: type.mainType.toString(),
            realValue: type.mainType.toString(),
            specialType: type.specialType
        }
    })
}

export function getSubQuestData(mainType: number, commonTrans: (key: string) => string): { label: string, value: string, specialFloor?: number }[] {
    const type = missionTypes.find((type) => type.mainType === mainType)
    if (!type || !type.subTypes) return []
    
    const data = type.subTypes.map((subType) => {
        return { label: commonTrans(`questTypes.${subType.name}`),
             value: subType.specialType.toString(), specialFloor: subType.specialFloor }
    })

    return data
}

export function getUseTargetItem(mainType: number): boolean {
    const type = missionTypes.find((type) => type.mainType === mainType)
    return type?.useTargetItem || false
}

export function getForceClient(mainType: number, secondaryType?: number): number {
    const type = missionTypes.find((type) => type.mainType === mainType)
    if (secondaryType !== undefined && type?.subTypes) {
        const subType = type.subTypes.find((subType) => subType.specialType === secondaryType)
        return subType?.forceClient || 0
    }
    return type?.forceClient || 0
    
}

export function getForceTarget(mainType: number, secondaryType?: number): number {
    const type = missionTypes.find((type) => type.mainType === mainType)
    if (secondaryType !== undefined && type?.subTypes) {
        const subType = type.subTypes.find((subType) => subType.specialType === secondaryType)
        return subType?.forceTarget || 0
    }
    return type?.forceTarget || 0
}

export function getClientIsTarget(mainType: number): boolean {
    const type = missionTypes.find((type) => type.mainType === mainType)
    return type?.clientIsTarget || false
}


const rewardTypes = [
    {name: "CASH", value: 0},
    {name: "CASH_REWARD_ITEM", value: 1, item: true},
    {name: "ITEM", value: 2, item: true},
    {name: "ITEM_RANDOM", value: 3, item: true},
    {name: "REWARD_ITEM", value: 4, item: true},
    {name: "EGG", value: 5},
    {name: "CLIENT_JOINS", value: 6},

]

export function getRewardTypes(commonTrans: (key: string) => string): { label: string, value: string, item?: boolean }[] {
    return rewardTypes.map((type) => {
        return { label: commonTrans(`rewardTypes.${type.name}`)
            , value: type.value.toString(), item: type.item }
    })
}

export function givesItem(rewardType: number): boolean {
    const type = rewardTypes.find((type) => type.value === rewardType)
    return type?.item || false
}