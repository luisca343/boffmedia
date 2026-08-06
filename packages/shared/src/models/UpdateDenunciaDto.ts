/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateDenunciaDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    town?: string;
    plotNumber?: number;
    accusedUuid?: string;
    /**
     * Free-form category
     */
    category?: string;
    description?: string;
    /**
     * An officer picking up a pending denuncia sets it to reviewing
     */
    status?: UpdateDenunciaDto.status;
};
export namespace UpdateDenunciaDto {
    /**
     * An officer picking up a pending denuncia sets it to reviewing
     */
    export enum status {
        REVIEWING = 'reviewing',
    }
}

