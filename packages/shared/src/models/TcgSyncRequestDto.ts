/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TcgSyncRequestDto = {
    /**
     * Series to sync
     */
    seriesId?: string;
    /**
     * Sync the series list itself
     */
    series?: boolean;
    /**
     * Sync the set/expansion catalogue
     */
    sets?: boolean;
    /**
     * Sync card data for the selected sets
     */
    cards?: boolean;
    /**
     * Download card artwork for the selected sets
     */
    images?: boolean;
    /**
     * Sets to process. Omit or leave empty to process every set in the series.
     */
    setIds?: Array<string>;
    /**
     * Re-fetch sets that are already complete. Off by default, so a re-run only fills the gaps and finishes in seconds.
     */
    force?: boolean;
};

