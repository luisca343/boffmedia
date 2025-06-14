export interface ParsedPokemonSpec {
    species: string;
    ability?: string;
    aggressionLevel?: 'timid' | 'passive' | 'aggressive';
    ball?: string;
    isBoss?: boolean;
    canCrowned?: boolean;
    canMegaEvolve?: boolean;
    canPrimalEvolve?: boolean;
    canUltraBurst?: boolean;
    cloneCount?: number;
    hasCuredPokerus?: boolean;
    isEgg?: boolean;
    enchantedCount?: number;
    evs?: { hp?: number; atk?: number; def?: number; spatk?: number; spdef?: number; spd?: number };
    exp?: number;
    form?: string;
    gender?: 'male' | 'female';
    generation?: number;
    hasGmaxFactor?: boolean;
    growth?: string;
    heldItem?: string;
    hasHiddenAbility?: boolean;
    ivs?: { hp?: number; atk?: number; def?: number; spatk?: number; spdef?: number; spd?: number };
    isLegendary?: boolean;
    level?: number;
    maxLevel?: number;
    minLevel?: number;
    modIvs?: { hp?: number; atk?: number; def?: number; spatk?: number; spdef?: number; spd?: number };
    modEvs?: { hp?: number; atk?: number; def?: number; spatk?: number; spdef?: number; spd?: number };
    moves?: [string?, string?, string?, string?];
    nature?: string;
    nickname?: string;
    noDrops?: boolean;
    originalTrainerName?: string;
    palette?: string;
    pokerus?: string;
    isRandom?: boolean;
    resetEvs?: boolean;
    resetIvs?: boolean;
    ribbons?: string[];
    isShiny?: boolean;
    notShiny?: boolean;
    status?: 'drowsy' | 'sleep' | 'burn' | 'paralysis' | 'frozen' | 'frostbitten' | 'poison' | 'poisonbadly';
    types?: [string?, string?];
    isUltraBeast?: boolean;
    uncatchable?: boolean;
    untradeable?: boolean;
    unbreedable?: boolean;
  }
  
  export function parsePokemonSpec(spec: string): ParsedPokemonSpec {
    if (!spec || typeof spec !== 'string') {
      return { species: 'Unknown' };
    }
  
    const result: ParsedPokemonSpec = {
      species: '',
      evs: {},
      ivs: {},
      modEvs: {},
      modIvs: {},
      moves: [undefined, undefined, undefined, undefined]
    };
  
    // Split the spec by spaces
    const parts = spec.split(/\s+/);
    
    // First part is always the species
    if (parts.length > 0) {
      result.species = parts[0];
    }
  
    // Process each spec parameter
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].toLowerCase();
      
      // Handle parameters that include colon
      if (part.includes(':')) {
        const [key, value] = part.split(':', 2);
        
        switch (key) {
          case 'ability':
          case 'ab':
            result.ability = value;
            break;
            
          case 'ai':
          case 'agro':
            if (['timid', 'passive', 'aggressive'].includes(value)) {
              result.aggressionLevel = value as 'timid' | 'passive' | 'aggressive';
            }
            break;
            
          case 'ball':
          case 'ba':
            result.ball = value;
            break;
            
          case 'clone':
            result.cloneCount = parseInt(value, 10);
            break;
            
          case 'enchantedcount':
          case 'enchanted':
          case 'laketrioenchanted':
            result.enchantedCount = parseInt(value, 10);
            break;
            
          case 'exp':
          case 'xp':
            result.exp = parseInt(value, 10);
            break;
            
          case 'form':
          case 'f':
            result.form = value;
            break;
            
          case 'gender':
          case 'g':
            result.gender = value === 'male' || value === 'm' ? 'male' : 'female';
            break;
            
          case 'generation':
          case 'gen':
            result.generation = parseInt(value, 10);
            break;
            
          case 'growth':
          case 'gr':
            result.growth = value;
            break;
            
          case 'helditem':
          case 'hi':
            result.heldItem = value;
            break;
            
          case 'level':
          case 'lvl':
            result.level = parseInt(value, 10);
            break;
            
          case 'maxlevel':
          case 'maxlvl':
          case 'ltlvl':
            result.maxLevel = parseInt(value, 10);
            break;
            
          case 'minlevel':
          case 'minlvl':
          case 'gtlvl':
            result.minLevel = parseInt(value, 10);
            break;
            
          case 'move1':
            result.moves![0] = value;
            break;
            
          case 'move2':
            result.moves![1] = value;
            break;
            
          case 'move3':
            result.moves![2] = value;
            break;
            
          case 'move4':
            result.moves![3] = value;
            break;
            
          case 'nature':
          case 'n':
            result.nature = value;
            break;
            
          case 'nickname':
          case 'nick':
            result.nickname = value;
            break;
            
          case 'originaltrainername':
          case 'otn':
            result.originalTrainerName = value;
            break;
            
          case 'palette':
          case 'ispalette':
          case 'customtexture':
            result.palette = value;
            break;
            
          case 'pokerus':
          case 'pkrs':
            result.pokerus = value;
            break;
            
          case 'ribbon':
          case 'ribbons':
            result.ribbons = result.ribbons || [];
            result.ribbons.push(value);
            break;
            
          case 'status':
            if (['drowsy', 'sleep', 'burn', 'paralysis', 'frozen', 'frostbitten', 'poison', 'poisonbadly'].includes(value)) {
              result.status = value as any;
            }
            break;
            
          case 'type1':
            result.types = result.types || [];
            result.types[0] = value;
            break;
            
          case 'type2':
            result.types = result.types || [];
            result.types[1] = value;
            break;
            
          // Handle EVs
          case 'evhp':
            result.evs!.hp = parseInt(value, 10);
            break;
          case 'evatk':
            result.evs!.atk = parseInt(value, 10);
            break;
          case 'evdef':
            result.evs!.def = parseInt(value, 10);
            break;
          case 'evspatk':
            result.evs!.spatk = parseInt(value, 10);
            break;
          case 'evspdef':
            result.evs!.spdef = parseInt(value, 10);
            break;
          case 'evspd':
            result.evs!.spd = parseInt(value, 10);
            break;
            
          // Handle IVs
          case 'ivhp':
            result.ivs!.hp = parseInt(value, 10);
            break;
          case 'ivatk':
            result.ivs!.atk = parseInt(value, 10);
            break;
          case 'ivdef':
            result.ivs!.def = parseInt(value, 10);
            break;
          case 'ivspatk':
            result.ivs!.spatk = parseInt(value, 10);
            break;
          case 'ivspdef':
            result.ivs!.spdef = parseInt(value, 10);
            break;
          case 'ivspd':
            result.ivs!.spd = parseInt(value, 10);
            break;
            
          // Handle IV mods
          case 'modhpiv':
            result.modIvs!.hp = parseInt(value, 10);
            break;
          case 'modatkiv':
            result.modIvs!.atk = parseInt(value, 10);
            break;
          case 'moddefiv':
            result.modIvs!.def = parseInt(value, 10);
            break;
          case 'modspatkiv':
            result.modIvs!.spatk = parseInt(value, 10);
            break;
          case 'modspdefiv':
            result.modIvs!.spdef = parseInt(value, 10);
            break;
          case 'modspdiv':
            result.modIvs!.spd = parseInt(value, 10);
            break;
            
          // Handle EV mods
          case 'modhpev':
            result.modEvs!.hp = parseInt(value, 10);
            break;
          case 'modatkev':
            result.modEvs!.atk = parseInt(value, 10);
            break;
          case 'moddefev':
            result.modEvs!.def = parseInt(value, 10);
            break;
          case 'modspatkev':
            result.modEvs!.spatk = parseInt(value, 10);
            break;
          case 'modspdefev':
            result.modEvs!.spdef = parseInt(value, 10);
            break;
          case 'modspdiv':
            result.modEvs!.spd = parseInt(value, 10);
            break;
        }
      } 
      // Handle boolean flags
      else {
        switch (part) {
          case 's':
          case 'shiny':
            result.isShiny = true;
            break;
            
          case '!s':
          case '!shiny':
            result.notShiny = true;
            break;
            
          case 'boss':
          case 'b':
          case 'isboss':
          case 'areyouaboss':
            result.isBoss = true;
            break;
            
          case 'cancrowned':
            result.canCrowned = true;
            break;
            
          case 'canmegaevolve':
          case 'canmega':
            result.canMegaEvolve = true;
            break;
            
          case 'canprimalevolve':
          case 'canprimal':
            result.canPrimalEvolve = true;
            break;
            
          case 'canultraburst':
          case 'canultra':
            result.canUltraBurst = true;
            break;
            
          case 'cured':
            result.hasCuredPokerus = true;
            break;
            
          case 'egg':
            result.isEgg = true;
            break;
            
          case '!egg':
            result.isEgg = false;
            break;
            
          case 'gmaxfactor':
            result.hasGmaxFactor = true;
            break;
            
          case 'hiddenability':
          case 'ha':
            result.hasHiddenAbility = true;
            break;
            
          case 'legendary':
          case 'leg':
          case 'islegendary':
            result.isLegendary = true;
            break;
            
          case 'nodrops':
          case 'cannotdrop':
            result.noDrops = true;
            break;
            
          case 'random':
            result.isRandom = true;
            break;
            
          case 'resetevs':
            result.resetEvs = true;
            break;
            
          case 'resetivs':
            result.resetIvs = true;
            break;
            
          case 'ultrabeast':
          case 'isultrabeast':
          case 'ub':
            result.isUltraBeast = true;
            break;
            
          case '!ultrabeast':
          case '!isultrabeast':
          case '!ub':
            result.isUltraBeast = false;
            break;
            
          case 'uncatchable':
            result.uncatchable = true;
            break;
            
          case 'untradeable':
            result.untradeable = true;
            break;
            
          case 'unbreedable':
            result.unbreedable = true;
            break;
        }
      }
    }
  
    return result;
  }
  
  // Helper function to create a readable string representation of a Pokémon spec
  export function formatPokemonSpec(spec: ParsedPokemonSpec): string {
    let result = spec.species || 'Unknown';
    
    if (spec.nickname) {
      result += ` "${spec.nickname}"`;
    }
    
    if (spec.level) {
      result += ` Lv.${spec.level}`;
    }
    
    if (spec.isShiny) {
      result += " ✨";
    }
    
    if (spec.form) {
      result += ` (${spec.form})`;
    }
    
    if (spec.gender) {
      result += ` ${spec.gender === 'male' ? '♂' : '♀'}`;
    }
    
    return result;
  }