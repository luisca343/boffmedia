/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateExpedienteEventoDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Free-form timeline entry kind
     */
    kind: string;
    /**
     * Related code (denuncia, multa…)
     */
    ref?: string;
    text: string;
};

