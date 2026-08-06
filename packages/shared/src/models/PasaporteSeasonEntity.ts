/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PasaporteLadderRungEntity } from './PasaporteLadderRungEntity';
import type { PasaporteSeasonInfoEntity } from './PasaporteSeasonInfoEntity';
import type { PasaporteStandingEntity } from './PasaporteStandingEntity';
export type PasaporteSeasonEntity = {
    /**
     * Null between cycles — the standing is then zeroed, not an error.
     */
    season?: PasaporteSeasonInfoEntity | null;
    standing: PasaporteStandingEntity;
    /**
     * Shipped so the client never duplicates the ladder definition.
     */
    ladder: Array<PasaporteLadderRungEntity>;
};

