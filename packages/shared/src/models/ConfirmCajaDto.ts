/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ConfirmCajaDto = {
    /**
     * The player, read by the mod off the connection — never supplied by the page.
     */
    uuid: string;
    /**
     * The id returned by POST /caja/reserve for the grant that was just delivered.
     */
    reservationId: string;
};

