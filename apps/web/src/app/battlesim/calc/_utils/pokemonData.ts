export const NATURES = [
    'Adamant (+Atk, -SpA)', 'Bashful', 'Bold (+Def, -Atk)', 'Brave (+Atk, -Spe)', 
    'Calm (+SpD, -Atk)', 'Careful (+SpD, -SpA)', 'Docile', 'Gentle (+SpD, -Def)', 
    'Hardy', 'Hasty (+Spe, -Def)', 'Impish (+Def, -SpA)', 'Jolly (+Spe, -SpA)', 
    'Lax (+Def, -SpD)', 'Lonely (+Atk, -Def)', 'Mild (+SpA, -Def)', 
    'Modest (+SpA, -Atk)', 'Naive (+Spe, -SpD)', 'Naughty (+Atk, -SpD)', 
    'Quiet (+SpA, -Spe)', 'Quirky', 'Rash (+SpA, -SpD)', 'Relaxed (+Def, -Spe)', 
    'Sassy (+SpD, -Spe)', 'Serious', 'Timid (+Spe, -Atk)'
  ];
  
  export const STATUS_OPTIONS = [
    'Healthy', 'Poisoned', 'Badly Poisoned', 'Burned', 'Paralyzed', 'Asleep', 'Frozen'
  ];
  
  // Common competitive items that should appear first in the item selector
  export const COMMON_ITEMS = [
    { id: '', name: 'None' },
    { id: 'heavydutyboots', name: 'Heavy-Duty Boots' },
    { id: 'lifeorb', name: 'Life Orb' },
    { id: 'choicespecs', name: 'Choice Specs' },
    { id: 'choiceband', name: 'Choice Band' },
    { id: 'choicescarf', name: 'Choice Scarf' },
    { id: 'leftovers', name: 'Leftovers' },
    { id: 'focussash', name: 'Focus Sash' },
    { id: 'assaultvest', name: 'Assault Vest' },
    { id: 'expertbelt', name: 'Expert Belt' },
    { id: 'weaknesspolicy', name: 'Weakness Policy' }
  ];
  
  // All available Pokémon types
  export const TYPE_OPTIONS = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon',
    'Dark', 'Steel', 'Fairy'
  ];
  
  // Gender options
  export const GENDER_OPTIONS = ['Male', 'Female', 'Genderless'];
  
  // Nature modifiers lookup - for stat calculation
  export const NATURE_MODIFIERS: Record<string, {atk?: number, def?: number, spa?: number, spd?: number, spe?: number}> = {
    Adamant: { atk: 1.1, spa: 0.9 },
    Bashful: {},
    Bold: { def: 1.1, atk: 0.9 },
    Brave: { atk: 1.1, spe: 0.9 },
    Calm: { spd: 1.1, atk: 0.9 },
    Careful: { spd: 1.1, spa: 0.9 },
    Docile: {},
    Gentle: { spd: 1.1, def: 0.9 },
    Hardy: {},
    Hasty: { spe: 1.1, def: 0.9 },
    Impish: { def: 1.1, spa: 0.9 },
    Jolly: { spe: 1.1, spa: 0.9 },
    Lax: { def: 1.1, spd: 0.9 },
    Lonely: { atk: 1.1, def: 0.9 },
    Mild: { spa: 1.1, def: 0.9 },
    Modest: { spa: 1.1, atk: 0.9 },
    Naive: { spe: 1.1, spd: 0.9 },
    Naughty: { atk: 1.1, spd: 0.9 },
    Quiet: { spa: 1.1, spe: 0.9 },
    Quirky: {},
    Rash: { spa: 1.1, spd: 0.9 },
    Relaxed: { def: 1.1, spe: 0.9 },
    Sassy: { spd: 1.1, spe: 0.9 },
    Serious: {},
    Timid: { spe: 1.1, atk: 0.9 }
  };