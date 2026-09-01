/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TcgSyncSetStatus = {
    id: string;
    name: string;
    /**
     * Set exists in the database
     */
    inDb: boolean;
    /**
     * Cards the remote catalogue reports
     */
    cardsRemote: number;
    /**
     * Cards stored locally
     */
    cardsInDb: number;
    /**
     * Stored EN artwork files
     */
    imagesEn: number;
    /**
     * Stored ES artwork files
     */
    imagesEs: number;
    /**
     * Cards with artwork in at least one locale
     */
    imagesAny: number;
    /**
     * Cards with no artwork at all. One locale missing upstream is normal, so a card counts as covered once either locale is stored.
     */
    imagesMissing: number;
    /**
     * What this set still needs
     */
    state: TcgSyncSetStatus.state;
};
export namespace TcgSyncSetStatus {
    /**
     * What this set still needs
     */
    export enum state {
        MISSING = 'missing',
        CARDS_PARTIAL = 'cards-partial',
        IMAGES_PARTIAL = 'images-partial',
        OK = 'ok',
    }
}

