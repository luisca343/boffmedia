/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — vendored Pokémon Showdown abilities mod table: battle-engine callbacks are not statically typeable against @pkmn/sim.
import type {ModdedAbilityDataTable} from '@pkmn/sim';

export const Abilities: ModdedAbilityDataTable = {
	spicyspray: {
		inherit: true,
		onDamagingHit(damage, target, source, move) {
			if (!source.trySetStatus('brn', target) && !source.status && source.hasType('Fire')) {
				this.add('-immune', source);
			}
		},
	},
};
