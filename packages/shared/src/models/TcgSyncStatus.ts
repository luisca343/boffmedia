/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TcgSyncSetStatus } from './TcgSyncSetStatus';
export type TcgSyncStatus = {
    seriesId: string;
    /**
     * Remote catalogue was reachable
     */
    remoteAvailable: boolean;
    /**
     * Why the remote check failed, if it did
     */
    remoteError?: Record<string, any>;
    setsRemote: number;
    setsInDb: number;
    cardsRemote: number;
    cardsInDb: number;
    /**
     * Cards that have artwork
     */
    imagesPresent: number;
    /**
     * Cards stored, i.e. cards that want artwork
     */
    imagesExpected: number;
    sets: Array<TcgSyncSetStatus>;
};

