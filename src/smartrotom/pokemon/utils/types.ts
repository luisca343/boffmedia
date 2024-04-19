import { off } from "process";

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
    steel: 1,
    fairy: 1,

    flying: 1,
    water: 1,

    ground: 1,
    fire: 1,
    dragon: 1,
    dark: 1,
    ghost: 1,
    fighting: 1,
    grass: 1,
    psychic: 1,
    poison: 1,
    electric: 1,
    normal: 1,
    ice: 1,
    rock: 1,
    bug: 1

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


function factorFrequency(score: number, type: string, deffensive: boolean){
    let realScore = 0
    if(score === 0) realScore = 0
    if(score === 0.25) realScore = 5
    if(score === 0.5) realScore = 10
    if(score === 1) realScore = 25
    if(score === 2) realScore = 50
    if(score === 4) realScore = 100
    if(deffensive) return score >25 ? realScore / offTypeFrequency[type] : realScore * offTypeFrequency[type]
    //return score > 25 ? realScore * deffTypeFrequency[type] : realScore / deffTypeFrequency[type]
    return score > 25 ? realScore / deffTypeFrequency[type] : realScore * deffTypeFrequency[type]
}


export function getDeffensiveScore(type1: string, type2?: string) {
    let total = 0

    for(let type in typeChart){
        let type1Effectiveness = typeChart[type][type1.toLowerCase()] ?? 1;
        if(type2 && type2 !== type1){
            const type2Effectiveness = typeChart[type][type2.toLowerCase()] ?? 1;
            let result = type1Effectiveness * type2Effectiveness
            if(result === 0) result = - 1.5
            total += factorFrequency(result, type, true)
        } else {
            if(type1Effectiveness === 0) type1Effectiveness = -1
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


export function getOverallScoreRanking(){
    
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