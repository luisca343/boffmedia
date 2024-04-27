import { off } from "process";
import * as fs from 'fs';
import *  as  path from 'path';
import { promises as fsPromises } from 'fs';

const typeChart = {
    normal : { ghost: 0, rock: 0.5, steel: 0.5 },
    fire : { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, rock: 2, bug: 0.5, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 0.5, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5, },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5, fire: 0.5 }
} as {[key: string]: {[key: string]: number}}

// We add a multiplier to the types depending on how common they are in the metagame. This will make the ranking more accurate.
// We will multiply the score by the type frequency. The type frequency is a number between 0 and 1 that represents the percentage of pokemons that have that type.
const deffTypeFrequency = {
    steel: 100,
    fairy: 100,

    flying: 70,
    water: 80,

    ground: 70,
    fire: 70,
    dragon: 70,
    dark: 70,
    ghost: 60,
    fighting: 60,
    grass: 50,
    psychic: 40,
    poison: 30,
    electric: 30,
    normal: 20,
    ice: 15,
    rock: 15,
    bug: 10

} as {[key: string]: number}

const offTypeFrequency = {
    ground: 100,
    rock: 100,
    fighting: 90,
    electric: 80,
    ice: 80,
    dark: 70,
    ghost: 70,

    fire: 65,
    water: 65,
    flying: 50,
    fairy: 50,
    steel: 50,

    normal: 40,
    grass: 40,
    poison: 40,
    bug: 30,
    psychic: 40,
    dragon: 20,
} as {[key: string]: number}


const defaultDirDef = path.join(__dirname, '../../../../', 'public/smartrotom/packs/wolfeyRanking.json');
export const wolfeyTypeRanking: {ranking: number, type1: string, type2: string, tier: string}[] = JSON.parse(fs.readFileSync(defaultDirDef, 'utf8'));

function factorFrequency(score: number, type: string, deffensive: boolean){
    let realScore = 0
    if(score === 0) realScore = deffensive ? -5 : 0
    if(score === 0.25) realScore = 5
    if(score === 0.5) realScore = 10
    if(score === 1) realScore = 25
    if(score === 2) realScore = 50
    if(score === 4) realScore = 100
    
    if(deffensive) return realScore >= 25 || realScore < 0  ? realScore * offTypeFrequency[type] : realScore / offTypeFrequency[type]
    //return score > 25 ? realScore * deffTypeFrequency[type] : realScore / deffTypeFrequency[type]
    return realScore >= 25 ? realScore * deffTypeFrequency[type] : realScore / deffTypeFrequency[type]
}


export function getDeffensiveScore(type1: string, type2?: string) {
    let total = 0

    for(let type in typeChart){
        let type1Effectiveness = typeChart[type][type1.toLowerCase()] ?? 1;
        if(type2 && type2 !== type1){
        
            const type2Effectiveness = typeChart[type][type2.toLowerCase()] ?? 1;
            let result = type1Effectiveness * type2Effectiveness
            total += factorFrequency(result, type, true)
            console.log(`${type1} ${type2} ${type} ${factorFrequency(result, type, true)} ${total}`)
        } else {
            total += factorFrequency(type1Effectiveness, type, true)
        }
    } 

    return total
}

export function getOffensiveScore22(type1: string) {
    let total = 0

    for(let type in typeChart){
        const typeEffectiveness = typeChart[type1][type] ?? 1;
        total += typeEffectiveness
    }
    return total
}


export function getOffensiveScore(type1: string, type2?: string) {
    let total = 0

    for(let type in typeChart){
        let type1Effectiveness = typeChart[type1.toLowerCase()][type] ?? 1;
        if(type2 && type2 !== type1){
            let type2Effectiveness = typeChart[type2.toLowerCase()][type] ?? 1;
            let result = type1Effectiveness > type2Effectiveness ? type1Effectiveness : type2Effectiveness
  
            total += factorFrequency(result, type, false)
        } else {
            total += factorFrequency(type1Effectiveness, type, false)
        }
    } 

    return total

}



