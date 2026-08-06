/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateMultaDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    playerUuid: string;
    amount: number;
    reason: string;
    issuedBy: string;
    /**
     * Related denuncia, if any
     */
    denunciaId?: number;
};

