/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GobiernoEventoCapturaEntity } from './GobiernoEventoCapturaEntity';
export type GobiernoEventoCapturasResponseEntity = {
    /**
     * true while the hunt is live — individual rows are withheld
     */
    blind: boolean;
    /**
     * Present while blind
     */
    participants?: number;
    /**
     * Present while blind
     */
    capturasRegistradas?: number;
    /**
     * Present once closed
     */
    items?: Array<GobiernoEventoCapturaEntity>;
    total?: number;
    page?: number;
    pageSize?: number;
};

