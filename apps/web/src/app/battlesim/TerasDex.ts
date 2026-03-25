import {Dex, ID, ModData} from '@pkmn/dex';

export async function initTerasMod() {
  const mod = 'teras';
  
  const modData = (await import('./mods/teras')) as ModData;
  
  return Dex.mod(mod as ID, modData);
}

export const TerasDex = initTerasMod()