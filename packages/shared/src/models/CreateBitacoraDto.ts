/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateBitacoraDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    patrullaId?: number;
    uuid: string;
    text: string;
    tone?: CreateBitacoraDto.tone;
};
export namespace CreateBitacoraDto {
    export enum tone {
        OK = 'ok',
        WARN = 'warn',
        DANGER = 'danger',
        INFO = 'info',
    }
}

