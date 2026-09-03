/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — vendored Pokémon Showdown moves mod table: battle-engine callbacks are not statically typeable against @pkmn/sim.
import type {ModdedMoveDataTable} from '@pkmn/sim';

export const Moves: ModdedMoveDataTable = {
	direclaw: {
		inherit: true,
		secondary: {
			chance: 30,
			onHit(target, source) {
				const status = this.sample(['psn', 'par', 'slp']);
				if (target.status) {
					if (target.status === status) {
						this.add('-fail', target, status);
					} else {
						this.add('-fail', target);
					}
					return;
				}
				target.trySetStatus(status, source);
			},
		},
	},
};
