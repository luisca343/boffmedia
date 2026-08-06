/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateListingDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    price?: number;
    note?: string;
    status?: UpdateListingDto.status;
    /**
     * Who is editing. Must be the seller.
     */
    actorUuid?: string;
};
export namespace UpdateListingDto {
    export enum status {
        ACTIVO = 'activo',
        RESERVADO = 'reservado',
        VENDIDO = 'vendido',
        CANCELADO = 'cancelado',
        PAUSADO = 'pausado',
    }
}