export function getOffensiveScoreRanking(){
    const result = {} as {[key: string]: {[key: string]: number}}
    const ranking = {} as {[key: string]: number}
    for(let type in typeChart){
        result[type] = {} as {[key: string]: number}
        const scoreType1 = getOffensiveScore(type)
        for(let type2 in typeChart){
            if(type === type2) {
                ranking[`${type}`] = scoreType1
                continue
            }
            const score = getOffensiveScore(type, type2)
            
            result[type][type2] = score
            if(!ranking[`${type}-${type2}`] && !ranking[`${type2}-${type}`]){
                ranking[`${type}-${type2}`] = score 
            }
        }
    }

    // Sort the ranking
    const sortedRanking = Object.entries(ranking).sort((a, b) => b[1] - a[1]).reduce((acc, [key, value]) => {
        acc[key] = value
        return acc
    }, {} as {[key: string]: number})

    const max = Math.max(...Object.values(ranking))
    for(let key in sortedRanking){
        sortedRanking[key] = sortedRanking[key] / max * 100
    }

    return sortedRanking
}



export function getDeffensiveScoreRanking(){
    const result = {} as {[key: string]: {[key: string]: number}}
    const ranking = {} as {[key: string]: number}

    for(let type in typeChart){
        result[type] = {} as {[key: string]: number}
        for(let type2 in typeChart){
            if(type === type2) {
                ranking[`${type}`] = getDeffensiveScore(type)
                continue
            }
            const score = getDeffensiveScore(type, type2)
            result[type][type2] = score
            if(!ranking[`${type}-${type2}`] && !ranking[`${type2}-${type}`]){
                ranking[`${type}-${type2}`] = score
            }
        }
    }

    // Sort the ranking
    const sortedRanking = Object.entries(ranking).sort((a, b) => a[1] - b[1]).reduce((acc, [key, value]) => {
        acc[key] = value
        return acc
    }, {} as {[key: string]: number})


    // In difference to the offensive ranking, the defensive ranking numbers are better the lower they are
    // So, the MIN value has to equal to 100

    const min = Math.min(...Object.values(ranking))
    for(let key in sortedRanking){
        sortedRanking[key] = min / sortedRanking[key] * 100
    }
    

    return sortedRanking
    
}

export function findInRanking(type1: string, type2: string){
    const result = Array.isArray(wolfeyTypeRanking) ? wolfeyTypeRanking.find((item: any) => {
        return (item.type1 === type1 && item.type2 === type2) || (item.type1 === type2 && item.type2 === type1)
    }) : undefined;
}


export function getOverallScoreRanking(){
    return wolfeyTypeRanking
    
    const offensiveRanking = getOffensiveScoreRanking()
    const defensiveRanking = getDeffensiveScoreRanking()

    
    const result = {} as {[key: string]: number}
    for(let key in offensiveRanking){
        result[key] = offensiveRanking[key] + defensiveRanking[key]   
    }

    // Sort the ranking
    const sortedRanking = Object.entries(result).sort((a, b) => b[1] - a[1]).reduce((acc, [key, value]) => {
        acc[key] = value
        return acc
    }, {} as {[key: string]: number})

    const max = Math.max(...Object.values(result))
    for(let key in sortedRanking){
        sortedRanking[key] = sortedRanking[key] / max * 100
    }

    return sortedRanking
}

/*
export function getOverallScore(type1: string, type2?: string) {
    let offensive = getOffensiveScore(type1)
    let defensive = getDeffensiveScore(type1, type2)

    return offensive + defensive
}*/


export function getEffectifity(moveType: string, targetType: string){
    return typeChart[moveType][targetType] || 1
}

export function getPokemonDefense(type1: string, type2= '') {
    const result = {} as {[key: string]: number}

    for(let type in typeChart){
        const type1Effectiveness = typeChart[type][type1.toLowerCase()] || 1;
        const type2Effectiveness = typeChart[type][type2.toLowerCase()] || 1;
        result[type] = type1Effectiveness * type2Effectiveness;
    }
    return result
}

export function getPokemonCoverage(type1: string, type2: string) {
    const result = {} as {[key: string]: number}

    for(let type in typeChart){
        const type1Effectiveness = typeChart[type1.toLowerCase()][type] || 1;
        const type2Effectiveness = typeChart[type2.toLowerCase()][type] || 1;
        result[type] = type1Effectiveness * type2Effectiveness;
    }

    return result
}