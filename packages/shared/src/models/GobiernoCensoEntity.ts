/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GobiernoCensoEntity = {
    uuid: string;
    username: string;
    /**
     * sancionado = active buscado · observado = pending multa · bueno = neither
     */
    standing: GobiernoCensoEntity.standing;
    /**
     * Number of parcelas owned (from WorldGuard)
     */
    parcelas: number;
    /**
     * Distinct towns where this player owns a parcela
     */
    towns: Array<string>;
    /**
     * Count of pending multas
     */
    multasPendientes: number;
    /**
     * Has an active buscado notice
     */
    buscado: boolean;
};
export namespace GobiernoCensoEntity {
    /**
     * sancionado = active buscado · observado = pending multa · bueno = neither
     */
    export enum standing {
        BUENO = 'bueno',
        OBSERVADO = 'observado',
        SANCIONADO = 'sancionado',
    }
}

