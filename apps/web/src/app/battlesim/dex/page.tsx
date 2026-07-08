import { redirect } from 'next/navigation';

// Retired: the BattleSim Pokédex is superseded by the SmartRotom Pokédex.
export default function LegacyDexRedirect() {
  redirect('/smartrotom/pokedex');
}
