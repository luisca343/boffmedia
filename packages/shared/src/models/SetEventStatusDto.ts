/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SetEventStatusDto = {
    status: SetEventStatusDto.status;
    /**
     * Required to move the lifecycle backwards (e.g. completed → active). Audited, and refused while the event has a non-draft randomizer config — reopening would re-arm seed minting against published settings.
     */
    reopen?: boolean;
};
export namespace SetEventStatusDto {
    export enum status {
        UPCOMING = 'upcoming',
        ACTIVE = 'active',
        COMPLETED = 'completed',
    }
}

