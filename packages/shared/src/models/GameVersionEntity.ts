/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GameVersionEntity = {
    id: string;
    type: GameVersionEntity.type;
    /**
     * ISO-8601
     */
    releaseTime: string;
    latest: boolean;
};
export namespace GameVersionEntity {
    export enum type {
        RELEASE = 'release',
        SNAPSHOT = 'snapshot',
        OLD_BETA = 'old_beta',
        OLD_ALPHA = 'old_alpha',
    }
}

