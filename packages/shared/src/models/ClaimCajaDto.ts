/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ClaimCajaDto = {
    /**
     * The player, read by the mod off the connection — never supplied by the page.
     */
    uuid: string;
    /**
     * Which ledger source to redeem. Mandatory — see CajaRepository.
     */
    source: ClaimCajaDto.source;
    /**
     * Optional selector: redeem only these rows. Omit to redeem the whole source. Rows not owned or of another source are ignored — it selects, never describes the reward.
     */
    ids?: Array<number>;
};
export namespace ClaimCajaDto {
    /**
     * Which ledger source to redeem. Mandatory — see CajaRepository.
     */
    export enum source {
        MINE = 'mine',
        ARCADE = 'arcade',
        DAILY_REWARD = 'daily_reward',
    }
}

