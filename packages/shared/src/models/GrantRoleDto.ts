/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GrantRoleDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    role: GrantRoleDto.role;
    actorUuid?: string;
};
export namespace GrantRoleDto {
    export enum role {
        GOBIERNO = 'GOBIERNO',
        GOB_AGENTE = 'GOB_AGENTE',
        GOB_INSPECTOR = 'GOB_INSPECTOR',
        GOB_ALCALDE = 'GOB_ALCALDE',
    }
}

